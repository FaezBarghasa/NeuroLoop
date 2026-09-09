import React, { useState } from 'react';
import { useNeuroStore } from '../store/useNeuroStore';
import { BRAINWAVE_BANDS, BrainwaveBandName, NoiseType } from '../types';
import { Sliders, Waves, Wind, ChevronDown, ChevronUp, Headphones, Sparkles } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

export const AudioEnginePanel: React.FC = () => {
  const {
    audio,
    setTargetBeatHz,
    setBaseCarrierHz,
    setBinauralMix,
    setIsochronicMix,
    setIsochronicDutyCycle,
    setNoiseType,
    setNoiseVolume,
    selectBand,
  } = useNeuroStore();

  const [showAdvanced, setShowAdvanced] = useState(false);

  const bands: BrainwaveBandName[] = ['Delta', 'Theta', 'Alpha', 'Beta', 'Gamma'];

  const currentBand = bands.find(
    (b) => audio.targetBeatHz >= BRAINWAVE_BANDS[b].minHz && audio.targetBeatHz <= BRAINWAVE_BANDS[b].maxHz
  ) || 'Alpha';

  const noiseOptions: { id: NoiseType; label: string; desc: string }[] = [
    { id: 'none', label: 'Off', desc: 'Pure harmonic tones' },
    { id: 'pink', label: 'Waterfall', desc: 'Natural 1/f soothing frequency' },
    { id: 'brownian', label: 'Deep Rumble', desc: 'Warm 1/f² grounding mask' },
    { id: 'white', label: 'Air Mask', desc: 'Spectral focus blanket' },
  ];

  const handleBandSelect = (bandKey: BrainwaveBandName) => {
    triggerHaptic('medium');
    selectBand(bandKey);
  };

  const handleFrequencyStep = (delta: number) => {
    triggerHaptic('light');
    const newHz = Math.max(0.5, Math.min(50, audio.targetBeatHz + delta));
    setTargetBeatHz(newHz, 4.0);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    triggerHaptic('selection');
    setTargetBeatHz(parseFloat(e.target.value), 4.0);
  };

  return (
    <div className="space-y-4">
      
      {/* Active Crossfade Transition Banner */}
      {audio.isCrossfading && (
        <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-500/20 via-emerald-500/15 to-teal-500/20 border border-emerald-500/30 text-emerald-300 text-xs animate-pulse shadow-sm">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
            <span className="font-semibold">Seamless Crossfading in progress...</span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-300">
            <span>Glide {audio.glideProgress}%</span>
            <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-400 transition-all duration-100"
                style={{ width: `${audio.glideProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Brainwave State Pill Bar */}
      <div className="backdrop-blur-md bg-zinc-900/40 border border-zinc-800/70 rounded-2xl p-2 sm:p-3">
        <div className="grid grid-cols-5 gap-1 sm:gap-2">
          {bands.map((bandKey) => {
            const band = BRAINWAVE_BANDS[bandKey];
            const isSelected = currentBand === bandKey;

            return (
              <button
                key={bandKey}
                onClick={() => handleBandSelect(bandKey)}
                className={`py-2.5 sm:py-3 px-1 rounded-xl text-center transition-all cursor-pointer select-none active:scale-95 touch-manipulation ${
                  isSelected
                    ? 'bg-zinc-800 text-zinc-100 font-semibold shadow-md shadow-black/40 border border-zinc-700/80'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850/50'
                }`}
              >
                <div className="text-xs sm:text-sm font-semibold tracking-wide">
                  {band.name}
                </div>
                <div className="text-[10px] font-mono text-zinc-400 hidden sm:block mt-0.5">
                  {band.minHz}-{band.maxHz} Hz
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Soundstage Grid: 2 Clean Minimalist Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Left: Beat Frequency & Entrainment */}
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold tracking-wide uppercase text-zinc-300">
                Brainwave Target
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleFrequencyStep(-0.5)}
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-mono flex items-center justify-center cursor-pointer active:scale-95 transition-all"
                title="Decrease frequency by 0.5 Hz"
              >
                -
              </button>
              <span className="px-2.5 py-1 rounded-lg bg-black/20 border border-white/5 text-xs font-mono font-bold text-emerald-400 min-w-[62px] text-center">
                {audio.targetBeatHz.toFixed(1)} Hz
              </span>
              <button
                onClick={() => handleFrequencyStep(0.5)}
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-mono flex items-center justify-center cursor-pointer active:scale-95 transition-all"
                title="Increase frequency by 0.5 Hz"
              >
                +
              </button>
            </div>
          </div>

          {/* Clean Frequency Slider */}
          <div>
            <input
              type="range"
              min="0.5"
              max="45.0"
              step="0.1"
              value={audio.targetBeatHz}
              onChange={handleSliderChange}
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
            />
            <div className="flex justify-between text-[11px] font-mono text-zinc-500 mt-1.5">
              <span>0.5 Hz Sleep</span>
              <span>10 Hz Alpha Calm</span>
              <span>45 Hz Focus</span>
            </div>
          </div>

          {/* Binaural vs Isochronic Level Mixers */}
          <div className="space-y-3 pt-2 border-t border-white/5">
            <div>
              <div className="flex justify-between text-xs text-zinc-300 mb-1.5">
                <span>Continuous Tones</span>
                <span className="font-mono text-zinc-400 text-[11px]">{Math.round(audio.binauralMix * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={audio.binauralMix}
                onChange={(e) => {
                  triggerHaptic('selection');
                  setBinauralMix(parseFloat(e.target.value));
                }}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-zinc-300 mb-1.5">
                <span>Rhythmic Pulses</span>
                <span className="font-mono text-zinc-400 text-[11px]">{Math.round(audio.isochronicMix * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={audio.isochronicMix}
                onChange={(e) => {
                  triggerHaptic('selection');
                  setIsochronicMix(parseFloat(e.target.value));
                }}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-400"
              />
            </div>
          </div>
        </div>

        {/* Right: Ambient Sound Mask */}
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wind className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-semibold tracking-wide uppercase text-zinc-300">
                Ambient Soundscape Mask
              </span>
            </div>
            <span className="text-xs font-mono text-zinc-400">
              {audio.noiseType === 'none' ? 'Off' : `${Math.round(audio.noiseVolume * 100)}%`}
            </span>
          </div>

          {/* Ambient Type Cards */}
          <div className="grid grid-cols-2 gap-2">
            {noiseOptions.map((opt) => {
              const isSelected = audio.noiseType === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => {
                    triggerHaptic('light');
                    setNoiseType(opt.id);
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer active:scale-95 ${
                    isSelected
                      ? 'bg-white/10 border-cyan-500/50 shadow-sm'
                      : 'bg-white/5 border-white/5 text-zinc-400 hover:text-zinc-200 hover:bg-white/10'
                  }`}
                >
                  <div className={`text-xs font-semibold ${isSelected ? 'text-cyan-300' : 'text-zinc-300'}`}>
                    {opt.label}
                  </div>
                  <div className="text-[10px] text-zinc-400 line-clamp-1 mt-0.5">
                    {opt.desc}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Ambient Mask Volume */}
          {audio.noiseType !== 'none' && (
            <div className="pt-2">
              <div className="flex justify-between text-xs text-zinc-300 mb-1.5">
                <span>Ambient Volume</span>
                <span className="font-mono text-zinc-400 text-[11px]">{Math.round(audio.noiseVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.8"
                step="0.02"
                value={audio.noiseVolume}
                onChange={(e) => {
                  triggerHaptic('selection');
                  setNoiseVolume(parseFloat(e.target.value));
                }}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>
          )}

          {/* Headphone Note */}
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-black/20 border border-white/5 text-[11px] text-zinc-400">
            <Headphones className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span>Stereo headphones recommended for true spatial immersion.</span>
          </div>
        </div>
      </div>

      {/* Advanced Harmonic Tuning Drawer */}
      <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-sm">
        <button
          onClick={() => {
            triggerHaptic('light');
            setShowAdvanced(!showAdvanced);
          }}
          className="w-full px-4 sm:px-5 py-3 flex items-center justify-between text-xs text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Waves className="w-3.5 h-3.5 text-zinc-400" />
            <span>Advanced Audio Settings</span>
          </div>
          {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showAdvanced && (
          <div className="p-4 sm:p-5 pt-0 border-t border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between text-xs text-zinc-300 mb-1.5">
                <span>Base Pitch</span>
                <span className="font-mono text-cyan-400 text-[11px]">{audio.baseCarrierHz} Hz</span>
              </div>
              <input
                type="range"
                min="100"
                max="528"
                step="1"
                value={audio.baseCarrierHz}
                onChange={(e) => {
                  triggerHaptic('selection');
                  setBaseCarrierHz(parseInt(e.target.value, 10));
                }}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 mb-2"
              />
              <div className="flex items-center gap-1.5 flex-wrap">
                {[196, 216, 250, 432, 528].map((pitch) => (
                  <button
                    key={pitch}
                    onClick={() => {
                      triggerHaptic('light');
                      setBaseCarrierHz(pitch);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono border transition-colors cursor-pointer ${
                      audio.baseCarrierHz === pitch
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-semibold'
                        : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                    }`}
                  >
                    {pitch} Hz
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-zinc-300 mb-1.5">
                <span>Isochronic Duty Cycle (Pulse Width)</span>
                <span className="font-mono text-indigo-300 text-[11px]">{Math.round(audio.isochronicDutyCycle * 100)}%</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                {[0.2, 0.5, 0.8].map((duty) => (
                  <button
                    key={duty}
                    onClick={() => {
                      triggerHaptic('light');
                      setIsochronicDutyCycle(duty);
                    }}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-mono border transition-colors cursor-pointer ${
                      audio.isochronicDutyCycle === duty
                        ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 font-semibold'
                        : 'bg-zinc-950 text-zinc-500 border-zinc-800'
                    }`}
                  >
                    {Math.round(duty * 100)}%
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
