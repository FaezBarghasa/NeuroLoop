import React from 'react';
import { useNeuroStore } from '../store/useNeuroStore';
import { AlertTriangle, ShieldAlert, Zap, X, Heart, Activity } from 'lucide-react';

export const BioAlertBanner: React.FC = () => {
  const { activeBioAlert, dismissBioAlert, triggerQuickRescue, theme, focusTimer } = useNeuroStore();

  if (!activeBioAlert) return null;

  const isHighContrast = theme === 'high_contrast';
  const isDnd = focusTimer.isActive && focusTimer.dndEnabled;

  return (
    <div className="relative z-50 px-3 sm:px-6 pt-2">
      {/* Subtle Vignette Edge Pulse */}
      <div className="fixed inset-0 pointer-events-none z-40 ring-4 ring-inset ring-amber-500/20 animate-pulse duration-1000" />

      {/* Alert Banner Card */}
      <div
        className={`relative overflow-hidden rounded-2xl p-3.5 sm:p-4 backdrop-blur-xl border transition-all ${
          isHighContrast
            ? 'bg-zinc-950/95 border-amber-400 text-zinc-100 ring-2 ring-amber-400/50 shadow-amber-950/40'
            : 'bg-amber-500/10 border-amber-500/20 text-amber-100 shadow-sm'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className={`p-2.5 rounded-xl shrink-0 mt-0.5 animate-bounce duration-700 ${
                isHighContrast
                  ? 'bg-amber-400 text-black font-bold'
                  : 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
              }`}
            >
              {activeBioAlert.metric === 'heartRate' ? (
                <Heart className="w-5 h-5 fill-current" />
              ) : activeBioAlert.metric === 'hrv' ? (
                <Activity className="w-5 h-5" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm tracking-tight text-amber-200 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  Elevated Stress Detected
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300">
                  {activeBioAlert.timestamp}
                </span>
                {isDnd && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300">
                    Focus Mode Active
                  </span>
                )}
              </div>
              <p className="text-xs text-amber-100/80 leading-relaxed max-w-2xl">
                We noticed your metrics are elevated. Would you like to switch to a calming audio session?
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <button
              onClick={() => triggerQuickRescue(8.5)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all active:scale-95 shadow-sm border ${
                isHighContrast
                  ? 'bg-emerald-400 text-black hover:bg-emerald-300 font-bold'
                  : 'bg-emerald-500 border-emerald-400/50 hover:bg-emerald-400 text-zinc-950'
              }`}
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              Play Calming Audio
            </button>

            <button
              onClick={dismissBioAlert}
              className="p-1.5 rounded-xl hover:bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
              title="Dismiss Alert"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
