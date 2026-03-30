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
3. Start infra with Docker:
   - `docker compose up postgres redis minio mc -d`
4. Generate Prisma client and run migrations:
   - `cd apps/api && npx prisma generate && npx prisma migrate dev`
5. (Optional) seed demo user/data:
   - `npm run seed --workspace=@axon/api`
6. Start everything:
   - `npm run dev`

## Demo credentials
- Email: `demo@axon.ai`
- Password: `Password123`

## Verification commands
- `npm run typecheck`
- `npm run build`

## Notes
- The ML service is scaffolded with deterministic mock inference outputs for a runnable end-to-end workflow.
- Queue, realtime progress, auth refresh, uploads, and share/export flows are wired and operational.
4. `cd apps/api && npx prisma migrate dev`
5. `cd ../.. && npm run dev`
