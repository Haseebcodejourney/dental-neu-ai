# Dental NEU AI — ML Service

FastAPI service for CV classification and class-aligned RAG + LLM diagnosis stubs.

NestJS orchestrates the pipeline and calls this service; models live here.

## Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Liveness |
| `POST` | `/classify` | Multipart `image` → `{ class, confidence, model }` (stub) |
| `POST` | `/diagnose` | JSON `{ class, image_id? }` → `{ diagnosis, citations[], model }` (stub) |

## Run

```bash
cd ml-service
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Docs: `http://localhost:8000/docs`

## NestJS integration

Set `ML_SERVICE_URL=http://localhost:8000` in `backend/.env`.

The Nest `MlClientService` calls:

- `POST {ML_SERVICE_URL}/classify` — `multipart/form-data` field `image`
- `POST {ML_SERVICE_URL}/diagnose` — JSON `{ "class": "<predicted>", "image_id": "<optional>" }`

## Later

- Load YOLO from `YOLO_MODEL_PATH`
- Class-aligned PDF retrieval from `RAG_PDF_DIR`
- Claude via `ANTHROPIC_API_KEY`
