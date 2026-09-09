import React from 'react';
import { useNeuroStore } from '../store/useNeuroStore';
import { Play, Square, Volume2, RefreshCw, Disc3 } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

export const MobileQuickPlayer: React.FC = () => {
  const {
    audio,
    musicPlayer,
    musicTracks,
    togglePlay,
    toggleMusicPlay,
    setMasterVolume,
    setTargetBeatHz,
  } = useNeuroStore();

  const currentTrack = musicTracks.find((t) => t.id === musicPlayer.currentTrackId) || musicTracks[0];

  return (
    <div className="sm:hidden fixed bottom-[64px] left-2 right-2 z-30 bg-zinc-900/95 border border-zinc-800/80 backdrop-blur-xl rounded-2xl p-2.5 shadow-[0_-8px_30px_-15px_rgba(0,0,0,0.8)]">
      <div className="flex items-center justify-between gap-3">
        
        {/* Play/Pause Button for Beats */}
        <button
          onClick={() => {
            triggerHaptic('heavy');
            togglePlay();
          }}
          className={`w-10 h-10 min-h-[40px] min-w-[40px] rounded-xl flex items-center justify-center shrink-0 shadow-md transition-all active:scale-95 cursor-pointer ${
            audio.isPlaying
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              : 'bg-emerald-500 text-zinc-950 font-bold shadow-emerald-500/20'
          }`}
          aria-label={audio.isPlaying ? 'Pause Audio' : 'Start Audio'}
        >
          {audio.isPlaying ? (
            <Square className="w-4 h-4 fill-current" />
          ) : (
            <Play className="w-4 h-4 fill-current ml-0.5" />
          )}
        </button>

        {/* Center Info: Beat Hz & Music status */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-1.5 truncate">
              <span className="text-sm font-bold font-mono text-emerald-400">
                {audio.currentBeatHz.toFixed(1)} Hz
              </span>
              <span className="text-[10px] text-zinc-400 truncate">
                ({audio.baseCarrierHz} Hz)
              </span>
            </div>

            {musicPlayer.isPlaying ? (
              <button
                onClick={() => {
                  triggerHaptic('light');
                  toggleMusicPlay();
                }}
                className="flex items-center gap-1 text-[10px] font-mono text-teal-300 bg-teal-500/10 px-1.5 py-0.5 rounded border border-teal-500/30 truncate max-w-[120px]"
              >
                <Disc3 className="w-2.5 h-2.5 animate-spin shrink-0" />
                <span className="truncate">{currentTrack.title}</span>
              </button>
            ) : audio.isGliding ? (
              <span className="flex items-center gap-1 text-[10px] font-mono text-indigo-300 animate-pulse">
                <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                <span>{audio.glideProgress}%</span>
              </span>
            ) : (
              <span className="text-[10px] font-mono text-zinc-400">
                {audio.isPlaying ? 'Beats On' : 'Beats Off'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-1">
            <button
              onClick={() => {
                triggerHaptic('light');
                setTargetBeatHz(Math.max(0.5, audio.targetBeatHz - 0.5), 4.0);
              }}
              className="px-2 py-0.5 rounded-md bg-zinc-950 border border-zinc-800 text-[10px] font-mono text-zinc-300 active:scale-95 cursor-pointer"
            >
              -0.5
            </button>
            <button
              onClick={() => {
                triggerHaptic('light');
                setTargetBeatHz(Math.min(50, audio.targetBeatHz + 0.5), 4.0);
              }}
              className="px-2 py-0.5 rounded-md bg-zinc-950 border border-zinc-800 text-[10px] font-mono text-zinc-300 active:scale-95 cursor-pointer"
            >
              +0.5
            </button>

            <div className="flex-1 flex items-center gap-1.5 ml-1">
              <Volume2 className="w-3 h-3 text-zinc-400 shrink-0" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={audio.masterVolume}
                onChange={(e) => {
                  triggerHaptic('selection');
                  setMasterVolume(parseFloat(e.target.value));
                }}
                className="w-full accent-emerald-400 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
