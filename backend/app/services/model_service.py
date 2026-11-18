import io
import os
import zipfile
from pathlib import Path
from typing import Optional, Tuple
import numpy as np

from backend.app.core.config import settings

class TorchModelWrapper:
    def __init__(self, keras_path: Path):
        import h5py
        import torch
        import torch.nn as nn
        import torch.nn.functional as F

        class ECGGuardTorch(nn.Module):
            def __init__(self, k_path: Path):
                super().__init__()
                with zipfile.ZipFile(str(k_path), "r") as z:
                    w_bytes = z.read("model.weights.h5")
                    with h5py.File(io.BytesIO(w_bytes), "r") as h5f:
                        # Conv1: (7, 1, 32) -> PyTorch (32, 1, 7)
                        c1_w = np.array(h5f["layers/conv1d/vars/0"]).transpose(2, 1, 0)
                        self.conv1 = nn.Conv1d(1, 32, kernel_size=7, padding=3, bias=False)
                        self.conv1.weight.data = torch.from_numpy(c1_w)

                        # BN1
                        self.bn1 = nn.BatchNorm1d(32, eps=0.001, momentum=0.99)
                        self.bn1.weight.data = torch.from_numpy(np.array(h5f["layers/batch_normalization/vars/0"]))
                        self.bn1.bias.data = torch.from_numpy(np.array(h5f["layers/batch_normalization/vars/1"]))
                        self.bn1.running_mean = torch.from_numpy(np.array(h5f["layers/batch_normalization/vars/2"]))
                        self.bn1.running_var = torch.from_numpy(np.array(h5f["layers/batch_normalization/vars/3"]))

                        # Conv2: (5, 32, 64) -> PyTorch (64, 32, 5)
                        c2_w = np.array(h5f["layers/conv1d_1/vars/0"]).transpose(2, 1, 0)
                        self.conv2 = nn.Conv1d(32, 64, kernel_size=5, padding=2, bias=False)
                        self.conv2.weight.data = torch.from_numpy(c2_w)

                        # BN2
                        self.bn2 = nn.BatchNorm1d(64, eps=0.001, momentum=0.99)
                        self.bn2.weight.data = torch.from_numpy(np.array(h5f["layers/batch_normalization_1/vars/0"]))
                        self.bn2.bias.data = torch.from_numpy(np.array(h5f["layers/batch_normalization_1/vars/1"]))
                        self.bn2.running_mean = torch.from_numpy(np.array(h5f["layers/batch_normalization_1/vars/2"]))
                        self.bn2.running_var = torch.from_numpy(np.array(h5f["layers/batch_normalization_1/vars/3"]))

                        # Conv3: (3, 64, 128) -> PyTorch (128, 64, 3)
                        c3_w = np.array(h5f["layers/conv1d_2/vars/0"]).transpose(2, 1, 0)
                        self.conv3 = nn.Conv1d(64, 128, kernel_size=3, padding=1, bias=False)
                        self.conv3.weight.data = torch.from_numpy(c3_w)

                        # BN3
                        self.bn3 = nn.BatchNorm1d(128, eps=0.001, momentum=0.99)
                        self.bn3.weight.data = torch.from_numpy(np.array(h5f["layers/batch_normalization_2/vars/0"]))
                        self.bn3.bias.data = torch.from_numpy(np.array(h5f["layers/batch_normalization_2/vars/1"]))
                        self.bn3.running_mean = torch.from_numpy(np.array(h5f["layers/batch_normalization_2/vars/2"]))
                        self.bn3.running_var = torch.from_numpy(np.array(h5f["layers/batch_normalization_2/vars/3"]))

                        # Dense 1: (128, 64) -> PyTorch (64, 128)
                        d1_w = np.array(h5f["layers/dense/vars/0"]).T
                        d1_b = np.array(h5f["layers/dense/vars/1"])
                        self.fc1 = nn.Linear(128, 64)
                        self.fc1.weight.data = torch.from_numpy(d1_w)
                        self.fc1.bias.data = torch.from_numpy(d1_b)

                        # Dense 2: (64, 4) -> PyTorch (4, 64)
                        d2_w = np.array(h5f["layers/dense_1/vars/0"]).T
                        d2_b = np.array(h5f["layers/dense_1/vars/1"])
                        self.fc2 = nn.Linear(64, 4)
                        self.fc2.weight.data = torch.from_numpy(d2_w)
                        self.fc2.bias.data = torch.from_numpy(d2_b)

                self.eval()

            def forward(self, x):
                x = self.conv1(x)
                x = self.bn1(x)
                x = F.relu(x)
                x = F.max_pool1d(x, kernel_size=2, stride=2)

                x = self.conv2(x)
                x = self.bn2(x)
                x = F.relu(x)
                x = F.max_pool1d(x, kernel_size=2, stride=2)

                x = self.conv3(x)
                x = self.bn3(x)
                x = F.relu(x)

                x = torch.mean(x, dim=2)  # Global Average Pooling

                x = self.fc1(x)
                x = F.relu(x)

                x = self.fc2(x)
                probs = F.softmax(x, dim=1)
                return probs

        self.model = ECGGuardTorch(keras_path)
        self.torch = torch

    def predict(self, signals: np.ndarray, batch_size: int = 256) -> np.ndarray:
        # signals shape (N, 77)
        results = []
        n = len(signals)
        with self.torch.no_grad():
            for i in range(0, n, batch_size):
                batch = np.array(signals[i : i + batch_size], copy=True)
                t_in = self.torch.from_numpy(batch).unsqueeze(1).float()
                probs = self.model(t_in).cpu().numpy()
                results.append(probs)
        return np.concatenate(results, axis=0)


class ModelService:
    def __init__(self):
        self._model = None
        self._backend_type = None
        self._loaded_path = None
        self._load_error = None

    @property
    def is_loaded(self) -> bool:
        return self._model is not None

    @property
    def load_error(self) -> Optional[str]:
        return self._load_error

    def load_model(self) -> bool:
        if self._model is not None:
            return True

        model_path = settings.resolve_model_path()
        if model_path is None or not model_path.exists():
            self._load_error = (
                f"Model file 'ecg_guard_final.keras' not found. "
                f"Please ensure it is located in 'models/ecg_guard_final.keras'."
            )
            print(f"[ERROR] {self._load_error}")
            return False

        # Attempt 1: TensorFlow Keras
        try:
            import tensorflow as tf
            print(f"[INFO] Loading model with TensorFlow Keras from {model_path}...")
            self._model = tf.keras.models.load_model(str(model_path), compile=False)
            self._backend_type = "tensorflow"
            self._loaded_path = str(model_path)
            self._load_error = None
            print("[INFO] Model loaded successfully with TensorFlow.")
            return True
        except Exception as tf_err:
            print(f"[INFO] TensorFlow load skipped/failed ({tf_err}). Trying native PyTorch loader...")

        # Attempt 2: PyTorch native loader using model.weights.h5
        try:
            self._model = TorchModelWrapper(model_path)
            self._backend_type = "pytorch_native"
            self._loaded_path = str(model_path)
            self._load_error = None
            print("[INFO] Model loaded successfully with native weight loader.")
            return True
        except Exception as pt_err:
            self._load_error = (
                f"Failed to load model from {model_path}: {pt_err}"
            )
            print(f"[ERROR] {self._load_error}")
            return False

    def predict_raw(self, signals: np.ndarray) -> np.ndarray:
        if not self.is_loaded:
            success = self.load_model()
            if not success:
                raise RuntimeError(self._load_error or "Model is not loaded.")

        if self._backend_type == "tensorflow":
            model_input = signals[..., np.newaxis].astype(np.float32)
            return self._model.predict(model_input, batch_size=256, verbose=0)
        elif self._backend_type == "pytorch_native":
            return self._model.predict(signals, batch_size=256)
        else:
            raise RuntimeError("Unknown model backend.")

model_service = ModelService()
