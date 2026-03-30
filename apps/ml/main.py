from __future__ import annotations

import os
from dataclasses import asdict
from typing import Optional

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Header, HTTPException, status
from pydantic import BaseModel

from models import current_profile, gpu_status, load_models, models_ready
from pipeline.extractor import run_extract
from pipeline.scorer import run_score
from pipeline.tribe import run_infer

load_dotenv()

app = FastAPI(title='AXON ML Service', version='1.0.0')
models = load_models()
analysis_duration_cache: dict[str, float] = {}

ML_SERVICE_SECRET = os.getenv('ML_SERVICE_SECRET', 'internal_secret_for_service_auth')


def verify_internal_secret(x_ml_secret: Optional[str] = Header(default=None)) -> None:
    if x_ml_secret != ML_SERVICE_SECRET:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Unauthorized internal request')


def verify_models_ready() -> None:
    if not models_ready():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail='Models are still loading. Try again shortly.',
            headers={'Retry-After': '120'},
        )


class ExtractRequest(BaseModel):
    analysis_id: str
    s3_key: str
    s3_bucket: str
    duration_seconds: Optional[float] = None


class InferRequest(BaseModel):
    analysis_id: str
    features_s3_prefix: str
    s3_bucket: str


class ScoreRequest(BaseModel):
    analysis_id: str
    raw_output_s3_key: str
    s3_bucket: str


@app.get('/health')
def health() -> dict:
    gpu_available, gpu_memory_free_gb = gpu_status()
    return {
        'status': 'ok',
        'profile': current_profile(),
        'degraded_mode': not (models.vjepa2 and models.wav2vec and models.llama and models.tribe),
        'models_loaded': {
            'vjepa2': models.vjepa2,
            'wav2vec': models.wav2vec,
            'llama': models.llama,
            'tribe': models.tribe,
        },
        'gpu_available': gpu_available,
        'gpu_memory_free_gb': gpu_memory_free_gb,
    }


@app.post('/extract', dependencies=[Depends(verify_internal_secret)])
def extract(body: ExtractRequest) -> dict:
    verify_models_ready()
    output = run_extract(body.analysis_id, body.s3_key, body.s3_bucket, body.duration_seconds)
    analysis_duration_cache[body.analysis_id] = output.duration_seconds
    return asdict(output)


@app.post('/infer', dependencies=[Depends(verify_internal_secret)])
def infer(body: InferRequest) -> dict:
    verify_models_ready()
    duration = analysis_duration_cache.get(body.analysis_id)
    if duration is None:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail='Missing extracted duration for analysis')

    output = run_infer(body.analysis_id, body.features_s3_prefix, body.s3_bucket, duration)
    return asdict(output)


@app.post('/score', dependencies=[Depends(verify_internal_secret)])
def score(body: ScoreRequest) -> dict:
    output = run_score(body.analysis_id, body.raw_output_s3_key, body.s3_bucket)
    return asdict(output)
