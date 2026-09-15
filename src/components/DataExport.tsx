import React, { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";

export const DataExport: React.FC = () => {
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  const handleExportZip = async () => {
    setIsExporting(true);
    setExportMessage(null);
    try {
      const destinationPath = await save({
        defaultPath: "neuroloop-export.zip",
        filters: [
          {
            name: "Zip Archive",
            extensions: ["zip"],
          },
        ],
      });

      if (!destinationPath) {
        setIsExporting(false);
        return;
      }

      await invoke("export_full_zip", { destinationPath });
      setExportMessage(`Full backup exported successfully to: ${destinationPath}`);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setExportMessage(`Export error: ${errorMsg}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportJson = async () => {
    setIsExporting(true);
    setExportMessage(null);
    try {
      const jsonContent = await invoke<string>("export_all_json");
      const blob = new Blob([jsonContent], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `neuroloop-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setExportMessage("JSON backup downloaded successfully!");
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setExportMessage(`Export error: ${errorMsg}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleWipeData = async () => {
    const confirmed = window.confirm("Are you sure you want to erase all local biometric and session records? This action is irreversible.");
    if (!confirmed) return;

    try {
      await invoke("wipe_data", { scope: "all" });
      setExportMessage("All local data has been permanently erased.");
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setExportMessage(`Wipe error: ${errorMsg}`);
    }
  };

  return (
    <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl text-slate-100 max-w-3xl mx-auto shadow-xl">
      <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-2xl font-bold">Data & Privacy Controls</h2>
          <p className="text-sm text-slate-400">
            Local-first, user-owned wellness data. Export or erase anytime.
          </p>
        </div>
        <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold rounded-full">
          100% Offline
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-slate-800/50 border border-slate-700/60 rounded-xl">
          <h3 className="font-semibold text-slate-200 mb-1">Export Full ZIP Archive</h3>
          <p className="text-xs text-slate-400 mb-4">
            Includes metadata.json, CSV tables, tuning profiles, and settings.
          </p>
          <button
            onClick={handleExportZip}
            disabled={isExporting}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-lg text-sm shadow-md transition-all cursor-pointer"
          >
            {isExporting ? "Bundling ZIP..." : "📦 Export Full ZIP"}
          </button>
        </div>

        <div className="p-4 bg-slate-800/50 border border-slate-700/60 rounded-xl">
          <h3 className="font-semibold text-slate-200 mb-1">Export JSON Backup</h3>
          <p className="text-xs text-slate-400 mb-4">
            Single structured JSON file containing all sessions and feedback.
          </p>
          <button
            onClick={handleExportJson}
            disabled={isExporting}
            className="w-full py-2.5 px-4 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-200 font-semibold rounded-lg text-sm transition-all cursor-pointer"
          >
            📄 Export JSON
          </button>
        </div>
      </div>

      {exportMessage && (
        <div className="p-4 mb-6 bg-indigo-950/40 border border-indigo-500/40 rounded-xl text-indigo-200 text-sm">
          {exportMessage}
        </div>
      )}

      <div className="border-t border-slate-800 pt-6">
        <h3 className="font-semibold text-rose-400 mb-2">Danger Zone</h3>
        <p className="text-xs text-slate-400 mb-4">
          Permanently delete local SurrealDB database and personalized tuning weights.
        </p>
        <button
          onClick={handleWipeData}
          className="py-2 px-4 bg-rose-950/60 hover:bg-rose-900 border border-rose-600/40 text-rose-300 font-semibold rounded-lg text-xs transition-all cursor-pointer"
        >
          🗑️ Erase All Local Data
        </button>
      </div>
    </div>
  );
};
