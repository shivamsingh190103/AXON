from __future__ import annotations

import json
from io import BytesIO
from dataclasses import dataclass
from pathlib import Path

import boto3
import numpy as np


@dataclass
class ScoreOutput:
    hook_timeseries: list[float]
    boredom_timeseries: list[float]
    emotion_timeseries: list[float]
    hook_score: int
    boredom_score: int
    emotion_score: int
    overall_score: int


GLASSER_PATH = Path(__file__).resolve().parents[1] / 'utils' / 'glasser_parcels.json'


def _clamp(value: float) -> float:
    return max(0.0, min(100.0, value))


def _s3_client():
    return boto3.client('s3')


def _download_numpy(bucket: str, key: str) -> np.ndarray:
    response = _s3_client().get_object(Bucket=bucket, Key=key)
    payload = response['Body'].read()
    return np.load(BytesIO(payload))


def _mean(values: np.ndarray) -> int:
    if values.size == 0:
        return 0
    return int(round(float(values.mean())))


def _normalize(series: np.ndarray) -> np.ndarray:
    if series.size == 0:
        return series
    lower = float(np.percentile(series, 5))
    upper = float(np.percentile(series, 95))
    if upper - lower < 1e-6:
        return np.clip(series, 0.0, 100.0)
    normalized = (series - lower) / (upper - lower)
    return np.clip(normalized * 100.0, 0.0, 100.0)


def _load_parcels() -> dict[str, list[int]]:
    with GLASSER_PATH.open('r', encoding='utf-8') as handle:
        raw = json.load(handle)
    return {key: [int(value) for value in values] for key, values in raw.items()}


def _region_mean(raw_vertices_by_time: np.ndarray, indices: list[int]) -> np.ndarray:
    valid = [index for index in indices if 0 <= index < raw_vertices_by_time.shape[0]]
    if not valid:
        return np.zeros((raw_vertices_by_time.shape[1],), dtype=np.float32)
    return raw_vertices_by_time[valid, :].mean(axis=0)


def run_score(analysis_id: str, raw_output_s3_key: str, bucket: str) -> ScoreOutput:
    _ = analysis_id
    raw = _download_numpy(bucket, raw_output_s3_key)
    if raw.ndim != 2:
        raise RuntimeError('TRIBE raw output must be a 2D tensor')

    if raw.shape[0] < raw.shape[1]:
        raw_vertices_by_time = raw
    else:
        raw_vertices_by_time = raw.T

    parcels = _load_parcels()
    hook_indices = parcels.get('PRIMARY_VISUAL_CORTEX', []) + parcels.get('EARLY_AUDITORY', [])
    boredom_indices = parcels.get('DEFAULT_MODE_NETWORK', [])
    emotion_indices = parcels.get('TPJ', []) + parcels.get('MTG', [])

    hook_ts = _normalize(_region_mean(raw_vertices_by_time, hook_indices))
    boredom_ts = _normalize(_region_mean(raw_vertices_by_time, boredom_indices))
    emotion_ts = _normalize(_region_mean(raw_vertices_by_time, emotion_indices))

    hook_score = _mean(hook_ts)
    boredom_score = _mean(boredom_ts)
    emotion_score = _mean(emotion_ts)
    overall_score = int(round(hook_score * 0.35 + (100 - boredom_score) * 0.35 + emotion_score * 0.30))

    return ScoreOutput(
        hook_timeseries=np.round(hook_ts, 2).tolist(),
        boredom_timeseries=np.round(boredom_ts, 2).tolist(),
        emotion_timeseries=np.round(emotion_ts, 2).tolist(),
        hook_score=hook_score,
        boredom_score=boredom_score,
        emotion_score=emotion_score,
        overall_score=int(_clamp(overall_score)),
    )
