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
| Front-end | **Next.js** (`frontend/`) — diagnose UI |

## Repository

```
backend/      NestJS API (orchestrates uploads → classify → diagnose)
ml-service/   FastAPI ML service (YOLO + class-aligned RAG + Claude)
frontend/     Next.js App Router diagnose UI
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
- `POST /api/diagnosis/run` — multipart `image` → classify → diagnose via ml-service

### Frontend

```bash
cd frontend
cp .env.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:3000
npm install
npm run dev                  # http://localhost:3041
```

See [`backend/README.md`](backend/README.md), [`ml-service/README.md`](ml-service/README.md), and [`frontend/README.md`](frontend/README.md).

## Class-aligned RAG PDFs

Drop reference PDFs into `ml-service/rag/pdfs/<class_slug>/` (see [`ml-service/rag/pdfs/README.md`](ml-service/rag/pdfs/README.md)). Set `ANTHROPIC_API_KEY` in `ml-service/.env` for Claude Sonnet grounded text. Without PDFs/key the pipeline still returns a structured stub.

## Status

YOLO classify + Nest orchestration + Next diagnose UI. Class-aligned RAG retrieves PDF chunks by predicted class slug; Claude Sonnet grounds diagnosis text when `ANTHROPIC_API_KEY` is set.
