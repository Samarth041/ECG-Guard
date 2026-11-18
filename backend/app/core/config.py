import json
import os
from pathlib import Path
from typing import Any, List, Optional
from pydantic_settings import BaseSettings

ROOT_DIR = Path(__file__).resolve().parent.parent.parent.parent
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent

def find_file(candidates: List[Path]) -> Optional[Path]:
    for path in candidates:
        if path.exists():
            return path
    return None

class Settings(BaseSettings):
    PROJECT_NAME: str = "ECG-Guard API"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173", "http://127.0.0.1:3000", "*"]
    
    # Paths
    MODEL_PATH: Optional[str] = os.getenv("MODEL_PATH")
    CONFIG_PATH: Optional[str] = os.getenv("CONFIG_PATH")
    DEMO_PATH: Optional[str] = os.getenv("DEMO_PATH")
    
    # Defaults
    DEFAULT_CLASS_NAMES: List[str] = ["Normal", "Supraventricular", "Ventricular", "Fusion"]
    DEFAULT_ALPHA: float = 0.175
    DEFAULT_PRIOR_RATIO: List[float] = [3.5175958488060397, 0.04859454540983203, 0.4288911295280722, 0.004918476256055874]
    
    def resolve_model_path(self) -> Optional[Path]:
        if self.MODEL_PATH:
            p = Path(self.MODEL_PATH)
            if p.exists():
                return p
        candidates = [
            ROOT_DIR / "models" / "ecg_guard_final.keras",
            BACKEND_DIR / "models" / "ecg_guard_final.keras",
            ROOT_DIR / "ecg_guard_final.keras",
            Path("models/ecg_guard_final.keras"),
        ]
        return find_file(candidates)

    def resolve_config_path(self) -> Optional[Path]:
        if self.CONFIG_PATH:
            p = Path(self.CONFIG_PATH)
            if p.exists():
                return p
        candidates = [
            ROOT_DIR / "deployment_config.json",
            BACKEND_DIR / "deployment_config.json",
            ROOT_DIR / "models" / "deployment_config.json",
            Path("deployment_config.json"),
        ]
        return find_file(candidates)

    def resolve_demo_path(self) -> Optional[Path]:
        if self.DEMO_PATH:
            p = Path(self.DEMO_PATH)
            if p.exists():
                return p
        candidates = [
            ROOT_DIR / "models" / "demo_beats.npz",
            BACKEND_DIR / "models" / "demo_beats.npz",
            ROOT_DIR / "demo_beats.npz",
            Path("models/demo_beats.npz"),
        ]
        return find_file(candidates)

    def load_deployment_config(self) -> dict[str, Any]:
        cfg_path = self.resolve_config_path()
        if cfg_path and cfg_path.exists():
            try:
                with open(cfg_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                print(f"[WARNING] Could not read {cfg_path}: {e}")
        return {
            "model_name": "ECG-Guard V3",
            "input_length": 77,
            "class_names": self.DEFAULT_CLASS_NAMES,
            "calibration_alpha": self.DEFAULT_ALPHA,
            "prior_ratio": self.DEFAULT_PRIOR_RATIO,
            "raw_test_metrics": {
                "accuracy": 0.7808191494139309,
                "balanced_accuracy": 0.5920716426365321,
                "macro_precision": 0.4034193056072106,
                "macro_recall": 0.5920716426365321,
                "macro_f1": 0.40733722476941514
            },
            "calibrated_test_metrics": {
                "accuracy": 0.8654511160012575,
                "balanced_accuracy": 0.601070802089838,
                "macro_precision": 0.4065390931443929,
                "macro_recall": 0.601070802089838,
                "macro_f1": 0.4244877088272463
            },
            "test_samples": 44534,
            "notes": "Input must be an already-preprocessed, beat-segmented 77-sample waveform. Research prototype only; not for clinical diagnosis."
        }

settings = Settings()
