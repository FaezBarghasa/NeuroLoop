import React, { useEffect } from 'react';
import { useNeuroStore } from './store/useNeuroStore';
import { Navbar } from './components/Navbar';
import { BioAlertBanner } from './components/BioAlertBanner';
import { SessionSummaryModal } from './components/SessionSummaryModal';
import { FocusModeTimer } from './components/FocusModeTimer';
import { AudioOscilloscope } from './components/AudioOscilloscope';
import { AudioEnginePanel } from './components/AudioEnginePanel';
import { BioLogicClosedLoop } from './components/BioLogicClosedLoop';
import { SleepHypnogram } from './components/SleepHypnogram';
import { PresetManager } from './components/PresetManager';
import { CarrierMusicPlayer } from './components/CarrierMusicPlayer';
import { MobileQuickPlayer } from './components/MobileQuickPlayer';
import { BottomNav } from './components/BottomNav';
import { DeviceManagerPanel } from './components/DeviceManagerPanel';

export default function App() {
  const { activeTab, simulateBiometricTick, theme } = useNeuroStore();

  const isHighContrast = theme === 'high_contrast';

  // Background biometric telemetry tick (every 3.5 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      simulateBiometricTick();
    }, 3500);

    return () => clearInterval(interval);
  }, [simulateBiometricTick]);

  return (
    <div
      className={`min-h-screen relative flex flex-col antialiased pb-safe transition-colors duration-500 overflow-hidden ${
        isHighContrast
          ? 'bg-black text-zinc-50'
          : 'bg-zinc-950 text-zinc-100'
      }`}
    >
      {/* Background Soft Glow Orbs for Glassmorphism */}
      {!isHighContrast && (
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-indigo-900/20 blur-[120px]" />
          <div className="absolute top-[30%] -right-[10%] w-[40%] h-[60%] rounded-full bg-emerald-900/10 blur-[140px]" />
          <div className="absolute -bottom-[20%] left-[20%] w-[60%] h-[50%] rounded-full bg-cyan-900/10 blur-[120px]" />
        </div>
      )}

      {/* Top Sticky Navbar with responsive tabs & quick toggles */}
      <div className="relative z-10 flex-1 flex flex-col">
        <Navbar />

        {/* Proactive Bio-Threshold Alert Banner */}
        <BioAlertBanner />

        {/* Main Content Area with bottom clearance for mobile quick-player & bottom nav */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 pb-36 sm:pb-8 space-y-4 sm:space-y-6">
          {/* Render Tab Views */}
          {activeTab === 'dashboard' && (
            <div className="space-y-4 sm:space-y-6">
              <FocusModeTimer />
              <AudioOscilloscope />
              <AudioEnginePanel />
            </div>
          )}

          {activeTab === 'music' && <CarrierMusicPlayer />}

          {activeTab === 'presets' && <PresetManager />}

          {activeTab === 'biologics' && <BioLogicClosedLoop />}

          {activeTab === 'sleep' && <SleepHypnogram />}

          {activeTab === 'devices' && <DeviceManagerPanel />}
        </main>

        {/* Post-Session Summary & Efficacy Tuning Modal */}
        <SessionSummaryModal />

        {/* Mobile Floating Quick-Player Dock (visible only on small screens) */}
        <MobileQuickPlayer />

        {/* Mobile Bottom Navigation */}
        <BottomNav />

        {/* Footer Status Bar */}
        <footer
          className={`hidden sm:block border-t py-4 text-xs transition-colors backdrop-blur-md ${
            isHighContrast
              ? 'border-zinc-800 bg-black text-zinc-400'
              : 'border-white/5 bg-white/5 text-zinc-400'
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
              <span className="font-medium tracking-wide">NeuroLoop • Adaptive Soundscapes</span>
            </div>

            <div className="flex items-center gap-4 text-[11px] opacity-80">
              <span>Personalized Wellness</span>
              <span>•</span>
              <span>Data Privacy Focused</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
