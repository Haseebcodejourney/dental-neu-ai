# Dental NEU AI

AI dental **disease diagnosis** from images:

**Image → CV classification → class-aligned RAG → LLM → Diagnosis UI**

Own labeled data. Primary CV: **YOLO** (alts: EfficientNet-V2/ConvNeXt, Swin/ViT). RAG retrieves a PDF/passages for the predicted disease class. LLM (Claude Sonnet) produces a grounded diagnosis.

## Stack (MVP)

| Layer | Tech |
| --- | --- |
| API | **NestJS** (TypeScript) — orchestration |
| ML | **FastAPI** (`ml-service/`) — CV + RAG/LLM |
| Database | **AWS RDS PostgreSQL** (local Docker optional) |
| ORM | TypeORM |
| Front-end | Next.js (planned) |

## Repository

```
backend/      NestJS API (orchestrates uploads → classify → diagnose)
ml-service/   FastAPI ML service (YOLO + RAG/Claude stubs)
```

## Quick start

### ML service

```bash
cd ml-service
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

### NestJS API

```bash
cd backend
cp .env.example .env   # set ML_SERVICE_URL=http://localhost:8000
docker compose up -d   # optional local Postgres
npm install
npm run start:dev
```

- `GET /api/health`
- `POST /api/diagnosis/run` — multipart `image` → stub pipeline via ml-service

See [`backend/README.md`](backend/README.md) and [`ml-service/README.md`](ml-service/README.md).

## Status

Scaffold + stub ML wiring. No real YOLO/RAG/Claude inference yet. Zero secrets in-repo.
