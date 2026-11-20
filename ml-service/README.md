# Dental NEU AI — ML Service

FastAPI service for CV classification and class-aligned RAG + LLM diagnosis stubs.

NestJS orchestrates the pipeline and calls this service; models live here.

## Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Liveness |
| `POST` | `/classify` | Multipart `image` → `{ class, confidence, model, detections[] }` |
| `POST` | `/diagnose` | JSON `{ class, image_id? }` → `{ diagnosis, citations[], model }` |

`detections[]` entries are `{ class, confidence, bbox }` where `bbox` is absolute `[x1, y1, x2, y2]`. Empty when the stub runs or the model is classification-only.

`/diagnose` looks up PDFs under `RAG_PDF_DIR/{class}/` and returns Nest-compatible `{ diagnosis, citations[], model }`. Without PDFs and without a wired LLM, `citations` is `[]` and `model` is `"stub"`.

## Run

```bash
cd ml-service
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

`ultralytics` installs PyTorch as a dependency — expect a large first-time download. Docs: `http://localhost:8000/docs`

## YOLO weights (optional)

No dataset or `.pt` is required to run the service. Without `YOLO_MODEL_PATH`, `POST /classify` returns a structured stub (`model: "stub"`).

When you have a trained Ultralytics weight:

1. Place the file outside git (e.g. `ml-service/models/dental-yolo.pt`) — `*.pt` is gitignored.
2. Set in `.env`:
   ```bash
   YOLO_MODEL_PATH=./models/dental-yolo.pt
   YOLO_CONFIDENCE=0.25
   DEVICE=cpu   # or cuda:0
   ```
3. Restart uvicorn. The service loads the model once and uses it for `/classify`.

## Class-aligned RAG PDFs (optional)

Convention (relative to `RAG_PDF_DIR`, default `./data/rag`):

```
data/rag/
  caries/
    review.pdf
  periodontitis/
    guidelines.pdf
```

1. Create a folder named exactly as the predicted class (safe chars: letters, digits, `._-` and spaces).
2. Drop one or more `.pdf` files into that folder. PDFs are gitignored — do not commit corpus files.
3. Restart is not required for new files; each `/diagnose` re-lists the folder.

Current behavior: list PDFs as citation shells (no page/passage extraction). Empty folder or missing class dir → `citations: []`.

**Later:** LlamaIndex (or similar) for chunking/embeddings + Claude Sonnet via `ANTHROPIC_API_KEY`. Keep those deps out of `requirements.txt` until wired.

## NestJS integration

Set `ML_SERVICE_URL=http://localhost:8000` in `backend/.env`.

The Nest `MlClientService` calls:

- `POST {ML_SERVICE_URL}/classify` — `multipart/form-data` field `image`
- `POST {ML_SERVICE_URL}/diagnose` — JSON `{ "class": "<predicted>", "image_id": "<optional>" }`

Nest consumes `class`, `confidence`, `model`, and forwards `detections` on `POST /api/diagnosis/run`.
