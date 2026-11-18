import {
  DemoBeatsResponse,
  HealthStatus,
  ModelInfo,
  PredictionResponse,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorDetail = `Request failed with status ${res.status}`;
    try {
      const errJson = await res.json();
      if (errJson && errJson.detail) {
        errorDetail = errJson.detail;
      }
    } catch {
      // fallback to status text
      errorDetail = res.statusText || errorDetail;
    }
    throw new ApiError(errorDetail, res.status);
  }
  return res.json();
}

export async function fetchHealth(): Promise<HealthStatus> {
  const res = await fetch(`${API_BASE_URL}/health`);
  return handleResponse<HealthStatus>(res);
}

export async function fetchModelInfo(): Promise<ModelInfo> {
  const res = await fetch(`${API_BASE_URL}/model-info`);
  return handleResponse<ModelInfo>(res);
}

export async function fetchDemoBeats(): Promise<DemoBeatsResponse> {
  const res = await fetch(`${API_BASE_URL}/demo-beats`);
  return handleResponse<DemoBeatsResponse>(res);
}

export async function predictSignals(signals: number[][]): Promise<PredictionResponse> {
  const res = await fetch(`${API_BASE_URL}/predict`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ signals }),
  });
  return handleResponse<PredictionResponse>(res);
}

export async function predictFile(file: File): Promise<PredictionResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE_URL}/predict/file`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse<PredictionResponse>(res);
}
