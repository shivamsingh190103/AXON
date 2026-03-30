from __future__ import annotations

import math
import random
from dataclasses import dataclass


@dataclass
class ScoreOutput:
    hook_timeseries: list[float]
    boredom_timeseries: list[float]
    emotion_timeseries: list[float]
    hook_score: int
    boredom_score: int
    emotion_score: int
    overall_score: int


def _clamp(value: float) -> float:
    return max(0.0, min(100.0, value))


def _mean(values: list[float]) -> int:
    if not values:
        return 0
    return int(round(sum(values) / len(values)))


def run_score(analysis_id: str, duration_seconds: float) -> ScoreOutput:
    random.seed(sum(ord(ch) for ch in analysis_id) + int(duration_seconds))
    n = max(1, int(duration_seconds))

    hook = []
    boredom = []
    emotion = []

    for t in range(n):
        phase = t / 7.5
        hook_val = _clamp(58 + 22 * math.sin(phase) + random.uniform(-6, 6))
        boredom_val = _clamp(38 + 18 * math.cos(phase / 1.2) + random.uniform(-7, 7))
        emotion_val = _clamp(52 + 20 * math.sin(phase / 1.3 + 0.8) + random.uniform(-6, 6))

        hook.append(round(hook_val, 2))
        boredom.append(round(boredom_val, 2))
        emotion.append(round(emotion_val, 2))

    hook_score = _mean(hook)
    boredom_score = _mean(boredom)
    emotion_score = _mean(emotion)
    overall_score = int(round(hook_score * 0.35 + (100 - boredom_score) * 0.35 + emotion_score * 0.30))

    return ScoreOutput(
        hook_timeseries=hook,
        boredom_timeseries=boredom,
        emotion_timeseries=emotion,
        hook_score=hook_score,
        boredom_score=boredom_score,
        emotion_score=emotion_score,
        overall_score=int(_clamp(overall_score)),
    )
