import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';

interface WaveformChartProps {
  signal: number[];
  title?: string;
  predictedClass?: string;
  rPeakIndex?: number;
  height?: number;
}

export const WaveformChart: React.FC<WaveformChartProps> = ({
  signal,
  title = "ECG Heartbeat Waveform (77 Samples)",
  predictedClass,
  rPeakIndex = 27, // 26 samples before, so peak is at index 27 (1-indexed)
  height = 280,
}) => {
  if (!signal || signal.length === 0) {
    return (
      <div className="w-full h-64 flex items-center justify-center bg-navy-900/60 rounded-xl border border-navy-700/60 text-slate-400 text-sm">
        No waveform data to display
      </div>
    );
  }

  // Format data for Recharts
  const data = signal.map((val, idx) => ({
    sample: idx + 1,
    amplitude: Number(val.toFixed(4)),
  }));

  // Min and max for YAxis
  const minVal = Math.min(...signal);
  const maxVal = Math.max(...signal);
  const padding = (maxVal - minVal) * 0.1 || 0.2;
  const yDomain = [Number((minVal - padding).toFixed(2)), Number((maxVal + padding).toFixed(2))];

  return (
    <div className="w-full bg-navy-850 p-4 sm:p-5 rounded-2xl border border-navy-700/80 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-2 border-b border-navy-700/60 gap-2">
        <div>
          <h4 className="text-sm font-semibold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-400"></span>
            {title}
          </h4>
          <p className="text-xs text-slate-400">
            Window size: {signal.length} samples (Resampled to 128 Hz, ~600ms)
          </p>
        </div>
        {predictedClass && (
          <div className="text-xs text-slate-300 flex items-center gap-2">
            <span className="text-slate-400">Target Category:</span>
            <span className="font-semibold text-teal-300 px-2 py-0.5 rounded bg-teal-400/10 border border-teal-400/20">
              {predictedClass}
            </span>
          </div>
        )}
      </div>

      <div style={{ width: '100%', height: height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 15, right: 15, left: -10, bottom: 5 }}>
            <defs>
              <linearGradient id="ecgLineGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#38D6C4" />
                <stop offset="50%" stopColor="#6BB7FF" />
                <stop offset="100%" stopColor="#38D6C4" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#152438" vertical={false} />
            <XAxis
              dataKey="sample"
              stroke="#64748B"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#1C314C' }}
              label={{ value: 'Sample Index (1 - 77)', position: 'insideBottom', offset: -5, fill: '#64748B', fontSize: 10 }}
            />
            <YAxis
              stroke="#64748B"
              fontSize={11}
              domain={yDomain}
              tickLine={false}
              axisLine={{ stroke: '#1C314C' }}
              tickFormatter={(v) => v.toFixed(1)}
              label={{ value: 'Amplitude (Z-score)', angle: -90, position: 'insideLeft', offset: 18, fill: '#64748B', fontSize: 10 }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const p = payload[0].payload;
                  return (
                    <div className="bg-navy-900 border border-navy-700 p-2.5 rounded-lg shadow-xl text-xs font-mono">
                      <p className="text-slate-400">Sample: <span className="text-white font-semibold">#{p.sample}</span></p>
                      <p className="text-teal-400">Amplitude: <span className="font-semibold">{p.amplitude}</span></p>
                      {p.sample === rPeakIndex && (
                        <p className="text-amber-400 text-[10px] mt-1 font-sans">Aligned R-Peak Center</p>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            <ReferenceLine
              x={rPeakIndex}
              stroke="#F6AD55"
              strokeDasharray="4 4"
              label={{
                value: 'R-Peak (~27)',
                position: 'top',
                fill: '#F6AD55',
                fontSize: 10,
              }}
            />
            <Line
              type="monotone"
              dataKey="amplitude"
              stroke="url(#ecgLineGradient)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#38D6C4', stroke: '#07111F', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 px-1">
        <span>Offset: -26 samples (~203ms)</span>
        <span className="flex items-center gap-1.5 text-amber-400/80">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block"></span>
          R-Peak fiducial center
        </span>
        <span>Offset: +51 samples (~398ms)</span>
      </div>
    </div>
  );
};
