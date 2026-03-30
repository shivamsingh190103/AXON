from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass
class LoadedModels:
    vjepa2: bool
    wav2vec: bool
    llama: bool
    tribe: bool


def load_models() -> LoadedModels:
    # Lightweight bootstrap flags for MVP. Swap with actual model loading.
    return LoadedModels(vjepa2=True, wav2vec=True, llama=True, tribe=True)


def gpu_status() -> tuple[bool, float | None]:
    try:
      import torch  # type: ignore

      if torch.cuda.is_available():
          free, _total = torch.cuda.mem_get_info()
          return True, round(free / (1024 ** 3), 2)

      if getattr(torch.backends, 'mps', None) and torch.backends.mps.is_available():
          return True, None
    except Exception:
      pass

    # Optional env override for local testing.
    if os.getenv('ML_GPU_AVAILABLE') == 'true':
        return True, None

    return False, None
