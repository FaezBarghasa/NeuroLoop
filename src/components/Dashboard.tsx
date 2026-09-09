import React, { useState } from "react";
import { DataExport } from "./DataExport";
import { EffectivenessReport } from "./EffectivenessReport";
import { FeedbackDialog } from "./FeedbackDialog";

export const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"overview" | "effectiveness" | "export">("overview");
  const [isFeedbackOpen, setIsFeedbackOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans">
      {/* Header */}
      <header className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <span className="p-2 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-xl text-xl">
              🌀
            </span>
            NeuroLoop
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Local-first, A432-tuned adaptive binaural wellness platform
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 gap-1">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "overview"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab("effectiveness")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "effectiveness"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Effectiveness
          </button>
          <button
            onClick={() => setActiveTab("export")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "export"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Data & Privacy
          </button>
        </div>
      </header>

      {/* Content Area */}
      <main className="max-w-6xl mx-auto space-y-8">
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Status Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Active Tuning Standard
                </span>
                <span className="text-2xl font-bold text-amber-400">A432 Hz Ladder</span>
                <p className="text-xs text-slate-500 mt-2">
                  Carriers: 108, 144, 216, 324, 432 Hz
                </p>
              </div>

              <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Biometric Data Source
                </span>
                <span className="text-2xl font-bold text-emerald-400">Health Connect</span>
                <p className="text-xs text-slate-500 mt-2">CMF Watch Pro 2 (Optional BLE Direct)</p>
              </div>

              <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Storage Engine
                </span>
                <span className="text-2xl font-bold text-cyan-400">SurrealDB Local</span>
                <p className="text-xs text-slate-500 mt-2">Embedded KV-SurrealKV Store</p>
              </div>
            </div>

            {/* Now Playing Quick Control */}
            <div className="p-6 bg-gradient-to-br from-indigo-950/60 to-slate-900 border border-indigo-500/30 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
              <div>
                <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-xs font-semibold rounded-full uppercase tracking-wider">
                  Preset: Deep Sleep Delta
                </span>
                <h2 className="text-xl font-bold text-slate-100 mt-3">
                  6 Hz Delta Ramp → 2 Hz Delta
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Modality: Binaural | Carrier: 108 Hz (A432) | Volume: 40%
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setIsFeedbackOpen(true)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition-all border border-slate-700"
                >
                  Rate Session
                </button>
                <button
                  onClick={() => alert("Playback toggled")}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-indigo-500/30 transition-all"
                >
                  ▶ Start Session
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "effectiveness" && <EffectivenessReport />}

        {activeTab === "export" && <DataExport />}
      </main>

      {/* Feedback Dialog */}
      <FeedbackDialog
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        onSubmit={(fb) => console.log("Feedback saved:", fb)}
      />
    </div>
  );
};
