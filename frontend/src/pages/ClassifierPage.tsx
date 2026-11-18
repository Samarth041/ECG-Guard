import React, { useState, useEffect } from 'react';
import {
  Upload,
  FileText,
  Activity,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Trash2,
  RotateCcw,
  ShieldAlert,
  Loader2,
  HelpCircle,
} from 'lucide-react';
import {
  DemoBeat,
  DemoBeatsResponse,
  InputMode,
  PredictionResponse,
  SingleBeatResult,
} from '../types';
import { fetchDemoBeats, predictFile, predictSignals } from '../services/api';
import { WaveformChart } from '../components/WaveformChart';
import { ProbabilityBarChart } from '../components/ProbabilityBarChart';
import { BatchResultsTable } from '../components/BatchResultsTable';

export const ClassifierPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<InputMode>('file');

  // Input states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [manualText, setManualText] = useState<string>('');
  const [manualCount, setManualCount] = useState<number>(0);
  const [manualValid, setManualValid] = useState<boolean>(false);

  // Demo beats state
  const [demoData, setDemoData] = useState<DemoBeatsResponse | null>(null);
  const [selectedDemoIndex, setSelectedDemoIndex] = useState<number>(0);
  const [loadingDemo, setLoadingDemo] = useState<boolean>(false);

  // Execution states
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [predictionResponse, setPredictionResponse] = useState<PredictionResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load demo beats on mount
  useEffect(() => {
    async function loadDemo() {
      try {
        setLoadingDemo(true);
        const data = await fetchDemoBeats();
        setDemoData(data);
      } catch (err) {
        console.warn('Could not load demo beats:', err);
      } finally {
        setLoadingDemo(false);
      }
    }
    loadDemo();
  }, []);

  // Update manual count and validity
  useEffect(() => {
    if (!manualText.trim()) {
      setManualCount(0);
      setManualValid(false);
      return;
    }
    const cleaned = manualText.replace(/,/g, ' ').replace(/;/g, ' ').trim();
    const tokens = cleaned.split(/\s+/).filter(Boolean);
    const count = tokens.length;
    setManualCount(count);

    if (count === 77) {
      const allNumbers = tokens.every((t) => !isNaN(Number(t)) && isFinite(Number(t)));
      setManualValid(allNumbers);
    } else {
      setManualValid(false);
    }
  }, [manualText]);

  // Handle classify action
  const handleRunClassification = async () => {
    setErrorMessage(null);
    setIsProcessing(true);

    try {
      if (activeTab === 'file') {
        if (!selectedFile) {
          throw new Error('Please select an ECG beat file (.csv, .txt, .npy) first.');
        }
        const res = await predictFile(selectedFile);
        setPredictionResponse(res);
      } else if (activeTab === 'manual') {
        if (!manualValid) {
          throw new Error(
            `Please provide exactly 77 valid numeric samples. Currently found ${manualCount} sample(s).`
          );
        }
        const cleaned = manualText.replace(/,/g, ' ').replace(/;/g, ' ').trim();
        const values = cleaned.split(/\s+/).filter(Boolean).map(Number);
        const res = await predictSignals([values]);
        setPredictionResponse(res);
      } else if (activeTab === 'demo') {
        if (!demoData || !demoData.available || demoData.beats.length === 0) {
          throw new Error('Demo examples are not installed or unavailable.');
        }
        const beat = demoData.beats[selectedDemoIndex];
        const res = await predictSignals([beat.signal]);
        setPredictionResponse(res);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred during classification.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper to pre-fill manual text with currently selected demo beat
  const handlePasteDemoToManual = () => {
    if (demoData?.beats[selectedDemoIndex]) {
      const sig = demoData.beats[selectedDemoIndex].signal;
      setManualText(sig.map((v) => v.toFixed(4)).join(', '));
      setActiveTab('manual');
    }
  };

  const isSubmitDisabled =
    isProcessing ||
    (activeTab === 'file' && !selectedFile) ||
    (activeTab === 'manual' && !manualValid) ||
    (activeTab === 'demo' && (!demoData || !demoData.available));

  const isSingleResult = predictionResponse && predictionResponse.count === 1;
  const singleResult = isSingleResult ? predictionResponse.results[0] : null;

  return (
    <div className="space-y-10 py-6">
      {/* Page Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navy-900 border border-teal-400/30 text-teal-300 text-xs font-mono">
          <Activity className="w-3.5 h-3.5 text-teal-400" />
          <span>Interactive Classification Workspace</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">ECG Heartbeat Classifier</h1>
        <p className="text-sm text-slate-400 max-w-3xl">
          Submit an already-preprocessed, 77-sample ECG heartbeat window. The model evaluates morphological features using the trained 1D-CNN and returns calibrated class probabilities.
        </p>
      </div>

      {/* Main Two-Column Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Input Panel (lg:col-span-5) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-navy-850 p-5 sm:p-6 rounded-2xl border border-navy-700/80 shadow-xl space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-navy-700">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-400"></span>
                  Input Heartbeat Data
                </h3>
                <span className="text-[11px] text-slate-400 font-mono">77 Samples Required</span>
              </div>

              {/* Input Mode Tabs */}
              <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-navy-900 border border-navy-700">
                <button
                  onClick={() => setActiveTab('file')}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === 'file'
                      ? 'bg-navy-800 text-teal-300 border border-teal-400/30 shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>File Upload</span>
                </button>

                <button
                  onClick={() => setActiveTab('manual')}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === 'manual'
                      ? 'bg-navy-800 text-teal-300 border border-teal-400/30 shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Manual Input</span>
                </button>

                <button
                  onClick={() => setActiveTab('demo')}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === 'demo'
                      ? 'bg-navy-800 text-teal-300 border border-teal-400/30 shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Demo Beat</span>
                </button>
              </div>

              {/* Tab A: File Upload */}
              {activeTab === 'file' && (
                <div className="space-y-4">
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        setSelectedFile(e.dataTransfer.files[0]);
                      }
                    }}
                    className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                      selectedFile
                        ? 'border-teal-400/50 bg-teal-400/5'
                        : 'border-navy-700 hover:border-slate-500 bg-navy-900/40'
                    }`}
                  >
                    <input
                      type="file"
                      id="fileInput"
                      accept=".csv,.txt,.npy"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setSelectedFile(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                    />
                    <label htmlFor="fileInput" className="cursor-pointer space-y-2 block">
                      <div className="w-12 h-12 rounded-xl bg-navy-800 border border-navy-700 flex items-center justify-center text-teal-400 mx-auto">
                        <Upload className="w-6 h-6" />
                      </div>
                      <div className="text-xs text-slate-300">
                        {selectedFile ? (
                          <span className="font-semibold text-teal-300">{selectedFile.name}</span>
                        ) : (
                          <>
                            <span className="font-semibold text-white">Click to browse</span> or drag and drop
                          </>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Supports <code className="text-slate-400">.csv</code>, <code className="text-slate-400">.txt</code>, <code className="text-slate-400">.npy</code> (Up to 5,000 beats)
                      </p>
                    </label>
                  </div>

                  {selectedFile && (
                    <div className="flex items-center justify-between text-xs px-3 py-2 rounded-lg bg-navy-900 border border-navy-700">
                      <span className="text-slate-300 font-mono truncate max-w-[200px]">
                        {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                      </span>
                      <button
                        onClick={() => setSelectedFile(null)}
                        className="text-slate-400 hover:text-rose-400 transition-colors"
                        title="Remove file"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  <div className="text-[11px] text-slate-400 space-y-1 bg-navy-900/40 p-3 rounded-xl border border-navy-700/50">
                    <p className="font-semibold text-slate-300">File Structure Guide:</p>
                    <p>• <strong>Single Beat:</strong> 1 row of 77 numeric values or 1D array.</p>
                    <p>• <strong>Batch Beats:</strong> N rows x 77 columns (one beat per row).</p>
                    <p>• Data should be already normalized (Z-score [-5, +5]).</p>
                  </div>
                </div>
              )}

              {/* Tab B: Manual Text Entry */}
              {activeTab === 'manual' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <label className="text-slate-300 font-medium">Paste 77 Numeric Samples</label>
                    <span
                      className={`font-mono text-[11px] px-2 py-0.5 rounded ${
                        manualValid
                          ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/30'
                          : manualCount > 0
                          ? 'bg-amber-400/10 text-amber-400 border border-amber-400/30'
                          : 'bg-navy-900 text-slate-500'
                      }`}
                    >
                      {manualCount} / 77 samples {manualValid && '✓'}
                    </span>
                  </div>

                  <textarea
                    rows={6}
                    value={manualText}
                    onChange={(e) => setManualText(e.target.value)}
                    placeholder="Example: -0.12, 0.05, 0.45, 1.82, 0.22, ... (separate with commas or spaces)"
                    className="w-full bg-navy-900 border border-navy-700 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-400 font-mono leading-relaxed resize-none"
                  />

                  <div className="flex items-center justify-between text-xs">
                    <button
                      onClick={() => setManualText('')}
                      disabled={!manualText}
                      className="text-slate-400 hover:text-white disabled:opacity-30 flex items-center gap-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Clear</span>
                    </button>
                    {demoData?.available && (
                      <button
                        onClick={handlePasteDemoToManual}
                        className="text-teal-400 hover:underline text-[11px]"
                      >
                        Load sample beat data
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Tab C: Demo Beats */}
              {activeTab === 'demo' && (
                <div className="space-y-4">
                  {loadingDemo ? (
                    <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-teal-400" />
                      <span>Loading reference demo signals...</span>
                    </div>
                  ) : !demoData || !demoData.available || demoData.beats.length === 0 ? (
                    <div className="p-4 rounded-xl bg-navy-900 border border-navy-700 text-xs text-amber-300 space-y-1">
                      <p className="font-semibold">Demo beats are not currently available.</p>
                      <p className="text-slate-400">
                        {demoData?.message || 'Ensure demo_beats.npz is placed inside the models/ directory.'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs text-slate-300">
                        Select a verified heartbeat sample extracted from the project evaluation holdout:
                      </p>
                      <div className="space-y-2">
                        {demoData.beats.map((beat, idx) => (
                          <div
                            key={beat.index}
                            onClick={() => setSelectedDemoIndex(idx)}
                            className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                              selectedDemoIndex === idx
                                ? 'bg-navy-800 border-teal-400/50 shadow-md ring-1 ring-teal-400/20'
                                : 'bg-navy-900/50 border-navy-700/60 hover:border-navy-600'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="w-6 h-6 rounded-md bg-navy-950 flex items-center justify-center font-mono text-xs font-bold text-slate-400">
                                #{beat.index}
                              </span>
                              <div>
                                <span className="text-xs font-semibold text-white block">
                                  Reference Class: {beat.reference_class}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  77 samples, Lead II normalized
                                </span>
                              </div>
                            </div>
                            <span className="text-[11px] font-mono text-teal-400">
                              {selectedDemoIndex === idx ? 'Selected' : 'Select'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Classification CTA */}
              <button
                onClick={handleRunClassification}
                disabled={isSubmitDisabled}
                className="w-full py-3.5 rounded-xl text-sm font-bold bg-gradient-to-r from-teal-400 to-teal-500 text-navy-950 hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(56,214,196,0.25)] flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analysing heartbeat...</span>
                  </>
                ) : (
                  <>
                    <Activity className="w-4 h-4" />
                    <span>Run ECG Classification</span>
                  </>
                )}
              </button>

              {/* Error Message */}
              {errorMessage && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-bold">Input Error:</span>
                    <p className="text-rose-200">{errorMessage}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Safety Reminder Card */}
            <div className="p-4 rounded-2xl bg-navy-900 border border-navy-700/60 text-xs text-slate-400 space-y-1.5">
              <div className="flex items-center gap-2 text-slate-300 font-semibold text-xs">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>Prototype Disclaimer</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Predictions reflect statistical pattern recognition on 77-sample isolated windows. They do not constitute a medical evaluation or clinical diagnosis.
              </p>
            </div>
          </div>

          {/* Right Column: Output / Results View (lg:col-span-7) */}
          <div className="lg:col-span-7 space-y-6">
            {!predictionResponse ? (
              // Empty State / Instructions
              <div className="bg-navy-850 p-8 sm:p-12 rounded-2xl border border-navy-700/80 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-navy-900 border border-navy-700 flex items-center justify-center text-teal-400 mx-auto">
                  <Activity className="w-8 h-8 opacity-60" />
                </div>
                <h3 className="text-lg font-bold text-white">No Heartbeat Classified Yet</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  Provide an ECG heartbeat waveform on the left panel (upload a file, enter 77 sample points, or choose a preloaded demo beat) and click <strong>Run ECG Classification</strong>.
                </p>
                <div className="pt-4 flex flex-wrap justify-center gap-2 text-[11px] text-slate-500">
                  <span className="px-2.5 py-1 rounded bg-navy-900 border border-navy-800">128 Hz Resampling</span>
                  <span className="px-2.5 py-1 rounded bg-navy-900 border border-navy-800">77 Window Length</span>
                  <span className="px-2.5 py-1 rounded bg-navy-900 border border-navy-800">Z-Score Normalized</span>
                  <span className="px-2.5 py-1 rounded bg-navy-900 border border-navy-800">4 AAMI Classes</span>
                </div>
              </div>
            ) : isSingleResult && singleResult ? (
              // Single Beat Result View
              <div className="space-y-6">
                {/* Result Hero Banner */}
                <div className="bg-navy-850 p-6 rounded-2xl border border-teal-400/40 shadow-xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-navy-700 gap-4">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-teal-400 bg-teal-400/10 px-2 py-0.5 rounded border border-teal-400/20">
                        Classification Output
                      </span>
                      <h2 className="text-2xl font-extrabold text-white mt-1">
                        Predicted: <span className="text-teal-300">{singleResult.predicted_class}</span>
                      </h2>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="text-[11px] text-slate-400 block">Top Model Score</span>
                      <span className="text-2xl font-mono font-extrabold text-white">
                        {(singleResult.model_score * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    The top model score is a mathematical likelihood output of the calibrated 1D-CNN network, not clinical certainty or a validated medical diagnosis.
                  </p>
                </div>

                {/* Probability Bar Chart */}
                <ProbabilityBarChart
                  probabilities={singleResult.probabilities}
                  predictedClass={singleResult.predicted_class}
                />

                {/* Waveform Chart */}
                {singleResult.signal && (
                  <WaveformChart
                    signal={singleResult.signal}
                    predictedClass={singleResult.predicted_class}
                  />
                )}
              </div>
            ) : (
              // Batch Results View
              <BatchResultsTable
                results={predictionResponse.results}
                modelName={predictionResponse.model_name}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
