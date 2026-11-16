#!/usr/bin/env python3
"""Train an Ultralytics YOLO detector for Dental NEU AI.

Expects a YOLO dataset (images/ + labels/ + data.yaml). Does not commit
weights — copy runs/.../weights/best.pt to models/ and set YOLO_MODEL_PATH.

Example:
  cd ml-service
  python training/train.py --data datasets/dental/data.yaml --epochs 50
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path


def parse_args() -> argparse.Namespace:
    root = Path(__file__).resolve().parents[1]
    parser = argparse.ArgumentParser(description="Train YOLO for dental detection")
    parser.add_argument(
        "--data",
        type=Path,
        default=root / "datasets" / "dental" / "data.yaml",
        help="Path to Ultralytics data.yaml",
    )
    parser.add_argument(
        "--model",
        default="yolov8n.pt",
        help="Base checkpoint (e.g. yolov8n.pt, yolov8s.pt)",
    )
    parser.add_argument("--epochs", type=int, default=50)
    parser.add_argument("--imgsz", type=int, default=640)
    parser.add_argument("--batch", type=int, default=8)
    parser.add_argument(
        "--device",
        default="cpu",
        help="cpu | 0 | cuda:0 — match DEVICE in .env for later serve",
    )
    parser.add_argument("--project", type=Path, default=root / "runs" / "detect")
    parser.add_argument("--name", default="dental")
    parser.add_argument(
        "--workers",
        type=int,
        default=2,
        help="Dataloader workers (lower on small VMs)",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    data_path = args.data.resolve()
    if not data_path.is_file():
        print(
            f"Missing data yaml: {data_path}\n"
            "Copy datasets/dental/data.yaml.example → datasets/dental/data.yaml "
            "and add images/labels (see training/README.md).",
            file=sys.stderr,
        )
        return 1

    try:
        from ultralytics import YOLO
    except ImportError:
        print(
            "ultralytics not installed. From ml-service/: pip install -r requirements.txt",
            file=sys.stderr,
        )
        return 1

    print(f"data={data_path}")
    print(f"model={args.model} epochs={args.epochs} imgsz={args.imgsz} device={args.device}")

    model = YOLO(args.model)
    results = model.train(
        data=str(data_path),
        epochs=args.epochs,
        imgsz=args.imgsz,
        batch=args.batch,
        device=args.device,
        project=str(args.project),
        name=args.name,
        workers=args.workers,
        exist_ok=True,
    )

    save_dir = Path(getattr(results, "save_dir", args.project / args.name))
    best = save_dir / "weights" / "best.pt"
    print("\nTraining finished.")
    print(f"best weights: {best}")
    print("Next:")
    print(f"  mkdir -p models && cp {best} models/dental-yolo.pt")
    print("  # .env → YOLO_MODEL_PATH=./models/dental-yolo.pt")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
