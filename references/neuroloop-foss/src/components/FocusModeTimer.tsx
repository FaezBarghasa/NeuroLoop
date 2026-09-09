import React, { useState } from 'react';
import { useNeuroStore } from '../store/useNeuroStore';
import {
  Timer,
  Play,
  Pause,
  Square,
  BellOff,
  Bell,
  Sparkles,
  Zap,
  CheckCircle2,
  Clock,
  Sliders,
} from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

export const FocusModeTimer: React.FC = () => {
  const {
    focusTimer,
    startFocusTimer,
    pauseFocusTimer,
    resumeFocusTimer,
    stopFocusTimer,
    setFocusDnd,
    presets,
    theme,
  } = useNeuroStore();

  const [selectedMinutes, setSelectedMinutes] = useState<number>(25);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('focus.deep-work-beta');
  const [dndToggle, setDndToggle] = useState<boolean>(true);
  const [showCustomConfig, setShowCustomConfig] = useState<boolean>(false);

  const isHighContrast = theme === 'high_contrast';

  const quickDurations = [
    { label: '15m Sprint', min: 15 },
    { label: '25m Pomodoro', min: 25 },
    { label: '45m Deep Work', min: 45 },
    { label: '60m Flow', min: 60 },
    { label: '90m Ultradian', min: 90 },
  ];

  const focusPresets = presets.filter(
    (p) => p.category === 'Focus' || p.category === 'focus' || p.targetBand === 'Beta' || p.targetBand === 'Gamma'
  ).slice(0, 5);

  // Active Timer Calculation
  const progressPercent = focusTimer.initialDurationSec > 0
    ? Math.round(((focusTimer.initialDurationSec - focusTimer.remainingSec) / focusTimer.initialDurationSec) * 100)
    : 0;

  const minsRemaining = Math.floor(focusTimer.remainingSec / 60);
  const secsRemaining = focusTimer.remainingSec % 60;
  const timeFormatted = `${String(minsRemaining).padStart(2, '0')}:${String(secsRemaining).padStart(2, '0')}`;

  const handleStart = () => {
    startFocusTimer(selectedMinutes, selectedPresetId, dndToggle);
  };

  return (
    <div
      className={`relative overflow-hidden backdrop-blur-md rounded-3xl p-5 sm:p-6 border transition-all ${
        isHighContrast
          ? 'bg-zinc-950/90 border-amber-400/80 text-zinc-100 shadow-xl shadow-amber-950/30 ring-1 ring-amber-400/40'
          : 'bg-zinc-900/40 border-zinc-800/80 text-zinc-100 shadow-lg shadow-black/20'
      }`}
    >
      {/* Background radial accent glow */}
      <div className="absolute -top-24 -right-24 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 backdrop-blur-sm">
            <Timer className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2 tracking-wide">
              Focus Timer
              {focusTimer.isActive && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              )}
            </h3>
            <p className="text-xs text-zinc-400">
              Deep work sprint with optimized audio.
            </p>
          </div>
        </div>

        {/* DND Status Pill */}
        <div
          onClick={() => {
            if (focusTimer.isActive) {
              setFocusDnd(!focusTimer.dndEnabled);
            } else {
              setDndToggle(!dndToggle);
            }
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono cursor-pointer transition-all border backdrop-blur-md ${
            (focusTimer.isActive ? focusTimer.dndEnabled : dndToggle)
              ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
              : 'bg-white/5 border-white/10 text-zinc-400'
          }`}
          title="Toggle notification muting"
        >
          {(focusTimer.isActive ? focusTimer.dndEnabled : dndToggle) ? (
            <BellOff className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <Bell className="w-3.5 h-3.5" />
          )}
          <span className="font-semibold">
            {(focusTimer.isActive ? focusTimer.dndEnabled : dndToggle) ? 'Muted' : 'DND Off'}
          </span>
        </div>
      </div>

      {/* Active State View */}
      {focusTimer.isActive ? (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-md">
          {/* Circular / Progress Indicator */}
          <div className="flex items-center gap-5">
            <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  className="stroke-zinc-800/50 fill-none"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  className="stroke-amber-400 fill-none transition-all duration-1000 ease-linear"
                  strokeWidth="8"
                  strokeDasharray="264"
                  strokeDashoffset={264 - (264 * progressPercent) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-mono font-bold text-zinc-100">{timeFormatted}</span>
                <span className="text-[10px] text-zinc-400 font-mono">{progressPercent}%</span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
                  {focusTimer.isPaused ? 'Paused' : 'Active'}
                </span>
              </div>
              <p className="text-xs text-zinc-300">
                Soundscape: <span className="font-semibold text-zinc-100">{presets.find(p => p.id === selectedPresetId)?.name || 'Focus Audio'}</span>
              </p>
            </div>
          </div>

          {/* Transport Controls */}
          <div className="flex items-center gap-2.5 self-end sm:self-center">
            {focusTimer.isPaused ? (
              <button
                onClick={resumeFocusTimer}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs cursor-pointer transition-all active:scale-95 shadow-md shadow-amber-950/30"
              >
                <Play className="w-4 h-4 fill-current" />
                Resume
              </button>
            ) : (
              <button
                onClick={pauseFocusTimer}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-zinc-200 font-bold text-xs cursor-pointer transition-all active:scale-95 border border-white/10"
              >
                <Pause className="w-4 h-4" />
                Pause
              </button>
            )}

            <button
              onClick={stopFocusTimer}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 font-bold text-xs cursor-pointer transition-all active:scale-95"
            >
              <Square className="w-4 h-4 fill-current" />
              Stop
            </button>
          </div>
        </div>
      ) : (
        /* Configuration / Idle View */
        <div className="space-y-4">
          {/* Quick Preset Time Chips */}
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-2 opacity-80">
              Select duration:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {quickDurations.map((item) => (
                <button
                  key={item.min}
                  onClick={() => {
                    triggerHaptic('light');
                    setSelectedMinutes(item.min);
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold cursor-pointer transition-all border text-center ${
                    selectedMinutes === item.min
                      ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 shadow-md shadow-amber-950/20 ring-1 ring-amber-500/30'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 text-zinc-300'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Preset Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-300 block opacity-80">
                Focus Soundscape:
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {focusPresets.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      triggerHaptic('light');
                      setSelectedPresetId(p.id);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all border ${
                      selectedPresetId === p.id
                        ? 'bg-white/10 border-amber-400/60 text-amber-300 shadow-sm'
                        : 'bg-white/5 border-white/5 text-zinc-400 hover:text-zinc-200 hover:bg-white/10'
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Launch Focus Mode Button */}
            <button
              onClick={handleStart}
              className={`flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm cursor-pointer transition-all active:scale-95 shadow-lg shrink-0 self-stretch sm:self-end ${
                isHighContrast
                  ? 'bg-amber-400 text-zinc-950 hover:bg-amber-300 ring-2 ring-amber-400/50'
                  : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 shadow-amber-950/40'
              }`}
            >
              <Zap className="w-4 h-4 fill-current" />
              Start Timer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
