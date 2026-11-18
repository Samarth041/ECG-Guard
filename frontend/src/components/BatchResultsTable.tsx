import React, { useState, useMemo } from 'react';
import { Download, Filter, Search, Eye, X, Activity } from 'lucide-react';
import { SingleBeatResult } from '../types';
import { WaveformChart } from './WaveformChart';
import { ProbabilityBarChart } from './ProbabilityBarChart';

interface BatchResultsTableProps {
  results: SingleBeatResult[];
  modelName: string;
}

const CLASS_BADGES: Record<string, { bg: string; text: string; border: string }> = {
  Normal: { bg: 'bg-teal-400/10', text: 'text-teal-400', border: 'border-teal-400/20' },
  Supraventricular: { bg: 'bg-cyan-400/10', text: 'text-cyan-400', border: 'border-cyan-400/20' },
  Ventricular: { bg: 'bg-amber-400/10', text: 'text-amber-400', border: 'border-amber-400/20' },
  Fusion: { bg: 'bg-rose-400/10', text: 'text-rose-400', border: 'border-rose-400/20' },
};

export const BatchResultsTable: React.FC<BatchResultsTableProps> = ({ results, modelName }) => {
  const [filterClass, setFilterClass] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedBeat, setSelectedBeat] = useState<SingleBeatResult | null>(null);

  // Filtered results
  const filteredResults = useMemo(() => {
    return results.filter((item) => {
      const matchesClass = filterClass === 'ALL' || item.predicted_class === filterClass;
      const matchesSearch =
        searchQuery === '' ||
        item.beat_index.toString().includes(searchQuery) ||
        item.predicted_class.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesClass && matchesSearch;
    });
  }, [results, filterClass, searchQuery]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'Beat',
      'Predicted_Class',
      'Model_Score',
      'P_Normal',
      'P_Supraventricular',
      'P_Ventricular',
      'P_Fusion',
    ];

    const rows = results.map((r) => [
      r.beat_index,
      r.predicted_class,
      r.model_score.toFixed(4),
      (r.probabilities['Normal'] ?? 0).toFixed(4),
      (r.probabilities['Supraventricular'] ?? 0).toFixed(4),
      (r.probabilities['Ventricular'] ?? 0).toFixed(4),
      (r.probabilities['Fusion'] ?? 0).toFixed(4),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'ecg_guard_batch_predictions.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Class summary counts
  const classCounts = useMemo(() => {
    const counts: Record<string, number> = { Normal: 0, Supraventricular: 0, Ventricular: 0, Fusion: 0 };
    results.forEach((r) => {
      if (counts[r.predicted_class] !== undefined) {
        counts[r.predicted_class]++;
      }
    });
    return counts;
  }, [results]);

  return (
    <div className="w-full space-y-6">
      {/* Top summary & actions bar */}
      <div className="bg-navy-850 p-5 rounded-2xl border border-navy-700/80 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-teal-400" />
              Batch Classification Results
            </h3>
            <p className="text-xs text-slate-400">
              Processed {results.length} heartbeats using {modelName}. Each row represents one pre-segmented 77-sample beat.
            </p>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-teal-400 text-navy-950 font-semibold text-xs hover:brightness-110 active:scale-95 transition-all shadow-[0_0_15px_rgba(56,214,196,0.2)]"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        {/* Quick class distribution chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
          {Object.entries(classCounts).map(([cls, count]) => {
            const badge = CLASS_BADGES[cls] || { bg: 'bg-slate-800', text: 'text-slate-300', border: 'border-slate-700' };
            const pct = results.length > 0 ? ((count / results.length) * 100).toFixed(1) : '0';
            return (
              <div
                key={cls}
                onClick={() => setFilterClass(filterClass === cls ? 'ALL' : cls)}
                className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                  filterClass === cls
                    ? `${badge.bg} ${badge.border} ring-1 ring-teal-400/50`
                    : 'bg-navy-900/60 border-navy-700/60 hover:border-navy-600'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className={`font-semibold ${badge.text}`}>{cls}</span>
                  <span className="font-mono text-xs text-slate-300 font-bold">{count}</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">{pct}% of batch</div>
              </div>
            );
          })}
        </div>

        {/* Filter and Search controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-navy-700/60">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="bg-navy-900 border border-navy-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-teal-400 w-full sm:w-auto"
            >
              <option value="ALL">All Predicted Classes ({results.length})</option>
              <option value="Normal">Normal Only</option>
              <option value="Supraventricular">Supraventricular Only</option>
              <option value="Ventricular">Ventricular Only</option>
              <option value="Fusion">Fusion Only</option>
            </select>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2" />
            <input
              type="text"
              placeholder="Search by beat index..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-navy-900 border border-navy-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-400 w-full"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-navy-850 rounded-2xl border border-navy-700/80 shadow-lg overflow-hidden">
        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-navy-900/90 text-slate-400 uppercase tracking-wider text-[10px] font-semibold sticky top-0 border-b border-navy-700">
              <tr>
                <th className="py-3 px-4"># Beat</th>
                <th className="py-3 px-4">Predicted Category</th>
                <th className="py-3 px-4 text-right">Top Score</th>
                <th className="py-3 px-4 text-right">P(Normal)</th>
                <th className="py-3 px-4 text-right">P(SVEB)</th>
                <th className="py-3 px-4 text-right">P(VEB)</th>
                <th className="py-3 px-4 text-right">P(Fusion)</th>
                <th className="py-3 px-4 text-center">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-700/50">
              {filteredResults.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No heartbeats match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                filteredResults.map((row) => {
                  const badge = CLASS_BADGES[row.predicted_class] || {
                    bg: 'bg-slate-800',
                    text: 'text-slate-300',
                    border: 'border-slate-700',
                  };

                  return (
                    <tr
                      key={row.beat_index}
                      className="hover:bg-navy-800/60 transition-colors cursor-pointer group"
                      onClick={() => setSelectedBeat(row)}
                    >
                      <td className="py-3 px-4 font-mono font-medium text-white">
                        #{row.beat_index}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${badge.bg} ${badge.text} ${badge.border}`}
                        >
                          {row.predicted_class}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-white">
                        {(row.model_score * 100).toFixed(1)}%
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-teal-400/90">
                        {((row.probabilities['Normal'] ?? 0) * 100).toFixed(1)}%
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-cyan-400/90">
                        {((row.probabilities['Supraventricular'] ?? 0) * 100).toFixed(1)}%
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-amber-400/90">
                        {((row.probabilities['Ventricular'] ?? 0) * 100).toFixed(1)}%
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-rose-400/90">
                        {((row.probabilities['Fusion'] ?? 0) * 100).toFixed(1)}%
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedBeat(row);
                          }}
                          className="p-1 rounded bg-navy-900 border border-navy-700 text-slate-400 group-hover:text-teal-400 group-hover:border-teal-400/40 transition-colors"
                          title="Inspect waveform"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Beat Modal */}
      {selectedBeat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm">
          <div className="bg-navy-900 border border-navy-700 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-navy-800">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-teal-400"></span>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Inspecting Beat #{selectedBeat.beat_index}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Predicted Class:{' '}
                    <span className="text-teal-300 font-semibold">{selectedBeat.predicted_class}</span> (
                    {(selectedBeat.model_score * 100).toFixed(1)}% score)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedBeat(null)}
                className="p-2 rounded-lg bg-navy-800 text-slate-400 hover:text-white hover:bg-navy-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedBeat.signal ? (
              <WaveformChart
                signal={selectedBeat.signal}
                title={`Beat #${selectedBeat.beat_index} ECG Waveform`}
                predictedClass={selectedBeat.predicted_class}
              />
            ) : (
              <div className="p-6 rounded-xl bg-navy-850 border border-navy-700 text-center text-xs text-slate-400">
                Waveform data was omitted for this large batch item.
              </div>
            )}

            <ProbabilityBarChart
              probabilities={selectedBeat.probabilities}
              predictedClass={selectedBeat.predicted_class}
            />

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedBeat(null)}
                className="px-5 py-2 rounded-xl bg-navy-800 border border-navy-700 text-slate-300 hover:text-white text-xs font-semibold"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
