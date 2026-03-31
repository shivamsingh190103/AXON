from __future__ import annotations

import json
import math
import os
from io import BytesIO
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import boto3
import cv2
import ffmpeg
import numpy as np

from models import get_runtime_models
from utils.ffmpeg_helpers import ensure_tmp_dir

VJEPA_BATCH_FRAMES = 64
VIDEO_EMBED_FPS = 16
WHISPER_TASK = 'translate'
AUDIO_ONLY_TYPES = {
    'PODCAST_EPISODE',
    'PODCAST_CLIP',
    'AUDIO_AD',
    # Compatibility aliases for future taxonomy extensions.
    'MUSIC_TRACK',
    'VOICE_MEMO',
    'AUDIOBOOK',
    'GENERIC_AUDIO',
}


@dataclass
class ExtractOutput:
    features_s3_prefix: str
    duration_seconds: float
    detected_language: str
    transcript: list[dict]
    is_audio_only: bool


def _s3_client():
    return boto3.client('s3')


def _clear_cuda_cache(runtime_models: Any) -> None:
    torch_module = runtime_models.torch
    if torch_module is None:
        return
    try:
        if torch_module.cuda.is_available():
            torch_module.cuda.empty_cache()
    except Exception:
        return


def _download_s3_file(bucket: str, key: str, destination: Path) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    _s3_client().download_file(bucket, key, str(destination))


def _upload_numpy(bucket: str, key: str, array: np.ndarray) -> None:
    byte_stream = BytesIO()
    np.save(byte_stream, array.astype(np.float32, copy=False))
    byte_stream.seek(0)
    _s3_client().put_object(Bucket=bucket, Key=key, Body=byte_stream.read(), ContentType='application/octet-stream')


def _upload_json(bucket: str, key: str, payload: Any) -> None:
    _s3_client().put_object(Bucket=bucket, Key=key, Body=json.dumps(payload).encode('utf-8'), ContentType='application/json')


def _probe_duration(video_path: Path) -> float:
    probe = ffmpeg.probe(str(video_path))
    format_duration = probe.get('format', {}).get('duration')
    if format_duration:
        return float(format_duration)

    for stream in probe.get('streams', []):
        if stream.get('codec_type') == 'video' and stream.get('duration'):
            return float(stream['duration'])

    raise RuntimeError('Could not determine video duration')


def _resolve_video_embed_dim(runtime_models: Any) -> int:
    env_value = os.getenv('VIDEO_EMBED_DIM', '768').strip()
    env_dim = int(env_value) if env_value.isdigit() else 768

    model = runtime_models.vjepa2_model
    config = getattr(model, 'config', None)
    hidden_size = getattr(config, 'hidden_size', None) if config is not None else None
    if isinstance(hidden_size, int) and hidden_size > 0:
        return hidden_size

    return env_dim


def _extract_audio(video_path: Path, audio_path: Path) -> None:
    (
        ffmpeg
        .input(str(video_path))
        .output(str(audio_path), ac=1, ar=16000, format='wav')
        .overwrite_output()
        .run(quiet=True)
    )


def _transcribe(audio_path: Path, runtime_models: Any) -> tuple[list[dict], str, str]:
    whisper_model = runtime_models.whisper_model
    if whisper_model is None:
        raise RuntimeError('Whisper model not loaded. Install faster-whisper and preload models.')

    segments, info = whisper_model.transcribe(
        str(audio_path),
        task=WHISPER_TASK,
        word_timestamps=True,
        vad_filter=True,
    )

    transcript: list[dict] = []
    text_chunks: list[str] = []
    for segment in segments:
        if getattr(segment, 'text', None):
            text_chunks.append(segment.text.strip())
        for word in getattr(segment, 'words', []) or []:
            transcript.append({
                'word': word.word.strip(),
                'start': float(word.start),
                'end': float(word.end),
            })

    detected_language = getattr(info, 'language', None) or 'en'
    if detected_language.startswith('hi'):
        detected_language = 'hi-en'

    full_text = ' '.join(chunk for chunk in text_chunks if chunk)
    return transcript, detected_language, full_text


def _fallback_frame_embedding(batch: np.ndarray) -> np.ndarray:
    # Deterministic non-random visual descriptor if V-JEPA2 is unavailable.
    pooled = batch.mean(axis=(1, 2, 3), keepdims=False)
    std = batch.std(axis=(1, 2, 3), keepdims=False)
    return np.stack([pooled, std], axis=1)


def _vjepa_batch_embedding(batch: np.ndarray, runtime_models: Any) -> np.ndarray:
    torch_module = runtime_models.torch
    vjepa2_model = runtime_models.vjepa2_model
    if torch_module is None or vjepa2_model is None:
        return _fallback_frame_embedding(batch)

    tensor = torch_module.from_numpy(batch).permute(0, 3, 1, 2).to(runtime_models.device)
    with torch_module.no_grad():
        try:
            output = vjepa2_model(pixel_values=tensor)
        except TypeError:
            output = vjepa2_model(tensor)

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

    if hidden_np.ndim == 2:
        return hidden_np
    if hidden_np.ndim >= 3:
        axes = tuple(range(1, hidden_np.ndim - 1))
        return hidden_np.mean(axis=axes)

    return hidden_np.reshape(hidden_np.shape[0], -1)


def _extract_video_embeddings(video_path: Path, duration_seconds: float, runtime_models: Any) -> np.ndarray:
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        raise RuntimeError('Unable to open video for V-JEPA2 extraction')

    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    frame_stride = max(1, int(round(fps / VIDEO_EMBED_FPS)))

    sampled_frames: list[np.ndarray] = []
    frame_embeddings: list[np.ndarray] = []
    frame_index = 0

    try:
        while True:
            success, frame = cap.read()
            if not success:
                break

            if frame_index % frame_stride != 0:
                frame_index += 1
                continue

            resized = cv2.resize(frame, (224, 224), interpolation=cv2.INTER_AREA)
            normalized = resized.astype(np.float32) / 255.0
            sampled_frames.append(normalized)

            if len(sampled_frames) == VJEPA_BATCH_FRAMES:
                batch = np.asarray(sampled_frames, dtype=np.float32)
                frame_embeddings.append(_vjepa_batch_embedding(batch, runtime_models))
                sampled_frames = []
                _clear_cuda_cache(runtime_models)

            frame_index += 1

        if sampled_frames:
            batch = np.asarray(sampled_frames, dtype=np.float32)
            frame_embeddings.append(_vjepa_batch_embedding(batch, runtime_models))
            _clear_cuda_cache(runtime_models)
    finally:
        cap.release()

    if not frame_embeddings:
        raise RuntimeError('No video embeddings were extracted')

    frame_level = np.concatenate(frame_embeddings, axis=0)
    seconds = max(1, int(math.ceil(duration_seconds)))
    per_second: list[np.ndarray] = []
    for second in range(seconds):
        start = second * VIDEO_EMBED_FPS
        end = min((second + 1) * VIDEO_EMBED_FPS, frame_level.shape[0])
        if start >= frame_level.shape[0]:
            per_second.append(frame_level[-1])
            continue
        per_second.append(frame_level[start:end].mean(axis=0))

    return np.asarray(per_second, dtype=np.float32)


def _decode_audio_pcm(audio_path: Path) -> np.ndarray:
    pcm_bytes, _stderr = (
        ffmpeg
        .input(str(audio_path))
        .output('pipe:', format='f32le', acodec='pcm_f32le', ac=1, ar=16000)
        .run(capture_stdout=True, capture_stderr=True, quiet=True)
    )
    waveform = np.frombuffer(pcm_bytes, dtype=np.float32)
    if waveform.size == 0:
        raise RuntimeError('Audio decode produced empty waveform')
    return waveform


def _fallback_audio_embedding(segment: np.ndarray) -> np.ndarray:
    spectrum = np.abs(np.fft.rfft(segment, n=2048))[:256]
    if spectrum.max() > 0:
        spectrum = spectrum / spectrum.max()
    return spectrum.astype(np.float32)


def _extract_audio_embeddings(audio_path: Path, seconds: int, runtime_models: Any) -> np.ndarray:
    waveform = _decode_audio_pcm(audio_path)
    sample_rate = 16000
    wav2vec_model = runtime_models.wav2vec_model
    wav2vec_processor = runtime_models.wav2vec_processor
    torch_module = runtime_models.torch

    rows: list[np.ndarray] = []
    for second in range(seconds):
        start = second * sample_rate
        end = min((second + 1) * sample_rate, waveform.shape[0])
        if start >= waveform.shape[0]:
            rows.append(rows[-1] if rows else np.zeros((256,), dtype=np.float32))
            continue

        segment = waveform[start:end]
        if segment.size < sample_rate:
            segment = np.pad(segment, (0, sample_rate - segment.size))

        if wav2vec_model is not None and wav2vec_processor is not None and torch_module is not None:
            inputs = wav2vec_processor(segment, sampling_rate=sample_rate, return_tensors='pt')
            inputs = {key: value.to(runtime_models.device) for key, value in inputs.items()}
            with torch_module.no_grad():
                output = wav2vec_model(**inputs)
            hidden = output.last_hidden_state.mean(dim=1).squeeze(0).detach().float().cpu().numpy()
            rows.append(hidden.astype(np.float32))
        else:
            rows.append(_fallback_audio_embedding(segment))

    return np.asarray(rows, dtype=np.float32)


def _fallback_text_embedding(text: str) -> np.ndarray:
    vector = np.zeros((256,), dtype=np.float32)
    for index, char in enumerate(text.lower()):
        bucket = (ord(char) + index) % vector.shape[0]
        vector[bucket] += 1.0
    if vector.max() > 0:
        vector = vector / vector.max()
    return vector


def _extract_text_embeddings(text: str, seconds: int, runtime_models: Any) -> np.ndarray:
    llama_model = runtime_models.llama_model
    llama_tokenizer = runtime_models.llama_tokenizer
    torch_module = runtime_models.torch

    if not text.strip():
        text = '<silence>'

    if llama_model is not None and llama_tokenizer is not None and torch_module is not None:
        inputs = llama_tokenizer(text, return_tensors='pt', max_length=512, truncation=True)
        inputs = {key: value.to(runtime_models.device) for key, value in inputs.items()}
        with torch_module.no_grad():
            output = llama_model(**inputs, output_hidden_states=True)
        hidden = output.hidden_states[-1].mean(dim=1).squeeze(0).detach().float().cpu().numpy()
        base = hidden.astype(np.float32)
    else:
        base = _fallback_text_embedding(text)

    tiled = np.repeat(base[np.newaxis, :], repeats=seconds, axis=0)
    return tiled.astype(np.float32)


def run_extract(
    analysis_id: str,
    s3_key: str,
    bucket: str,
    duration_seconds: float | None = None,
    content_type: str | None = None
) -> ExtractOutput:
    runtime_models = get_runtime_models()
    work_dir = ensure_tmp_dir(analysis_id)
    source_suffix = Path(s3_key).suffix or '.bin'
    source_video_path = work_dir / f'source_media{source_suffix}'
    audio_path = work_dir / 'audio.wav'

    _download_s3_file(bucket, s3_key, source_video_path)

    if duration_seconds is not None and duration_seconds > 0:
        resolved_duration = float(duration_seconds)
    else:
        resolved_duration = _probe_duration(source_video_path)

    _extract_audio(source_video_path, audio_path)
    transcript, detected_language, full_text = _transcribe(audio_path, runtime_models)

    second_count = max(1, int(math.ceil(resolved_duration)))
    is_audio_only = (content_type or '').upper() in AUDIO_ONLY_TYPES
    audio_embeddings = _extract_audio_embeddings(audio_path, second_count, runtime_models)
    text_embeddings = _extract_text_embeddings(full_text, second_count, runtime_models)

    if is_audio_only:
        video_embeddings = np.zeros(
            (audio_embeddings.shape[0], _resolve_video_embed_dim(runtime_models)),
            dtype=np.float32
        )
    else:
        video_embeddings = _extract_video_embeddings(source_video_path, resolved_duration, runtime_models)

    min_seconds = min(video_embeddings.shape[0], audio_embeddings.shape[0], text_embeddings.shape[0], second_count)
    video_embeddings = video_embeddings[:min_seconds]
    audio_embeddings = audio_embeddings[:min_seconds]
    text_embeddings = text_embeddings[:min_seconds]

    features_prefix = f'features/{analysis_id}/'
    _upload_numpy(bucket, f'{features_prefix}video_embeddings.npy', video_embeddings)
    _upload_numpy(bucket, f'{features_prefix}audio_embeddings.npy', audio_embeddings)
    _upload_numpy(bucket, f'{features_prefix}text_embeddings.npy', text_embeddings)
    _upload_json(bucket, f'{features_prefix}transcript.json', transcript)

    return ExtractOutput(
        features_s3_prefix=f's3://{bucket}/{features_prefix}',
        duration_seconds=float(min_seconds),
        detected_language=detected_language,
        transcript=transcript,
        is_audio_only=is_audio_only,
    )
