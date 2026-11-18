export interface HealthStatus {
  status: string;
  model_loaded: boolean;
  model_name: string;
  message?: string | null;
}

export interface ModelInfo {
  model_name: string;
  architecture: string;
  input_length: number;
  class_names: string[];
  calibration_alpha: number;
  prior_ratio: number[];
  train_prior?: number[];
  validation_prior?: number[];
  raw_test_metrics: Record<string, number>;
  calibrated_test_metrics: Record<string, number>;
  test_samples: number;
  disclaimer: string;
}

export interface DemoBeat {
  index: number;
  reference_class_id: number;
  reference_class: string;
  signal: number[];
}

export interface DemoBeatsResponse {
  available: boolean;
  count: number;
  class_names: string[];
  beats: DemoBeat[];
  message?: string | null;
}

export interface SingleBeatResult {
  beat_index: number;
  predicted_class: 'Normal' | 'Supraventricular' | 'Ventricular' | 'Fusion' | string;
  model_score: number;
  probabilities: Record<string, number>;
  signal?: number[];
}

export interface PredictionResponse {
  model_name: string;
  input_length: number;
  count: number;
  results: SingleBeatResult[];
}

export type InputMode = 'file' | 'manual' | 'demo';
export type PageRoute = 'home' | 'classifier' | 'about';
