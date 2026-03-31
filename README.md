# AXON

AXON is a full-stack neural content intelligence platform for creators and media teams.

It analyzes uploaded media (video + audio, and audio-only) and returns second-by-second engagement signals before publishing.

## Current Product State

This repository is set up for two modes:

1. Local Demo Mode (recommended on MacBook Air M1)
- Uses real frontend/backend/queue/auth/storage flows.
- Uses `USE_MOCK_ML=true` for lightweight inference.
- Fast, stable, low memory pressure.

2. Full Inference Mode (production-style)
- Run `apps/ml` on cloud GPU (RunPod/Lambda/A100 class).
- Keep web + API + Postgres + Redis on your local/dev server.

## Universal Content Expansion (v2.0)

The app now supports a content taxonomy beyond YouTube-only workflows.

Implemented content families:
- Social video: YouTube Video, YouTube Short, Instagram Reel, TikTok
- Audio: Podcast Episode, Podcast Clip, Audio Ad
- Live/Education: Live Stream, Webinar, Course Lesson, Lecture Recording
- Ads/Product: Ad Creative, Product Demo

Key behavior:
- Upload modal requires selecting `contentType` first.
- Audio-only types accept audio media and trigger audio-mode playback UI.
- Short-form types use short-form presentation logic.
- Metric labels adapt to content type (context-aware naming).

## Monorepo

- `apps/web`: React 18 + Vite + Tailwind + Framer Motion
- `apps/api`: Express 5 + TypeScript + Prisma + BullMQ + Socket.IO
- `apps/ml`: FastAPI + model pipeline (local mock friendly, cloud full mode)
- `packages/shared`: shared types + Zod schemas

## M1-Safe Quick Start (Recommended)

### 1) Install dependencies
```bash
npm install
npm run build --workspace=@axon/shared
```

### 2) Configure environment
```bash
cp .env.example .env
```

Set these values in `.env`:
```env
USE_MOCK_ML=true
DATABASE_URL=postgresql://axon:password@localhost:5432/axon_db
REDIS_URL=redis://localhost:6379
VITE_API_URL=http://localhost:3001/api/v1
VITE_SOCKET_URL=http://localhost:3001
```

### 3) Start infra
```bash
docker compose up -d postgres redis minio mc
```

### 4) Apply DB migrations + Prisma client
```bash
cd apps/api
npx prisma migrate dev
npm run prisma:generate
cd ../..
```

### 5) Run app
```bash
npm run dev
```

Open:
- Web: `http://localhost:5173`
- API health: `http://localhost:3001/health`

## First End-to-End Demo Flow

1. Register a new account.
2. Open Upload modal.
3. Select content type.
4. Upload file or YouTube URL.
5. Watch Socket.IO progress updates.
6. Open completed analysis and verify timeline + insight cards + export/share.

## Auth and Registration Troubleshooting

If Create Account fails, check in this order:

1. PostgreSQL running
```bash
docker ps | grep postgres
```

2. Redis running
```bash
docker ps | grep redis
```

3. Migrations applied
```bash
cd apps/api
npx prisma migrate dev
```

4. Frontend/API URL consistency
- Use `http://localhost:5173` and `http://localhost:3001` together.
- Avoid mixing `localhost` and LAN IP unless configured.

Recent hardening added in code:
- Better backend error mapping for DB/Redis setup failures.
- Rate limits now fail-open locally if Redis store is temporarily unavailable.
- Local host normalization in Axios/Socket client to reduce CSRF/session issues.

## Content-Type Specific Behavior

### Upload validation
- Video + audio formats accepted.
- Audio uploads capped at 200MB.
- Video uploads capped by plan (free/creator/pro via backend checks).
- Modality mismatch guard rejects wrong media type for selected content type.
- Duration expectation warning shown for unusual length.

### Analysis UI
- Timeline labels are content-aware from shared taxonomy.
- Audio-only content renders audio mode player with waveform view.
- Short-form content supports portrait-centric analysis context.

## Cloud GPU Setup (Full Mode)

When you are ready for production-grade inference:

1. Deploy `apps/ml` to cloud GPU host.
2. Set:
```env
USE_MOCK_ML=false
ML_SERVICE_URL=http://<gpu-host>:8000
ML_SERVICE_SECRET=<shared-secret>
HF_TOKEN=<token-with-model-access>
```
3. Keep local command center unchanged (web/api/db/redis).

## Scripts

Root:
```bash
npm run dev
npm run build
npm run typecheck
```

API:
```bash
cd apps/api
npm run dev
npm run prisma:generate
npm run seed
```

Web:
```bash
cd apps/web
npm run dev
npm run build
```

Shared:
```bash
cd packages/shared
npm run build
```

## Production Readiness Direction

This codebase is positioned for SaaS evolution:
- clear service boundaries,
- shared schemas/types,
- queue-driven async pipeline,
- real-time progress updates,
- plan limit enforcement,
- auth/session security baseline.

Next recommended milestones:
1. CI/CD + test matrix (API integration + web component tests).
2. Replace remaining ML placeholders with validated full model paths on GPU infra.
3. Billing + subscription lifecycle hardening.
4. Observability stack (structured logs, tracing, alerts).

---

If you want, the next step can be a production deployment checklist (`staging -> prod`) tailored to your cloud provider.
