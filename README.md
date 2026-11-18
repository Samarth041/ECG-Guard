<div align="center">

# 💓 ECG-Guard

### AI-Assisted ECG Heartbeat Classification & Web Platform

**A four-class ECG beat classification system powered by a 1D Convolutional Neural Network (1D CNN), deployed with a FastAPI backend and a modern React + TypeScript + Vite web application (alongside the original Streamlit prototype).**

<p>
  <img src="https://img.shields.io/badge/Python-3.11%20%7C%203.12-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python">
  <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI">
  <img src="https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5.6-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="TailwindCSS">
  <img src="https://img.shields.io/badge/TensorFlow%20%2F%20PyTorch-FF6F00?style=for-the-badge&logo=tensorflow&logoColor=white" alt="Deep Learning">
  <img src="https://img.shields.io/badge/Streamlit-Legacy%20UI-FF4B4B?style=for-the-badge&logo=streamlit&logoColor=white" alt="Streamlit">
</p>

</div>

---

> **IMPORTANT MEDICAL NOTICE**
> 
> ECG-Guard is an **academic research and educational prototype**. It is **NOT A MEDICAL DEVICE** and is not certified for clinical diagnosis, patient monitoring, triage, or healthcare decision-making. Do not use its output to evaluate health status. In a medical emergency, contact emergency medical services immediately.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Web Application Features](#2-web-application-features)
3. [System Architecture](#3-system-architecture)
4. [Dataset & Signal Preprocessing](#4-dataset--signal-preprocessing)
5. [Model Architecture & Calibration](#5-model-architecture--calibration)
6. [Project Structure](#6-project-structure)
7. [Installation & Setup](#7-installation--setup)
8. [How to Run](#8-how-to-run)
9. [REST API Documentation](#9-rest-api-documentation)
10. [Automated Testing](#10-automated-testing)
11. [Model Evaluation Results](#11-model-evaluation-results)
12. [Project Contributors](#12-project-contributors)

---

## 1. Overview

**ECG-Guard** is an AI-assisted electrocardiogram (ECG) heartbeat classification project that categorizes preprocessed, isolated single heartbeats into four primary categories derived from the ANSI/AAMI EC57 standard:

| Class ID | Heartbeat Class | Clinically Mapped Symbols | Description |
|---:|---|---|---|
| **0** | **Normal (N)** | N, L, R, B, e, j | Normal sinus rhythm, bundle branch block beats, escape beats |
| **1** | **Supraventricular (S)** | A, a, J, S, n | Premature atrial/junctional beats, aberrated supraventricular beats |
| **2** | **Ventricular (V)** | V, E, r | Premature ventricular contractions (PVCs), ventricular escape, R-on-T |
| **3** | **Fusion (F)** | F | Hybrid activation combining normal conduction and ventricular ectopic focus |

The project accepts an already-segmented, 77-sample heartbeat window (Lead II, resampled to 128 Hz, Z-score normalized) and returns calibrated output probabilities.

---

## 2. Web Application Features

The modern web application provides:

- **Public Landing Experience (`/`):** Project overview, capability cards, educational class breakdown, model evaluation snapshot, and safety disclaimers.
- **Interactive Classifier Workspace (`/classifier`):**
  - **File Upload:** Drag-and-drop support for `.csv`, `.txt`, and `.npy` files. Handles single beats and batches up to 5,000 beats.
  - **Manual Sample Entry:** Text area accepting comma-, space-, or semicolon-separated values with live counter (`X / 77 samples`).
  - **Preloaded Reference Demo:** Direct selection of verified reference samples from `models/demo_beats.npz`.
  - **Single-Beat Inspection:** Prominent predicted class badge, top model score, 4-class calibrated horizontal bar chart, and interactive 77-sample waveform with R-peak fiducial alignment line.
  - **Batch Analysis & Export:** Searchable, class-filterable results table, modal waveform inspector for any row, and instant CSV export.
- **Methodology & Architecture (`/about`):** Detailed 1D CNN layer diagram, patient-independent stratification mechanics, evaluation trade-offs, and project limitations.

---

## 3. System Architecture

```text
┌────────────────────────────────────────────────────────┐
│               React + TypeScript Frontend              │
│       Vite • Tailwind CSS • Lucide Icons • Recharts     │
└───────────────────────────┬────────────────────────────┘
                            │ REST API Requests
                            ▼
┌────────────────────────────────────────────────────────┐
│                 FastAPI Python Backend                 │
│      - Input Parser & Validator (.csv, .txt, .npy)     │
│      - Model Service (TensorFlow Keras / PyTorch native)│
│      - Prior Calibration Engine (alpha = 0.175)        │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│                   Model & Artefacts                    │
│   • models/ecg_guard_final.keras (1D-CNN weights)      │
│   • deployment_config.json (parameters & test metrics) │
│   • models/demo_beats.npz (verified reference samples) │
└────────────────────────────────────────────────────────┘
```

---

## 4. Dataset & Signal Preprocessing

The model was developed using three established PhysioNet databases:
1. **MIT-BIH Arrhythmia Database (`mitdb`):** 48 ambulatory recordings (360 Hz). Records 201 and 202 are unified into one patient identity.
2. **St. Petersburg INCART 12-Lead Arrhythmia Database (`incartdb`):** 75 records (257 Hz) mapped via header comments to 32 patient identities.
3. **MIT-BIH Supraventricular Arrhythmia Database (`svdb`):** 78 records preserved as an unverified external holdout.

### Signal Preprocessing Pipeline:
- **Bandpass Filter:** 4th-order zero-phase Butterworth filter (0.5 – 40.0 Hz).
- **Resampling:** Rational polyphase resampling (`resample_poly`) to a uniform **128 Hz**.
- **Window Extraction:** 77 samples captured around the R-peak (26 samples before, 51 samples after, corresponding to ~600 ms).
- **Normalization:** Per-beat Z-score normalization `(x - mean) / std`, clipped to `[-5, +5]`.
- **Training Balance:** 3,000 beats per class using patient-aware weighted jittering, scaling, and Gaussian noise. Test sets remain completely unaugmented and natural.

---

## 5. Model Architecture & Calibration

### 1D CNN Architecture
```text
Input: (Batch, 77, 1)
  │
  ├─► Conv1D(32, kernel=7, padding="same") ─► BatchNorm(eps=0.001) ─► ReLU ─► MaxPool1D(2)
  │
  ├─► Conv1D(64, kernel=5, padding="same") ─► BatchNorm(eps=0.001) ─► ReLU ─► MaxPool1D(2)
  │
  ├─► Conv1D(128, kernel=3, padding="same") ─► BatchNorm(eps=0.001) ─► ReLU
  │
  ├─► GlobalAveragePooling1D() ─► (Batch, 128)
  │
  ├─► Dense(64, activation="relu") ─► Dropout(0.35)
  │
  └─► Dense(4, activation="softmax") ─► Output: [P_Normal, P_SVEB, P_VEB, P_Fusion]
```

### Probability Calibration
To counter extreme clinical class imbalance, raw probabilities are adjusted using the validation-selected prior ratio:
$$\tilde{P}_c = P_c \times (\text{ratio}_c)^\alpha, \quad \text{where } \alpha = 0.175$$
Normalized so that $\sum \tilde{P}_c = 1.0$.

---

## 6. Project Structure

```text
ECG-Guard/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── endpoints.py         # REST API routes (/predict, /health, etc.)
│   │   ├── core/
│   │   │   └── config.py            # Environment configuration & path resolvers
│   │   ├── schemas/
│   │   │   └── prediction.py        # Pydantic schemas for requests & responses
│   │   ├── services/
│   │   │   ├── input_parser.py      # Robust parser for CSV, TXT, NPY & text
│   │   │   ├── model_service.py     # Dual model loader (TensorFlow + PyTorch)
│   │   │   └── prediction_service.py# Calibration & batch prediction logic
│   │   └── main.py                  # FastAPI application & SPA static server
│   └── requirements.txt             # Python backend dependencies
│
├── frontend/
│   ├── src/
│   │   ├── components/              # WaveformChart, ProbabilityBarChart, etc.
│   │   ├── pages/                   # HomePage, ClassifierPage, AboutPage
│   │   ├── services/                # API client with error handling
│   │   ├── types/                   # TypeScript interfaces
│   │   ├── styles/                  # Tailwind base & theme CSS
│   │   ├── App.tsx                  # Root layout & route coordinator
│   │   └── main.tsx                 # React entry point
│   ├── package.json                 # Node dependencies
│   └── vite.config.ts               # Vite build & proxy settings
│
├── models/
│   ├── ecg_guard_final.keras        # Trained V3 model weights & architecture
│   └── demo_beats.npz               # 4 verified reference heartbeat samples
│
├── tests/
│   ├── run_tests.py                 # Async backend test runner
│   └── test_backend.py              # Test cases (10 passed)
│
├── deployment_config.json           # Model metadata, priors & recorded metrics
├── app.py                           # Legacy Streamlit prototype
├── requirements.txt                 # Root dependencies
└── README.md
```

---

## 7. Installation & Setup

### Prerequisites
- **Python:** 3.11 or 3.12
- **Node.js:** 18+ (Node 20 or 22 recommended)

### 1. Clone the repository
```bash
git clone https://github.com/your-username/ECG-Guard.git
cd ECG-Guard
```

### 2. Python Backend Setup
Install the backend dependencies:
```bash
pip install -r backend/requirements.txt
```

### 3. Frontend Setup
Install frontend npm packages and build the production bundle:
```bash
cd frontend
npm install
npm run build
cd ..
```

---

## 8. How to Run

### Option A: Unified Production Server (Recommended)
Once the frontend is built (`npm run build` inside `frontend/`), FastAPI serves both the API and the React web application on a single port:
```bash
python backend/app/main.py
```
Open **[http://localhost:8000](http://localhost:8000)** in your browser.

### Option B: Full-Stack Development Mode
Run the backend and frontend in separate terminals:

**Terminal 1 (FastAPI Backend):**
```bash
uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```

**Terminal 2 (Vite React Frontend):**
```bash
cd frontend
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser. API requests are automatically proxied to the backend at port 8000.

### Option C: Legacy Streamlit Prototype
```bash
streamlit run app.py
```

---

## 9. REST API Documentation

FastAPI automatically provides interactive Swagger documentation at **`http://localhost:8000/docs`**.

### Endpoints:

#### `GET /api/health`
Returns system status and model readiness.
```json
{
  "status": "ok",
  "model_loaded": true,
  "model_name": "ECG-Guard V3",
  "message": null
}
```

#### `GET /api/model-info`
Returns model architecture, 4-class ordering, calibration parameters, and recorded test metrics.

#### `POST /api/predict`
Accepts a JSON array of beats (each with exactly 77 numeric samples):
```json
{
  "signals": [
    [-0.05, 0.02, ..., 0.12]
  ]
}
```
Returns structured predictions, top model score, and calibrated 4-class probabilities.

#### `POST /api/predict/file`
Multipart upload supporting `.csv`, `.txt`, and `.npy` files containing up to 5,000 beats.

#### `GET /api/demo-beats`
Returns the 4 reference demonstration beats from `demo_beats.npz` with ground-truth classes.

---

## 10. Automated Testing

Run the complete backend test suite:
```bash
python tests/run_tests.py
```

**Test Coverage:**
- Service health & model preloading
- Model information & disclaimer verification
- Reference demo beats loading & signal validation
- Single-beat inference and probability summation to 1.0
- Batch inference across multiple heartbeats
- 77-sample length enforcement (rejects invalid sample counts)
- Rejection of NaN and infinite values
- Multipart CSV file parsing
- Multipart binary NPY file parsing
- Rejection of unsupported file formats

---

## 11. Model Evaluation Results

Evaluation performed on the complete, untouched, patient-independent **44,534-beat test set**:

| Metric | Raw V3 Model | Prior-Calibrated V3 ($\alpha = 0.175$) |
|---|---:|---:|
| **Overall Accuracy** | **78.08%** | **86.55%** |
| **Balanced Accuracy** | **59.21%** | **60.11%** |
| **Macro Precision** | **40.34%** | **40.65%** |
| **Macro Recall** | **59.21%** | **60.11%** |
| **Macro F1-Score** | **40.73%** | **42.45%** |

*Note: Raw overall accuracy reflects the natural ~88% dominance of Normal beats. Balanced accuracy and Macro F1 provide an honest reflection of minority ectopic beat recognition.*

---

## 12. Project Contributors

| Contributor | Enrollment Number |
|---|---|
| **Samarth Gupta** | 24/11/EE/012 |
| **Ramji** | 24/11/EC/025 |
| **Devananda Sreekumar** | 24/11/EE/036 |
| **Priyanshu Kumar Ajariwal** | 24/11/EE/005 |

---

<div align="center">

**ECG-Guard — AI-Assisted ECG Heartbeat Classification**  
*Academic & Educational Research Project.*

</div>
