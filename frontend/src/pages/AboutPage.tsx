import React from 'react';
import {
  Activity,
  Layers,
  Database,
  BarChart3,
  ShieldAlert,
  GitBranch,
  Cpu,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { ModelInfo } from '../types';

interface AboutPageProps {
  modelInfo: ModelInfo | null;
}

export const AboutPage: React.FC<AboutPageProps> = ({ modelInfo }) => {
  const rawMetrics = modelInfo?.raw_test_metrics || {
    accuracy: 0.7808,
    balanced_accuracy: 0.5921,
    macro_precision: 0.4034,
    macro_recall: 0.5921,
    macro_f1: 0.4073,
  };

  const calMetrics = modelInfo?.calibrated_test_metrics || {
    accuracy: 0.8655,
    balanced_accuracy: 0.6011,
    macro_precision: 0.4065,
    macro_recall: 0.6011,
    macro_f1: 0.4245,
  };

  const testCount = modelInfo?.test_samples || 44534;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">
      {/* Title */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navy-900 border border-teal-400/30 text-teal-300 text-xs font-mono">
          <Cpu className="w-3.5 h-3.5 text-teal-400" />
          <span>Research Whitepaper & Methodology</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white">About ECG-Guard V3</h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
          Technical specifications, neural network architecture, patient-stratified data engineering, and validation trade-offs.
        </p>
      </div>

      {/* Safety Notice */}
      <div className="p-6 rounded-2xl bg-navy-900 border border-amber-500/40 shadow-xl flex items-start gap-4">
        <ShieldAlert className="w-6 h-6 text-amber-400 shrink-0 mt-1" />
        <div className="space-y-1 text-xs sm:text-sm">
          <h3 className="font-bold text-amber-300">Non-Clinical Research Notice</h3>
          <p className="text-slate-300 leading-relaxed">
            ECG-Guard is an educational machine-learning research project. It is strictly an experimental prototype, not a certified medical device. The model predictions and probability distributions are computational outputs intended for academic study and must not be used for diagnosis, clinical evaluation, or treatment decisions.
          </p>
        </div>
      </div>

      {/* Section 1: Project Overview */}
      <section className="space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-navy-700">
          <Activity className="w-5 h-5 text-teal-400" />
          <h2 className="text-xl font-bold text-white">Project Overview & Objectives</h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          ECG-Guard addresses the challenge of automated electrocardiogram (ECG) heartbeat classification across diverse clinical arrhythmia databases. In standard Holter monitoring, heartbeats are naturally dominated by normal sinus rhythm, creating extreme class imbalance where life-critical ectopic beats (such as Ventricular and Supraventricular arrhythmias) make up less than 10% of recording time.
        </p>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          The V3 iteration implements an end-to-end reproducible workflow that guarantees patient-independent data separation, filters raw signals using zero-phase Butterworth bandpass filtering, resamples waveforms to a standard 128 Hz grid, and classifies isolated 77-sample windows with a dedicated 1D-CNN.
        </p>
      </section>

      {/* Section 2: Model Architecture */}
      <section className="space-y-6">
        <div className="flex items-center gap-2.5 pb-2 border-b border-navy-700">
          <Layers className="w-5 h-5 text-teal-400" />
          <h2 className="text-xl font-bold text-white">1D-CNN Model Architecture</h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          The network processes a single-channel, 77-sample waveform vector through three hierarchical convolutional feature extraction stages, followed by global average pooling and a dense classification head:
        </p>

        {/* Visual Architecture Flow */}
        <div className="p-6 rounded-2xl bg-navy-850 border border-navy-700/80 shadow-lg space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs font-mono">
            <div className="p-3.5 rounded-xl bg-navy-900 border border-navy-700/80 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase">Input Layer</span>
              <p className="text-white font-bold">(Batch, 77, 1)</p>
              <p className="text-[11px] text-slate-400 font-sans">Single lead II window at 128 Hz</p>
            </div>

            <div className="p-3.5 rounded-xl bg-navy-900 border border-navy-700/80 space-y-1">
              <span className="text-[10px] text-teal-400 uppercase">Conv Block 1</span>
              <p className="text-white font-bold">Conv1D(32, K=7) + BN + ReLU</p>
              <p className="text-[11px] text-slate-400 font-sans">MaxPool1D(2) → Shape: (38, 32)</p>
            </div>

            <div className="p-3.5 rounded-xl bg-navy-900 border border-navy-700/80 space-y-1">
              <span className="text-[10px] text-cyan-400 uppercase">Conv Block 2</span>
              <p className="text-white font-bold">Conv1D(64, K=5) + BN + ReLU</p>
              <p className="text-[11px] text-slate-400 font-sans">MaxPool1D(2) → Shape: (19, 64)</p>
            </div>

            <div className="p-3.5 rounded-xl bg-navy-900 border border-navy-700/80 space-y-1">
              <span className="text-[10px] text-amber-400 uppercase">Conv Block 3</span>
              <p className="text-white font-bold">Conv1D(128, K=3) + BN + ReLU</p>
              <p className="text-[11px] text-slate-400 font-sans">Shape: (19, 128)</p>
            </div>

            <div className="p-3.5 rounded-xl bg-navy-900 border border-navy-700/80 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase">Pooling</span>
              <p className="text-white font-bold">GlobalAveragePooling1D</p>
              <p className="text-[11px] text-slate-400 font-sans">Reduces temporal axis → (128,)</p>
            </div>

            <div className="p-3.5 rounded-xl bg-navy-900 border border-teal-400/40 space-y-1">
              <span className="text-[10px] text-teal-400 uppercase">Classifier Head</span>
              <p className="text-white font-bold">Dense(64) + Dropout(0.35)</p>
              <p className="text-[11px] text-teal-300 font-sans">Dense(4, Softmax) → (4 Classes)</p>
            </div>
          </div>

          <div className="p-3 bg-navy-900 rounded-xl border border-navy-700 text-xs text-slate-400">
            <span className="font-semibold text-slate-200">Probability Calibration:</span> To balance prediction across imbalanced prevalence, the model applies a mild prior adjustment: <code className="text-teal-300">P_cal = P_raw × (ratio ^ 0.175)</code>, re-normalized to 1.
          </div>
        </div>
      </section>

      {/* Section 3: Data Pipeline & Leakage Prevention */}
      <section className="space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-navy-700">
          <GitBranch className="w-5 h-5 text-teal-400" />
          <h2 className="text-xl font-bold text-white">Patient-Independent Data Engineering</h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          A critical flaw in standard literature is intra-patient data leakage, where heartbeats from the same patient appear in both training and test sets, falsely inflating model accuracy to 99%+. ECG-Guard strictly prevents leakage through patient-level grouping:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-navy-850 border border-navy-700/80 space-y-2">
            <h4 className="font-bold text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-teal-400" />
              MIT-BIH Subject Unification
            </h4>
            <p className="text-slate-400 leading-relaxed">
              Records 201 and 202 originate from the same subject. They are unified under a single subject identifier (<code className="text-slate-300">mitdb_subject_201_202</code>) to ensure they cannot span across splits.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-navy-850 border border-navy-700/80 space-y-2">
            <h4 className="font-bold text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-teal-400" />
              INCART Header Parsing
            </h4>
            <p className="text-slate-400 leading-relaxed">
              75 recordings in INCART are mapped back to their 32 underlying patients using regex extraction on clinical header comments, preventing intra-patient contamination.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-navy-850 border border-navy-700/80 space-y-2">
            <h4 className="font-bold text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-teal-400" />
              SVDB External Holdout
            </h4>
            <p className="text-slate-400 leading-relaxed">
              Because SVDB recordings lack verified patient headers, the database is strictly excluded from core training/test partitions and preserved as an independent external evaluation manifest.
            </p>
          </div>
        </div>
      </section>

      {/* Section 4: Evaluation Metrics Comparison */}
      <section className="space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-navy-700">
          <BarChart3 className="w-5 h-5 text-teal-400" />
          <h2 className="text-xl font-bold text-white">Full Held-Out Evaluation ({testCount.toLocaleString()} Beats)</h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          Comparison between raw model predictions and prior-calibrated predictions on the completely untouched, patient-independent test set:
        </p>

        <div className="bg-navy-850 rounded-2xl border border-navy-700/80 shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-navy-900 text-slate-400 uppercase tracking-wider text-[10px] font-semibold border-b border-navy-700">
                <tr>
                  <th className="py-3 px-4">Evaluation Metric</th>
                  <th className="py-3 px-4 text-right">Raw V3 Model</th>
                  <th className="py-3 px-4 text-right">Calibrated V3 Model (α = 0.175)</th>
                  <th className="py-3 px-4">Clinical Significance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-700/50">
                <tr>
                  <td className="py-3 px-4 font-medium text-white">Overall Accuracy</td>
                  <td className="py-3 px-4 text-right font-mono">{(rawMetrics.accuracy * 100).toFixed(2)}%</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-teal-300">{(calMetrics.accuracy * 100).toFixed(2)}%</td>
                  <td className="py-3 px-4 text-slate-400">Total correct predictions across all beats.</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-white">Balanced Accuracy</td>
                  <td className="py-3 px-4 text-right font-mono">{(rawMetrics.balanced_accuracy * 100).toFixed(2)}%</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-teal-300">{(calMetrics.balanced_accuracy * 100).toFixed(2)}%</td>
                  <td className="py-3 px-4 text-slate-400">Unweighted mean recall across the 4 classes.</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-white">Macro F1 Score</td>
                  <td className="py-3 px-4 text-right font-mono">{(rawMetrics.macro_f1 * 100).toFixed(2)}%</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-teal-300">{(calMetrics.macro_f1 * 100).toFixed(2)}%</td>
                  <td className="py-3 px-4 text-slate-400">Harmonic mean of precision and recall per category.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Section 5: Current Limitations */}
      <section className="space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-navy-700">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
          <h2 className="text-xl font-bold text-white">Project Scope & Known Limitations</h2>
        </div>
        <div className="p-5 rounded-2xl bg-navy-900 border border-navy-700 space-y-3 text-xs text-slate-300">
          <ul className="list-disc pl-5 space-y-2 leading-relaxed">
            <li>
              <strong>Pre-Segmented Input Only:</strong> The current model expects an isolated, pre-segmented 77-sample heartbeat window. It does not perform continuous 10-second ECG recording analysis or automated R-peak fiducial detection.
            </li>
            <li>
              <strong>Single-Lead Focus:</strong> The model evaluates Lead II (or physical equivalent MLII), which provides optimal QRS morphology but does not inspect full 12-lead vectors.
            </li>
            <li>
              <strong>Fusion Sensitivity:</strong> Due to extreme biological scarcity, Fusion beats represent less than 0.2% of natural recordings, making high recall challenging without prior adjustment.
            </li>
            <li>
              <strong>Non-Diagnostic Status:</strong> Outputs must never supersede expert clinical evaluation by a certified cardiologist.
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
};
