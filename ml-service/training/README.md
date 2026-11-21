# YOLO training (Dental NEU AI)

Train a 14-class panoramic detector, then point the FastAPI service at the resulting `.pt`.

Class labels are locked to match `app/services/class_taxonomy.py` and the RAG folder slugs under `rag/pdfs/` (including the shipped spelling **Bone resorbtion**).

## Dataset (external)

**Do not commit images or labels.** Local retrain uses Hamza’s folder:

`panoramic_radiography_yolo_dataset_14_classes`

Keep that corpus outside git. For in-repo layout (or a symlink/copy into the scaffold):

```
datasets/dental/
  data.yaml          # copy from data.yaml.example
  images/
    train/           # .jpg / .png panoramics
    val/
  labels/
    train/           # matching .txt YOLO boxes (class cx cy w h, normalized)
    val/
```

If the external folder already has Ultralytics `images/` + `labels/` + `data.yaml`, point `train.py --data` at that yaml instead of copying into `datasets/dental/`.

Label with **Label Studio** or **CVAT**, export YOLO. Keep **patient-level** splits (same patient never in both train and val).

### Locked classes (ids 0–13)

| id | YOLO name (exact) | RAG slug |
| --- | --- | --- |
| 0 | Implant | `implant` |
| 1 | Prosthetic restoration | `prosthetic-restoration` |
| 2 | Obturation | `obturation` |
| 3 | Endodontic treatment | `endodontic-treatment` |
| 4 | Carious lesion | `carious-lesion` |
| 5 | Bone resorbtion | `bone-resorbtion` |
| 6 | Impacted tooth | `impacted-tooth` |
| 7 | Apical periodontitis | `apical-periodontitis` |
| 8 | Root fragment | `root-fragment` |
| 9 | Furcation lesion | `furcation-lesion` |
| 10 | Apical surgery | `apical-surgery` |
| 11 | Root resorption | `root-resorption` |
| 12 | Orthodontic device | `orthodontic-device` |
| 13 | Surgical device | `surgical-device` |

Names in `data.yaml` must match the table (and `YOLO_CLASS_NAMES`) so `/classify` predictions resolve to the correct RAG folders.

## Train

```bash
cd ml-service
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

cp datasets/dental/data.yaml.example datasets/dental/data.yaml
# link or copy Hamza’s panoramic_radiography_yolo_dataset_14_classes
# into datasets/dental/{images,labels}/{train,val} — or --data that folder’s yaml

python training/train.py \
  --data datasets/dental/data.yaml \
  --model yolov8n.pt \
  --epochs 50 \
  --imgsz 640 \
  --batch 8 \
  --device cpu   # or 0 / cuda:0
```

Outputs land in `runs/detect/dental/` (gitignored). Use `weights/best.pt`.

## Serve the weight

```bash
mkdir -p models
cp runs/detect/dental/weights/best.pt models/dental-yolo.pt
```

`.env`:

```bash
YOLO_MODEL_PATH=./models/dental-yolo.pt
YOLO_CONFIDENCE=0.25
DEVICE=cpu
```

Restart uvicorn → `POST /classify` uses the trained model instead of `model: "stub"`.

## Notes

- Do **not** commit images, labels, or `.pt` weights.
- Start with `yolov8n.pt`; move to `yolov8s`/`yolov8m` if mAP plateaus and GPU allows.
- Metrics to track: per-class precision/recall, mAP@0.5, patient-level holdout.
