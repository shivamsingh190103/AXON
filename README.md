# AXON

Neural Content Intelligence Platform monorepo.

## Architecture (Production Split)

Use a distributed setup so your MacBook Air M1 stays responsive:

- **Machine 1 (Local MacBook, command center)**
  - `apps/web` (React)
  - `apps/api` (Express + BullMQ worker)
  - Postgres + Redis via Docker
- **Machine 2 (Cloud GPU, inference engine)**
  - `apps/ml` (FastAPI + heavy models)
  - Runs on RunPod/Lambda/A100 class machine

## Repository Layout

- `apps/web`: React + Vite frontend
- `apps/api`: Express + Prisma API
- `apps/ml`: FastAPI ML microservice
- `packages/shared`: Shared Zod schemas + TS types

## 1) Credentials You Need (Initial to Final)

### Hugging Face
1. Create/login at [Hugging Face](https://huggingface.co/).
2. Open the Llama model page you use (for example `meta-llama/Llama-3.2-3B-Instruct`) and accept/request access.
3. Create a token with **Read** scope.
4. Put it in `HF_TOKEN` (on the GPU machine).

### Database
- Local default works out of the box:
  - `DATABASE_URL=postgresql://axon:password@localhost:5432/axon_db`

### Storage
- For production: use AWS S3 credentials.
- For local-only tests: MinIO is supported.

### Optional (for complete auth/comms flows)
- Google OAuth: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- Resend: `RESEND_API_KEY`, `EMAIL_FROM`

## 2) Environment Setup

1. Copy env file:
   - `cp .env.example .env`
2. On your **MacBook** `.env`, set:
   - `ML_SERVICE_URL=http://<YOUR_CLOUD_GPU_PUBLIC_IP>:8000`
   - `ML_SERVICE_SECRET=<same_secret_used_on_gpu_machine>`
3. On your **Cloud GPU** (`apps/ml/.env`), set:
   - `HF_TOKEN=<your_hf_token>`
   - `ML_SERVICE_SECRET=<same_secret_used_on_mac_api>`
   - Model IDs if needed:
     - `VJEPA_MODEL_ID`
     - `TRIBE_MODEL_ID`
     - `VJEPA_MODEL_ID_FALLBACK` (comma-separated optional)
     - `TRIBE_MODEL_ID_FALLBACK` (comma-separated optional)

## 3) Boot Local Command Center (Mac)

```bash
npm install
docker compose up postgres redis -d
cd apps/api && npx prisma migrate dev && cd ../..
npm run dev
```

This starts frontend + API locally while ML stays remote.

## 4) Boot Cloud GPU Inference Node

In your GPU machine clone of this repo:

```bash
cd apps/ml
bash runpod_setup.sh
```

`runpod_setup.sh` does all of this:
1. `apt-get update && apt-get install -y ffmpeg`
2. `pip install -r requirements.txt`
3. Prompts for `HF_TOKEN` if missing
4. Starts: `uvicorn main:app --host 0.0.0.0 --port 8000`

## 5) Verify End-to-End

### ML health (from Mac)
```bash
curl http://<YOUR_CLOUD_GPU_PUBLIC_IP>:8000/health
```

### API health
```bash
curl http://localhost:3001/health
```

### App
- Open `http://localhost:5173`
- Register/login
- Upload a short test video
- Watch socket progress updates on `/analysis/:id`

## Model ID Overrides

If a model ID 404s on Hugging Face, set alternative IDs in env without code edits:

- `VJEPA_MODEL_ID` + `VJEPA_MODEL_ID_FALLBACK`
- `TRIBE_MODEL_ID` + `TRIBE_MODEL_ID_FALLBACK`

Fallback vars accept comma-separated candidates; loader tries them in order.

## S3 Playback Requirements

Your S3 bucket must allow CORS + range-friendly playback:

- Allow origin: your `FRONTEND_URL`
- Allow method: `GET`
- Allow headers: `*`
- Expose headers: `Accept-Ranges`, `Content-Length`, `Content-Range`, `ETag`

Example:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET"],
    "AllowedOrigins": ["http://localhost:5173"],
    "ExposeHeaders": ["Accept-Ranges", "Content-Length", "Content-Range", "ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

## Notes

- API already reads `ML_SERVICE_URL` from env (`apps/api/src/lib/env.ts`).
- Keep heavy ML inference off your M1 to avoid memory pressure.
