# Dental NEU AI — NestJS API

Backend for **Dental NEU AI**: image upload metadata → CV classification → class-aligned RAG → LLM diagnosis.

## Stack choice

| Layer | Choice | Why |
| --- | --- | --- |
| API | NestJS (TypeScript) | Modular DI, production patterns, fits the product stack |
| ORM | **TypeORM** (`@nestjs/typeorm`) | First-class Nest integration, entity decorators map cleanly to diagnosis pipeline tables, solid PostgreSQL + SSL support for AWS Aurora/RDS |
| DB | PostgreSQL | AWS Aurora PostgreSQL (prod) or Docker Compose (local) |

Prisma was considered; TypeORM was preferred for tighter Nest module/entity wiring without a separate generate step for this scaffold.

## Pipeline entities (schemas only)

- `ImageUpload` — upload metadata
- `DiagnosisJob` — job status for the CV → RAG → LLM flow
- `CvResult` — predicted class + confidence
- `RagCitation` — class-aligned retrieved passages
- `LlmResponse` — grounded diagnostic text

No fake AI implementations — stubs only.

## Database bootstrap

On startup (when `DATABASE_ENSURE=true`, default):

1. Connect with password auth to the maintenance DB (`DATABASE_MAINTENANCE_NAME`, default `postgres`) over SSL if `DATABASE_SSL=true`.
2. `CREATE DATABASE dental_neu_ai` if it does not exist (idempotent lookup on `pg_database`).
3. TypeORM connects to `DATABASE_NAME` (`dental_neu_ai`).
4. **Schema sync**
   - **On** when `NODE_ENV != production` (dev convenience), **or**
   - **On** when `SYNC_SCHEMA=true` (explicit first boot / recovery on Aurora)
   - **Off** in production otherwise — use TypeORM migrations for ongoing changes (not scaffolded yet)

The DB role needs `CREATEDB` (Aurora master user typically does).

## Prerequisites

- Node.js 20+
- npm
- PostgreSQL (local Docker **or** AWS Aurora PostgreSQL)

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

## Point at AWS Aurora PostgreSQL

1. Use the **cluster writer** endpoint (VPC/security group must allow the API host).
2. Copy `.env.example` → `.env` and set (password via secrets manager / local `.env` only):

```env
NODE_ENV=production
PORT=3000
DATABASE_HOST=database-1.cluster-chq02gsowk5h.eu-north-1.rds.amazonaws.com
DATABASE_PORT=5432
DATABASE_USER=<master-or-app-user>
DATABASE_PASSWORD=<from-secrets-manager-or-local-env>
DATABASE_NAME=dental_neu_ai
DATABASE_SSL=true
DATABASE_ENSURE=true
# First empty-cluster boot only:
SYNC_SCHEMA=true
```

3. Do **not** commit secrets.
4. After the first successful sync, set `SYNC_SCHEMA=false` and introduce migrations for later schema changes.
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
  database/     ensure DB + TypeORM ↔ Postgres/Aurora
  health/       health (+ optional DB ping)
  uploads/      image metadata entity + stub controller
  diagnosis/    job / CV / RAG / LLM entities + stub controller
```
