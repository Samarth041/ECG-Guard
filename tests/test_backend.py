import io
import json
import numpy as np
import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.core.config import settings

client = TestClient(app)

def test_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["model_loaded"] is True
    assert "ECG-Guard" in data["model_name"]

def test_model_info():
    response = client.get("/api/model-info")
    assert response.status_code == 200
    data = response.json()
    assert data["input_length"] == 77
    assert data["class_names"] == ["Normal", "Supraventricular", "Ventricular", "Fusion"]
    assert "accuracy" in data["raw_test_metrics"]
    assert "disclaimer" in data
    assert "not a medical device" in data["disclaimer"].lower()

def test_demo_beats():
    response = client.get("/api/demo-beats")
    assert response.status_code == 200
    data = response.json()
    assert data["available"] is True
    assert data["count"] == 4
    for beat in data["beats"]:
        assert len(beat["signal"]) == 77
        assert beat["reference_class"] in ["Normal", "Supraventricular", "Ventricular", "Fusion"]

def test_predict_single_beat():
    demo_res = client.get("/api/demo-beats")
    beat = demo_res.json()["beats"][0]["signal"]
    
    response = client.post("/api/predict", json={"signals": [beat]})
    assert response.status_code == 200
    data = response.json()
    assert data["count"] == 1
    res = data["results"][0]
    assert res["beat_index"] == 1
    assert res["predicted_class"] == "Normal"
    assert 0.0 <= res["model_score"] <= 1.0
    probs = res["probabilities"]
    assert len(probs) == 4
    assert pytest.approx(sum(probs.values()), rel=1e-3) == 1.0

def test_predict_batch():
    demo_res = client.get("/api/demo-beats")
    beats = [b["signal"] for b in demo_res.json()["beats"]]
    
    response = client.post("/api/predict", json={"signals": beats})
    assert response.status_code == 200
    data = response.json()
    assert data["count"] == 4
    for i, res in enumerate(data["results"]):
        assert res["beat_index"] == i + 1
        probs = res["probabilities"]
        assert pytest.approx(sum(probs.values()), rel=1e-3) == 1.0

def test_predict_invalid_sample_count():
    invalid_beat = [0.1] * 50  # only 50 samples
    response = client.post("/api/predict", json={"signals": [invalid_beat]})
    assert response.status_code == 400
    assert "77" in response.json()["detail"]

def test_predict_nan_inf():
    nan_beat = [0.1] * 76 + [float("nan")]
    response = client.post("/api/predict", json={"signals": [nan_beat]})
    assert response.status_code == 400
    assert "NaN or infinite" in response.json()["detail"]

def test_predict_file_csv():
    # Create a 77-sample CSV in memory
    sample_row = ",".join(str(0.01 * i) for i in range(77))
    csv_bytes = sample_row.encode("utf-8")
    
    response = client.post(
        "/api/predict/file",
        files={"file": ("test_beat.csv", csv_bytes, "text/csv")}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["count"] == 1
    assert data["results"][0]["predicted_class"] in ["Normal", "Supraventricular", "Ventricular", "Fusion"]

def test_predict_file_npy():
    arr = np.random.randn(2, 77).astype(np.float32)
    buf = io.BytesIO()
    np.save(buf, arr)
    buf.seek(0)
    
    response = client.post(
        "/api/predict/file",
        files={"file": ("test_batch.npy", buf.read(), "application/octet-stream")}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["count"] == 2

def test_predict_file_unsupported_extension():
    response = client.post(
        "/api/predict/file",
        files={"file": ("test.pdf", b"dummy pdf content", "application/pdf")}
    )
    assert response.status_code == 400
    assert "Unsupported file format" in response.json()["detail"]
