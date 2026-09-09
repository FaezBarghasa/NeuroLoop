import React from 'react';
import { useNeuroStore } from '../store/useNeuroStore';
import {
  Sliders,
  Activity,
  Moon,
  Brain,
  Watch,
  Music,
} from 'lucide-react';
import { TabType } from '../types';
import { triggerHaptic } from '../utils/haptics';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab } = useNeuroStore();

  const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: 'dashboard', label: 'Home', icon: Sliders },
    { id: 'music', label: 'Music', icon: Music },
    { id: 'presets', label: 'Presets', icon: Brain },
    { id: 'biologics', label: 'Bio-Sync', icon: Activity },
    { id: 'sleep', label: 'Sleep', icon: Moon },
    { id: 'devices', label: 'Devices', icon: Watch },
  ];

  const handleTabClick = (tabId: TabType) => {
    triggerHaptic('light');
    setActiveTab(tabId);
  };

  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/85 backdrop-blur-2xl border-t border-white/10 pb-safe shadow-2xl">
      <div className="flex items-center justify-around px-1 py-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`flex flex-col items-center justify-center w-full py-1.5 min-h-[48px] gap-0.5 rounded-xl transition-all cursor-pointer touch-manipulation active:scale-95 ${
                isActive
                  ? 'text-emerald-400'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <div className={`p-1 rounded-xl transition-colors ${isActive ? 'bg-emerald-500/15 text-emerald-400' : 'bg-transparent'}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className={`text-[10px] tracking-tight ${isActive ? 'font-bold text-emerald-300' : 'font-medium'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
