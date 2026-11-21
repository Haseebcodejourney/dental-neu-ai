# Dental NEU AI — ML Service

FastAPI service for CV classification and class-aligned RAG diagnosis grounded on our trained YOLO.

NestJS orchestrates the pipeline and calls this service; models live here.

## Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Liveness |
| `POST` | `/classify` | Multipart `image` → `{ class, confidence, model, detections[] }` |
| `POST` | `/diagnose` | JSON `{ class, image_id?, detections? }` → `{ diagnosis, citations[], model }` |

`detections[]` entries are `{ class, confidence, bbox }` where `bbox` is absolute `[x1, y1, x2, y2]`. Empty when the stub runs or the model is classification-only.

`/diagnose` retrieves PDF chunks under `RAG_PDF_DIR/<class_slug>/` and builds a grounded note from **our trained YOLO detections + RAG** (`model: "dental-yolo+rag"`). Default `DIAGNOSIS_BACKEND=local` — no cloud LLM. Without PDFs, `citations` may be `[]` but diagnosis still returns from YOLO — the endpoint does not crash.

## Run

```bash
cd ml-service
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

`ultralytics` installs PyTorch as a dependency — expect a large first-time download. Docs: `http://localhost:8000/docs`

## YOLO weights (optional)

No dataset or `.pt` is required to run the service. Without `YOLO_MODEL_PATH`, `POST /classify` returns a structured stub (`model: "stub"`).

### Train (local, 14-class panoramic)

See [`training/README.md`](training/README.md). Short path:

```bash
cp datasets/dental/data.yaml.example datasets/dental/data.yaml
# use Hamza’s external panoramic_radiography_yolo_dataset_14_classes (not committed)
# put/link images + YOLO labels under datasets/dental/{images,labels}/{train,val}
python training/train.py --data datasets/dental/data.yaml --device cpu
cp runs/detect/dental/weights/best.pt models/dental-yolo.pt
```

Class names must match [`app/services/class_taxonomy.py`](app/services/class_taxonomy.py).

### Serve a trained weight

When you have a trained Ultralytics weight:

1. Place the file outside git (e.g. `ml-service/models/dental-yolo.pt`) — `*.pt` is gitignored.
2. Set in `.env`:
   ```bash
   YOLO_MODEL_PATH=./models/dental-yolo.pt
   YOLO_CONFIDENCE=0.25
   DEVICE=cpu   # or cuda:0
   ```
3. Restart uvicorn. The service loads the model once and uses it for `/classify`.

## Class-aligned RAG PDFs

Convention (relative to `RAG_PDF_DIR`, default `./rag/pdfs`):

```
rag/pdfs/
  carious-lesion/
    review.pdf
  apical-periodontitis/
    guidelines.pdf
```

Folders use **slugs** derived from the 14 YOLO legend labels (see [`rag/pdfs/README.md`](rag/pdfs/README.md)).

1. Drop one or more `.pdf` files into the matching slug folder. PDFs are gitignored — do not commit corpus files.
2. Restart is not required; each `/diagnose` re-chunks the folder.
3. Retrieval is a light local keyword ranker over `pypdf` text chunks (LlamaIndex-swappable later via the same `retrieve_citations` contract).

Empty folder or missing class dir → `citations: []`.

## Diagnosis backend

| `DIAGNOSIS_BACKEND` | Behavior |
| --- | --- |
| `local` (default) | Own `dental-yolo` detections + class-aligned RAG → `model: "dental-yolo+rag"` |
| `anthropic` | Opt-in Claude Sonnet (needs `ANTHROPIC_API_KEY`); falls back to local on error |

Drop PDFs under `rag/pdfs/<class_slug>/` to enrich the local narrative with passages.

## NestJS integration

Set `ML_SERVICE_URL=http://localhost:8000` in `backend/.env`.

The Nest `MlClientService` calls:

- `POST {ML_SERVICE_URL}/classify` — `multipart/form-data` field `image`
- `POST {ML_SERVICE_URL}/diagnose` — JSON `{ "class": "<predicted>", "image_id": "<optional>", "detections": [...] }`

Nest consumes `class`, `confidence`, `model`, and forwards `detections` on `POST /api/diagnosis/run`.
