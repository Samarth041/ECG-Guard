from typing import List, Optional
import numpy as np

from backend.app.core.config import settings
from backend.app.schemas.prediction import (
    DemoBeatItem,
    DemoBeatsResponse,
    PredictionResponse,
    SingleBeatResult,
)
from backend.app.services.model_service import model_service

class PredictionService:
    def predict(
        self,
        signals: np.ndarray,
        include_signals: bool = True
    ) -> PredictionResponse:
        config = settings.load_deployment_config()
        class_names: List[str] = config.get("class_names", settings.DEFAULT_CLASS_NAMES)
        alpha: float = float(config.get("calibration_alpha", settings.DEFAULT_ALPHA))
        prior_ratio: List[float] = config.get("prior_ratio", settings.DEFAULT_PRIOR_RATIO)
        model_name: str = config.get("model_name", "ECG-Guard V3")
        input_length: int = int(config.get("input_length", 77))

        raw_probabilities = model_service.predict_raw(signals)

        # Apply calibration logic exactly as defined in V3 deployment
        ratio = np.asarray(prior_ratio, dtype=np.float64)
        if ratio.shape != (len(class_names),):
            ratio = np.ones(len(class_names), dtype=np.float64)

        calibrated = raw_probabilities * np.power(
            np.maximum(ratio, 1e-12), float(alpha)
        )[np.newaxis, :]
        calibrated /= np.maximum(calibrated.sum(axis=1, keepdims=True), 1e-12)

        predicted_ids = np.argmax(calibrated, axis=1)
        results: List[SingleBeatResult] = []

        is_single = len(signals) == 1

        for idx, class_id in enumerate(predicted_ids):
            probs_dict = {
                class_names[c_idx]: float(calibrated[idx, c_idx])
                for c_idx in range(len(class_names))
            }
            top_score = float(calibrated[idx, class_id])

            # For single beats or when requested, attach signal samples (rounded for readability)
            sig_list = signals[idx].tolist() if (include_signals or is_single) else None

            results.append(
                SingleBeatResult(
                    beat_index=idx + 1,
                    predicted_class=class_names[int(class_id)],
                    model_score=top_score,
                    probabilities=probs_dict,
                    signal=sig_list,
                )
            )

        return PredictionResponse(
            model_name=model_name,
            input_length=input_length,
            count=len(results),
            results=results,
        )

    def get_demo_beats(self) -> DemoBeatsResponse:
        demo_path = settings.resolve_demo_path()
        config = settings.load_deployment_config()
        class_names = config.get("class_names", settings.DEFAULT_CLASS_NAMES)

        if demo_path is None or not demo_path.exists():
            return DemoBeatsResponse(
                available=False,
                count=0,
                class_names=class_names,
                beats=[],
                message="Demo beats file 'demo_beats.npz' is not installed in the models directory.",
            )

        try:
            data = np.load(str(demo_path), allow_pickle=False)
            signals = np.asarray(data["signals"], dtype=np.float32)
            labels = np.asarray(data["labels"], dtype=np.int32)

            if signals.ndim == 3 and signals.shape[-1] == 1:
                signals = signals[..., 0]

            if signals.ndim != 2 or signals.shape[1] != 77 or len(signals) != len(labels):
                return DemoBeatsResponse(
                    available=False,
                    count=0,
                    class_names=class_names,
                    beats=[],
                    message="Demo beats file has invalid signal dimensions.",
                )

            items = []
            for i in range(len(signals)):
                ref_id = int(labels[i])
                ref_name = class_names[ref_id] if 0 <= ref_id < len(class_names) else "Unknown"
                items.append(
                    DemoBeatItem(
                        index=i + 1,
                        reference_class_id=ref_id,
                        reference_class=ref_name,
                        signal=signals[i].tolist(),
                    )
                )

            return DemoBeatsResponse(
                available=True,
                count=len(items),
                class_names=class_names,
                beats=items,
            )
        except Exception as e:
            return DemoBeatsResponse(
                available=False,
                count=0,
                class_names=class_names,
                beats=[],
                message=f"Failed to load demo beats: {str(e)}",
            )

prediction_service = PredictionService()
