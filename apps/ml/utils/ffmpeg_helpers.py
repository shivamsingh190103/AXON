from __future__ import annotations

from pathlib import Path


def ensure_tmp_dir(analysis_id: str) -> Path:
    path = Path('/tmp') / 'axon-ml' / analysis_id
    path.mkdir(parents=True, exist_ok=True)
    return path
