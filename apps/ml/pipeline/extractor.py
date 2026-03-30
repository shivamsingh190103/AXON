from __future__ import annotations

import random
from dataclasses import dataclass


@dataclass
class ExtractOutput:
    features_s3_prefix: str
    duration_seconds: float
    detected_language: str
    transcript: list[dict]


def run_extract(analysis_id: str, s3_key: str, bucket: str, duration_seconds: float | None = None) -> ExtractOutput:
    # Deterministic mock output based on analysis id hash.
    seed = sum(ord(c) for c in analysis_id)
    random.seed(seed)

    duration = duration_seconds if duration_seconds and duration_seconds > 0 else random.randint(45, 300)

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

    return ExtractOutput(
        features_s3_prefix=f's3://{bucket}/features/{analysis_id}/',
        duration_seconds=float(duration),
        detected_language='en',
        transcript=transcript
    )
