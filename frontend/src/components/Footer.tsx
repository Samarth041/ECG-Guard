import React from 'react';
import { Activity, ShieldAlert, BookOpen, ExternalLink, Code2 } from 'lucide-react';
import { PageRoute } from '../types';

interface FooterProps {
  onNavigate: (page: PageRoute) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-navy-950 border-t border-navy-800 text-slate-400 text-sm mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Brand & Mission */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-teal-400/20 border border-teal-400/30 flex items-center justify-center text-teal-400">
                <Activity className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold text-white">
                ECG<span className="text-teal-400">Guard</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-md">
              An academic deep learning research project applying a 1D Convolutional Neural Network
              to 77-sample preprocessed ECG heartbeat classification across four AAMI classes.
            </p>
            <div className="p-3.5 rounded-xl bg-navy-900 border border-navy-700/80 flex items-start gap-3">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-300 leading-normal">
                <strong className="text-amber-300">Academic Prototype Notice:</strong> ECG-Guard is not a certified medical device and must never be used for clinical diagnosis, patient management, or medical triage.
              </p>
            </div>
          </div>

          {/* Col 2: Navigation */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">Navigation</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => onNavigate('home')} className="hover:text-teal-400 transition-colors">
                  Home Overview
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('classifier')} className="hover:text-teal-400 transition-colors">
                  Classifier Workspace
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('about')} className="hover:text-teal-400 transition-colors">
                  Architecture & Dataset
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Research Datasets & Standards */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">Research Sources</h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-1 hover:text-slate-300">
                <span>MIT-BIH Arrhythmia Database</span>
              </li>
              <li className="flex items-center gap-1 hover:text-slate-300">
                <span>St. Petersburg INCART Database</span>
              </li>
              <li className="flex items-center gap-1 hover:text-slate-300">
                <span>SVDB External Evaluation</span>
              </li>
              <li className="pt-2 text-[11px] text-slate-500">
                AAMI EC57 4-Class Benchmark
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-navy-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2026 ECG-Guard Research Project. Educational & Academic Demonstration.</p>
          <p className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
            <span>V3 1D-CNN Model Architecture</span>
          </p>
        </div>
      </div>
    </footer>
  );
};
