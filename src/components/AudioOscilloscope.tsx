import React, { useEffect, useRef } from 'react';
import { dspEngine } from '../audio/dspEngine';
import { useNeuroStore } from '../store/useNeuroStore';
import { RefreshCw, Play } from 'lucide-react';
import { BRAINWAVE_BANDS, BrainwaveBandName } from '../types';

export const AudioOscilloscope: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { audio, togglePlay } = useNeuroStore();

  const currentBand = (Object.keys(BRAINWAVE_BANDS) as BrainwaveBandName[]).find(
    (b) => audio.targetBeatHz >= BRAINWAVE_BANDS[b].minHz && audio.targetBeatHz <= BRAINWAVE_BANDS[b].maxHz
  ) || 'Alpha';

  const bandInfo = BRAINWAVE_BANDS[currentBand];

  // Colors per brainwave band
  const bandGradients: Record<BrainwaveBandName, { stroke: string; glow: string; fill: string }> = {
    Delta: { stroke: '#38bdf8', glow: 'rgba(56, 189, 248, 0.4)', fill: 'rgba(56, 189, 248, 0.08)' },
    Theta: { stroke: '#818cf8', glow: 'rgba(129, 140, 248, 0.4)', fill: 'rgba(129, 140, 248, 0.08)' },
    Alpha: { stroke: '#34d399', glow: 'rgba(52, 211, 153, 0.4)', fill: 'rgba(52, 211, 153, 0.08)' },
    Beta: { stroke: '#f59e0b', glow: 'rgba(245, 158, 11, 0.4)', fill: 'rgba(245, 158, 11, 0.08)' },
    Gamma: { stroke: '#c084fc', glow: 'rgba(192, 132, 252, 0.4)', fill: 'rgba(192, 132, 252, 0.08)' },
  };

  const currentTheme = bandGradients[currentBand];

  // Dynamic ResizeObserver
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(300, Math.floor(rect.width * dpr));
      canvas.height = Math.max(160, Math.floor(rect.height * dpr));
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  // Visualizer render loop: Organic flowing harmonic ribbons
  useEffect(() => {
    let animationFrameId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dataArray = new Uint8Array(64);
    let phase = 0;

    const render = () => {
      animationFrameId = requestAnimationFrame(render);
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      // Soft clear with slight fade
      ctx.fillStyle = 'rgba(10, 11, 16, 0.28)';
      ctx.fillRect(0, 0, width, height);

      // Subtle ambient center radial glow
      const radial = ctx.createRadialGradient(
        width / 2,
        centerY,
        10,
        width / 2,
        centerY,
        width * 0.45
      );
      radial.addColorStop(0, audio.isPlaying ? currentTheme.glow : 'rgba(39, 39, 42, 0.15)');
      radial.addColorStop(1, 'rgba(10, 11, 16, 0)');
      ctx.fillStyle = radial;
      ctx.fillRect(0, 0, width, height);

      const beatHz = Math.max(0.5, audio.currentBeatHz);
      const isPlaying = audio.isPlaying;

      if (isPlaying && dspEngine.analyser) {
        dspEngine.getAnalyserData(dataArray);
      }

      // Draw 3 organic layered harmonic sine ribbons
      const ribbons = [
        { freqMult: 1.0, speed: 0.03, alpha: 0.85, width: 2.8, waveAmp: 0.28 },
        { freqMult: 1.5, speed: -0.02, alpha: 0.45, width: 1.8, waveAmp: 0.20 },
        { freqMult: 0.5, speed: 0.015, alpha: 0.25, width: 1.2, waveAmp: 0.35 },
      ];

      ribbons.forEach((ribbon, rIdx) => {
        ctx.beginPath();
        ctx.lineWidth = ribbon.width;
        ctx.strokeStyle = audio.isGliding
          ? `rgba(129, 140, 248, ${ribbon.alpha})`
          : currentTheme.stroke;

        const points: { x: number; y: number }[] = [];
        const steps = 80;

        for (let i = 0; i <= steps; i++) {
          const x = (i / steps) * width;
          // Harmonic modulation shaped by the current beat Hz
          const normX = (i / steps) * Math.PI * 2 * (beatHz / 4);
          const t = phase * ribbon.speed * (isPlaying ? 1 : 0.4);
          
          let dspMod = 0;
          if (isPlaying && dataArray.length > 0) {
            const dataIdx = Math.floor((i / steps) * (dataArray.length - 1));
            dspMod = ((dataArray[dataIdx] - 128) / 128) * 18;
          }

          // Envelope windowing (tapers at edges)
          const windowing = Math.sin((i / steps) * Math.PI);
          const y =
            centerY +
            Math.sin(normX * ribbon.freqMult + t + rIdx) *
              (height * ribbon.waveAmp * windowing) +
            dspMod * windowing;

          points.push({ x, y });

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }

        ctx.stroke();

        // Soft subtle ribbon fill on the main ribbon
        if (rIdx === 0 && points.length > 0) {
          ctx.lineTo(width, height);
          ctx.lineTo(0, height);
          ctx.closePath();
          ctx.fillStyle = currentTheme.fill;
          ctx.fill();
        }
      });

      phase += 1;
    };

    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, [audio.isPlaying, audio.isGliding, audio.currentBeatHz, currentTheme]);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-zinc-800/70 backdrop-blur-md bg-zinc-900/40 shadow-xl shadow-black/40">
      
      {/* Top Ambient Bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-zinc-800/40">
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full animate-pulse shadow-sm"
            style={{ backgroundColor: currentTheme.stroke }}
          />
          <span className="text-xs font-semibold tracking-wider uppercase text-zinc-300">
            {bandInfo.name} Entrainment
          </span>
          <span className="hidden sm:inline-block text-xs text-zinc-500">• {bandInfo.mentalState}</span>
        </div>

        {audio.isGliding ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-xs font-mono text-indigo-300 animate-pulse">
            <RefreshCw className="w-3 h-3 animate-spin" />
            <span>Harmonic Crossfade {audio.glideProgress}%</span>
          </div>
        ) : (
          <div className="text-xs font-mono text-zinc-400 flex items-center gap-2">
            <span>Left: {audio.baseCarrierHz} Hz</span>
            <span className="text-zinc-600">|</span>
            <span>Right: {(audio.baseCarrierHz + audio.currentBeatHz).toFixed(1)} Hz</span>
          </div>
        )}
      </div>

      {/* Main Canvas Stage */}
      <div ref={containerRef} className="relative w-full h-44 sm:h-56 bg-zinc-950/60 overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Centerpiece Display: Large Elegant Typography */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
          <div className="text-center px-4">
            <div className="flex items-baseline justify-center gap-1.5">
              <span
                className="text-4xl sm:text-6xl font-bold font-mono tracking-tight transition-colors duration-500 drop-shadow-md"
                style={{ color: audio.isPlaying ? currentTheme.stroke : '#a1a1aa' }}
              >
                {audio.currentBeatHz.toFixed(1)}
              </span>
              <span className="text-base sm:text-xl font-mono text-zinc-400 font-normal">
                Hz
              </span>
            </div>

            <p className="text-xs sm:text-sm font-medium tracking-wide text-zinc-300 mt-0.5">
              {bandInfo.mentalState}
            </p>
          </div>
        </div>

        {/* Suspended Audio Overlay with Big Play CTA */}
        {!audio.isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4">
            <button
              onClick={togglePlay}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-sm shadow-lg shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Tap to Begin Soundscape</span>
            </button>
          </div>
        )}
      </div>

      {/* Sleek Glide Indicator Line */}
      {audio.isGliding && (
        <div className="w-full h-1 bg-zinc-800/80 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-emerald-400 to-cyan-400 transition-all duration-150"
            style={{ width: `${audio.glideProgress}%` }}
          />
        </div>
      )}
    </div>
  );
};
