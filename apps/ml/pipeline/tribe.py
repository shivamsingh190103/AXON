from __future__ import annotations

import math
from io import BytesIO
from dataclasses import dataclass

import boto3
import numpy as np

from models import get_runtime_models
from utils.ffmpeg_helpers import ensure_tmp_dir

TRIBE_MAX_SECONDS_BATCH = 30
TRIBE_NUM_VERTICES = 20484


def _s3_client():
    return boto3.client('s3')


def _parse_s3_prefix(prefix: str, bucket: str) -> str:
    if prefix.startswith('s3://'):
        stripped = prefix.replace('s3://', '', 1)
        if stripped.startswith(f'{bucket}/'):
            return stripped[len(bucket) + 1:]
        return '/'.join(stripped.split('/')[1:])
    return prefix


def _download_numpy(bucket: str, key: str) -> np.ndarray:
    response = _s3_client().get_object(Bucket=bucket, Key=key)
    payload = response['Body'].read()
    return np.load(BytesIO(payload))


def _upload_numpy(bucket: str, key: str, array: np.ndarray) -> None:
    stream = BytesIO()
    np.save(stream, array.astype(np.float32, copy=False))
    stream.seek(0)
    _s3_client().put_object(Bucket=bucket, Key=key, Body=stream.read(), ContentType='application/octet-stream')


def _clear_cuda_cache(runtime_models) -> None:
    torch_module = runtime_models.torch
    if torch_module is None:
        return
    try:
        if torch_module.cuda.is_available():
            torch_module.cuda.empty_cache()
    except Exception:
        return


def _projection_matrix(input_dim: int) -> np.ndarray:
    # Deterministic projection for stable vertex count mapping.
    i = np.arange(TRIBE_NUM_VERTICES, dtype=np.float32)[:, None]
    j = np.arange(input_dim, dtype=np.float32)[None, :]
    return np.cos((i + 1) * (j + 1) / 2048.0).astype(np.float32)


def _tribe_forward(batch_embeddings: np.ndarray, runtime_models) -> np.ndarray:
    torch_module = runtime_models.torch
    tribe_model = runtime_models.tribe_model

    if torch_module is not None and tribe_model is not None:
        tensor = torch_module.from_numpy(batch_embeddings).float().to(runtime_models.device)
        with torch_module.no_grad():
            try:
                output = tribe_model(inputs_embeds=tensor.unsqueeze(0))
            except TypeError:
                output = tribe_model(tensor.unsqueeze(0))

        if hasattr(output, 'last_hidden_state'):
            hidden = output.last_hidden_state
        elif isinstance(output, (tuple, list)) and output:
            hidden = output[0]
        else:
            hidden = output

        if hasattr(hidden, 'detach'):
            hidden_np = hidden.detach().float().cpu().numpy()
        else:
            hidden_np = np.asarray(hidden, dtype=np.float32)

        if hidden_np.ndim >= 3:
            hidden_np = hidden_np.mean(axis=0)
        elif hidden_np.ndim == 2:
            pass
        else:
            hidden_np = hidden_np.reshape(batch_embeddings.shape[0], -1)
    else:
        hidden_np = batch_embeddings

    if hidden_np.ndim != 2:
        hidden_np = hidden_np.reshape(hidden_np.shape[0], -1)

    projector = _projection_matrix(hidden_np.shape[1])
    vertices_by_time = projector @ hidden_np.T
    return vertices_by_time.astype(np.float32)


@dataclass
class InferOutput:
    raw_output_s3_key: str
    duration_seconds: float
    num_frames: int


def run_infer(analysis_id: str, features_s3_prefix: str, bucket: str, duration_seconds: float) -> InferOutput:
    runtime_models = get_runtime_models()
    _ = ensure_tmp_dir(analysis_id)

    prefix = _parse_s3_prefix(features_s3_prefix, bucket).rstrip('/') + '/'
    video_embeddings = _download_numpy(bucket, f'{prefix}video_embeddings.npy')
    audio_embeddings = _download_numpy(bucket, f'{prefix}audio_embeddings.npy')
    text_embeddings = _download_numpy(bucket, f'{prefix}text_embeddings.npy')

    second_count = int(min(video_embeddings.shape[0], audio_embeddings.shape[0], text_embeddings.shape[0], max(1, int(math.floor(duration_seconds)))))
    video_embeddings = video_embeddings[:second_count]
    audio_embeddings = audio_embeddings[:second_count]
    text_embeddings = text_embeddings[:second_count]

    combined_embeddings = np.concatenate([video_embeddings, audio_embeddings, text_embeddings], axis=1).astype(np.float32)

    chunks: list[np.ndarray] = []
    for start in range(0, second_count, TRIBE_MAX_SECONDS_BATCH):
        end = min(start + TRIBE_MAX_SECONDS_BATCH, second_count)
        batch = combined_embeddings[start:end]
        chunk = _tribe_forward(batch, runtime_models)
        chunks.append(chunk)
        _clear_cuda_cache(runtime_models)

    raw_output = np.concatenate(chunks, axis=1).astype(np.float32)
    raw_output_key = f'raw-output/{analysis_id}/tribe_output.npy'
    _upload_numpy(bucket, raw_output_key, raw_output)

    return InferOutput(
        raw_output_s3_key=raw_output_key,
        duration_seconds=float(second_count),
        num_frames=second_count,
    )
