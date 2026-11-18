import sys
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import asyncio
import io
import unittest
import numpy as np
import httpx

from backend.app.main import app

class AsyncTestRunner:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.errors = []

    async def run(self):
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            tests = [
                self.test_health,
                self.test_model_info,
                self.test_demo_beats,
                self.test_predict_single_beat,
                self.test_predict_batch,
                self.test_predict_invalid_sample_count,
                self.test_predict_nan_inf,
                self.test_predict_file_csv,
                self.test_predict_file_npy,
                self.test_predict_file_unsupported,
            ]
            for test in tests:
                name = test.__name__
                try:
                    await test(client)
                    print(f"  [PASS] {name}")
                    self.passed += 1
                except Exception as e:
                    print(f"  [FAIL] {name}: {e}")
                    self.failed += 1
                    self.errors.append((name, str(e)))

        print("\n" + "=" * 50)
        print(f"Test Summary: {self.passed} Passed, {self.failed} Failed")
        print("=" * 50)
        if self.failed > 0:
            sys.exit(1)

    async def test_health(self, client: httpx.AsyncClient):
        res = await client.get("/api/health")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}"
        data = res.json()
        assert data["status"] == "ok"
        assert data["model_loaded"] is True
        assert "ECG-Guard" in data["model_name"]

    async def test_model_info(self, client: httpx.AsyncClient):
        res = await client.get("/api/model-info")
        assert res.status_code == 200
        data = res.json()
        assert data["input_length"] == 77
        assert data["class_names"] == ["Normal", "Supraventricular", "Ventricular", "Fusion"]
        assert "accuracy" in data["raw_test_metrics"]
        assert "disclaimer" in data
        assert "not a medical device" in data["disclaimer"].lower()

    async def test_demo_beats(self, client: httpx.AsyncClient):
        res = await client.get("/api/demo-beats")
        assert res.status_code == 200
        data = res.json()
        assert data["available"] is True
        assert data["count"] == 4
        for beat in data["beats"]:
            assert len(beat["signal"]) == 77
            assert beat["reference_class"] in ["Normal", "Supraventricular", "Ventricular", "Fusion"]

    async def test_predict_single_beat(self, client: httpx.AsyncClient):
        demo_res = await client.get("/api/demo-beats")
        beat = demo_res.json()["beats"][0]["signal"]
        
        res = await client.post("/api/predict", json={"signals": [beat]})
        assert res.status_code == 200
        data = res.json()
        assert data["count"] == 1
        item = data["results"][0]
        assert item["beat_index"] == 1
        assert item["predicted_class"] == "Normal"
        assert 0.0 <= item["model_score"] <= 1.0
        probs = item["probabilities"]
        assert len(probs) == 4
        assert abs(sum(probs.values()) - 1.0) < 1e-3

    async def test_predict_batch(self, client: httpx.AsyncClient):
        demo_res = await client.get("/api/demo-beats")
        beats = [b["signal"] for b in demo_res.json()["beats"]]
        
        res = await client.post("/api/predict", json={"signals": beats})
        assert res.status_code == 200
        data = res.json()
        assert data["count"] == 4
        for i, item in enumerate(data["results"]):
            assert item["beat_index"] == i + 1
            probs = item["probabilities"]
            assert abs(sum(probs.values()) - 1.0) < 1e-3

    async def test_predict_invalid_sample_count(self, client: httpx.AsyncClient):
        invalid_beat = [0.1] * 50
        res = await client.post("/api/predict", json={"signals": [invalid_beat]})
        assert res.status_code == 400
        assert "77" in res.json()["detail"]

    async def test_predict_nan_inf(self, client: httpx.AsyncClient):
        # Test NaN in NPY file upload
        arr = np.ones((1, 77), dtype=np.float32)
        arr[0, 5] = np.nan
        buf = io.BytesIO()
        np.save(buf, arr)
        res = await client.post(
            "/api/predict/file",
            files={"file": ("nan_beat.npy", buf.getvalue(), "application/octet-stream")}
        )
        assert res.status_code == 400
        assert "NaN or infinite" in res.json()["detail"]

    async def test_predict_file_csv(self, client: httpx.AsyncClient):
        sample_row = ",".join(str(0.01 * i) for i in range(77))
        csv_bytes = sample_row.encode("utf-8")
        
        res = await client.post(
            "/api/predict/file",
            files={"file": ("test_beat.csv", csv_bytes, "text/csv")}
        )
        assert res.status_code == 200
        data = res.json()
        assert data["count"] == 1
        assert data["results"][0]["predicted_class"] in ["Normal", "Supraventricular", "Ventricular", "Fusion"]

    async def test_predict_file_npy(self, client: httpx.AsyncClient):
        arr = np.random.randn(2, 77).astype(np.float32)
        buf = io.BytesIO()
        np.save(buf, arr)
        buf.seek(0)
        
        res = await client.post(
            "/api/predict/file",
            files={"file": ("test_batch.npy", buf.read(), "application/octet-stream")}
        )
        assert res.status_code == 200
        data = res.json()
        assert data["count"] == 2

    async def test_predict_file_unsupported(self, client: httpx.AsyncClient):
        res = await client.post(
            "/api/predict/file",
            files={"file": ("test.pdf", b"dummy pdf content", "application/pdf")}
        )
        assert res.status_code == 400
        assert "Unsupported file format" in res.json()["detail"]

if __name__ == "__main__":
    runner = AsyncTestRunner()
    asyncio.run(runner.run())
