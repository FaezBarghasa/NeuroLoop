import React from "react";

export const EffectivenessReport: React.FC = () => {
  const sleepPresets = [
    { name: "Deep Sleep Delta", score: 0.86, carrier: "108 Hz (A432)", weight: "86%" },
    { name: "Theta Descent", score: 0.73, carrier: "216 Hz (A432)", weight: "73%" },
    { name: "Calm Night", score: 0.64, carrier: "108 Hz (A432)", weight: "64%" },
  ];

  const focusPresets = [
    { name: "Deep Work Beta", score: 0.79, carrier: "324 Hz (A432)", weight: "79%" },
    { name: "Coding SMR", score: 0.74, carrier: "216 Hz (A432)", weight: "74%" },
    { name: "Low Beta Calm", score: 0.68, carrier: "216 Hz (A432)", weight: "68%" },
  ];

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
          <span className="text-sm font-bold text-amber-400">A432 Hz Ladder</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sleep Effectiveness */}
        <div className="p-5 bg-slate-800/40 border border-slate-700/50 rounded-xl">
          <h3 className="text-lg font-semibold text-indigo-300 mb-4 flex items-center gap-2">
            🌙 Sleep Presets Ranking
          </h3>
          <div className="space-y-3">
            {sleepPresets.map((item, idx) => (
              <div key={item.name} className="p-3 bg-slate-800/80 rounded-lg">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-sm text-slate-200">
                    {idx + 1}. {item.name}
                  </span>
                  <span className="text-xs font-bold text-indigo-400">{item.weight}</span>
                </div>
                <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-500 h-full rounded-full transition-all"
                    style={{ width: `${item.score * 100}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Carrier: {item.carrier}
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
            {focusPresets.map((item, idx) => (
              <div key={item.name} className="p-3 bg-slate-800/80 rounded-lg">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-sm text-slate-200">
                    {idx + 1}. {item.name}
                  </span>
                  <span className="text-xs font-bold text-cyan-400">{item.weight}</span>
                </div>
                <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-cyan-500 h-full rounded-full transition-all"
                    style={{ width: `${item.score * 100}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Carrier: {item.carrier}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
