import React, { useRef, useState } from 'react';
import { useNeuroStore } from '../store/useNeuroStore';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Volume2,
  Upload,
  Sliders,
  Disc3,
  Zap,
} from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

export const CarrierMusicPlayer: React.FC = () => {
  const {
    musicPlayer,
    musicTracks,
    playTrack,
    toggleMusicPlay,
    playNextTrack,
    playPrevTrack,
    setMusicVolume,
    seekMusic,
    addLocalAudioFiles,
    toggleMusicLoop,
    setMusicCarrierMode,
    audio,
    togglePlay: toggleBeatEngine,
    setMasterVolume,
    setBinauralMix,
  } = useNeuroStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [dragOver, setDragOver] = useState<boolean>(false);

  const currentTrack = musicTracks.find((t) => t.id === musicPlayer.currentTrackId) || musicTracks[0];

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      triggerHaptic('success');
      addLocalAudioFiles(e.target.files);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      triggerHaptic('success');
      addLocalAudioFiles(e.dataTransfer.files);
    }
  };

  const categories = ['All', 'Atmospheric Drone', 'Solfeggio Frequencies', 'Lo-Fi Chill', 'Nature & Rain', 'Local Audio'];

  const filteredTracks = selectedCategory === 'All'
    ? musicTracks
    : musicTracks.filter((t) => t.category === selectedCategory);

  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* Top Banner / Concept Pill */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 shrink-0">
            <Disc3 className={`w-6 h-6 ${musicPlayer.isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '8s' }} />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-zinc-100 tracking-tight">
              Music & Soundscapes
            </h2>
            <p className="text-xs text-zinc-400">
              Play calming music while you focus or relax.
            </p>
          </div>
        </div>

        {/* Upload Local Audio Button */}
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="audio/*,.mp3,.wav,.flac,.ogg,.m4a,.aac"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={() => {
              triggerHaptic('light');
              fileInputRef.current?.click();
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs transition-all shadow-sm active:scale-95 cursor-pointer touch-manipulation"
          >
            <Upload className="w-4 h-4" />
            <span>Add Custom Audio</span>
          </button>
        </div>
      </div>

      {/* Hero Now Playing Deck */}
      <div className="relative rounded-2xl overflow-hidden border border-zinc-800/80 bg-zinc-900/60 backdrop-blur-xl shadow-xl shadow-black/40 p-4 sm:p-6">
        
        {/* Ambient Blurred Glow Background */}
        <div className={`absolute -inset-1 opacity-25 blur-3xl pointer-events-none bg-gradient-to-r ${currentTrack.coverGradient}`} />

        <div className="relative z-10 flex flex-col md:flex-row gap-6 items-center">
          
          {/* Album Vinyl / Art Display */}
          <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-2xl overflow-hidden border border-zinc-700/60 shadow-2xl flex flex-col items-center justify-center p-4 text-center shrink-0 bg-gradient-to-br from-zinc-800 to-zinc-950">
            <div className={`absolute inset-0 bg-gradient-to-tr ${currentTrack.coverGradient} opacity-60`} />
            <Disc3 className={`w-14 h-14 text-zinc-200 relative z-10 mb-2 ${musicPlayer.isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
            <span className="relative z-10 text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full bg-black/60 text-emerald-300 border border-emerald-500/30">
              {currentTrack.category}
            </span>
          </div>

          {/* Track Info & Scrubber */}
          <div className="flex-1 w-full space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="inline-block text-[10px] font-mono uppercase text-emerald-400 font-semibold mb-1">
                  {currentTrack.moodTag}
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-zinc-100 tracking-tight">
                  {currentTrack.title}
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {currentTrack.artist} • {currentTrack.isSynthetic ? 'Procedural Web Audio Synth' : 'Local Audio File'}
                </p>
              </div>

              {/* Mode Toggle Badge */}
              <div className="flex items-center gap-1.5 self-start sm:self-center bg-zinc-950/80 border border-zinc-800 rounded-xl p-1">
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    setMusicCarrierMode('overlay');
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    musicPlayer.carrierMode === 'overlay'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Layer Mode
                </button>
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    setMusicCarrierMode('pure_carrier');
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    musicPlayer.carrierMode === 'pure_carrier'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Carrier Mode
                </button>
              </div>
            </div>

            {/* Scrubber Progress Bar */}
            <div className="space-y-1.5">
              <div className="relative w-full h-2 bg-zinc-800 rounded-full overflow-hidden cursor-pointer">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-300"
                  style={{ width: `${(musicPlayer.currentTime / Math.max(1, musicPlayer.duration)) * 100}%` }}
                />
                <input
                  type="range"
                  min={0}
                  max={musicPlayer.duration || 600}
                  value={musicPlayer.currentTime}
                  onChange={(e) => {
                    triggerHaptic('selection');
                    seekMusic(parseFloat(e.target.value));
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500">
                <span>{formatTime(musicPlayer.currentTime)}</span>
                <span>{formatTime(musicPlayer.duration)}</span>
              </div>
            </div>

            {/* Transport Player Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
              
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    playPrevTrack();
                  }}
                  className="p-2.5 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors active:scale-95 cursor-pointer"
                  title="Previous Track"
                >
                  <SkipBack className="w-5 h-5" />
                </button>

                <button
                  onClick={() => {
                    triggerHaptic('heavy');
                    toggleMusicPlay();
                  }}
                  className="p-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 cursor-pointer font-bold"
                  title={musicPlayer.isPlaying ? 'Pause' : 'Play'}
                >
                  {musicPlayer.isPlaying ? (
                    <Pause className="w-6 h-6 fill-current" />
                  ) : (
                    <Play className="w-6 h-6 fill-current translate-x-0.5" />
                  )}
                </button>

                <button
                  onClick={() => {
                    triggerHaptic('light');
                    playNextTrack();
                  }}
                  className="p-2.5 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors active:scale-95 cursor-pointer"
                  title="Next Track"
                >
                  <SkipForward className="w-5 h-5" />
                </button>

                <button
                  onClick={() => {
                    triggerHaptic('light');
                    toggleMusicLoop();
                  }}
                  className={`p-2.5 rounded-xl transition-colors cursor-pointer ${
                    musicPlayer.loop
                      ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                  title="Loop Track"
                >
                  <Repeat className="w-4 h-4" />
                </button>
              </div>

              {/* Volume Slider */}
              <div className="flex items-center gap-2 min-w-[150px]">
                <Volume2 className="w-4 h-4 text-zinc-400 shrink-0" />
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={musicPlayer.volume}
                  onChange={(e) => {
                    triggerHaptic('selection');
                    setMusicVolume(parseFloat(e.target.value));
                  }}
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                />
                <span className="text-[11px] font-mono text-zinc-400 w-8 text-right">
                  {Math.round(musicPlayer.volume * 100)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mixer Balance: Music vs Entrainment Beats */}
      <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-zinc-200 tracking-wide uppercase">
              Audio Volume Balance
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400">Background Tone:</span>
            <button
              onClick={() => {
                triggerHaptic('medium');
                toggleBeatEngine();
              }}
              className={`px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
                audio.isPlaying
                  ? 'bg-emerald-500 text-zinc-950 border-emerald-500 shadow-sm'
                  : 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{audio.isPlaying ? 'Tone Active' : 'Start Tone'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          
          {/* Music Layer Volume */}
          <div className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-2">
            <div className="flex justify-between items-center text-zinc-400">
              <span className="font-medium text-zinc-300">Music Volume</span>
              <span className="font-mono text-emerald-400">{Math.round(musicPlayer.volume * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={musicPlayer.volume}
              onChange={(e) => {
                triggerHaptic('selection');
                setMusicVolume(parseFloat(e.target.value));
              }}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
            />
          </div>

          {/* Binaural Entrainment Mix */}
          <div className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-2">
            <div className="flex justify-between items-center text-zinc-400">
              <span className="font-medium text-zinc-300">Tone Volume</span>
              <span className="font-mono text-emerald-400">{Math.round(audio.binauralMix * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={audio.binauralMix}
              onChange={(e) => {
                triggerHaptic('selection');
                setBinauralMix(parseFloat(e.target.value));
              }}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
            />
          </div>

          {/* Master Output */}
          <div className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-2">
            <div className="flex justify-between items-center text-zinc-400">
              <span className="font-medium text-zinc-300">Master Volume</span>
              <span className="font-mono text-emerald-400">{Math.round(audio.masterVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={audio.masterVolume}
              onChange={(e) => {
                triggerHaptic('selection');
                setMasterVolume(parseFloat(e.target.value));
              }}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
            />
          </div>
        </div>
      </div>

      {/* Drag & Drop File Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => {
          triggerHaptic('light');
          fileInputRef.current?.click();
        }}
        className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all cursor-pointer ${
          dragOver
            ? 'border-emerald-500 bg-emerald-500/10'
            : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/20 hover:bg-zinc-900/40'
        }`}
      >
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="p-3 bg-zinc-800/70 rounded-full text-zinc-300">
            <Upload className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-sm font-semibold text-zinc-200">
            Drop local music files here or click to browse
          </div>
          <div className="text-xs text-zinc-500 max-w-sm">
            Supports MP3, WAV, FLAC, M4A, OGG, and AAC directly from your device storage.
          </div>
        </div>
      </div>

      {/* Track Library & Categories */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">
            Soundscape & Track Library
          </h3>
          <span className="text-xs text-zinc-500 font-mono">
            {filteredTracks.length} available
          </span>
        </div>

        {/* Category Pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                triggerHaptic('light');
                setSelectedCategory(cat);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-emerald-500 text-zinc-950 font-semibold shadow-sm shadow-emerald-500/20'
                  : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800/80 hover:bg-zinc-850'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Track List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {filteredTracks.map((track) => {
            const isCurrent = track.id === musicPlayer.currentTrackId;
            const isPlayingThis = isCurrent && musicPlayer.isPlaying;

            return (
              <div
                key={track.id}
                onClick={() => {
                  triggerHaptic('medium');
                  playTrack(track.id);
                }}
                className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all active:scale-[0.98] ${
                  isCurrent
                    ? 'bg-zinc-850 border-emerald-500/50 shadow-md shadow-black/40'
                    : 'bg-zinc-900/40 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-850/50'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${track.coverGradient} flex items-center justify-center shrink-0 border border-zinc-700/50`}>
                    {isPlayingThis ? (
                      <Pause className="w-4 h-4 text-white fill-current" />
                    ) : (
                      <Play className="w-4 h-4 text-white fill-current translate-x-0.5" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-zinc-200 truncate">{track.title}</span>
                      {isCurrent && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                      )}
                    </div>
                    <div className="text-[11px] text-zinc-400 truncate">
                      {track.artist}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-950 text-zinc-400 border border-zinc-800/80">
                    {track.moodTag.split('&')[0]}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500">
                    {formatTime(track.durationSec)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
