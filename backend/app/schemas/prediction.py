from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

class HealthResponse(BaseModel):
    status: str = "ok"
    model_loaded: bool
    model_name: str
    message: Optional[str] = None

class ModelInfoResponse(BaseModel):
    model_name: str
    architecture: str = "1D Convolutional Neural Network (Conv1D-BN-ReLU-MaxPool x3 -> GAP -> Dense(64) -> Dropout -> Softmax(4))"
    input_length: int = 77
    class_names: List[str]
    calibration_alpha: float
    prior_ratio: List[float]
    train_prior: Optional[List[float]] = None
    validation_prior: Optional[List[float]] = None
    raw_test_metrics: Dict[str, float] = Field(default_factory=dict)
    calibrated_test_metrics: Dict[str, float] = Field(default_factory=dict)
    test_samples: int = 44534
    disclaimer: str = (
        "ECG-Guard is an academic research prototype, not a medical device. "
        "It is not intended to diagnose, treat, monitor, or rule out any medical condition. "
        "Do not use its output to make healthcare decisions."
    )

class PredictionRequest(BaseModel):
    signals: List[List[float]]

class SingleBeatResult(BaseModel):
    beat_index: int
    predicted_class: str
    model_score: float
    probabilities: Dict[str, float]
    signal: Optional[List[float]] = None

class PredictionResponse(BaseModel):
    model_name: str
    input_length: int = 77
    count: int
    results: List[SingleBeatResult]

class DemoBeatItem(BaseModel):
    index: int
    reference_class_id: int
    reference_class: str
    signal: List[float]

class DemoBeatsResponse(BaseModel):
    available: bool
    count: int
    class_names: List[str]
    beats: List[DemoBeatItem] = Field(default_factory=list)
    message: Optional[str] = None
