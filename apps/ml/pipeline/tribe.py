from __future__ import annotations

import math
from dataclasses import dataclass


@dataclass
class InferOutput:
    raw_output_s3_key: str
    duration_seconds: float
    num_frames: int


def run_infer(analysis_id: str, features_s3_prefix: str, bucket: str, duration_seconds: float) -> InferOutput:
    _ = (features_s3_prefix, bucket)
    frames = max(1, int(math.floor(duration_seconds)))
    return InferOutput(
        raw_output_s3_key=f'raw-output/{analysis_id}/tribe_output.npy',
        duration_seconds=duration_seconds,
        num_frames=frames,
    )
