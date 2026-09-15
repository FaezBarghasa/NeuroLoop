import React, { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";
import { Download, FileJson, Trash2, ShieldCheck, Database } from "lucide-react";
import { triggerHaptic } from "../utils/haptics";

export const DataExport: React.FC = () => {
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  const handleExportZip = async () => {
    triggerHaptic('medium');
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
      triggerHaptic('success');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setExportMessage(`Export error: ${errorMsg}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportJson = async () => {
    triggerHaptic('medium');
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
      triggerHaptic('success');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setExportMessage(`Export error: ${errorMsg}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleWipeData = async () => {
    triggerHaptic('heavy');
    const confirmed = window.confirm("Are you sure you want to erase all local biometric and session records? This action is irreversible.");
    if (!confirmed) return;

    try {
      await invoke("wipe_data", { scope: "all" });
      setExportMessage("All local data has been permanently erased.");
      triggerHaptic('success');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setExportMessage(`Wipe error: ${errorMsg}`);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Deck */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 shrink-0">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-zinc-100 tracking-tight">
              Data & Privacy Controls
            </h2>
            <p className="text-xs text-zinc-400">
              Local-first, user-owned biometric and session storage.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono self-start sm:self-center">
          <ShieldCheck className="w-4 h-4" />
          <span>100% Offline / Local</span>
        </div>
      </div>

      {/* Export Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 sm:p-5 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2 text-zinc-200 font-bold text-sm">
              <Download className="w-4 h-4 text-indigo-400" />
              <span>Full ZIP Archive</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Includes metadata.json, CSV tables, personalized tuning profiles, and audio state settings.
            </p>
          </div>
          <button
            onClick={handleExportZip}
            disabled={isExporting}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl text-xs shadow-md transition-all cursor-pointer active:scale-95 touch-manipulation min-h-[44px] flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? "Bundling ZIP..." : "Export Full ZIP"}</span>
          </button>
        </div>

        <div className="p-4 sm:p-5 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2 text-zinc-200 font-bold text-sm">
              <FileJson className="w-4 h-4 text-emerald-400" />
              <span>JSON Raw Backup</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Single structured JSON file containing all sessions, hypnograms, and self-tuning metrics.
            </p>
          </div>
          <button
            onClick={handleExportJson}
            disabled={isExporting}
            className="w-full py-2.5 px-4 bg-white/10 hover:bg-white/20 border border-white/10 disabled:opacity-50 text-zinc-100 font-semibold rounded-xl text-xs transition-all cursor-pointer active:scale-95 touch-manipulation min-h-[44px] flex items-center justify-center gap-2"
          >
            <FileJson className="w-4 h-4" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {exportMessage && (
        <div className="p-4 bg-indigo-950/40 border border-indigo-500/40 rounded-2xl text-indigo-200 text-xs font-mono">
          {exportMessage}
        </div>
      )}

      {/* Danger Zone */}
      <div className="p-4 sm:p-5 bg-rose-950/15 border border-rose-500/20 rounded-2xl backdrop-blur-md space-y-3">
        <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
          <Trash2 className="w-4 h-4" />
          <span>Danger Zone</span>
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Permanently delete local database records, session history, and personalized tuning weights.
        </p>
        <button
          onClick={handleWipeData}
          className="py-2.5 px-4 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-bold rounded-xl text-xs transition-all cursor-pointer active:scale-95 touch-manipulation min-h-[44px] flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          <span>Erase All Local Data</span>
        </button>
      </div>
    </div>
  );
};
