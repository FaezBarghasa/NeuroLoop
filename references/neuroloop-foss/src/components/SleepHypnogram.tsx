import React, { useState } from 'react';
import { useNeuroStore } from '../store/useNeuroStore';
import {
  Moon,
  Heart,
  RefreshCw,
  Sparkles,
  Clock,
  Waves,
  Download,
  Share2,
  Copy,
  Check,
  FileJson,
  X,
  ShieldCheck,
} from 'lucide-react';
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Line,
  ComposedChart,
  Area,
} from 'recharts';
import { triggerHaptic } from '../utils/haptics';

export const SleepHypnogram: React.FC = () => {
  const { sleepData, biometrics, fetchSleepHistoryBle } = useNeuroStore();
  const [showExportModal, setShowExportModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const stageLabels: Record<number, string> = {
    4: 'Awake',
    3: 'REM',
    2: 'Light',
    1: 'Deep',
  };

  const totalRecords = sleepData.length;
  const deepCount = sleepData.filter((r) => r.stage === 'Deep').length;
  const remCount = sleepData.filter((r) => r.stage === 'REM').length;
  const lightCount = sleepData.filter((r) => r.stage === 'Light').length;
  const awakeCount = sleepData.filter((r) => r.stage === 'Awake').length;

  const deepPercent = Math.round((deepCount / totalRecords) * 100);
  const remPercent = Math.round((remCount / totalRecords) * 100);
  const lightPercent = Math.round((lightCount / totalRecords) * 100);
  const awakePercent = Math.round((awakeCount / totalRecords) * 100);

  const minHR = Math.min(...sleepData.map((d) => d.hr));
  const maxHR = Math.max(...sleepData.map((d) => d.hr));
  const avgHR = Math.round(sleepData.reduce((acc, d) => acc + d.hr, 0) / totalRecords);
  const avgSpo2 = (sleepData.reduce((acc, d) => acc + d.spo2, 0) / totalRecords).toFixed(1);

  // Generate standardized JSON export for Google Health Connect, Gadgetbridge, and Apple Health
  const generateExportJson = () => {
    const exportPayload = {
      $schema: 'https://healthdata.org/schemas/v1/sleep-session.json',
      metadata: {
        application: 'NeuroLoop Closed-Loop Entrainment Bio-Engine',
        version: '2.2.0',
        exportTimestamp: new Date().toISOString(),
        compatibility: [
          'Google Health Connect (androidx.health.connect.client.records.SleepSessionRecord)',
          'Gadgetbridge JSON/SQLite Exporter',
          'Apple HealthKit (HKCategoryTypeIdentifierSleepAnalysis)',
          'OpenHealth Biometric Standard',
        ],
        device: {
          name: biometrics.deviceName,
          source: biometrics.source,
          batteryLevelPct: biometrics.batteryPercent,
          samplingRateHz: 1,
        },
      },
      sessionSummary: {
        sessionType: 'NOCTURNAL_SLEEP',
        startTime: '23:00:00Z',
        endTime: '07:00:00Z',
        durationMinutes: 470,
        sleepEfficiencyScore: 91,
        stagesSummary: {
          deepPercentage: deepPercent,
          remPercentage: remPercent,
          lightPercentage: lightPercent,
          awakePercentage: awakePercent,
          deepDurationMinutes: Math.round((deepPercent / 100) * 470),
          remDurationMinutes: Math.round((remPercent / 100) * 470),
        },
        biometricAverages: {
          restingHeartRateBpm: minHR,
          maxHeartRateBpm: maxHR,
          meanHeartRateBpm: avgHR,
          meanOxygenSaturationSpo2: parseFloat(avgSpo2),
          baselineHrvRmssdMs: biometrics.baseline7DayHRV,
          vagalNadirTimestamp: '02:40:00Z',
        },
      },
      timeSeriesEpochs: sleepData.map((record) => ({
        timestamp: `2026-03-09T${record.time}:00Z`,
        timeFormatted: record.time,
        sleepStage: record.stage.toUpperCase(),
        sleepStageNumeric: record.stageNumeric,
        heartRateBpm: record.hr,
        oxygenSaturationPct: record.spo2,
      })),
    };

    return JSON.stringify(exportPayload, null, 2);
  };

  const handleDownloadJson = () => {
    triggerHaptic('success');
    const jsonStr = generateExportJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const dateStr = new Date().toISOString().split('T')[0];

    const link = document.createElement('a');
    link.href = url;
    link.download = `neuroloop-sleep-session-${dateStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyJson = () => {
    triggerHaptic('light');
    const jsonStr = generateExportJson();
    navigator.clipboard.writeText(jsonStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* Header Card */}
      <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-semibold text-zinc-100">
                  Sleep Tracker
                </h3>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                View and export your overnight sleep stages and heart rate.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                triggerHaptic('medium');
                setShowExportModal(true);
              }}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-emerald-300 text-xs font-mono font-semibold border border-white/10 transition-all shadow-sm cursor-pointer select-none active:scale-95"
              title="Export session data"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>

            <button
              onClick={() => {
                triggerHaptic('light');
                fetchSleepHistoryBle();
              }}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-mono text-zinc-200 border border-white/10 transition-colors shadow-sm cursor-pointer select-none active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
              <span>Sync Device</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sleep KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1.5">
            <span className="flex items-center gap-1.5 font-medium">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              Total Sleep
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-100">7h 50m</div>
          <p className="text-[11px] text-zinc-500 mt-1 font-mono">23:00 - 07:00</p>
        </div>

        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1.5">
            <span className="flex items-center gap-1.5 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              Deep Sleep
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-sky-400">{deepPercent}%</div>
          <p className="text-[11px] text-zinc-500 mt-1 font-mono">Good recovery</p>
        </div>

        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1.5">
            <span className="flex items-center gap-1.5 font-medium">
              <Heart className="w-3.5 h-3.5 text-rose-400" />
              Resting Pulse
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-rose-400">
            {minHR} <span className="text-xs font-normal text-zinc-400">BPM</span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1 font-mono">Lowest point at 02:40</p>
        </div>

        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1.5">
            <span className="flex items-center gap-1.5 font-medium">
              <Waves className="w-3.5 h-3.5 text-teal-400" />
              Blood Oxygen
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-teal-300">{avgSpo2}%</div>
          <p className="text-[11px] text-zinc-500 mt-1 font-mono">Stable overnight</p>
        </div>
      </div>

      {/* Main Hypnogram Recharts Plot */}
      <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
          <div>
            <h4 className="text-xs font-semibold tracking-wide uppercase text-zinc-300">
              Overnight Sleep Graph
            </h4>
            <p className="text-[11px] text-zinc-500">
              Your sleep stages and heart rate.
            </p>
          </div>

          {/* Clean Legend */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-zinc-400">
              <span className="w-2 h-2 rounded-full bg-[#f43f5e]" /> Awake
            </span>
            <span className="flex items-center gap-1.5 text-zinc-400">
              <span className="w-2 h-2 rounded-full bg-[#c084fc]" /> REM
            </span>
            <span className="flex items-center gap-1.5 text-zinc-400">
              <span className="w-2 h-2 rounded-full bg-[#818cf8]" /> Light
            </span>
            <span className="flex items-center gap-1.5 text-zinc-400">
              <span className="w-2 h-2 rounded-full bg-[#38bdf8]" /> Deep
            </span>
          </div>
        </div>

        <div className="h-56 sm:h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={sleepData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <XAxis dataKey="time" stroke="#52525b" fontSize={9} tickLine={false} />
              <YAxis
                yAxisId="stages"
                domain={[0.8, 4.2]}
                ticks={[1, 2, 3, 4]}
                tickFormatter={(val: number) => stageLabels[val] || ''}
                stroke="#52525b"
                fontSize={10}
                tickLine={false}
              />
              <YAxis
                yAxisId="hr"
                orientation="right"
                domain={[45, 95]}
                stroke="#f43f5e"
                fontSize={9}
                tickLine={false}
                unit=" bpm"
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl shadow-xl font-mono text-xs space-y-1">
                        <div className="text-zinc-200 font-semibold">{data.time}</div>
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-400">Stage:</span>
                          <span className="font-bold text-indigo-300">{data.stage}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-400">HR:</span>
                          <span className="text-rose-400">{data.hr} BPM</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-400">SpO2:</span>
                          <span className="text-teal-300">{data.spo2}%</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                yAxisId="stages"
                type="stepAfter"
                dataKey="stageNumeric"
                stroke="#818cf8"
                strokeWidth={2}
                fill="#818cf8"
                fillOpacity={0.12}
                name="Sleep Stage"
              />
              <Line
                yAxisId="hr"
                type="monotone"
                dataKey="hr"
                stroke="#f43f5e"
                strokeWidth={1.5}
                dot={{ r: 2, fill: '#f43f5e' }}
                name="Heart Rate"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Stage distribution bar */}
        <div className="mt-4 pt-3 border-t border-zinc-800/60">
          <div className="flex flex-col sm:flex-row sm:justify-between text-xs text-zinc-400 mb-1.5 gap-1">
            <span>Sleep Stage Distribution</span>
            <span className="font-mono text-[11px]">
              Deep ({deepPercent}%) • Light ({lightPercent}%) • REM ({remPercent}%) • Awake ({awakePercent}%)
            </span>
          </div>
          <div className="flex h-2 rounded-full overflow-hidden bg-zinc-800 w-full">
            <div style={{ width: `${deepPercent}%` }} className="bg-[#38bdf8]" title={`Deep: ${deepPercent}%`} />
            <div style={{ width: `${lightPercent}%` }} className="bg-[#818cf8]" title={`Light: ${lightPercent}%`} />
            <div style={{ width: `${remPercent}%` }} className="bg-[#c084fc]" title={`REM: ${remPercent}%`} />
            <div style={{ width: `${awakePercent}%` }} className="bg-[#f43f5e]" title={`Awake: ${awakePercent}%`} />
          </div>
        </div>
      </div>

      {/* Export Session JSON Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                  <FileJson className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-zinc-100">
                    Export Session Biometric Data
                  </h3>
                  <p className="text-[11px] text-zinc-400 font-mono">
                    OpenHealth & Google Health Connect Standard Schema
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Compatibility Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className="p-2.5 bg-zinc-950/60 rounded-xl border border-zinc-800 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-zinc-300">Health Connect Ready</span>
              </div>
              <div className="p-2.5 bg-zinc-950/60 rounded-xl border border-zinc-800 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="text-zinc-300">Gadgetbridge JSON</span>
              </div>
              <div className="p-2.5 bg-zinc-950/60 rounded-xl border border-zinc-800 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
                <span className="text-zinc-300">Apple HealthKit Staging</span>
              </div>
            </div>

            {/* JSON Code Preview */}
            <div className="flex-1 overflow-auto rounded-xl bg-zinc-950 border border-zinc-800 p-3.5 text-xs font-mono text-zinc-300 scrollbar-thin">
              <pre className="whitespace-pre">{generateExportJson()}</pre>
            </div>

            {/* Bottom Modal Actions */}
            <div className="flex items-center justify-between gap-3 pt-2 border-t border-zinc-800">
              <div className="text-[11px] font-mono text-zinc-500">
                {sleepData.length} records • 470 min total
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyJson}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 transition-all cursor-pointer active:scale-95"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy JSON'}</span>
                </button>

                <button
                  onClick={handleDownloadJson}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .json</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
