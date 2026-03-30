# AXON

Neural Content Intelligence Platform monorepo.

## Apps
- `apps/web`: React + Vite frontend
- `apps/api`: Express + Prisma API
- `apps/ml`: FastAPI ML microservice
- `packages/shared`: Shared Zod schemas + TS types

## Quick start
1. `cp .env.example .env`
2. `npm install`
3. Start infra:
   - Docker path: `docker compose up postgres redis minio mc -d`
   - Local macOS fallback: `brew services start postgresql@16 && brew services start redis`
4. Generate Prisma client and run migrations:
   - `cd apps/api && npx prisma generate`
   - Preferred: `npx prisma migrate dev`
   - Fallback (if migration engine is blocked): `DATABASE_URL=postgresql://axon:password@localhost:5432/axon_db npx prisma db push`
5. (Optional) seed demo user/data:
   - `DATABASE_URL=postgresql://axon:password@localhost:5432/axon_db npm run seed --workspace=@axon/api`
6. Start everything:
   - `npm run dev`

## MacBook Air M1 Safe Mode (recommended)
This mode is configured to avoid heavy RAM/VRAM pressure.

1. Keep these defaults in `.env`:
   - `ML_PROFILE=lite`
   - `ML_REQUIRE_FULL_MODELS=false`
   - `ML_ENABLE_VJEPA2=false`
   - `ML_ENABLE_WAV2VEC=false`
   - `ML_ENABLE_LLAMA=false`
   - `ML_ENABLE_TRIBE=false`
   - `ML_ENABLE_WHISPER=true`
   - `WHISPER_MODEL_SIZE=tiny`
2. Start ML without reload (lower CPU/memory churn):
   - `cd apps/ml && source .venv/bin/activate && uvicorn main:app --host 0.0.0.0 --port 8000`
3. Health check:
   - `curl http://127.0.0.1:8000/health`
   - Expect `profile: "lite"` and `degraded_mode: true` on M1-safe config.
4. In this mode, AXON runs with lightweight extraction + deterministic fallback inference/scoring paths, so your laptop stays responsive.

## Full Model Mode (high resource)
Use only on a stronger machine/cloud GPU.

1. Set in `.env`:
   - `ML_PROFILE=full`
   - `ML_REQUIRE_FULL_MODELS=true`
   - `ML_ENABLE_VJEPA2=true`
   - `ML_ENABLE_WAV2VEC=true`
   - `ML_ENABLE_LLAMA=true`
   - `ML_ENABLE_TRIBE=true`
2. Set `HF_TOKEN` and accept gated model licenses first.
3. Expect long first boot and large downloads.

## Demo credentials
- Email: `demo@axon.ai`
- Password: `Password123`

## Verification commands
- `npm run typecheck`
- `npm run build`

## Notes
- Queue, realtime progress, auth refresh, uploads, and share/export flows are wired and operational.
- ML service supports two runtime profiles:
  - `lite`: low-pressure mode for local laptops.
  - `full`: full-model mode for GPU-backed environments.

## S3 playback requirements
- S3 bucket CORS must allow `GET` from your `FRONTEND_URL` and `AllowedHeaders: ["*"]`.
- Presigned playback URLs are generated without signing a `Range` header so browser `<video>` seeking works.
- Recommended CORS template:

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
