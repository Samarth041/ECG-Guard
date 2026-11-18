from typing import Any
from fastapi import APIRouter, File, HTTPException, UploadFile, status
from fastapi.responses import JSONResponse
import numpy as np

from backend.app.core.config import settings
from backend.app.schemas.prediction import (
    DemoBeatsResponse,
    HealthResponse,
    ModelInfoResponse,
    PredictionRequest,
    PredictionResponse,
)
from backend.app.services.input_parser import parse_uploaded_file
from backend.app.services.model_service import model_service
from backend.app.services.prediction_service import prediction_service

router = APIRouter()

@router.get("/health", response_model=HealthResponse)
async def get_health():
    config = settings.load_deployment_config()
    model_name = config.get("model_name", "ECG-Guard V3")
    is_loaded = model_service.is_loaded
    if not is_loaded:
        is_loaded = model_service.load_model()
    
    return HealthResponse(
        status="ok" if is_loaded else "degraded",
        model_loaded=is_loaded,
        model_name=model_name,
        message=None if is_loaded else model_service.load_error,
    )

@router.get("/model-info", response_model=ModelInfoResponse)
async def get_model_info():
    config = settings.load_deployment_config()
    return ModelInfoResponse(
        model_name=config.get("model_name", "ECG-Guard V3"),
        architecture="1D Convolutional Neural Network (Conv1D-BN-ReLU-MaxPool x3 -> GAP -> Dense(64) -> Dropout -> Softmax(4))",
        input_length=int(config.get("input_length", 77)),
        class_names=config.get("class_names", settings.DEFAULT_CLASS_NAMES),
        calibration_alpha=float(config.get("calibration_alpha", settings.DEFAULT_ALPHA)),
        prior_ratio=config.get("prior_ratio", settings.DEFAULT_PRIOR_RATIO),
        train_prior=config.get("train_prior"),
        validation_prior=config.get("validation_prior"),
        raw_test_metrics=config.get("raw_test_metrics", {}),
        calibrated_test_metrics=config.get("calibrated_test_metrics", {}),
        test_samples=int(config.get("test_samples", 44534)),
    )

@router.post("/predict", response_model=PredictionResponse)
async def predict_signals(request: PredictionRequest):
    if not request.signals:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Signals list cannot be empty. Please provide at least one 77-sample beat.",
        )

    try:
        arr = np.asarray(request.signals, dtype=np.float32)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid signal data: {str(e)}",
        )

    if arr.ndim == 1:
        if arr.size != 77:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Expected 77 values for one beat, but received {arr.size}.",
            )
        arr = arr.reshape(1, 77)
    elif arr.ndim == 2:
        if arr.shape[1] != 77:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Each beat must contain exactly 77 samples. Received row length {arr.shape[1]}.",
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid array dimensions: expected 2D (N x 77), received {arr.ndim}D.",
        )

    if not np.isfinite(arr).all():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Signals contain NaN or infinite values.",
        )

    if len(arr) > 5000:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Batch size limit exceeded: maximum allowed is 5,000 beats per request. Received {len(arr)} beats.",
        )

    try:
        response = prediction_service.predict(arr)
        return response
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction error: {str(exc)}",
        )

@router.post("/predict/file", response_model=PredictionResponse)
async def predict_file(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file has no filename.",
        )

    try:
        content = await file.read()
        signals = parse_uploaded_file(content, file.filename)
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to process file: {str(e)}",
        )

    try:
        response = prediction_service.predict(signals)
        return response
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction error: {str(exc)}",
        )

@router.get("/demo-beats", response_model=DemoBeatsResponse)
async def get_demo_beats():
    return prediction_service.get_demo_beats()
