import io
from pathlib import Path
from typing import Tuple
import numpy as np
import pandas as pd

MAX_BATCH_SIZE = 5000
EXPECTED_SAMPLE_LENGTH = 77

def parse_manual_text(text: str) -> np.ndarray:
    if not text or not text.strip():
        raise ValueError("Please provide sample values. The input cannot be empty.")
    
    # Replace commas, semicolons, tabs, and newlines with spaces
    cleaned = text.replace(",", " ").replace(";", " ").replace("\t", " ").replace("\n", " ")
    try:
        values = np.fromstring(cleaned, sep=" ", dtype=np.float32)
    except Exception as e:
        raise ValueError(f"Failed to parse numeric values from text: {e}")
        
    if values.size == 0:
        raise ValueError("No numeric values found in the input.")
        
    if values.size != EXPECTED_SAMPLE_LENGTH:
        raise ValueError(
            f"Please provide exactly {EXPECTED_SAMPLE_LENGTH} numeric values. Found {values.size} samples."
        )
        
    if not np.isfinite(values).all():
        raise ValueError("Input contains NaN or infinite values.")
        
    return values.reshape(1, EXPECTED_SAMPLE_LENGTH)


def parse_uploaded_file(file_content: bytes, filename: str) -> np.ndarray:
    if not file_content:
        raise ValueError("Uploaded file is empty.")
        
    suffix = Path(filename).suffix.lower()
    if suffix not in [".csv", ".txt", ".npy"]:
        raise ValueError(
            f"Unsupported file format '{suffix}'. Accepted formats are .csv, .txt, and .npy."
        )
        
    try:
        if suffix == ".npy":
            array = np.load(io.BytesIO(file_content), allow_pickle=False)
        elif suffix == ".txt":
            raw_text = file_content.decode("utf-8-sig", errors="ignore").strip()
            if not raw_text:
                raise ValueError("The .txt file contains no text.")
            try:
                array = np.loadtxt(io.StringIO(raw_text), delimiter=",")
            except Exception:
                array = np.loadtxt(io.StringIO(raw_text))
        else:  # .csv
            raw_text = file_content.decode("utf-8-sig", errors="ignore").strip()
            if not raw_text:
                raise ValueError("The .csv file contains no text.")
            frame = pd.read_csv(io.StringIO(raw_text), header=None)
            frame = frame.apply(pd.to_numeric, errors="coerce")
            frame = frame.dropna(axis=0, how="all").dropna(axis=1, how="all")
            array = frame.to_numpy(dtype=np.float32)
    except ValueError as ve:
        raise ve
    except Exception as e:
        raise ValueError(f"Could not parse file '{filename}': {str(e)}")

    array = np.asarray(array, dtype=np.float32)
    
    if array.size == 0:
        raise ValueError("No valid numeric data found in the file.")
        
    if array.ndim == 1:
        if array.size != EXPECTED_SAMPLE_LENGTH:
            raise ValueError(
                f"Expected {EXPECTED_SAMPLE_LENGTH} values for one beat, but received {array.size}."
            )
        array = array.reshape(1, EXPECTED_SAMPLE_LENGTH)
    elif array.ndim == 2:
        if array.shape == (EXPECTED_SAMPLE_LENGTH, 1):
            array = array.reshape(1, EXPECTED_SAMPLE_LENGTH)
        elif array.shape[1] == EXPECTED_SAMPLE_LENGTH:
            pass
        elif array.shape[0] == EXPECTED_SAMPLE_LENGTH and array.shape[1] != EXPECTED_SAMPLE_LENGTH:
            array = array.T
        else:
            raise ValueError(
                f"Input must contain {EXPECTED_SAMPLE_LENGTH} values per row. "
                f"Received shape {array.shape}."
            )
    else:
        raise ValueError(
            f"Unsupported array dimension: {array.ndim}D. "
            "Please provide a 1D vector (77 samples) or a 2D matrix (N x 77)."
        )

    if array.shape[1] != EXPECTED_SAMPLE_LENGTH:
        raise ValueError(
            f"Each beat must contain exactly {EXPECTED_SAMPLE_LENGTH} samples. "
            f"Received {array.shape[1]}."
        )

    if not np.isfinite(array).all():
        raise ValueError("Input data contains NaN or infinite values.")

    if len(array) > MAX_BATCH_SIZE:
        raise ValueError(
            f"Batch upload limit exceeded: maximum allowed is {MAX_BATCH_SIZE} beats per request. "
            f"Received {len(array)} beats."
        )

    return np.ascontiguousarray(array, dtype=np.float32)
