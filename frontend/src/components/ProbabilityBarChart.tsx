import React from 'react';
import { CheckCircle2, Info } from 'lucide-react';

interface ProbabilityBarChartProps {
  probabilities: Record<string, number>;
  predictedClass: string;
}

const CLASS_CONFIG: Record<string, { label: string; code: string; color: string; bg: string; border: string; desc: string }> = {
  Normal: {
    label: 'Normal Beat',
    code: 'N',
    color: '#38D6C4',
    bg: 'bg-teal-400',
    border: 'border-teal-400/30',
    desc: 'Normal sinus rhythm, bundle branch block',
  },
  Supraventricular: {
    label: 'Supraventricular Ectopic',
    code: 'S',
    color: '#6BB7FF',
    bg: 'bg-cyan-400',
    border: 'border-cyan-400/30',
    desc: 'Atrial/nodal premature or escape beats',
  },
  Ventricular: {
    label: 'Ventricular Ectopic',
    code: 'V',
    color: '#F6AD55',
    bg: 'bg-amber-400',
    border: 'border-amber-400/30',
    desc: 'Premature ventricular contraction, escape beats',
  },
  Fusion: {
    label: 'Fusion Beat',
    code: 'F',
    color: '#FC8181',
    bg: 'bg-rose-400',
    border: 'border-rose-400/30',
    desc: 'Combined ventricular and normal activation',
  },
};

const ORDERED_CLASSES = ['Normal', 'Supraventricular', 'Ventricular', 'Fusion'];

export const ProbabilityBarChart: React.FC<ProbabilityBarChartProps> = ({
  probabilities,
  predictedClass,
}) => {
  return (
    <div className="w-full bg-navy-850 p-5 rounded-2xl border border-navy-700/80 shadow-lg space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-navy-700/60">
        <div>
          <h4 className="text-sm font-semibold text-white">Class Probability Breakdown</h4>
          <p className="text-xs text-slate-400">Calibrated V3 output distribution (sums to ~100%)</p>
        </div>
        <div className="text-[11px] text-slate-400 flex items-center gap-1 bg-navy-900 px-2.5 py-1 rounded-full border border-navy-700">
          <Info className="w-3.5 h-3.5 text-teal-400" />
          <span>AAMI 4-Class Order</span>
        </div>
      </div>

      <div className="space-y-3.5">
        {ORDERED_CLASSES.map((cls) => {
          const prob = probabilities[cls] ?? 0;
          const percentage = (prob * 100).toFixed(1);
          const isTop = cls === predictedClass;
          const config = CLASS_CONFIG[cls] || {
            label: cls,
            code: '?',
            color: '#A0AEC0',
            bg: 'bg-slate-400',
            border: 'border-slate-700',
            desc: '',
          };

          return (
            <div
              key={cls}
              className={`p-3 rounded-xl border transition-all ${
                isTop
                  ? 'bg-navy-800/90 border-teal-400/40 shadow-[0_0_15px_rgba(56,214,196,0.08)]'
                  : 'bg-navy-900/40 border-navy-700/50 hover:border-navy-600'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5 text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="w-5 h-5 rounded-md flex items-center justify-center font-mono font-bold text-[11px] text-navy-950"
                    style={{ backgroundColor: config.color }}
                  >
                    {config.code}
                  </span>
                  <span className={`font-medium ${isTop ? 'text-white' : 'text-slate-300'}`}>
                    {config.label}
                  </span>
                  {isTop && (
                    <span className="flex items-center gap-1 text-[10px] text-teal-400 bg-teal-400/10 px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider">
                      <CheckCircle2 className="w-3 h-3" />
                      Predicted
                    </span>
                  )}
                </div>

                <div className="font-mono text-xs font-semibold">
                  <span className={isTop ? 'text-teal-300 text-sm' : 'text-slate-300'}>
                    {percentage}%
                  </span>
                </div>
              </div>

              {/* Progress Bar Container */}
              <div className="w-full h-2 rounded-full bg-navy-950 overflow-hidden p-0.5 border border-navy-800">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${Math.max(Number(percentage), 1)}%`,
                    backgroundColor: config.color,
                  }}
                />
              </div>

              <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1">
                <span>{config.desc}</span>
                <span className="font-mono">P = {prob.toFixed(4)}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-2 text-[11px] text-slate-500 flex items-start gap-1.5">
        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400" />
        <span>
          Output scores represent the mathematical likelihood under the calibrated model prior. They are not clinical confidence metrics or diagnostic guarantees.
        </span>
      </div>
    </div>
  );
};
