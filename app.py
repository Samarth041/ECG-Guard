from __future__ import annotations

import io
import json
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
import streamlit as st
import tensorflow as tf


# ECG-Guard expects an already-preprocessed, beat-segmented 77-sample waveform.
APP_DIR = Path(__file__).resolve().parent
MODEL_CANDIDATES = [
    APP_DIR / "models" / "ecg_guard_final.keras",
    APP_DIR / "ecg_guard_final.keras",
]
CONFIG_CANDIDATES = [
    APP_DIR / "deployment_config.json",
    APP_DIR / "models" / "deployment_config.json",
]
DEMO_CANDIDATES = [
    APP_DIR / "models" / "demo_beats.npz",
    APP_DIR / "demo_beats.npz",
]

DEFAULT_CLASS_NAMES = [
    "Normal",
    "Supraventricular",
    "Ventricular",
    "Fusion",
]
DEFAULT_ALPHA = 0.175
DEFAULT_PRIOR_RATIO = [
    3.51759584,
    0.04859456,
    0.42889112,
    0.00491848,
]

st.set_page_config(
    page_title="ECG-Guard | ECG Beat Classifier",
    page_icon="💓",
    layout="wide",
    initial_sidebar_state="expanded",
)


def first_existing(paths: list[Path]) -> Path | None:
    for path in paths:
        if path.exists():
            return path
    return None


@st.cache_resource(show_spinner="Loading ECG-Guard model...")
def load_model(model_path: str):
    return tf.keras.models.load_model(model_path, compile=False)


def load_config() -> dict[str, Any]:
    config_path = first_existing(CONFIG_CANDIDATES)
    if config_path is None:
        return {
            "model_name": "ECG-Guard V3",
            "input_length": 77,
            "class_names": DEFAULT_CLASS_NAMES,
            "calibration_alpha": DEFAULT_ALPHA,
            "prior_ratio": DEFAULT_PRIOR_RATIO,
            "raw_test_metrics": {},
            "calibrated_test_metrics": {},
        }

    try:
        with config_path.open("r", encoding="utf-8") as handle:
            return json.load(handle)
    except Exception as exc:
        st.warning(f"Could not read deployment_config.json: {exc}")
        return {
            "model_name": "ECG-Guard V3",
            "input_length": 77,
            "class_names": DEFAULT_CLASS_NAMES,
            "calibration_alpha": DEFAULT_ALPHA,
            "prior_ratio": DEFAULT_PRIOR_RATIO,
            "raw_test_metrics": {},
            "calibrated_test_metrics": {},
        }


def load_demo_data():
    demo_path = first_existing(DEMO_CANDIDATES)
    if demo_path is None:
        return None

    try:
        data = np.load(demo_path, allow_pickle=False)
        signals = np.asarray(data["signals"], dtype=np.float32)
        labels = np.asarray(data["labels"], dtype=np.int32)
        if signals.ndim == 3 and signals.shape[-1] == 1:
            signals = signals[..., 0]
        if signals.ndim != 2 or signals.shape[1] != 77:
            return None
        if len(signals) != len(labels):
            return None
        return signals, labels
    except Exception:
        return None


def parse_uploaded_signal(uploaded_file) -> np.ndarray:
    suffix = Path(uploaded_file.name).suffix.lower()

    if suffix == ".npy":
        array = np.load(uploaded_file, allow_pickle=False)
    else:
        raw_text = uploaded_file.getvalue().decode("utf-8-sig", errors="ignore")
        if suffix == ".txt":
            try:
                array = np.loadtxt(io.StringIO(raw_text), delimiter=",")
            except Exception:
                array = np.loadtxt(io.StringIO(raw_text))
        else:
            frame = pd.read_csv(io.StringIO(raw_text), header=None)
            frame = frame.apply(pd.to_numeric, errors="coerce")
            frame = frame.dropna(axis=0, how="all").dropna(axis=1, how="all")
            array = frame.to_numpy(dtype=np.float32)

    array = np.asarray(array, dtype=np.float32)

    if array.ndim == 1:
        if array.size != 77:
            raise ValueError(
                f"Expected 77 values for one beat, but received {array.size}."
            )
        array = array.reshape(1, 77)

    elif array.ndim == 2:
        if array.shape == (77, 1):
            array = array.reshape(1, 77)
        elif array.shape[1] == 77:
            pass
        elif array.shape[0] == 77 and array.shape[1] != 77:
            array = array.T
        else:
            raise ValueError(
                "Input must contain 77 values per row. "
                f"Received shape {array.shape}."
            )
    else:
        raise ValueError(
            f"Unsupported input dimensions: {array.ndim}. "
            "Upload a 1D or 2D numeric array."
        )

    if array.shape[1] != 77:
        raise ValueError(
            f"Each beat must contain exactly 77 samples. "
            f"Received {array.shape[1]}."
        )

    if not np.isfinite(array).all():
        raise ValueError("Input contains NaN or infinite values.")

    if len(array) > 5000:
        raise ValueError(
            "For this demo, batch uploads are limited to 5,000 beats."
        )

    return np.ascontiguousarray(array, dtype=np.float32)


def parse_manual_signal(text: str) -> np.ndarray:
    cleaned = text.replace(",", " ").replace(";", " ")
    values = np.fromstring(cleaned, sep=" ", dtype=np.float32)
    if values.size != 77:
        raise ValueError(
            f"Please provide exactly 77 numeric values. Found {values.size}."
        )
    if not np.isfinite(values).all():
        raise ValueError("Input contains NaN or infinite values.")
    return values.reshape(1, 77)


def predict_beats(model, signals, class_names, alpha, prior_ratio):
    model_input = signals[..., np.newaxis].astype(np.float32)
    raw_probabilities = model.predict(
        model_input, batch_size=256, verbose=0
    )

    ratio = np.asarray(prior_ratio, dtype=np.float64)
    if ratio.shape != (len(class_names),):
        ratio = np.ones(len(class_names), dtype=np.float64)

    calibrated = raw_probabilities * np.power(
        np.maximum(ratio, 1e-12), float(alpha)
    )[np.newaxis, :]
    calibrated /= np.maximum(
        calibrated.sum(axis=1, keepdims=True), 1e-12
    )

    predicted_ids = np.argmax(calibrated, axis=1)
    rows = []

    for index, class_id in enumerate(predicted_ids):
        row = {
            "Beat": index + 1,
            "Prediction": class_names[int(class_id)],
            "Model score": float(calibrated[index, class_id]),
        }
        for class_index, class_name in enumerate(class_names):
            row[f"P({class_name})"] = float(calibrated[index, class_index])
        rows.append(row)

    return calibrated, pd.DataFrame(rows)


def show_single_result(signal, probabilities, class_names, result_row):
    prediction = str(result_row["Prediction"])
    score = float(result_row["Model score"])

    left, right = st.columns([1, 1])
    with left:
        st.subheader("Classification result")
        st.metric("Predicted beat class", prediction)
        st.metric("Model score", f"{score:.1%}")
        st.caption(
            "The score is a model output, not a clinical diagnosis "
            "or a measure of medical certainty."
        )

    with right:
        st.subheader("Class probabilities")
        probability_frame = pd.DataFrame(
            {"Probability": probabilities},
            index=class_names,
        )
        st.bar_chart(probability_frame, height=230)

    st.subheader("Uploaded ECG beat")
    waveform_frame = pd.DataFrame(
        {"Amplitude": signal},
        index=pd.RangeIndex(1, 78, name="Sample"),
    )
    st.line_chart(waveform_frame, height=250)


st.title("💓 ECG-Guard")
st.markdown(
    "### AI-assisted ECG heartbeat classification\n"
    "Classifies a **preprocessed 77-sample ECG beat** into one of four classes."
)

st.info(
    "Research and educational prototype only. ECG-Guard is not a medical "
    "device and must not be used to diagnose, treat, or rule out a heart condition."
)

model_path = first_existing(MODEL_CANDIDATES)
if model_path is None:
    st.error(
        "The trained model file is missing. Place "
        "`ecg_guard_final.keras` inside the `models/` folder, then refresh this page."
    )
    st.code(
        "ECG_Guard_Streamlit/\n"
        "├── app.py\n"
        "├── requirements.txt\n"
        "├── deployment_config.json\n"
        "└── models/\n"
        "    ├── ecg_guard_final.keras\n"
        "    └── demo_beats.npz  # optional"
    )
    st.stop()

config = load_config()
class_names = config.get("class_names", DEFAULT_CLASS_NAMES)
input_length = int(config.get("input_length", 77))
alpha = float(config.get("calibration_alpha", DEFAULT_ALPHA))
prior_ratio = config.get("prior_ratio", DEFAULT_PRIOR_RATIO)
model_name = config.get("model_name", "ECG-Guard V3")

if input_length != 77 or len(class_names) != 4:
    st.error(
        "Deployment configuration does not match the expected "
        "4-class, 77-sample model."
    )
    st.stop()

try:
    model = load_model(str(model_path))
except Exception as exc:
    st.error(f"Could not load the trained model: {exc}")
    st.stop()

with st.sidebar:
    st.header("Model information")
    st.write(f"**Model:** {model_name}")
    st.write("**Architecture:** 1D Convolutional Neural Network")
    st.write("**Input:** 77 samples per beat")
    st.write(f"**Calibration strength:** {alpha:.3f}")
    st.divider()
    st.caption(
        "The model expects an already segmented and preprocessed beat. "
        "It does not currently detect R-peaks or process a full raw ECG recording."
    )

    raw_metrics = config.get("raw_test_metrics", {})
    if raw_metrics:
        with st.expander("Recorded held-out test metrics"):
            st.caption("Raw model metrics from the full test set.")
            for metric_name in [
                "accuracy",
                "balanced_accuracy",
                "macro_f1",
            ]:
                if metric_name in raw_metrics:
                    st.write(
                        f"**{metric_name.replace('_', ' ').title()}:** "
                        f"{float(raw_metrics[metric_name]):.2%}"
                    )

tab_upload, tab_demo, tab_about = st.tabs(
    ["Classify ECG beat", "Try a demo beat", "About the model"]
)

with tab_upload:
    st.subheader("Upload a preprocessed ECG beat")
    st.write(
        "Accepted formats: `.csv`, `.txt`, `.npy`. "
        "For batch prediction, provide one beat per row with 77 values per row."
    )

    uploaded_file = st.file_uploader(
        "Choose ECG beat file",
        type=["csv", "txt", "npy"],
        key="ecg_upload",
    )

    with st.expander("Or paste 77 sample values"):
        manual_values = st.text_area(
            "Paste comma- or space-separated values",
            height=110,
            placeholder="0.02, 0.05, 0.11, ...",
        )

    if st.button("Run ECG classification", type="primary"):
        try:
            if uploaded_file is not None:
                signals = parse_uploaded_signal(uploaded_file)
            elif manual_values.strip():
                signals = parse_manual_signal(manual_values)
            else:
                st.warning("Upload a file or paste 77 sample values first.")
                signals = None

            if signals is not None:
                with st.spinner("Analysing ECG beat(s)..."):
                    calibrated_probs, results = predict_beats(
                        model, signals, class_names, alpha, prior_ratio
                    )

                st.success(
                    f"Completed classification for {len(signals)} beat(s)."
                )

                if len(signals) == 1:
                    show_single_result(
                        signals[0],
                        calibrated_probs[0],
                        class_names,
                        results.iloc[0],
                    )
                else:
                    st.subheader("Batch predictions")
                    st.dataframe(results, use_container_width=True)
                    csv_bytes = results.to_csv(index=False).encode("utf-8")
                    st.download_button(
                        "Download prediction results",
                        data=csv_bytes,
                        file_name="ecg_guard_predictions.csv",
                        mime="text/csv",
                    )
        except Exception as exc:
            st.error(str(exc))

with tab_demo:
    st.subheader("Explore ECG-Guard with example beats")
    demo_data = load_demo_data()

    if demo_data is None:
        st.warning(
            "Demo examples are not installed yet. Run the deployment export cell "
            "in the final notebook and copy `demo_beats.npz` into the `models/` folder."
        )
    else:
        demo_signals, demo_labels = demo_data
        demo_options = [
            f"Example {i + 1} — reference class: {class_names[int(label)]}"
            for i, label in enumerate(demo_labels)
        ]
        selected_demo = st.selectbox("Choose an example beat", demo_options)
        demo_index = demo_options.index(selected_demo)

        if st.button("Classify selected demo beat"):
            demo_signal = demo_signals[demo_index]
            demo_prob, demo_result = predict_beats(
                model,
                demo_signal.reshape(1, 77),
                class_names,
                alpha,
                prior_ratio,
            )
            st.caption(
                f"Reference label from the training dataset: "
                f"**{class_names[int(demo_labels[demo_index])]}**"
            )
            show_single_result(
                demo_signal,
                demo_prob[0],
                class_names,
                demo_result.iloc[0],
            )

with tab_about:
    st.subheader("How ECG-Guard works")
    st.markdown(
        """
        1. A preprocessed heartbeat waveform containing 77 samples is supplied.
        2. The waveform is passed to a trained 1D CNN.
        3. The network produces probabilities for four heartbeat classes.
        4. A mild prior adjustment, selected using validation data, is applied
           before displaying the predicted class.

        **Classes**
        - Normal
        - Supraventricular
        - Ventricular
        - Fusion

        **Current limitations**
        - The app classifies individual, pre-segmented beats; it does not process
          an entire ECG recording.
        - It does not perform R-peak detection or signal filtering.
        - Performance is affected by class imbalance and limited minority-class
          recognition.
        - Predictions are experimental and require review by a qualified clinician.
        """
    )