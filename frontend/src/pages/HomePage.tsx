import React from 'react';
import {
  Activity,
  ArrowRight,
  ShieldAlert,
  BarChart3,
  Layers,
  FileSpreadsheet,
  CheckCircle,
  HelpCircle,
  Sparkles,
  HeartPulse,
} from 'lucide-react';
import { ModelInfo, PageRoute } from '../types';

interface HomePageProps {
  onNavigate: (page: PageRoute) => void;
  modelInfo: ModelInfo | null;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, modelInfo }) => {
  // Use verified metrics from config or fallback
  const rawMetrics = modelInfo?.raw_test_metrics || {
    accuracy: 0.7808,
    balanced_accuracy: 0.5921,
    macro_f1: 0.4073,
  };
  const testSamples = modelInfo?.test_samples || 44534;

  return (
    <div className="space-y-24 py-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-6 pb-12">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-teal-400/10 via-cyan-500/10 to-transparent blur-3xl pointer-events-none rounded-full" />

        <div className="max-w-4xl mx-auto text-center space-y-6 px-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-navy-900 border border-teal-400/30 text-teal-300 text-xs font-medium shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            <span>ECG-Guard V3 Research Prototype</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-[1.15]">
            Understand the heartbeat.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-teal-400 to-cyan-400">
              Explore the signal.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            ECG-Guard is an AI-assisted ECG heartbeat classification research project that uses a
            1D Convolutional Neural Network to classify preprocessed heartbeat signals into four categories.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={() => onNavigate('classifier')}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl text-sm font-bold bg-gradient-to-r from-teal-400 to-teal-500 text-navy-950 hover:brightness-110 active:scale-95 transition-all shadow-[0_0_25px_rgba(56,214,196,0.3)] flex items-center justify-center gap-2"
            >
              <span>Try ECG-Guard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('about')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl text-sm font-semibold bg-navy-850 border border-navy-700 text-slate-200 hover:text-white hover:border-slate-600 transition-all flex items-center justify-center gap-2"
            >
              <span>Explore the Model</span>
            </button>
          </div>
        </div>

        {/* Subtle Animated Signal Wave graphic */}
        <div className="max-w-3xl mx-auto mt-12 px-4">
          <div className="relative p-6 rounded-2xl bg-navy-900/70 border border-navy-700/80 backdrop-blur-sm shadow-2xl">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-3 pb-2 border-b border-navy-800">
              <span className="flex items-center gap-2 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                Lead II Signal Sample (128 Hz, 77 points)
              </span>
              <span className="text-[11px] text-teal-400 font-mono">Normalized Z-Score</span>
            </div>
            <svg
              className="w-full h-28 stroke-teal-400 fill-none"
              viewBox="0 0 600 120"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="heroGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#38D6C4" stopOpacity="0.2" />
                  <stop offset="50%" stopColor="#38D6C4" stopOpacity="1" />
                  <stop offset="100%" stopColor="#6BB7FF" stopOpacity="0.3" />
                </linearGradient>
              </defs>
              <path
                d="M 0 60 L 100 60 Q 120 50 140 60 T 170 60 L 220 60 L 235 70 L 255 10 L 275 110 L 295 60 L 330 60 Q 360 40 390 60 T 430 60 L 600 60"
                stroke="url(#heroGradient)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-2">
              <span>Sample 1 (P-Wave)</span>
              <span className="text-amber-400 font-semibold">Sample 27 (R-Peak Fiducial)</span>
              <span>Sample 77 (T-Wave)</span>
            </div>
          </div>
        </div>
      </section>

      {/* Prominent Research Notice */}
      <section className="max-w-5xl mx-auto px-4">
        <div className="p-5 sm:p-6 rounded-2xl bg-navy-900 border border-amber-500/30 shadow-lg flex flex-col sm:flex-row items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="space-y-1 text-xs sm:text-sm">
            <h4 className="font-bold text-amber-300">Important Research Prototype Disclaimer</h4>
            <p className="text-slate-300 leading-relaxed">
              ECG-Guard is an academic research prototype, not a medical device. It is not intended to
              diagnose, treat, monitor, or rule out any medical condition. Do not use its output to
              make healthcare decisions. If you are experiencing chest pain or a medical emergency,
              contact your local emergency medical service immediately.
            </p>
          </div>
        </div>
      </section>

      {/* 4 Key Capability Cards */}
      <section className="max-w-6xl mx-auto px-4 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">System Capabilities</h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            Engineered specifically for preprocessed single-beat analysis using the verified V3 pipeline.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="p-6 rounded-2xl bg-navy-850 border border-navy-700/80 hover:border-teal-400/40 transition-all shadow-md group">
            <div className="w-11 h-11 rounded-xl bg-teal-400/10 border border-teal-400/20 flex items-center justify-center text-teal-400 mb-4 group-hover:scale-110 transition-transform">
              <HeartPulse className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">4-Class Classification</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Categorizes segmented beats into Normal, Supraventricular, Ventricular, and Fusion categories according to AAMI EC57 standards.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-navy-850 border border-navy-700/80 hover:border-cyan-400/40 transition-all shadow-md group">
            <div className="w-11 h-11 rounded-xl bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center text-cyan-400 mb-4 group-hover:scale-110 transition-transform">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Waveform Inspection</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Interactive 77-sample visualization plotting amplitude against sample index, complete with R-peak alignment markers.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-navy-850 border border-navy-700/80 hover:border-amber-400/40 transition-all shadow-md group">
            <div className="w-11 h-11 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400 mb-4 group-hover:scale-110 transition-transform">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Calibrated Probabilities</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Evaluates raw softmax outputs alongside validation-tuned prior calibration to compensate for clinical class imbalance.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-navy-850 border border-navy-700/80 hover:border-teal-400/40 transition-all shadow-md group">
            <div className="w-11 h-11 rounded-xl bg-teal-400/10 border border-teal-400/20 flex items-center justify-center text-teal-400 mb-4 group-hover:scale-110 transition-transform">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Batch Analysis & CSV</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Submit up to 5,000 beats via CSV or NPY, view structured class tables, inspect individual beats, and export results.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works (4 Steps) */}
      <section className="max-w-5xl mx-auto px-4 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">How ECG-Guard Operates</h2>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            From preprocessed waveform input to calibrated multi-class distribution.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              step: '01',
              title: 'Provide a Beat',
              desc: 'Upload a CSV, TXT, or NPY file, paste 77 numbers, or select a preloaded demo beat.',
            },
            {
              step: '02',
              title: 'Validate Input',
              desc: 'The parser verifies exact 77-sample length, checks for non-numeric data, and rejects NaNs/Infs.',
            },
            {
              step: '03',
              title: 'Run 1D-CNN Model',
              desc: 'Waveform is processed through 3 convolutional blocks followed by global average pooling and dense layers.',
            },
            {
              step: '04',
              title: 'Review Results',
              desc: 'Examine the predicted class, top model score, calibrated probability chart, and aligned waveform.',
            },
          ].map((s) => (
            <div
              key={s.step}
              className="p-5 rounded-2xl bg-navy-900 border border-navy-700/80 relative space-y-2"
            >
              <span className="font-mono text-xs font-bold text-teal-400 bg-teal-400/10 px-2 py-0.5 rounded border border-teal-400/20">
                Step {s.step}
              </span>
              <h3 className="text-sm font-bold text-white">{s.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 4 Heartbeat Classes Overview */}
      <section className="max-w-5xl mx-auto px-4 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">The Four Heartbeat Classes</h2>
          <p className="text-sm text-slate-400 max-w-lg mx-auto">
            ECG-Guard maps individual clinical annotation symbols into the standard 4-class AAMI EC57 taxonomy.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-navy-850 border border-teal-400/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white">Normal Heartbeat (N)</span>
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-teal-400/10 text-teal-400">Class 0</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Encompasses normal sinus beats, left/right bundle branch block beats, and escape rhythms (N, L, R, B, e, j). Typically dominant in natural recording distributions.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-navy-850 border border-cyan-400/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white">Supraventricular Ectopic (S)</span>
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-cyan-400/10 text-cyan-400">Class 1</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Arises from atrial or junctional foci above the ventricles, including premature atrial contractions and aberrated beats (A, a, J, S, n).
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-navy-850 border border-amber-400/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white">Ventricular Ectopic (V)</span>
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-amber-400/10 text-amber-400">Class 2</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Originates within the ventricles, characterized by premature ventricular contractions (PVCs) and R-on-T phenomena (V, E, r).
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-navy-850 border border-rose-400/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white">Fusion Beat (F)</span>
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-rose-400/10 text-rose-400">Class 3</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Occurs when a ventricular ectopic impulse and a supraventricular conduction activate the myocardium simultaneously (F). Clinically rare.
            </p>
          </div>
        </div>
      </section>

      {/* Model Snapshot & Evaluation Metrics */}
      <section className="max-w-5xl mx-auto px-4">
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-navy-900 to-navy-850 border border-navy-700/80 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-navy-700">
            <div>
              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-teal-400 bg-teal-400/10 px-2 py-0.5 rounded border border-teal-400/20">
                Evaluation Snapshot
              </span>
              <h3 className="text-xl font-bold text-white mt-1">Recorded Held-Out Test Set Performance</h3>
            </div>
            <span className="text-xs text-slate-400 font-mono bg-navy-950 px-3 py-1.5 rounded-lg border border-navy-800">
              Held-Out Test: {testSamples.toLocaleString()} Beats
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-navy-950/70 border border-navy-800 space-y-1">
              <div className="text-xs text-slate-400">Overall Accuracy</div>
              <div className="text-3xl font-extrabold text-white font-mono">
                {(rawMetrics.accuracy * 100).toFixed(2)}%
              </div>
              <p className="text-[11px] text-slate-500">
                High due to the natural dominance of Normal beats.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-navy-950/70 border border-navy-800 space-y-1">
              <div className="text-xs text-slate-400">Balanced Accuracy</div>
              <div className="text-3xl font-extrabold text-teal-300 font-mono">
                {(rawMetrics.balanced_accuracy * 100).toFixed(2)}%
              </div>
              <p className="text-[11px] text-slate-500">
                Average recall across all four classes without frequency bias.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-navy-950/70 border border-navy-800 space-y-1">
              <div className="text-xs text-slate-400">Macro F1 Score</div>
              <div className="text-3xl font-extrabold text-cyan-300 font-mono">
                {(rawMetrics.macro_f1 * 100).toFixed(2)}%
              </div>
              <p className="text-[11px] text-slate-500">
                Reflects the precision-recall trade-off across rare arrhythmia classes.
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Note: Raw overall accuracy in imbalanced medical datasets can give a misleadingly high impression of performance because Normal beats comprise ~88% of test data. Balanced accuracy and Macro F1 provide an honest assessment of minority-class arrhythmia recognition.
          </p>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="max-w-4xl mx-auto text-center px-4 pt-6 space-y-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-white">Ready to test the classifier?</h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
          Upload your preprocessed ECG data file or try one of the verified reference examples from the project.
        </p>
        <button
          onClick={() => onNavigate('classifier')}
          className="px-8 py-3.5 rounded-xl text-sm font-bold bg-teal-400 text-navy-950 hover:brightness-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(56,214,196,0.3)] inline-flex items-center gap-2"
        >
          <span>Open Classifier Workspace</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </section>
    </div>
  );
};
