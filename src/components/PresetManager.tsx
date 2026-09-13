import React, { useState, useMemo } from 'react';
import { useNeuroStore } from '../store/useNeuroStore';
import { Preset, BrainwaveBandName, BRAINWAVE_BANDS } from '../types';
import {
  Brain,
  Search,
  Sparkles,
  Play,
  Check,
  Plus,
  Moon,
  Zap,
  Activity,
  Heart,
  X,
} from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

export const PresetManager: React.FC = () => {
  const {
    presets,
    activePresetId,
    applyPreset,
    savePreset,
    audio,
    togglePlay,
    getOptimalPresetInsight,
  } = useNeuroStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedBand, setSelectedBand] = useState<string>('All');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Smart Insight
  const smartInsight = useMemo(() => getOptimalPresetInsight(), [getOptimalPresetInsight]);

  // New Custom Preset Form State
  const [customName, setCustomName] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [customCategory, setCustomCategory] = useState<Preset['category']>('Focus');
  const [customCarrierHz, setCustomCarrierHz] = useState(216);
  const [customBeatHz, setCustomBeatHz] = useState(10.0);
  const [customNoiseType, setCustomNoiseType] = useState<Preset['noiseType']>('pink');
  const [customNoiseVol, setCustomNoiseVol] = useState(0.2);

  const categories = [
    { id: 'All', label: 'All Moods', icon: Sparkles, count: presets.length },
    { id: 'Rest', label: 'Sleep & Night', icon: Moon, count: presets.filter(p => p.category === 'Rest').length },
    { id: 'Focus', label: 'Focus & Study', icon: Zap, count: presets.filter(p => p.category === 'Focus').length },
    { id: 'Meditation', label: 'Meditation', icon: Brain, count: presets.filter(p => p.category === 'Meditation').length },
    { id: 'Relax', label: 'Calm & Stress', icon: Heart, count: presets.filter(p => p.category === 'Relax').length },
    { id: 'Energy', label: 'Morning & Energy', icon: Activity, count: presets.filter(p => p.category === 'Energy').length },
    { id: 'Bio-Adaptive', label: 'Bio-Adaptive', icon: Activity, count: presets.filter(p => p.category === 'Bio-Adaptive').length },
  ];

  const bands = ['All', 'Delta', 'Theta', 'Alpha', 'Beta', 'Gamma'];

  const filteredPresets = useMemo(() => {
    return presets.filter((p) => {
      // Category match
      if (selectedCategory !== 'All' && p.category !== selectedCategory) {
        return false;
      }
      // Band match
      if (selectedBand !== 'All' && p.targetBand !== selectedBand) {
        return false;
      }
      // Search query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesDesc = p.description.toLowerCase().includes(q);
        const matchesTags = p.tags?.some((t) => t.toLowerCase().includes(q)) ?? false;
        const matchesBand = p.targetBand.toLowerCase().includes(q);
        const matchesHz = p.targetBeatHz.toString().includes(q);
        return matchesName || matchesDesc || matchesTags || matchesBand || matchesHz;
      }
      return true;
    });
  }, [presets, selectedCategory, selectedBand, searchQuery]);

  const handleSelectAndPlay = (preset: Preset) => {
    triggerHaptic('medium');
    applyPreset(preset.id);
    if (!audio.isPlaying) {
      togglePlay();
    }
  };

  const handleSaveCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    let targetBand: BrainwaveBandName = 'Alpha';
    if (customBeatHz < 4.0) targetBand = 'Delta';
    else if (customBeatHz < 8.0) targetBand = 'Theta';
    else if (customBeatHz < 13.0) targetBand = 'Alpha';
    else if (customBeatHz < 30.0) targetBand = 'Beta';
    else targetBand = 'Gamma';

    const newPreset: Preset = {
      id: `custom-${Date.now()}`,
      name: customName.trim(),
      description: customDesc.trim() || `Custom ${targetBand} session (${customBeatHz.toFixed(1)} Hz).`,
      category: customCategory,
      baseCarrierHz: customCarrierHz,
      targetBeatHz: customBeatHz,
      targetBand,
      binauralMix: 0.85,
      isochronicMix: 0.25,
      isochronicDutyCycle: 0.5,
      noiseType: customNoiseType,
      noiseVolume: customNoiseVol,
      durationMinutes: 30,
      tags: ['custom', customCategory.toLowerCase(), targetBand.toLowerCase()],
    };

    savePreset(newPreset);
    applyPreset(newPreset.id);
    setShowCreateModal(false);
    setCustomName('');
    setCustomDesc('');
  };

  const getCategoryColor = (cat: Preset['category']) => {
    switch (cat) {
      case 'Rest': return 'text-sky-400 bg-sky-500/10 border-sky-500/20';
      case 'Focus': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'Meditation': return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
      case 'Relax': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'Energy': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      case 'Bio-Adaptive': return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      default: return 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20';
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* Header Deck */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 shrink-0">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-zinc-100 tracking-tight">
                Soundscape Presets
              </h2>
              <p className="text-xs text-zinc-400">
                Scientifically tuned audio to help you focus, relax, or sleep.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs transition-all shadow-sm active:scale-95 cursor-pointer touch-manipulation"
        >
          <Plus className="w-4 h-4" />
          <span>Create Custom</span>
        </button>
      </div>

      {/* Smart ML-Inspired Time-of-Day Insight */}
      {smartInsight && (
        <div className="backdrop-blur-md bg-indigo-950/30 border border-indigo-500/40 rounded-2xl p-4 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2 bg-indigo-500/20 rounded-xl text-indigo-400 border border-indigo-500/30 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-indigo-200 tracking-tight flex items-center gap-2">
                Optimal Preset Suggested
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300">
                  Data-Driven Insight
                </span>
              </h3>
              <p className="text-xs text-indigo-300/80 mt-0.5">
                {smartInsight.reason}
              </p>
            </div>
          </div>
          <button
            onClick={() => handleSelectAndPlay(presets.find(p => p.id === smartInsight.presetId)!)}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-semibold text-xs shadow-md shadow-indigo-950/50 transition-all active:scale-95 shrink-0"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Play {smartInsight.presetName}
          </button>
        </div>
      )}

      {/* Mood & Occasion Category Filter Strip */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer touch-manipulation active:scale-95 border ${
                isSelected
                  ? 'bg-emerald-500 text-zinc-950 font-semibold border-emerald-500 shadow-sm'
                  : 'bg-white/5 text-zinc-400 hover:text-zinc-200 border-white/10 hover:bg-white/10 backdrop-blur-sm'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{cat.label}</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-zinc-950/30 text-zinc-950' : 'bg-white/10 text-zinc-400'}`}>
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search & Band Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by mood, occasion, tag..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500/50 transition-colors backdrop-blur-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Frequency Band Selector Chips */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <span className="text-[11px] text-zinc-500 mr-1 hidden lg:inline font-mono">Band:</span>
          {bands.map((band) => (
            <button
              key={band}
              onClick={() => setSelectedBand(band)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                selectedBand === band
                  ? 'bg-white/20 text-emerald-400 border border-emerald-500/40 font-bold backdrop-blur-md'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/10'
              }`}
            >
              {band}
            </button>
          ))}
        </div>
      </div>

      {/* Presets Grid */}
      {filteredPresets.length === 0 ? (
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-10 text-center space-y-2">
          <Brain className="w-8 h-8 text-zinc-600 mx-auto" />
          <h4 className="text-sm font-semibold text-zinc-300">No presets matched your search</h4>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Try adjusting your search terms or filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredPresets.map((preset) => {
            const isActive = preset.id === activePresetId;
            const bandColor = BRAINWAVE_BANDS[preset.targetBand]?.color || '#34d399';

            return (
              <div
                key={preset.id}
                onClick={() => handleSelectAndPlay(preset)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all relative overflow-hidden flex flex-col justify-between active:scale-[0.98] group backdrop-blur-md ${
                  isActive
                    ? 'bg-white/10 border-emerald-500/60 shadow-lg shadow-emerald-950/30'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <div>
                  
                  {/* Top Metadata Row */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border font-semibold ${getCategoryColor(preset.category)}`}>
                      {preset.category}
                    </span>

                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-zinc-950 border border-zinc-800/80"
                        style={{ color: bandColor }}
                      >
                        {preset.targetBeatHz.toFixed(1)} Hz ({preset.targetBand})
                      </span>

                      {isActive && (
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400" />
                      )}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h4 className="text-sm font-bold text-zinc-100 group-hover:text-emerald-300 transition-colors mb-1 leading-snug">
                    {preset.name}
                  </h4>
                  <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed mb-3">
                    {preset.description}
                  </p>

                  {/* Tags */}
                  {preset.tags && preset.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {preset.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="text-[10px] font-mono text-zinc-500 bg-zinc-950/60 px-1.5 py-0.5 rounded border border-zinc-900">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bottom Footer Details */}
                <div className="pt-2.5 border-t border-zinc-800/60 flex items-center justify-between text-[11px] font-mono text-zinc-500">
                  <div className="flex items-center gap-2">
                    <span>{preset.baseCarrierHz} Hz Base</span>
                    {preset.durationMinutes && (
                      <>
                        <span>•</span>
                        <span>{preset.durationMinutes}m</span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {isActive ? (
                      <span className="text-emerald-400 font-semibold flex items-center gap-1 text-[10px]">
                        <Check className="w-3.5 h-3.5" />
                        <span>Active</span>
                      </span>
                    ) : (
                      <span className="text-zinc-500 group-hover:text-zinc-300 flex items-center gap-1 text-[10px]">
                        <Play className="w-3 h-3 fill-current" />
                        <span>Play</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Custom Preset Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-zinc-100">Create Custom Mood Preset</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustom} className="space-y-4 text-xs">
              
              <div>
                <label className="block text-zinc-300 font-medium mb-1">Preset Name</label>
                <input
                  type="text"
                  required
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. My Afternoon Coding Flow"
                  className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1">Occasion / Mood Description</label>
                <input
                  type="text"
                  value={customDesc}
                  onChange={(e) => setCustomDesc(e.target.value)}
                  placeholder="e.g. High-demand problem solving and deep focus"
                  className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Category</label>
                  <select
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value as Preset['category'])}
                    className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Focus">Focus</option>
                    <option value="Rest">Sleep & Rest</option>
                    <option value="Relax">Relax & Calm</option>
                    <option value="Meditation">Meditation</option>
                    <option value="Energy">Energy</option>
                    <option value="Bio-Adaptive">Bio-Adaptive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Background Noise</label>
                  <select
                    value={customNoiseType}
                    onChange={(e) => setCustomNoiseType(e.target.value as Preset['noiseType'])}
                    className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="none">None</option>
                    <option value="pink">Pink Noise (Gentle)</option>
                    <option value="brownian">Brownian (Deep 1/f²)</option>
                    <option value="white">White Noise (Crisp)</option>
                  </select>
                </div>
              </div>

              {/* Frequency Sliders */}
              <div className="space-y-3 p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                <div className="space-y-1">
                  <div className="flex justify-between text-zinc-400">
                    <span>Target Entrainment Beat</span>
                    <span className="font-mono text-emerald-400 font-bold">{customBeatHz.toFixed(1)} Hz</span>
                  </div>
                  <input
                    type="range"
                    min={0.5}
                    max={45.0}
                    step={0.1}
                    value={customBeatHz}
                    onChange={(e) => setCustomBeatHz(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-zinc-400">
                    <span>Base Carrier Frequency</span>
                    <span className="font-mono text-emerald-400">{customCarrierHz} Hz</span>
                  </div>
                  <input
                    type="range"
                    min={100}
                    max={528}
                    step={1}
                    value={customCarrierHz}
                    onChange={(e) => setCustomCarrierHz(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                  />
                </div>

                {customNoiseType !== 'none' && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-zinc-400">
                      <span>Noise Volume</span>
                      <span className="font-mono text-emerald-400">{Math.round(customNoiseVol * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0.0}
                      max={1.0}
                      step={0.05}
                      value={customNoiseVol}
                      onChange={(e) => setCustomNoiseVol(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold transition-all shadow-md active:scale-95"
                >
                  Save & Activate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
