import React from 'react';
import {
  Play,
  Square,
  Activity,
  Sliders,
  Moon,
  Sun,
  Brain,
  Watch,
  Music,
  Radio,
  BarChart2,
} from 'lucide-react';
import { useNeuroStore } from '../store/useNeuroStore';
import { TabType } from '../types';
import { triggerHaptic } from '../utils/haptics';

export const Navbar: React.FC = () => {
  const {
    audio,
    musicPlayer,
    biometrics,
    activeTab,
    theme,
    sessionHistory,
    setActiveTab,
    togglePlay,
    toggleTheme,
    setModalSessionSummary,
  } = useNeuroStore();

  const isHighContrast = theme === 'high_contrast';

  const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: 'dashboard', label: 'Home', icon: Sliders },
    { id: 'music', label: 'Music', icon: Music },
    { id: 'presets', label: 'Presets', icon: Brain },
    { id: 'biologics', label: 'Bio-Sync', icon: Activity },
    { id: 'sleep', label: 'Sleep', icon: Moon },
    { id: 'devices', label: 'Devices', icon: Watch },
  ];

  // Dynamic Bio-Sync Connection Status (compact for mobile-first cleanliness)
  const getBioSyncStatus = () => {
    if (!biometrics.connected) {
      return {
        label: 'Offline',
        shortLabel: 'Offline',
        colorClass: 'text-zinc-400 bg-white/5 border-white/10 hover:bg-white/10',
      };
    }

    if (biometrics.source === 'google_health_connect' || biometrics.source === 'health_connect') {
      return {
        label: 'Health Connect',
        shortLabel: `${biometrics.heartRate} BPM`,
        colorClass: isHighContrast
          ? 'text-emerald-300 bg-zinc-900 border-emerald-400'
          : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20',
      };
    }

    if (biometrics.source === 'gadgetbridge_intent') {
      return {
        label: 'Gadgetbridge',
        shortLabel: `${biometrics.heartRate} BPM`,
        colorClass: isHighContrast
          ? 'text-cyan-300 bg-zinc-900 border-cyan-400'
          : 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20 hover:bg-cyan-500/20',
      };
    }

    if (biometrics.source === 'cmf_ble' || biometrics.source === 'ble_standard') {
      return {
        label: 'Direct BLE',
        shortLabel: `${biometrics.heartRate} BPM`,
        colorClass: isHighContrast
          ? 'text-sky-300 bg-zinc-900 border-sky-400'
          : 'text-sky-400 bg-sky-500/10 border-sky-500/20 hover:bg-sky-500/20',
      };
    }

    return {
      label: 'Live Stream',
      shortLabel: `${biometrics.heartRate} BPM`,
      colorClass: 'text-zinc-300 bg-white/5 border-white/10 hover:bg-white/10',
    };
  };

  const bioSync = getBioSyncStatus();

  const handleTabClick = (tabId: TabType) => {
    triggerHaptic('light');
    setActiveTab(tabId);
  };

  const handleOpenLatestSession = () => {
    triggerHaptic('medium');
    if (sessionHistory.length > 0) {
      setModalSessionSummary(sessionHistory[0]);
    } else {
      useNeuroStore.getState().finalizeActiveSession();
    }
  };

  return (
    <header
      className={`sticky top-0 z-40 w-full backdrop-blur-2xl transition-colors shadow-sm ${
        isHighContrast
          ? 'bg-zinc-950/95 border-b border-zinc-800'
          : 'bg-zinc-950/60 border-b border-white/5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 sm:py-2.5">
        {/* Mobile-First Header Bar: Clean, Minimalist, Fewer Components */}
        <div className="flex items-center justify-between gap-2.5 min-h-[44px]">
          {/* Brand Mark */}
          <div
            className="flex items-center gap-2 cursor-pointer select-none group"
            onClick={() => handleTabClick('dashboard')}
          >
            <div
              className={`relative flex items-center justify-center w-8 h-8 rounded-xl border shrink-0 shadow-sm transition-transform active:scale-95 ${
                isHighContrast
                  ? 'bg-zinc-900 border-emerald-400 text-emerald-300'
                  : 'bg-white/10 border-white/10 text-emerald-300'
              }`}
            >
              <Brain className="w-4 h-4" />
              {(audio.isPlaying || musicPlayer.isPlaying) && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold tracking-tight text-zinc-100 group-hover:text-emerald-300 transition-colors">
                NeuroLoop
              </span>
              {(audio.isPlaying || musicPlayer.isPlaying) && (
                <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400/90 pl-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="hidden xs:inline">
                    {audio.isPlaying ? `${audio.currentBeatHz.toFixed(1)}Hz` : 'Audio'}
                  </span>
                </span>
              )}
            </div>
          </div>

          {/* Clean Mobile-First Right Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Bio / Device Status Indicator Pill */}
            <button
              onClick={() => handleTabClick('devices')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 min-h-[44px] rounded-xl text-xs font-mono font-medium transition-all cursor-pointer active:scale-95 touch-manipulation border ${bioSync.colorClass}`}
              title={`Device: ${bioSync.label} (Tap to manage)`}
            >
              <div className="relative flex items-center justify-center">
                <Radio className="w-3.5 h-3.5 shrink-0" />
                {biometrics.connected && (
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                )}
              </div>
              <span className="font-semibold text-[11px] whitespace-nowrap">{bioSync.shortLabel}</span>
            </button>

            {/* Insights Button */}
            <button
              onClick={handleOpenLatestSession}
              className={`flex items-center justify-center gap-1.5 p-2 sm:px-3 sm:py-1.5 min-h-[44px] min-w-[44px] rounded-xl text-xs font-medium border transition-all cursor-pointer active:scale-95 touch-manipulation ${
                isHighContrast
                  ? 'bg-zinc-900 border-zinc-700 text-zinc-200 hover:bg-zinc-800'
                  : 'bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300 backdrop-blur-sm'
              }`}
              title="Session Insights & History"
              aria-label="View Insights"
            >
              <BarChart2 className="w-4 h-4 text-zinc-400 shrink-0" />
              <span className="hidden sm:inline font-mono text-[11px] font-semibold whitespace-nowrap">Insights</span>
            </button>

            {/* Theme Switcher Button */}
            <button
              onClick={toggleTheme}
              className={`flex items-center justify-center p-2 min-h-[44px] min-w-[44px] rounded-xl text-xs font-medium border transition-all cursor-pointer active:scale-95 touch-manipulation ${
                isHighContrast
                  ? 'bg-amber-400/20 border-amber-400/50 text-amber-300'
                  : 'bg-white/5 hover:bg-white/10 border-white/10 text-zinc-400 hover:text-zinc-200 backdrop-blur-sm'
              }`}
              title={`Toggle Theme: Currently ${isHighContrast ? 'High Contrast' : 'Deep Space'}`}
              aria-label="Toggle Theme"
            >
              {isHighContrast ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Desktop-only Master Play/Stop Button */}
            <button
              onClick={() => {
                triggerHaptic('heavy');
                togglePlay();
              }}
              className={`hidden sm:flex items-center gap-2 px-3.5 py-1.5 min-h-[44px] rounded-xl font-semibold text-xs transition-all shadow-sm active:scale-95 cursor-pointer touch-manipulation whitespace-nowrap ${
                audio.isPlaying
                  ? 'bg-rose-500/15 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold shadow-emerald-500/20'
              }`}
            >
              {audio.isPlaying ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current shrink-0" />
                  <span>Stop Beats</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current shrink-0" />
                  <span>Start Beats</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Desktop / Tablet Segmented Tabs (BottomNav handles mobile view) */}
        <div className="hidden sm:flex items-center gap-1.5 mt-2.5 pt-2.5 border-t border-white/5 overflow-x-auto scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 min-h-[38px] rounded-xl text-xs font-medium transition-all cursor-pointer whitespace-nowrap active:scale-95 border ${
                  isActive
                    ? isHighContrast
                      ? 'bg-zinc-800 text-emerald-300 border-emerald-400/50 font-semibold'
                      : 'bg-white/10 text-emerald-400 border-white/10 shadow-sm backdrop-blur-md font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200 border-transparent hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
