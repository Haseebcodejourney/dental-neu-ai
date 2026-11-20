# Class-aligned RAG PDFs

Drop clinical reference PDFs here so `/diagnose` can retrieve passages for the
predicted YOLO class(es). **Do not commit PDF content** (`*.pdf` is gitignored).

## Layout

```
ml-service/rag/pdfs/
  <class_slug>/
    your-paper.pdf
    guidelines.pdf
```

`RAG_PDF_DIR` defaults to `./rag/pdfs` (relative to `ml-service/`). Override in
`.env` if you keep the corpus elsewhere.

## Class slugs (match dental-yolo.pt / legend)

| YOLO class (exact label) | Folder slug |
| --- | --- |
| Implant | `implant` |
| Prosthetic restoration | `prosthetic-restoration` |
| Obturation | `obturation` |
| Endodontic treatment | `endodontic-treatment` |
| Carious lesion | `carious-lesion` |
| Bone resorbtion | `bone-resorbtion` |
| Impacted tooth | `impacted-tooth` |
| Apical periodontitis | `apical-periodontitis` |
| Root fragment | `root-fragment` |
| Furcation lesion | `furcation-lesion` |
| Apical surgery | `apical-surgery` |
| Root resorption | `root-resorption` |
| Orthodontic device | `orthodontic-device` |
| Surgical device | `surgical-device` |

Each slug folder already exists (empty except `.gitkeep`). Example index:

```
rag/pdfs/carious-lesion/example-index.txt
```

## How to add PDFs

1. Choose the folder whose slug matches the YOLO class label.
2. Copy one or more `.pdf` files into that folder (any filename).
3. No restart required — each `/diagnose` re-reads the folder and chunks text.
4. Set `ANTHROPIC_API_KEY` in `ml-service/.env` for Claude Sonnet grounded text.

Without PDFs and/or without an API key the service still returns a structured
stub diagnosis (`model: "stub"`) and never crashes.
