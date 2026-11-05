from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import tempfile
from pathlib import Path

from .backend import final_skin_analysis_with_medical_info
from .backend import create_ui_result
from .backend import MEDICAL_KB


app = FastAPI(
    title="DermaVision API",
    description="AI-assisted skin analysis API",
    version="1.0.0"
)


# ------------------------------------------------------------
# CORS
# ------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ------------------------------------------------------------
# HOME
# ------------------------------------------------------------

@app.get("/")
def root():
    return {
        "name": "DermaVision API",
        "status": "running",
        "version": "1.0.0"
    }


# ------------------------------------------------------------
# HEALTH CHECK
# ------------------------------------------------------------

@app.get("/health")
def health():
    return {
        "status": "healthy"
    }


# ------------------------------------------------------------
# CONDITIONS (read-only, for the frontend's Learn page)
# ------------------------------------------------------------

@app.get("/conditions")
def conditions():
    return MEDICAL_KB


# ------------------------------------------------------------
# IMAGE ANALYSIS
# ------------------------------------------------------------

@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):

    # Check file type
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="Please upload a valid image file."
        )

    temp_path = None

    try:
        # Read uploaded file
        contents = await file.read()

        # Verify that PIL can open it
        image = Image.open(contents if False else __import__("io").BytesIO(contents))
        image.verify()

        # Create temporary image file
        suffix = Path(file.filename or ".jpg").suffix or ".jpg"

        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=suffix
        ) as temp_file:

            temp_file.write(contents)
            temp_path = temp_file.name

        # Run existing DermaVision pipeline
        final_result = final_skin_analysis_with_medical_info(
            temp_path
        )

        # Convert backend result into frontend-friendly JSON
        ui_result = create_ui_result(
            final_result
        )

        return ui_result

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {type(e).__name__}: {str(e)}"
        )

    finally:

        # Delete temporary uploaded image
        if temp_path:

            try:
                Path(temp_path).unlink(
                    missing_ok=True
                )
            except Exception:
                pass