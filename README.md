<div align="center">

# 🧠 AXON

**Neural Content Intelligence for the Modern Creator Economy.**

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](#)
[![React](https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](#)
[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](#)
[![PyTorch](https://img.shields.io/badge/PyTorch-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white)](#)
[![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)](#)
[![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](#)

*Predict human attention before you publish.*

[Getting Started](#-getting-started) · [Architecture](#️-architecture) · [The Pipeline](#-the-biological-pipeline) · [API Reference](#-api-reference) · [Deployment](#-deployment)

</div>

---

## 🌍 The Vision: In-Silico Neuromarketing

Attention is the most valuable currency on the modern internet — and we measure it completely wrong.

Right now, every creator is driving while looking in the rearview mirror. You upload a video to YouTube or Instagram, wait 24 hours, and study the **retention graph** to find where your audience tuned out. It's a *lagging indicator*. By the time you know the video failed, the time and money are already gone.

To get a *leading indicator*, Fortune 500 companies hire neuromarketing agencies, wire 50 people to EEG headsets, and pay **$50,000 per study**.

**AXON changes this.** AXON is a **Virtual Neuromarketing Lab in a Box**. By fusing state-of-the-art foundation models with Meta's TRIBE v2 fMRI brain decoder, AXON simulates how the human brain will process a video — second by second — before a single viewer ever watches it. We convert biological cognitive states into three actionable editing metrics: **Hook**, **Boredom**, and **Emotion**.

> Democratizing a $50,000 lab study into a single API call.

---

## 🔬 The Biological Pipeline

AXON uses a **tri-modal fusion pipeline** that extracts audio, visual, and semantic signals from a video and projects them onto the **Glasser Cortical Parcellation** — a neuroscience standard mapping 20,484 vertices of the human cortex.

```
Video File / YouTube URL
        │
        ├─── 👀 Visual   ──► facebook/vjepa2           ──► 768D / second
        ├─── 👂 Audio    ──► facebook/w2v-bert-2.0     ──► 256D / second
        └─── 💬 Language ──► meta-llama/Llama-3.2-3B   ──► 256D / second
                                        │
                                        ▼
                              facebook/tribev2  (TRIBE v2)
                         Multimodal fMRI Neural Decoder
                                        │
                                        ▼
                     20,484-vertex Glasser Cortical Map / second
                                        │
                    ┌───────────────────┼───────────────────┐
                    ▼                   ▼                   ▼
             Hook Score           Boredom Score       Emotion Score
          Visual + Auditory     Default Mode Network    TPJ + MTG
              Cortex            (mind-wandering)      (arousal)
```

### The Three Metrics

| Metric | Brain Region | What It Measures |
|--------|-------------|-----------------|
| **Hook** | Visual + Auditory Cortex | Sensory engagement — how locked-in is the viewer? |
| **Boredom** | Default Mode Network (DMN) | Mind-wandering — when the brain stops processing and daydreams. High DMN = viewer about to leave. |
| **Emotion** | Temporoparietal Junction (TPJ) + Middle Temporal Gyrus (MTG) | Physiological arousal to narrative beats and emotional moments. |

The **Overall Score** is a weighted composite: `35% Hook + 35% (100 − Boredom) + 30% Emotion`, producing a 0–100 grade (A/B/C/D).

### AI Insights Engine
Beyond raw scores, AXON's insight engine automatically detects:
- 🔴 **Critical Drop** — Boredom spike above threshold, high churn risk
- 🟡 **Boredom Spike** — DMN activation, consider cutting or pacing change
- 🟢 **Hook Moment** — Sensory re-engagement after a dip, learn from it
- 💜 **Emotion Peak** — Emotional high-point, ideal for CTAs

Up to 8 insights per video, format-aware (SHORT_FORM / STANDARD / LONG_FORM), severity-ranked (LOW → CRITICAL).

---

## 🏗️ Architecture

AXON uses a strict **distributed architecture** — separating lightweight orchestration from heavy GPU inference — so the entire platform can be run with a MacBook as the command center and a cloud A100 as the inference node.

```
┌─────────────────────────────────────────────────────────────────┐
│                   COMMAND CENTER  (Local / Cloud VM)            │
│                                                                 │
│  ┌──────────────┐    ┌──────────────────┐    ┌──────────────┐  │
│  │  React 18    │    │  Express API      │    │   BullMQ     │  │
│  │  Vite 5      │◄──►│  TypeScript       │◄──►│  + Redis     │  │
│  │  TailwindCSS │    │  Prisma ORM       │    │  5-stage     │  │
│  │  Zustand     │    │  Socket.IO        │    │  job queue   │  │
│  │  Framer      │    │  JWT / OAuth      │    └──────────────┘  │
│  └──────────────┘    └──────────────────┘           │          │
│         :5173               :3001                   │          │
│                                             S3 / MinIO         │
│                                          (feature store)       │
└─────────────────────────────────────────────────────────────────┘
                                                      │
                                    HTTP (ML_SERVICE_URL)
                                                      │
┌─────────────────────────────────────────────────────────────────┐
│                  INFERENCE ENGINE  (Cloud GPU — A100 80GB)      │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  FastAPI · Uvicorn · PyTorch 2.6 · Hugging Face            │ │
│  │                                                            │ │
│  │  /extract  →  V-JEPA2 + Wav2Vec-BERT + Whisper + Llama    │ │
│  │  /infer    →  TRIBE v2 (20,484-vertex brain decoder)       │ │
│  │  /score    →  Glasser parcel mapping → Hook/Boredom/Emote  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                            :8000                                │
└─────────────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18.3, Vite 5.4, TypeScript 5.6, TailwindCSS, Framer Motion, Zustand, React Query, Recharts, Socket.IO Client |
| **Backend API** | Node.js 20+, Express 5, TypeScript 5.6, Prisma 5.20, PostgreSQL 16, BullMQ 5.16, Socket.IO 4.8 |
| **Storage** | AWS S3 / MinIO (S3-compatible) |
| **ML Service** | Python 3.11, FastAPI 0.116, PyTorch 2.6, Hugging Face Transformers 4.46, Faster-Whisper |
| **Infrastructure** | Docker Compose, Turbo monorepo |

---

## 📂 Repository Structure

```text
AXON/
├── apps/
│   ├── web/                  # React + Vite dashboard
│   │   └── src/
│   │       ├── pages/        # Dashboard, Analysis, Settings, Share, Auth
│   │       ├── components/   # VideoPlayer, TimelineTracks, InsightPanel, UploadModal
│   │       ├── stores/       # Zustand: auth, analysis, ui state
│   │       └── hooks/        # useAuth, useAnalysis, useUpload
│   │
│   ├── api/                  # Express + Prisma job orchestrator
│   │   └── src/
│   │       ├── routes/       # auth, analyses, users, share, webhooks
│   │       ├── controllers/  # Request handlers per route group
│   │       ├── jobs/         # BullMQ worker (5-stage pipeline)
│   │       ├── services/     # ML client, S3, email, insight generation
│   │       ├── middleware/   # Auth, rate-limit, upload, CSRF
│   │       └── lib/          # Prisma client, Redis, env, socket
│   │   └── prisma/
│   │       └── schema.prisma # User, Analysis, AnalysisResult, RefreshToken
│   │
│   └── ml/                   # FastAPI GPU inference service
│       ├── main.py           # Route definitions + model lifecycle
│       ├── pipeline/
│       │   ├── extractor.py  # V-JEPA2 + Wav2Vec + Whisper + Llama feature extraction
│       │   ├── tribe.py      # TRIBE v2 inference + Glasser parcel projection
│       │   ├── scorer.py     # Brain region → Hook / Boredom / Emotion scoring
│       │   └── insights.py   # Insight detection (not used directly — lives in API)
│       └── utils/
│           ├── ffmpeg_helpers.py   # Video/audio extraction via FFmpeg
│           └── glasser_parcels.json # 20,484-vertex brain atlas data
│
├── packages/
│   └── shared/               # Shared TypeScript types, Zod schemas, enums
│       └── src/
│           ├── types/        # User, Analysis, AnalysisResult, Insight, Job types
│           └── schemas/      # Zod validation for auth, analysis, user endpoints
│
├── docker-compose.yml        # Dev: postgres, redis, minio, api, web, ml
├── docker-compose.prod.yml   # Prod: api, web, ml (external services assumed)
└── turbo.json                # Monorepo task pipeline (build, dev, lint)
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v20+ and npm
- **Docker & Docker Compose** (for PostgreSQL, Redis, MinIO)
- **YouTube processing binaries** (API host): `yt-dlp`, `ffmpeg`, `ffprobe`
- **Hugging Face account** with `meta-llama/Llama-3.2-3B-Instruct` access accepted (gated model — requires Meta approval on the HF model page)
- **AWS S3 bucket** or MinIO (for feature/video storage)

### Option A — Local Sandbox (Zero GPU Cost)

Test the full UI, API flow, and job queue without renting a GPU. The mock ML layer returns realistic engagement data in ~10 seconds.

**1. Clone and install:**
```bash
git clone https://github.com/shivamsingh190103/AXON.git
cd AXON
npm install
npm run build --workspace=@axon/shared
```

**2. Configure environment:**
```bash
cp .env.example .env
```
Open `.env` and set:
```env
USE_MOCK_ML=true
```
All other defaults work out of the box for local development.

**3. Start infrastructure and migrate database:**
```bash
docker compose up postgres redis minio -d
cd apps/api
npx prisma migrate dev
cd ../..
```

**4. Run the app:**
```bash
npm run dev
```

Open [`http://localhost:5173`](http://localhost:5173), register an account, upload a video, and watch the mock pipeline simulate a real run in seconds. Real-time progress streams via WebSocket to the analysis page.

---

### Option B — Full Production Mode (Cloud GPU)

Run the actual tensor mathematics and biological brain mapping on NVIDIA A100-class hardware.

**1. Spin up a GPU instance** on [RunPod](https://runpod.io), [Lambda Labs](https://lambdalabs.com/), or any cloud provider. Expose port `8000`. An NVIDIA A100 (80GB) or equivalent is recommended (~50GB model cache).

**2. Bootstrap the inference engine** — SSH into the GPU instance, clone this repo, and run the automated setup:
```bash
cd apps/ml
bash runpod_setup.sh
# Provide your HF_TOKEN when prompted to download gated models.
```
The setup script handles `ffmpeg` installation, Python dependencies, and launches `uvicorn` on port 8000.

**3. Connect your Command Center** — on your local `.env`, point the API at your GPU:
```env
USE_MOCK_ML=false
ML_SERVICE_URL=http://<YOUR_GPU_PUBLIC_IP>:8000
ML_SERVICE_SECRET=<shared_secret_matching_gpu_env>
```

**4. Launch:**
```bash
npm run dev
```

**5. Verify the connection:**
```bash
# Check GPU service health (shows model readiness + VRAM usage)
curl http://<YOUR_GPU_PUBLIC_IP>:8000/health

# Check API health
curl http://localhost:3001/health
```

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env`. Key variables:

### Command Center (`.env` in repo root)

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://axon:password@localhost:5432/axon_db` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `JWT_ACCESS_SECRET` | 32+ char cryptographically random secret for access tokens. Generate with: `openssl rand -base64 32` | — |
| `JWT_REFRESH_SECRET` | 32+ char cryptographically random secret (must differ from access secret). Generate with: `openssl rand -base64 32` | — |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | — |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | — |
| `AWS_ACCESS_KEY_ID` | S3 / MinIO access key | `minioadmin` |
| `AWS_SECRET_ACCESS_KEY` | S3 / MinIO secret key | `minioadmin` |
| `S3_BUCKET_NAME` | S3 bucket name | `axon-videos-dev` |
| `S3_ENDPOINT` | MinIO endpoint (omit for AWS) | `http://localhost:9000` |
| `ML_SERVICE_URL` | URL of the GPU inference service | `http://localhost:8000` |
| `ML_SERVICE_SECRET` | Shared secret for ML auth header | — |
| `USE_MOCK_ML` | Skip real ML inference for dev | `true` |
| `RESEND_API_KEY` | Email delivery via Resend | — |
| `FRONTEND_URL` | For CORS and OAuth redirects | `http://localhost:5173` |

### Inference Engine (GPU machine env)

| Variable | Description |
|----------|-------------|
| `HF_TOKEN` | Hugging Face read token (required for gated models) |
| `ML_SERVICE_SECRET` | Must match `ML_SERVICE_SECRET` on the API side |
| `ML_PROFILE` | `full` (all models) or `lite` (skip heavy models) |
| `VJEPA_MODEL_ID` | Override default `facebook/vjepa2` |
| `TRIBE_MODEL_ID` | Override default `facebook/tribev2` |
| `VJEPA_MODEL_ID_FALLBACK` | Comma-separated fallback model IDs |
| `TRIBE_MODEL_ID_FALLBACK` | Comma-separated fallback model IDs |
| `WHISPER_MODEL_SIZE` | Whisper model size (`small`, `medium`, `large`) |

---

## 🔌 API Reference

All endpoints are prefixed with `/api/v1`. Authentication uses `Authorization: Bearer <access_token>` JWT headers.

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/register` | Create account (email + password) |
| `POST` | `/auth/login` | Login, returns access + refresh tokens |
| `POST` | `/auth/logout` | Invalidate refresh token |
| `POST` | `/auth/refresh` | Rotate access token via refresh token |
| `GET` | `/auth/me` | Current authenticated user |
| `GET` | `/auth/google` | Initiate Google OAuth flow |
| `POST` | `/auth/forgot-password` | Send password reset email |
| `POST` | `/auth/reset-password` | Reset password with token |

### Analyses
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/analyses` | List analyses (paginated, filterable by status) |
| `POST` | `/analyses/upload` | Upload video file (multipart, max 100MB) |
| `POST` | `/analyses/youtube` | Submit YouTube URL for analysis |
| `GET` | `/analyses/:id` | Full analysis detail + per-second scores |
| `GET` | `/analyses/:id/status` | Processing status + progress % (polling fallback) |
| `PATCH` | `/analyses/:id` | Update title |
| `DELETE` | `/analyses/:id` | Delete analysis (blocked during active processing) |
| `GET` | `/analyses/:id/export` | Export results as JSON |
| `POST` | `/analyses/:id/share` | Generate 7-day public share link |
| `POST` | `/analyses/:id/retry` | Retry a failed or cancelled analysis |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/users/me/usage` | Usage stats: analyses used, limit, plan, reset date |
| `PATCH` | `/users/me` | Update display name / avatar |
| `PATCH` | `/users/me/password` | Change password (invalidates all sessions) |

### Public
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/share/:token` | Access shared analysis without authentication |
| `GET` | `/health` | Service health check |

### Real-time (Socket.IO)
Connect to `VITE_SOCKET_URL` with auth token. Join room `analysis:{id}` for live updates.

| Event | Payload | Description |
|-------|---------|-------------|
| `analysis:progress` | `{ status, progress, step, etaSeconds }` | Job stage updates |
| `analysis:completed` | `{ analysisId }` | Processing finished, fetch results |
| `analysis:failed` | `{ analysisId, errorCode }` | Processing failed |

---

## 🧬 Processing Pipeline

When a video is submitted, BullMQ orchestrates a **5-stage asynchronous pipeline** (2 concurrent workers, 30-min lock timeout):

```
QUEUED
  │
  ▼ Stage 1: DOWNLOADING
  │   Download source video (YouTube URL → local temp file)
  │
  ▼ Stage 2: EXTRACTING_FEATURES            [GPU]
  │   • V-JEPA2: 64-frame batches → 768D visual embeddings / second
  │   • Wav2Vec-BERT 2.0: 16kHz PCM → 256D audio embeddings / second
  │   • Faster-Whisper: speech-to-text + language detection
  │   • Llama-3.2-3B: transcript → 256D semantic embeddings / second
  │   • Uploads feature .npy arrays to S3
  │
  ▼ Stage 3: RUNNING_TRIBE                  [GPU]
  │   • Loads embeddings from S3
  │   • TRIBE v2: concatenated 768D input → 20,484-vertex cortex map / second
  │   • Processes in 30-second batches for memory efficiency
  │   • Uploads raw brain output to S3
  │
  ▼ Stage 4: SCORING
  │   • Maps TRIBE output → Glasser cortical parcels
  │   • Hook: visual + auditory cortex activation
  │   • Boredom: Default Mode Network activation (inverted)
  │   • Emotion: TPJ + MTG activation
  │   • Weighted overall score
  │
  ▼ Stage 5: GENERATING_INSIGHTS
  │   • Detects boredom spikes (threshold: 65), emotion peaks, hook moments
  │   • Format-aware suggestions (SHORT_FORM / STANDARD / LONG_FORM)
  │   • Severity ranking + top-8 filtering
  │
COMPLETED / FAILED
```

**Error resilience:** 2 auto-retries with exponential backoff. Hourly stale-job cleanup (2hr+ in-progress → marked FAILED). Failure notification email sent via Resend.

**Mock mode** (`USE_MOCK_ML=true`): Generates plausible timeseries data without GPU access. Full UI and API flow in ~10 seconds. Ideal for development and UI iteration.

---

## 🗄️ Data Models

```prisma
User              ──┐
  email               │  (email/password + Google OAuth)
  plan                │  FREE | CREATOR | PRO
  monthlyUsageCount   │  reset on 1st of each month
  RefreshTokens    ───┘

Analysis         ──┐
  userId              │  belongs to User
  status              │  QUEUED → ... → COMPLETED | FAILED
  sourceType          │  FILE | YOUTUBE_URL
  duration            │  seconds (float)
  language            │  detected by Whisper
  AnalysisResult   ───┘

AnalysisResult
  overallScore        # 0–100 composite
  hookScore           # sensory engagement
  boredomScore        # DMN activation (inverted)
  emotionScore        # TPJ/MTG arousal
  hookTimeseries      # Float[] per second
  boredomTimeseries   # Float[] per second
  emotionTimeseries   # Float[] per second
  insights            # Insight[] (type, timestamp, severity, description)
  grade               # A (80+) | B (60+) | C (40+) | D
  formatType          # SHORT_FORM (<3min) | STANDARD | LONG_FORM (>10min)
```

---

## 🐳 Docker

### Development (all services locally)
```bash
docker compose up -d
```
Starts: `postgres:16`, `redis:7`, `minio` (S3-compatible), `api`, `web`, `ml`.
MinIO bucket is auto-created via the `mc` init container.

### Production
```bash
docker compose -f docker-compose.prod.yml up -d
```
Starts: `api`, `web`, `ml`. Assumes external PostgreSQL, Redis, and S3.

---

## 🛡️ Edge Cases & Resilience

- **Upload limits:** Client and server-side validation reject files > 100MB, protecting S3 costs. For videos larger than 100MB, submit a YouTube URL instead — the pipeline downloads the source directly from YouTube with no size limitation.
- **Concurrent limits:** Plan-based quotas (FREE: 3/month, CREATOR: 20/month, PRO: unlimited) with `HTTP 402 Payment Required` on breach.
- **No audio:** Pipeline detects videos without an audio track and returns a `VIDEO_NO_AUDIO` error code with a user-friendly message.
- **GPU OOM:** Detected via error pattern matching, surfaces as `GPU_OOM` error code.
- **Model fallbacks:** If a Hugging Face model ID fails to load (404 or unavailable), TRIBE and V-JEPA2 each support comma-separated `*_FALLBACK` env var candidates tried in order.
- **Graceful degradation:** Individual modality encoders (V-JEPA2, Wav2Vec, Llama) have deterministic fallback implementations so the pipeline continues even if a model is unavailable.
- **Stale jobs:** Background maintenance job runs hourly to detect and fail any analysis stuck in-progress for 2+ hours.
- **Share link expiry:** Public share tokens are stored in Redis with a hard 7-day TTL.
- **Token rotation:** Refresh tokens are single-use; each rotation invalidates the previous token.
- **S3 range requests:** Presigned video URLs are configured to expose `Accept-Ranges`, `Content-Length`, `Content-Range`, and `ETag` headers, enabling smooth HTML5 video seeking.

---

## 🔐 S3 CORS Configuration

For video playback to work in the browser, configure your S3 bucket CORS policy:

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

Replace `AllowedOrigins` with your production `FRONTEND_URL` before deploying.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes and run `npm run dev` to test locally
4. Run `cd apps/api && npx prisma migrate dev` if you modified the schema
5. Submit a pull request

---

## 👨‍💻 Founder

Built by **Shivam Singh**

*"You contain multitudes. Code should too."*
