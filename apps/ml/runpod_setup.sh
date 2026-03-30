#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${SCRIPT_DIR}"

if [[ -f ".env" ]]; then
  set -a
  # shellcheck source=/dev/null
  source ".env"
  set +a
fi

echo "[1/4] Installing system dependency: ffmpeg"
apt-get update
apt-get install -y ffmpeg

echo "[2/4] Installing Python dependencies"
python3 -m pip install --upgrade pip
pip install -r requirements.txt

if [[ -z "${HF_TOKEN:-}" ]]; then
  echo "[3/4] Hugging Face token required for gated/private models"
  read -r -s -p "Enter HF_TOKEN (read scope): " HF_TOKEN_INPUT
  echo
  if [[ -z "${HF_TOKEN_INPUT}" ]]; then
    echo "HF_TOKEN cannot be empty."
    exit 1
  fi
  export HF_TOKEN="${HF_TOKEN_INPUT}"
else
  echo "[3/4] HF_TOKEN found in environment"
fi

export ML_PROFILE="${ML_PROFILE:-full}"
export ML_REQUIRE_FULL_MODELS="${ML_REQUIRE_FULL_MODELS:-true}"

echo "[4/4] Starting AXON ML FastAPI service on :8000"
exec uvicorn main:app --host 0.0.0.0 --port 8000
