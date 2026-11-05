# DermaVision

An educational web app that analyzes a skin photo with an AI model and shows a prediction, an honest confidence level, a visual explanation (Grad-CAM), and general educational information.

**This is not a medical diagnosis and it has not been clinically validated.** Always see a healthcare professional for any skin concern.

## What it does

- Upload or capture a skin photo and get a model prediction with a Grad-CAM heatmap showing which areas influenced it.
- Results are shown with a strict reliability rule: below 60% confidence the app shows "Inconclusive result" instead of naming a condition, and it never labels any result "high confidence".
- Nine pages: Home, Analyze, Assessment (skin-type quiz), Routine, Ingredients (interaction checker), Progress, History, Learn, and Model Metrics.
- Extra tools: printable report (PDF via the browser), photo-quality tips, crop tool, compare two photos, export/import history, first-visit consent screen, "Ask about this condition" (answers only from the built-in knowledge base), find-a-dermatologist link, installable app shell (PWA), and English/Hindi interface (Telugu in progress).
- History and profile data stay in your browser (localStorage). Images are not stored on the server.

## Quick start

You need Python 3.10+ and Node.js 18+. The app has two parts, and **each one needs its own terminal window**, both left open while you use the app.

### One-time setup

From the project root (the folder that contains `backend` and `frontend`):

```
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r backend\requirements.txt
cd frontend
npm install
cd ..
```

On macOS or Linux, activate the environment with `source .venv/bin/activate` instead.

### Terminal 1 - run the backend

```
cd path\to\DermaVision
.\.venv\Scripts\Activate.ps1
uvicorn backend.api:app --reload
```

Wait until you see "Application startup complete". The API runs at http://127.0.0.1:8000 and its docs are at http://127.0.0.1:8000/docs. The model takes a short while to load.

### Terminal 2 - run the frontend

```
cd path\to\DermaVision\frontend
npm run dev
```

Open http://localhost:5173 in your browser.

### Troubleshooting

- "Could not import module backend.api": you started uvicorn from the wrong folder. Run it from the project root, the folder that contains `backend`, not from inside `backend`.
- "Missing script: dev": you ran `npm run dev` from the wrong folder. Run it inside `frontend`.
- Analyze says the backend is unavailable: check that Terminal 1 is still running, and that the address is http://127.0.0.1:8000.
- Page looks outdated after an update: hard-refresh the browser (Ctrl+Shift+R).
- Analyze does not work at all: the model weights file is probably missing (see below).

### Model weights

The trained weights (`models/efficientnet_b4_exp2_best.pth`) are not included in this repository because they were trained on a dataset whose licence is unverified. Without them the Analyze page will not work, but the other pages will. Ask the author for the weights file and place it in the `models/` folder.

### Optional settings

- `MODEL_PATH`: path to a different weights file (the loader currently supports the deployed EfficientNet-B4 configuration).
- `USE_TTA=1`: average predictions over the original and a flipped copy. Off by default and not validated.
- `VITE_API_URL` (in `frontend/.env`): change the backend address.

### Build for production

```
cd frontend
npm run build
```

The output is created in `frontend/dist`.

## Honest model performance

The deployed model is an EfficientNet-B4 with 19 classes. On its held-out test set of 510 images:

| Metric | Value |
|---|---|
| Top-1 accuracy | 33.33% |
| Top-3 accuracy | 56.67% |
| Balanced accuracy | 17.61% |
| Macro-F1 | 16.32% |

These numbers are weak, and the app is designed to say so: low-confidence results are shown as inconclusive. The Model Metrics page shows the full evaluation.

Known limitations:
- The original training split may contain duplicate images across train and test, so the numbers above may be optimistic.
- The dataset has no patient IDs, and its exact source and licence are unverified.
- Results can change with image size and quality.
- The Hindi (and Telugu) text needs review by a native speaker.
- The photo-quality and not-skin checks are rough heuristics, not validated.

## Tech stack

- Frontend: React 18, Vite 5, plain CSS, lucide-react
- Backend: Python, FastAPI, PyTorch (EfficientNet-B4), Grad-CAM
- Training tools: `training/` (dataset audit, leak-safe split, Colab notebook, evaluation scripts)

## Project structure

```
backend/      FastAPI app (api.py) and model code (backend.py)
frontend/     React app (src/pages, src/components, src/utils, src/data)
models/       model_config.json, medical_knowledge_base.json, model weights (weights not in this repo)
training/     data audit, split manifest, training and evaluation scripts, Colab notebook
```

## Training pipeline

The `training/` folder contains a dataset audit (image counts, exact and near-duplicate detection), a group-safe train/validation/test split, a Colab training notebook (EfficientNetV2-S and ConvNeXt-Tiny, three seeds each), and evaluation scripts. A new model has not been trained or deployed yet, and no new accuracy figures exist. The dataset images are not part of this repository.

## Privacy

Analysis images are sent to your own backend for prediction and are not stored. History is kept only in your browser.

## Author

P. Ganishka 

## Licence

No licence is granted yet. The dataset licence is unverified, so do not redistribute the dataset or any model trained on it.
