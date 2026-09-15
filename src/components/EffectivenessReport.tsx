import React, { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

interface TuningProfile {
  version: number;
  auto_sensitivity: number;
  fade_seconds: number;
  tuning_standard: string;
  carrier_overrides: Record<string, number>;
  state_thresholds: Record<string, number>;
  preset_weights: Record<string, Record<string, number>>;
}

export const EffectivenessReport: React.FC = () => {
  const [profile, setProfile] = useState<TuningProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        const p = await invoke<TuningProfile>("get_tuning_profile");
        setProfile(p);
      } catch (err: unknown) {
        console.error("Failed to load tuning profile from SurrealDB:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadProfile();
  }, []);

  const sleepWeights = profile?.preset_weights?.["sleep"] || {
    "sleep.deep.delta": 0.86,
    "sleep.onset.alpha-theta": 0.73,
    "sleep.calm-night": 0.64,
  };

  const focusWeights = profile?.preset_weights?.["focus"] || {
    "focus.deep-work-beta": 0.79,
    "focus.coding-smr": 0.74,
    "focus.low-beta-calm": 0.68,
  };

  return (
    <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl text-slate-100 max-w-4xl mx-auto shadow-xl">
      <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-2xl font-bold">Adaptive Learning & Effectiveness</h2>
          <p className="text-sm text-slate-400">
            Personalized preset effectiveness rankings tuned to your biometric responses.
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-500 block">Tuning Standard</span>
          <span className="text-sm font-bold text-amber-400">
            {profile?.tuning_standard || "A432"} Hz Ladder (v{profile?.version || 1})
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-sm text-slate-400">Loading personalized tuning profile...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sleep Effectiveness */}
          <div className="p-5 bg-slate-800/40 border border-slate-700/50 rounded-xl">
            <h3 className="text-lg font-semibold text-indigo-300 mb-4 flex items-center gap-2">
              🌙 Sleep Presets Ranking
            </h3>
            <div className="space-y-3">
              {Object.entries(sleepWeights)
                .sort(([, a], [, b]) => b - a)
                .map(([presetId, weight], idx) => (
                  <div key={presetId} className="p-3 bg-slate-800/80 rounded-lg">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-sm text-slate-200">
                        {idx + 1}. {presetId.replace(/\./g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                      </span>
                      <span className="text-xs font-bold text-indigo-400">{Math.round(weight * 100)}%</span>
                    </div>
                    <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-500 h-full rounded-full transition-all"
                        style={{ width: `${Math.min(100, weight * 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Carrier: {profile?.carrier_overrides?.["sleep"] || 108} Hz (A432 Subharmonic)
                    </span>
                  </div>
                ))}
            </div>
          </div>

          {/* Focus Effectiveness */}
          <div className="p-5 bg-slate-800/40 border border-slate-700/50 rounded-xl">
            <h3 className="text-lg font-semibold text-cyan-300 mb-4 flex items-center gap-2">
              🎯 Focus Presets Ranking
            </h3>
            <div className="space-y-3">
              {Object.entries(focusWeights)
                .sort(([, a], [, b]) => b - a)
                .map(([presetId, weight], idx) => (
                  <div key={presetId} className="p-3 bg-slate-800/80 rounded-lg">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-sm text-slate-200">
                        {idx + 1}. {presetId.replace(/\./g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                      </span>
                      <span className="text-xs font-bold text-cyan-400">{Math.round(weight * 100)}%</span>
                    </div>
                    <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-cyan-500 h-full rounded-full transition-all"
                        style={{ width: `${Math.min(100, weight * 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Carrier: {profile?.carrier_overrides?.["focus"] || 324} Hz (A432 Subharmonic)
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
