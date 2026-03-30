from __future__ import annotations

import random
from dataclasses import dataclass

VJEPA_BATCH_FRAMES = 64
SECONDS_PER_VJEPA_BATCH = 4
WHISPER_TASK = 'translate'


def _clear_cuda_cache() -> None:
    try:
        import torch  # type: ignore

        if torch.cuda.is_available():
            torch.cuda.empty_cache()
    except Exception:
        # Torch is optional in local mock mode.
        return


@dataclass
class ExtractOutput:
    features_s3_prefix: str
    duration_seconds: float
    detected_language: str
    transcript: list[dict]


def run_extract(analysis_id: str, s3_key: str, bucket: str, duration_seconds: float | None = None) -> ExtractOutput:
    # Deterministic mock output based on analysis id hash.
    # In production, Whisper runs with task='translate' to handle Hindi/Hinglish
    # transcription+translation in one pass, aligned to timestamps.
    seed = sum(ord(c) for c in analysis_id)
    random.seed(seed)
    _ = s3_key
    _ = WHISPER_TASK

    duration = duration_seconds if duration_seconds and duration_seconds > 0 else random.randint(45, 300)

    total_batches = max(1, int(duration // SECONDS_PER_VJEPA_BATCH) + (1 if duration % SECONDS_PER_VJEPA_BATCH else 0))
    for _batch_index in range(total_batches):
        # Production path should process exactly 64 frames at a time for V-JEPA2.
        _batch_frame_count = VJEPA_BATCH_FRAMES
        _ = _batch_frame_count
        _clear_cuda_cache()

    transcript_words = [
        'this',
        'is',
        'the',
        'moment',
        'you',
        'need',
        'to',
        'watch'
    ]

    transcript = []
    cursor = 0.0
    for word in transcript_words:
        span = round(random.uniform(0.2, 0.6), 2)
        transcript.append({'word': word, 'start': round(cursor, 2), 'end': round(cursor + span, 2)})
        cursor += span

    detected_language = 'hi-en' if seed % 5 == 0 else 'en'

    return ExtractOutput(
        features_s3_prefix=f's3://{bucket}/features/{analysis_id}/',
        duration_seconds=float(duration),
        detected_language=detected_language,
        transcript=transcript
    )
