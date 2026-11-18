import React, { useState } from 'react';
import { Activity, Menu, X, ShieldAlert, Cpu } from 'lucide-react';
import { HealthStatus, PageRoute } from '../types';

interface NavbarProps {
  currentPage: PageRoute;
  onNavigate: (page: PageRoute) => void;
  health: HealthStatus | null;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPage, onNavigate, health }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { id: PageRoute; label: string }[] = [
    { id: 'home', label: 'Home' },
    { id: 'classifier', label: 'Classifier' },
    { id: 'about', label: 'About & Methodology' },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-navy-950/80 backdrop-blur-md border-b border-navy-700/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div 
            onClick={() => onNavigate('home')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400/20 to-cyan-500/10 border border-teal-400/30 flex items-center justify-center text-teal-400 group-hover:border-teal-400 transition-colors">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                ECG<span className="text-teal-400">Guard</span>
                <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-teal-400/10 text-teal-400 border border-teal-400/20">
                  V3
                </span>
              </span>
              <p className="text-[10px] text-slate-400 hidden sm:block">AI Heartbeat Classifier</p>
            </div>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  currentPage === item.id
                    ? 'text-teal-400 bg-navy-850 border border-teal-400/20 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-navy-900'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Right Status & Action */}
          <div className="hidden md:flex items-center gap-3.5">
            {/* Status indicator */}
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-navy-900 border border-navy-700 text-xs">
              <span
                className={`w-2 h-2 rounded-full ${
                  health?.model_loaded ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'bg-amber-400'
                }`}
              />
              <span className="text-slate-300 font-mono text-[11px]">
                {health?.model_loaded ? 'Model Ready' : 'Connecting...'}
              </span>
            </div>

            <button
              onClick={() => onNavigate('classifier')}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-teal-400 to-teal-500 text-navy-950 hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_0_15px_rgba(56,214,196,0.25)]"
            >
              Try Classifier
            </button>
          </div>

          {/* Mobile menu toggle */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-navy-900"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-navy-900 border-b border-navy-700 px-4 pt-2 pb-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onNavigate(item.id);
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3.5 py-2.5 rounded-lg text-sm font-medium ${
                currentPage === item.id
                  ? 'text-teal-400 bg-navy-850 font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-navy-800'
              }`}
            >
              {item.label}
            </button>
          ))}
          <div className="pt-3 border-t border-navy-800 flex flex-col gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-navy-950 text-xs text-slate-400">
              <span
                className={`w-2 h-2 rounded-full ${
                  health?.model_loaded ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
              <span>{health?.model_loaded ? 'ECG-Guard V3 Online' : 'Connecting to API...'}</span>
            </div>
            <button
              onClick={() => {
                onNavigate('classifier');
                setMobileMenuOpen(false);
              }}
              className="w-full text-center px-4 py-2.5 rounded-lg text-sm font-semibold bg-teal-400 text-navy-950 font-medium"
            >
              Try Classifier
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};
