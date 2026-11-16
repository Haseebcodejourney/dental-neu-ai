# YOLO training (Dental NEU AI)

Train a detector, then point the FastAPI service at the resulting `.pt`.

## Dataset layout

Ultralytics YOLO format under `ml-service/datasets/dental/` (images/labels are gitignored):

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

Label with **Label Studio** or **CVAT**, export YOLO. Keep **patient-level** splits (same patient never in both train and val).

Draft classes in `data.yaml.example` (sign off before large labeling):

| id | name |
| --- | --- |
| 0 | implant |
| 1 | crown_or_fixed_restoration |
| 2 | endodontic_filling |
| 3 | filling |

MVP volume target: ~300–800 labeled images, ≥50–100 instances per class.

## Train

```bash
cd ml-service
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

cp datasets/dental/data.yaml.example datasets/dental/data.yaml
# add images + labels under datasets/dental/{images,labels}/{train,val}

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
