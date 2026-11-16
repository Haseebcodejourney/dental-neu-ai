# Dental NEU AI

AI dental **disease diagnosis** from images:

**Image → CV classification → class-aligned RAG → LLM → Diagnosis UI**

Own labeled data. Primary CV: **YOLO** (alts: EfficientNet-V2/ConvNeXt, Swin/ViT). RAG retrieves a PDF/passages for the predicted disease class. LLM (Claude Sonnet) produces a grounded diagnosis.

## Stack (MVP)

| Layer | Tech |
| --- | --- |
| API | **NestJS** (TypeScript) |
| Database | **AWS RDS PostgreSQL** (local Docker optional) |
| ORM | TypeORM |
| Front-end | Next.js (planned) |
| CV / RAG / LLM | YOLO + LlamaIndex + Claude Sonnet (integrations TBD) |

## Repository

```
backend/   NestJS API scaffold (health, config, DB, upload/diagnosis stubs)
```

## Quick start (API)

```bash
cd backend
cp .env.example .env   # point at local Postgres or AWS RDS
docker compose up -d   # optional local Postgres
npm install
npm run start:dev
```

See [`backend/README.md`](backend/README.md) for RDS wiring, health checks, and module layout.

## Status

Backend scaffold only — no AI inference, no deploy, no real AWS credentials in-repo.
