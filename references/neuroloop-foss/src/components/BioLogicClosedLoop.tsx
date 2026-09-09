import React from 'react';
import { useNeuroStore } from '../store/useNeuroStore';
import {
  Activity,
  Zap,
  ShieldCheck,
  Sliders,
  Heart,
  Sparkles,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { triggerHaptic } from '../utils/haptics';

export const BioLogicClosedLoop: React.FC = () => {
  const {
    biometrics,
    biometricHistory,
    isClosedLoopActive,
    hysteresisDeadbandBPM,
    activeIntervention,
    bioLogicEvents,
    setClosedLoopActive,
    setHysteresisDeadband,
    injectHeartRate,
  } = useNeuroStore();

  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* Hero Autonomic State Card */}
      <div className={`p-4 sm:p-6 rounded-2xl border backdrop-blur-md bg-white/5 transition-all ${
        isClosedLoopActive
          ? 'border-emerald-500/30 shadow-md shadow-emerald-950/20'
          : 'border-white/10'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-colors ${
              isClosedLoopActive
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                : 'bg-white/10 border-white/10 text-zinc-400'
            }`}>
              <Zap className={`w-6 h-6 ${isClosedLoopActive ? 'animate-pulse' : ''}`} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-semibold text-zinc-100 tracking-tight">
                  Smart Sync Mode
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-medium ${
                  isClosedLoopActive
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    : 'bg-white/5 text-zinc-400 border border-white/10'
                }`}>
                  {isClosedLoopActive ? 'Active' : 'Off'}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1 max-w-xl leading-relaxed">
                Automatically adjusts audio frequencies to help you relax if your heart rate spikes.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              triggerHaptic('heavy');
              setClosedLoopActive(!isClosedLoopActive);
            }}
            className={`px-5 py-2.5 rounded-full font-medium text-xs sm:text-sm tracking-wide transition-all border shadow-sm cursor-pointer select-none active:scale-95 ${
              isClosedLoopActive
                ? 'bg-white/10 hover:bg-white/20 text-zinc-200 border-white/10 backdrop-blur-sm'
                : 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold border-transparent shadow-emerald-500/20'
            }`}
          >
            {isClosedLoopActive ? 'Turn Off Smart Sync' : 'Turn On Smart Sync'}
          </button>
        </div>

        {/* Active Intervention Alert Banner */}
        {activeIntervention?.active && (
          <div className="mt-4 p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/40 flex items-center justify-between gap-2 animate-pulse">
            <div className="flex items-center gap-2 text-xs text-indigo-300 font-mono">
              <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>
                Intervention Active: Gliding to {activeIntervention.targetBeatHz} Hz Alpha wave ({activeIntervention.reason})
              </span>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-900/60 border border-indigo-700 text-indigo-200">
              5s Crossfade
            </span>
          </div>
        )}
      </div>

      {/* Biometric KPIs: 3 Clean Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        
        {/* Heart Rate */}
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
            <span className="flex items-center gap-1.5 font-medium">
              <Heart className="w-4 h-4 text-rose-400" />
              Heart Rate
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-bold font-mono text-zinc-100">
              {biometrics.filteredHeartRate}
            </span>
            <span className="text-xs text-zinc-400 font-mono">BPM</span>
          </div>
        </div>

        {/* HRV RMSSD */}
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
            <span className="flex items-center gap-1.5 font-medium">
              <Activity className="w-4 h-4 text-emerald-400" />
              Heart Rate Variability
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-bold font-mono text-emerald-400">
              {biometrics.hrvRmssd}
            </span>
            <span className="text-xs text-zinc-400 font-mono">ms</span>
          </div>
        </div>

        {/* Stress Index */}
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
            <span className="flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              Stress Score
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl sm:text-4xl font-bold font-mono ${
              biometrics.stressIndex > 60 ? 'text-rose-400' : 'text-cyan-300'
            }`}>
              {biometrics.stressIndex}
            </span>
            <span className="text-xs text-zinc-400 font-mono">/100</span>
          </div>
        </div>
      </div>

      {/* Real-time HR History Chart */}
      <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="text-xs font-semibold tracking-wide uppercase text-zinc-300">
              Heart Rate Graph
            </h4>
            <p className="text-[11px] text-zinc-500">
              Last 60 seconds of activity.
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            Live Streaming
          </span>
        </div>

        <div className="h-44 sm:h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={biometricHistory} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="hrGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34d399" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#34d399" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" stroke="#52525b" fontSize={9} tickLine={false} />
              <YAxis domain={[50, 110]} stroke="#52525b" fontSize={9} tickLine={false} unit=" bpm" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#09090b',
                  borderColor: '#27272a',
                  borderRadius: '0.75rem',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                }}
              />
              <Area
                type="monotone"
                dataKey="filteredHR"
                stroke="#34d399"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#hrGradient)"
                name="Heart Rate (BPM)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Simulator Playground & Event Timeline */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Scenario Injector */}
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold tracking-wide uppercase text-zinc-300">
              Test Simulator
            </span>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-zinc-300">Simulated Heart Rate</span>
              <span className="font-mono text-emerald-400 font-semibold">{biometrics.heartRate} BPM</span>
            </div>
            <input
              type="range"
              min="50"
              max="115"
              step="1"
              value={biometrics.heartRate}
              onChange={(e) => {
                triggerHaptic('selection');
                injectHeartRate(parseInt(e.target.value, 10));
              }}
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => {
                triggerHaptic('medium');
                injectHeartRate(54);
              }}
              className="py-2 px-1 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-sky-400 border border-white/10 transition-colors text-center cursor-pointer active:scale-95"
            >
              Deep Rest
            </button>
            <button
              onClick={() => {
                triggerHaptic('medium');
                injectHeartRate(64);
              }}
              className="py-2 px-1 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-emerald-400 border border-white/10 transition-colors text-center cursor-pointer active:scale-95"
            >
              Baseline
            </button>
            <button
              onClick={() => {
                triggerHaptic('heavy');
                injectHeartRate(88);
              }}
              className="py-2 px-1 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-rose-400 border border-white/10 transition-colors text-center cursor-pointer active:scale-95"
            >
              Stress Spike
            </button>
          </div>
        </div>

        {/* Bio-Logic Decision Timeline */}
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold tracking-wide uppercase text-zinc-300">
                Activity Log
              </span>
            </div>
          </div>

          <div className="space-y-2 overflow-y-auto max-h-56 pr-1 scrollbar-none flex-1">
            {bioLogicEvents.map((evt) => (
              <div
                key={evt.id}
                className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs space-y-0.5"
              >
                <div className="flex items-center justify-between">
                  <span className={`font-semibold ${
                    evt.type === 'intervention'
                      ? 'text-indigo-400'
                      : evt.type === 'recovery'
                      ? 'text-emerald-400'
                      : 'text-zinc-300'
                  }`}>
                    {evt.title}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500">{evt.timestamp}</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-snug">
                  {evt.detail}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
