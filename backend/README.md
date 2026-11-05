# DermaVision backend

Your own `backend.py` and `api.py`, unchanged. This package adds the two things
that were missing so it can actually run:

- `requirements.txt` — yours was empty (0 bytes), so `pip install -r backend/requirements.txt`
  installed nothing.
- `__init__.py` — an empty marker file. Your setup already worked without it, so this
  is a harmless, conventional addition, not a fix.

## Folder layout

Put this `backend` folder in your project root, next to `models` and `frontend`:

```
DermaVision/
├── backend/
│   ├── __init__.py
│   ├── backend.py
│   ├── api.py
│   └── requirements.txt
├── models/                              <- your existing files, not included here
│   ├── efficientnet_b4_exp2_best.pth
│   ├── model_config.json
│   └── medical_knowledge_base.json
└── frontend/
```

`models/` is not included in this package — I don't have your trained checkpoint or
knowledge base. Keep your existing `models` folder as it is.

## Setup (first time)

From the project root, `DermaVision`:

```
python -m venv .venv
.venv\Scripts\activate
pip install -r backend\requirements.txt
```

This installs the default PyPI build of torch/torchvision. `backend.py` already
detects a GPU automatically (`torch.cuda.is_available()`) and falls back to CPU,
so this works either way. If you don't have an NVIDIA GPU and want a smaller,
faster install, use the official CPU-only wheels instead:

```
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
pip install -r backend\requirements.txt
```
(pip will skip torch/torchvision the second time, since they're already installed.)

## Run

```
.venv\Scripts\activate
uvicorn backend.api:app --reload
```

- API: http://127.0.0.1:8000
- Interactive docs: http://127.0.0.1:8000/docs

Run this from the project root (`DermaVision`), not from inside `backend/`, since
`api.py` imports `backend.backend` as a package.

## What I checked

I don't have your model checkpoint, so I couldn't run a real prediction. I did:

- Confirm both files have no syntax errors.
- Confirm every package `backend.py`/`api.py` imports is listed in `requirements.txt`,
  and that the full set installs together with no version conflicts.
- Run your actual, unmodified `api.py` under a real FastAPI/uvicorn server, with a
  stand-in for `backend.backend` in place of the real ML pipeline (since that needs
  your checkpoint). Against that, I tested: `/`, `/health`, a valid image upload,
  a non-image file (400), corrupted image bytes (500 with a readable message, not a
  crash), a missing file field (422), and that temporary uploaded files are deleted
  afterwards. All passed, and the server stayed responsive throughout.

This checks the API layer — routing, CORS, file handling, error responses — but not
the model, Grad-CAM, or the medical knowledge base lookup, which all need your real
`models/` files and PyTorch installed to exercise.

## Endpoints

- `GET /` and `GET /health` — status checks. The frontend's status pill uses these
  to show "AI System Online".
- `POST /analyze` — multipart form field `file` (an image). Returns the JSON shape
  the frontend already expects: `success`, `image_quality`, `prediction`,
  `top3_predictions`, `assessment`, `explainability`, `medical_information`,
  `triage`, `disclaimer`.
- `GET /conditions` — **new**, added for the frontend's Learn page. Returns your
  `models/medical_knowledge_base.json` as-is (it's already loaded into memory as
  `MEDICAL_KB` in `backend.py`, at import time). Read-only, no request body, and it
  doesn't touch the model or the analysis pipeline. Try it at
  http://127.0.0.1:8000/conditions once the server is running.

## Note for later: a couple of field names worth knowing

Not something to change now, just useful if the frontend ever seems to show the
wrong label. `create_ui_result` in `backend.py` uses these key names, which the
frontend already knows how to read:

- `prediction.class` (not `class_name`)
- `medical_information.condition` (not `display_name`)
- `explainability.message` (not `gradcam_message`)
- Grad-CAM `layers[].layer` (not `name`)
