# Dental NEU AI — NestJS API

Backend for **Dental NEU AI**: image upload metadata → CV classification → class-aligned RAG → LLM diagnosis.

## Stack choice

| Layer | Choice | Why |
| --- | --- | --- |
| API | NestJS (TypeScript) | Modular DI, production patterns, fits the product stack |
| ORM | **TypeORM** (`@nestjs/typeorm`) | First-class Nest integration, entity decorators map cleanly to diagnosis pipeline tables, solid PostgreSQL + SSL support for AWS RDS |
| DB | PostgreSQL | AWS RDS (prod) or Docker Compose (local) |

Prisma was considered; TypeORM was preferred for tighter Nest module/entity wiring without a separate generate step for this scaffold.

## Pipeline entities (schemas only)

- `ImageUpload` — upload metadata
- `DiagnosisJob` — job status for the CV → RAG → LLM flow
- `CvResult` — predicted class + confidence
- `RagCitation` — class-aligned retrieved passages
- `LlmResponse` — grounded diagnostic text

No fake AI implementations — stubs only.

## Prerequisites

- Node.js 20+
- npm
- PostgreSQL (local Docker **or** AWS RDS)

## Local run (Docker Postgres)

```bash
cp .env.example .env
# Edit .env for local:
#   DATABASE_HOST=localhost
#   DATABASE_PORT=5432
#   DATABASE_USER=postgres
#   DATABASE_PASSWORD=postgres
#   DATABASE_NAME=dental_neu_ai
#   DATABASE_SSL=false

docker compose up -d
npm install
npm run start:dev
```

API base: `http://localhost:3000/api`

- `GET /api/health` — process health
- `GET /api/health?db=true` — health + Postgres ping
- `GET /api/uploads` — stub
- `GET /api/diagnosis` — stub

## Point at AWS RDS

1. Create an RDS PostgreSQL instance (VPC/security group must allow the API host).
2. Copy `.env.example` → `.env` and set:

```env
NODE_ENV=production
PORT=3000
DATABASE_HOST=<rds-endpoint>
DATABASE_PORT=5432
DATABASE_USER=<user>
DATABASE_PASSWORD=<password>
DATABASE_NAME=dental_neu_ai
DATABASE_SSL=true
```

3. Do **not** commit secrets. Prefer AWS Secrets Manager / SSM in real deploys.
4. In production, `synchronize` is off — add migrations before shipping schema changes.
5. Start: `npm run build && npm run start:prod`

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run start:dev` | Watch mode |
| `npm run build` | Compile |
| `npm run start:prod` | Run `dist/main` |
| `npm test` | Unit tests |
| `npm run test:e2e` | E2E tests (needs DB + env) |

## Project layout

```
src/
  config/       env load + validation
  database/     TypeORM ↔ Postgres
  health/       health (+ optional DB ping)
  uploads/      image metadata entity + stub controller
  diagnosis/    job / CV / RAG / LLM entities + stub controller
```
