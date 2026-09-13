import React, { useState } from 'react';
import { useNeuroStore } from '../store/useNeuroStore';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import {
  Activity,
  Heart,
  TrendingDown,
  TrendingUp,
  Sparkles,
  Download,
  Copy,
  Check,
  X,
  Zap,
  ShieldCheck,
  Brain,
  Calendar,
  FileSpreadsheet,
  FileCode,
  RefreshCw,
} from 'lucide-react';
import { SessionSummaryData } from '../types';
import { triggerHaptic } from '../utils/haptics';

export const SessionSummaryModal: React.FC = () => {
  const {
    modalSessionSummary,
    setModalSessionSummary,
    sessionHistory,
    exportSessionJson,
    exportSessionCsv,
    exportAllSessionsJson,
    exportAllSessionsCsv,
    applyTuningRecommendation,
    tuneProfileFromAllHistory,
    personalizedTuning,
    theme,
  } = useNeuroStore();

  const [activeTab, setActiveTab] = useState<'timeline' | 'tuning' | 'raw_export' | 'history'>('timeline');
  const [copied, setCopied] = useState<boolean>(false);
  const [appliedTuning, setAppliedTuning] = useState<boolean>(false);
  const [appliedAllTuning, setAppliedAllTuning] = useState<boolean>(false);
  const [selectedHistoricalId, setSelectedHistoricalId] = useState<string | null>(null);

  if (!modalSessionSummary) return null;

  const session: SessionSummaryData =
    (selectedHistoricalId && sessionHistory.find((s) => s.id === selectedHistoricalId)) ||
    modalSessionSummary;

  const isHighContrast = theme === 'high_contrast';

  const handleCopyJson = () => {
    triggerHaptic('light');
    const json = exportSessionJson(session);
    navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJson = () => {
    triggerHaptic('success');
    const json = exportSessionJson(session);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `neuroloop-session-${session.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadCsv = () => {
    triggerHaptic('success');
    const csv = exportSessionCsv(session);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `neuroloop-session-${session.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadAllJson = () => {
    triggerHaptic('success');
    const json = exportAllSessionsJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `neuroloop-all-sessions-telemetry.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadAllCsv = () => {
    triggerHaptic('success');
    const csv = exportAllSessionsCsv();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `neuroloop-all-sessions-summary.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleApplyTuning = () => {
    if (session.tuningRecommendation) {
      applyTuningRecommendation(session.tuningRecommendation);
      setAppliedTuning(true);
      setTimeout(() => setAppliedTuning(false), 3000);
    }
  };

  const handleTuneFromAllHistory = () => {
    tuneProfileFromAllHistory();
    setAppliedAllTuning(true);
    setTimeout(() => setAppliedAllTuning(false), 3000);
  };

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}m ${secs > 0 ? `${secs}s` : ''}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div
        className={`w-full max-w-4xl my-auto rounded-3xl border shadow-2xl backdrop-blur-2xl overflow-hidden transition-all ${
          isHighContrast
            ? 'bg-zinc-950 border-zinc-700 text-zinc-100 ring-2 ring-emerald-400/50 shadow-black'
            : 'bg-zinc-900/95 border-zinc-800 text-zinc-100 shadow-2xl shadow-black/80'
        }`}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-white/5 bg-white/5 backdrop-blur-md">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-400 shrink-0">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-bold text-zinc-100 tracking-tight">
                  Session Summary
                </h2>
                <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                  {session.presetName}
                </span>
              </div>
              <p className="text-xs text-zinc-400 flex items-center gap-2 mt-0.5">
                <span>{session.formattedDate}</span>
                <span>•</span>
                <span>Duration: {formatDuration(session.durationSec)}</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => setModalSessionSummary(null)}
            className="p-2.5 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer"
            title="Close summary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-white/5 bg-white/5 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('timeline')}
            className={`pb-3 px-3 text-xs font-bold cursor-pointer border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'timeline'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Activity className="w-4 h-4" />
            Session Graph
          </button>

          <button
            onClick={() => setActiveTab('tuning')}
            className={`pb-3 px-3 text-xs font-bold cursor-pointer border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'tuning'
                ? 'border-indigo-400 text-indigo-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Smart Tuning
          </button>

          <button
            onClick={() => setActiveTab('raw_export')}
            className={`pb-3 px-3 text-xs font-bold cursor-pointer border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'raw_export'
                ? 'border-teal-400 text-teal-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Download className="w-4 h-4" />
            Export Data
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`pb-3 px-3 text-xs font-bold cursor-pointer border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'history'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            History ({sessionHistory.length})
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-5 sm:p-6 space-y-6 max-h-[72vh] overflow-y-auto">
          {/* Key Metrics Bento Grid (always visible) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Stress Delta */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-zinc-400 font-medium">Stress Score</span>
                <div className={`p-1.5 rounded-lg ${session.stressDelta <= 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'}`}>
                  {session.stressDelta <= 0 ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                </div>
              </div>
              <div className="flex items-end gap-2">
                <div className="text-2xl font-bold font-mono text-zinc-100">
                  {session.stressDelta > 0 ? `+${session.stressDelta}%` : `${session.stressDelta}%`}
                </div>
                {sessionHistory.length > 1 && (
                  <div className="text-[10px] font-mono text-zinc-500 mb-1">
                    avg {Math.round(sessionHistory.reduce((acc, s) => acc + s.stressDelta, 0) / sessionHistory.length)}%
                  </div>
                )}
              </div>
            </div>

            {/* HRV Recovery */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-zinc-400 font-medium">HRV Trend</span>
                <div className={`p-1.5 rounded-lg ${session.hrvDelta >= 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'}`}>
                  <Activity className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-end gap-2">
                <div className="text-2xl font-bold font-mono text-emerald-400">
                  {session.hrvDelta >= 0 ? `+${session.hrvDelta} ms` : `${session.hrvDelta} ms`}
                </div>
                {sessionHistory.length > 1 && (
                  <div className="text-[10px] font-mono text-zinc-500 mb-1">
                    avg +{Math.round(sessionHistory.reduce((acc, s) => acc + s.hrvDelta, 0) / sessionHistory.length)}
                  </div>
                )}
              </div>
            </div>

            {/* Heart Rate */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-zinc-400 font-medium">Avg Heart Rate</span>
                <div className="p-1.5 rounded-lg bg-rose-500/15 text-rose-400">
                  <Heart className="w-4 h-4 fill-current" />
                </div>
              </div>
              <div className="flex items-end gap-2">
                <div className="text-2xl font-bold font-mono text-zinc-100">
                  {session.avgHeartRate} <span className="text-sm font-normal text-zinc-400">BPM</span>
                </div>
                {sessionHistory.length > 1 && (
                  <div className="text-[10px] font-mono text-zinc-500 mb-1">
                    avg {Math.round(sessionHistory.reduce((acc, s) => acc + s.avgHeartRate, 0) / sessionHistory.length)}
                  </div>
                )}
              </div>
            </div>

            {/* Entrainment Resonance Score */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-zinc-400 font-medium">Relaxation Score</span>
                <div className="p-1.5 rounded-lg bg-indigo-500/15 text-indigo-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-end gap-2">
                <div className="text-2xl font-bold font-mono text-indigo-300">
                  {session.entrainmentResonanceScore}%
                </div>
                {sessionHistory.length > 1 && (
                  <div className="text-[10px] font-mono text-zinc-500 mb-1">
                    avg {Math.round(sessionHistory.reduce((acc, s) => acc + s.entrainmentResonanceScore, 0) / sessionHistory.length)}%
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* TAB 1: Correlated Timeline Graph */}
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-zinc-200">
                    Audio Frequency Shift vs Biometric Response Curve
                  </h4>
                  <p className="text-xs text-zinc-400">
                    Dual-axis timeline correlating target beat frequency (Hz) with real-time biometric stress levels (%).
                  </p>
                </div>
              </div>

              {/* Recharts Dual-Axis Graph */}
              <div className="h-64 sm:h-72 w-full bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-3 sm:p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={session.points} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis
                      dataKey="timeFormatted"
                      stroke="#71717a"
                      fontSize={11}
                      tickLine={false}
                    />
                    {/* Left Axis: Beat Hz */}
                    <YAxis
                      yAxisId="left"
                      stroke="#38bdf8"
                      fontSize={11}
                      domain={[0, 'auto']}
                      tickFormatter={(v) => `${v}Hz`}
                    />
                    {/* Right Axis: Stress Index % & BPM */}
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke="#f43f5e"
                      fontSize={11}
                      domain={[0, 100]}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#09090b',
                        borderColor: '#3f3f46',
                        borderRadius: '0.75rem',
                        fontSize: '12px',
                        color: '#f4f4f5',
                      }}
                      labelFormatter={(label) => `Session Time: ${label}`}
                      formatter={(val: any, name: any) => {
                        if (val === undefined) return ['', ''];
                        if (name === 'Target Beat (Hz)') return [`${val} Hz`, name];
                        if (name === 'Stress Index') return [`${val}%`, name];
                        if (name === 'Heart Rate') return [`${val} BPM`, name];
                        if (name === 'HRV RMSSD') return [`${val} ms`, name];
                        return [String(val), name || ''];
                      }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                      iconType="circle"
                    />
                    <Area
                      yAxisId="right"
                      type="monotone"
                      dataKey="stressIndex"
                      name="Stress Index"
                      fill="#f43f5e"
                      fillOpacity={0.15}
                      stroke="#f43f5e"
                      strokeWidth={2}
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="beatHz"
                      name="Target Beat (Hz)"
                      stroke="#38bdf8"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: '#38bdf8' }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="heartRate"
                      name="Heart Rate"
                      stroke="#fb7185"
                      strokeDasharray="4 4"
                      strokeWidth={1.5}
                      dot={false}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="hrvRmssd"
                      name="HRV RMSSD"
                      stroke="#34d399"
                      strokeWidth={1.5}
                      dot={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              <div className="flex items-center justify-between text-xs text-zinc-400 bg-zinc-950/40 p-3 rounded-xl border border-zinc-800">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                  Target Entrainment Beat (Left Axis)
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  Biometric Stress & Autonomic Strain (Right Axis)
                </span>
              </div>
            </div>
          )}

          {/* TAB 2: Tune Effectiveness (Bio-Data Engine) */}
          {activeTab === 'tuning' && (
            <div className="space-y-4">
              {/* Single Session Recommendation Card */}
              <div className="p-5 rounded-2xl bg-indigo-950/30 border border-indigo-500/30">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-indigo-200">
                        Session-Specific Tuning Recommendation
                      </h4>
                      <p className="text-xs text-zinc-400">
                        Derived from immediate response curve of the active session.
                      </p>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-mono font-bold">
                    +{session.tuningRecommendation?.efficiencyGainPercent || 24}% Gain
                  </span>
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-950/60 p-3.5 rounded-xl border border-zinc-800 mb-4">
                  {session.tuningRecommendation?.insightText ||
                    'Autonomic data indicates high parasympathetic sensitivity. Tuning frequency glide duration to 4.2s and carrier to 208Hz will optimize autonomic lock.'}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 text-xs">
                  <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800">
                    <span className="text-zinc-400 block mb-0.5">Tuned Carrier Frequency</span>
                    <span className="text-base font-mono font-bold text-indigo-300">
                      {session.tuningRecommendation?.optimalCarrierHz || 208} Hz
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800">
                    <span className="text-zinc-400 block mb-0.5">Recommended Resonance Band</span>
                    <span className="text-base font-mono font-bold text-emerald-300">
                      {session.tuningRecommendation?.recommendedBand || 'Alpha'} ({session.tuningRecommendation?.optimalBeatHz || 10} Hz)
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800">
                    <span className="text-zinc-400 block mb-0.5">Autonomic Sensitivity</span>
                    <span className="text-base font-mono font-bold text-amber-300">
                      High (0.85 Factor)
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleApplyTuning}
                  className={`w-full py-3 px-4 rounded-xl font-bold text-xs cursor-pointer transition-all flex items-center justify-center gap-2 active:scale-98 shadow-lg ${
                    appliedTuning
                      ? 'bg-emerald-500 text-zinc-950'
                      : 'bg-indigo-500 hover:bg-indigo-400 text-white shadow-indigo-950/50'
                  }`}
                >
                  {appliedTuning ? (
                    <>
                      <Check className="w-4 h-4" />
                      Tuned Parameters Applied to Sound Engine!
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 fill-current" />
                      Apply Session Tuning to Active Soundstage
                    </>
                  )}
                </button>
              </div>

              {/* Global History Auto-Calibration Card */}
              <div className="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      <RefreshCw className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-emerald-200">
                        Aggregate Historical Efficacy Calibration
                      </h4>
                      <p className="text-xs text-zinc-400">
                        Synthesizes all {sessionHistory.length} recorded sessions to tune global carrier and band filters.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 text-xs">
                  <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800">
                    <span className="text-zinc-400 block mb-0.5">Analyzed Sessions</span>
                    <span className="text-base font-mono font-bold text-zinc-100">
                      {personalizedTuning.sessionsAnalyzed} sessions
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800">
                    <span className="text-zinc-400 block mb-0.5">Total Telemetry Time</span>
                    <span className="text-base font-mono font-bold text-teal-300">
                      {personalizedTuning.totalDurationMinutes} minutes
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800">
                    <span className="text-zinc-400 block mb-0.5">Calibrated Carrier</span>
                    <span className="text-base font-mono font-bold text-emerald-300">
                      {personalizedTuning.optimalCarrierHz} Hz ({personalizedTuning.preferredBeatBand})
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleTuneFromAllHistory}
                  className={`w-full py-3 px-4 rounded-xl font-bold text-xs cursor-pointer transition-all flex items-center justify-center gap-2 active:scale-98 shadow-lg ${
                    appliedAllTuning
                      ? 'bg-emerald-500 text-zinc-950'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold shadow-emerald-950/50'
                  }`}
                >
                  {appliedAllTuning ? (
                    <>
                      <Check className="w-4 h-4" />
                      Global Multi-Session Tuning Calibrated!
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 fill-current" />
                      Auto-Calibrate Audio Engine from All Historical Data
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: Raw Export & Data Schemas */}
          {activeTab === 'raw_export' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-zinc-200">Export Session Telemetry</h4>
                  <p className="text-xs text-zinc-400">
                    OpenHealth & Google Health Connect compliant JSON and CSV schemas.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={handleDownloadJson}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold cursor-pointer transition-all active:scale-95"
                    title="Download active session JSON"
                  >
                    <FileCode className="w-3.5 h-3.5" />
                    Session JSON
                  </button>

                  <button
                    onClick={handleDownloadCsv}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/30 text-teal-300 text-xs font-bold cursor-pointer transition-all active:scale-95"
                    title="Download active session CSV"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    Session CSV
                  </button>

                  <button
                    onClick={handleDownloadAllJson}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 text-xs font-bold cursor-pointer transition-all active:scale-95"
                    title="Export all historical sessions JSON"
                  >
                    <Download className="w-3.5 h-3.5" />
                    All ({sessionHistory.length}) JSON
                  </button>

                  <button
                    onClick={handleDownloadAllCsv}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-bold cursor-pointer transition-all active:scale-95"
                    title="Export all historical sessions CSV"
                  >
                    <Download className="w-3.5 h-3.5" />
                    All CSV
                  </button>

                  <button
                    onClick={handleCopyJson}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium cursor-pointer transition-all border border-zinc-700"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* JSON Preview Frame */}
              <div className="bg-zinc-950 rounded-2xl p-4 border border-zinc-800 font-mono text-[11px] text-zinc-300 overflow-x-auto max-h-56 leading-relaxed">
                <pre>{exportSessionJson(session)}</pre>
              </div>
            </div>
          )}

          {/* TAB 4: Session History List */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-zinc-200">Historical Sessions & Bio-Responses</h4>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadAllJson}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer underline decoration-emerald-500/40"
                  >
                    Export All JSON
                  </button>
                  <span className="text-zinc-600">•</span>
                  <button
                    onClick={handleDownloadAllCsv}
                    className="text-xs text-teal-400 hover:text-teal-300 font-semibold cursor-pointer underline decoration-teal-500/40"
                  >
                    Export All CSV
                  </button>
                </div>
              </div>

              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {sessionHistory.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => {
                      setSelectedHistoricalId(s.id);
                      setActiveTab('timeline');
                    }}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                      session.id === s.id
                        ? 'bg-emerald-500/10 border-emerald-500/40 ring-1 ring-emerald-500/30'
                        : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-zinc-200">{s.presetName}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                          {s.presetCategory}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        {s.formattedDate} • {formatDuration(s.durationSec)}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 text-right">
                      <div>
                        <span className="text-xs font-bold font-mono text-emerald-400 block">
                          {s.stressDelta}% stress
                        </span>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          +{s.hrvDelta}ms HRV
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-indigo-300 px-2 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                        {s.entrainmentResonanceScore}% lock
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-white/5 bg-white/5 flex items-center justify-between gap-3 backdrop-blur-md">
          <span className="text-[10px] text-zinc-500 font-mono">
            NeuroLoop Data Insights
          </span>
          <button
            onClick={() => setModalSessionSummary(null)}
            className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-zinc-100 font-bold text-xs cursor-pointer transition-all active:scale-95 border border-white/10"
          >
            Close Summary
          </button>
        </div>
      </div>
    </div>
  );
};
