from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Any


@dataclass
class LoadedModels:
    vjepa2: bool
    wav2vec: bool
    llama: bool
    tribe: bool


@dataclass
class RuntimeModels:
    device: str
    torch: Any | None
    vjepa2_model: Any | None
    wav2vec_model: Any | None
    wav2vec_processor: Any | None
    llama_model: Any | None
    llama_tokenizer: Any | None
    tribe_model: Any | None
    whisper_model: Any | None
    whisper_backend: str | None


_runtime_models = RuntimeModels(
    device='cpu',
    torch=None,
    vjepa2_model=None,
    wav2vec_model=None,
    wav2vec_processor=None,
    llama_model=None,
    llama_tokenizer=None,
    tribe_model=None,
    whisper_model=None,
    whisper_backend=None,
)

_loaded_flags = LoadedModels(vjepa2=False, wav2vec=False, llama=False, tribe=False)


def _resolve_device(torch_module: Any | None) -> str:
    if torch_module is None:
        return 'cpu'
    if torch_module.cuda.is_available():
        return 'cuda'
    if getattr(torch_module.backends, 'mps', None) and torch_module.backends.mps.is_available():
        return 'mps'
    return 'cpu'


def _load_transformer_model(model_id: str, torch_dtype: Any | None, hf_token: str | None):
    from transformers import AutoModel  # type: ignore

    kwargs: dict[str, Any] = {'trust_remote_code': True}
    if hf_token:
        kwargs['token'] = hf_token
    if torch_dtype is not None:
        kwargs['torch_dtype'] = torch_dtype

    return AutoModel.from_pretrained(model_id, **kwargs)


def load_models() -> LoadedModels:
    global _loaded_flags

    hf_token = os.getenv('HF_TOKEN') or None
    tribe_model_id = os.getenv('TRIBE_MODEL_ID', 'facebook/tribev2')
    vjepa_model_id = os.getenv('VJEPA_MODEL_ID', 'facebook/vjepa2')
    wav2vec_model_id = os.getenv('WAV2VEC_MODEL_ID', 'facebook/w2v-bert-2.0')
    llama_model_id = os.getenv('LLAMA_MODEL_ID', 'meta-llama/Llama-3.2-3B-Instruct')
    whisper_model_size = os.getenv('WHISPER_MODEL_SIZE', 'small')

    try:
        import torch  # type: ignore

        _runtime_models.torch = torch
        _runtime_models.device = _resolve_device(torch)
    except Exception:
        _runtime_models.torch = None
        _runtime_models.device = 'cpu'

    torch_dtype = None
    if _runtime_models.torch is not None and _runtime_models.device in {'cuda', 'mps'}:
        torch_dtype = _runtime_models.torch.float16

    try:
        _runtime_models.vjepa2_model = _load_transformer_model(vjepa_model_id, torch_dtype, hf_token)
        if _runtime_models.torch is not None:
            _runtime_models.vjepa2_model.to(_runtime_models.device)
        _runtime_models.vjepa2_model.eval()
        _loaded_flags.vjepa2 = True
    except Exception:
        _runtime_models.vjepa2_model = None
        _loaded_flags.vjepa2 = False

    try:
        from transformers import AutoModel, AutoProcessor  # type: ignore

        processor_kwargs: dict[str, Any] = {'trust_remote_code': True}
        model_kwargs: dict[str, Any] = {'trust_remote_code': True}
        if hf_token:
            processor_kwargs['token'] = hf_token
            model_kwargs['token'] = hf_token
        if torch_dtype is not None:
            model_kwargs['torch_dtype'] = torch_dtype

        _runtime_models.wav2vec_processor = AutoProcessor.from_pretrained(wav2vec_model_id, **processor_kwargs)
        _runtime_models.wav2vec_model = AutoModel.from_pretrained(wav2vec_model_id, **model_kwargs)
        if _runtime_models.torch is not None:
            _runtime_models.wav2vec_model.to(_runtime_models.device)
        _runtime_models.wav2vec_model.eval()
        _loaded_flags.wav2vec = True
    except Exception:
        _runtime_models.wav2vec_model = None
        _runtime_models.wav2vec_processor = None
        _loaded_flags.wav2vec = False

    try:
        from transformers import AutoModelForCausalLM, AutoTokenizer  # type: ignore

        tokenizer_kwargs: dict[str, Any] = {'trust_remote_code': True}
        model_kwargs: dict[str, Any] = {'trust_remote_code': True}
        if hf_token:
            tokenizer_kwargs['token'] = hf_token
            model_kwargs['token'] = hf_token
        if torch_dtype is not None:
            model_kwargs['torch_dtype'] = torch_dtype

        _runtime_models.llama_tokenizer = AutoTokenizer.from_pretrained(llama_model_id, **tokenizer_kwargs)
        _runtime_models.llama_model = AutoModelForCausalLM.from_pretrained(llama_model_id, **model_kwargs)
        if _runtime_models.torch is not None:
            _runtime_models.llama_model.to(_runtime_models.device)
        _runtime_models.llama_model.eval()
        _loaded_flags.llama = True
    except Exception:
        _runtime_models.llama_model = None
        _runtime_models.llama_tokenizer = None
        _loaded_flags.llama = False

    try:
        _runtime_models.tribe_model = _load_transformer_model(tribe_model_id, torch_dtype, hf_token)
        if _runtime_models.torch is not None:
            _runtime_models.tribe_model.to(_runtime_models.device)
        _runtime_models.tribe_model.eval()
        _loaded_flags.tribe = True
    except Exception:
        _runtime_models.tribe_model = None
        _loaded_flags.tribe = False

    # Whisper is required for extraction but is not part of the /health contract payload.
    try:
        from faster_whisper import WhisperModel  # type: ignore

        whisper_device = 'cuda' if _runtime_models.device == 'cuda' else 'cpu'
        compute_type = 'float16' if whisper_device == 'cuda' else 'int8'
        _runtime_models.whisper_model = WhisperModel(whisper_model_size, device=whisper_device, compute_type=compute_type)
        _runtime_models.whisper_backend = 'faster-whisper'
    except Exception:
        _runtime_models.whisper_model = None
        _runtime_models.whisper_backend = None

    return _loaded_flags


def get_runtime_models() -> RuntimeModels:
    return _runtime_models


def models_ready() -> bool:
    return _loaded_flags.vjepa2 and _loaded_flags.wav2vec and _loaded_flags.llama and _loaded_flags.tribe


def gpu_status() -> tuple[bool, float | None]:
    torch_module = _runtime_models.torch
    if torch_module is not None:
        try:
            if torch_module.cuda.is_available():
                free, _total = torch_module.cuda.mem_get_info()
                return True, round(free / (1024 ** 3), 2)
            if getattr(torch_module.backends, 'mps', None) and torch_module.backends.mps.is_available():
                return True, None
        except Exception:
            pass

    if os.getenv('ML_GPU_AVAILABLE') == 'true':
        return True, None

    return False, None
