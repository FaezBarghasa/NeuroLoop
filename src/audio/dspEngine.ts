import { NoiseType, Preset } from '../types';

export class NeuroDspEngine {
  private ctx: AudioContext | null = null;
  private isRunning: boolean = false;

  // Master & mixers
  private masterGain: GainNode | null = null;
  private binauralGain: GainNode | null = null;
  private isochronicGain: GainNode | null = null;
  private noiseGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  public analyser: AnalyserNode | null = null;

  // Crossfade bus gain node to eliminate any clicks during preset swaps
  private crossfadeGain: GainNode | null = null;

  // Binaural Beat Generators (Stereo)
  private leftOsc: OscillatorNode | null = null;
  private rightOsc: OscillatorNode | null = null;
  private merger: ChannelMergerNode | null = null;

  // Isochronic Generator
  private isochronicOsc: OscillatorNode | null = null;
  private isochronicPulsarGain: GainNode | null = null;
  private pulseIntervalId: number | null = null;

  // Noise Generator
  private noiseNode: AudioNode | null = null;

  // Music & Atmospheric Soundscape Carrier Layer
  private audioElement: HTMLAudioElement | null = null;
  private audioSourceNode: MediaElementAudioSourceNode | null = null;
  private synthNodes: AudioNode[] = [];
  private synthIntervalId: number | null = null;
  private currentMusicVolume: number = 0.7;

  // Glide & Crossfade state
  private currentBaseHz: number = 200;
  private currentBeatHz: number = 10.0;
  private targetBeatHz: number = 10.0;
  private startBeatHz: number = 10.0;
  private glideStartTime: number = 0;
  private glideDurationSec: number = 5.0;
  private isGliding: boolean = false;
  private isCrossfading: boolean = false;
  private crossfadeProgress: number = 1.0;
  private glideProgressCallback?: (currentBeatHz: number, progress: number, isCrossfading?: boolean) => void;

  constructor() {
    // Lazy AudioContext initialization on user interaction
  }

  public initContext(): AudioContext {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public async start(config: {
    baseCarrierHz: number;
    targetBeatHz: number;
    masterVolume: number;
    binauralMix: number;
    isochronicMix: number;
    isochronicDutyCycle: number;
    noiseType: NoiseType;
    noiseVolume: number;
    glideDurationSec?: number;
    musicVolume?: number;
  }): Promise<void> {
    const ctx = this.initContext();
    if (this.isRunning) {
      this.stop();
    }

    this.currentBaseHz = config.baseCarrierHz;
    this.currentBeatHz = config.targetBeatHz;
    this.targetBeatHz = config.targetBeatHz;
    this.glideDurationSec = config.glideDurationSec ?? 5.0;
    this.currentMusicVolume = config.musicVolume ?? 0.7;

    // Master bus & Analyser
    this.masterGain = ctx.createGain();
    this.masterGain.gain.setValueAtTime(config.masterVolume, ctx.currentTime);

    // Crossfade Gain (smoothing bus)
    this.crossfadeGain = ctx.createGain();
    this.crossfadeGain.gain.setValueAtTime(1.0, ctx.currentTime);

    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.8;

    this.crossfadeGain.connect(this.masterGain);
    this.masterGain.connect(this.analyser);
    this.analyser.connect(ctx.destination);

    // Submixers (connected through crossfadeGain)
    this.binauralGain = ctx.createGain();
    this.binauralGain.gain.setValueAtTime(config.binauralMix, ctx.currentTime);
    this.binauralGain.connect(this.crossfadeGain);

    this.isochronicGain = ctx.createGain();
    this.isochronicGain.gain.setValueAtTime(config.isochronicMix, ctx.currentTime);
    this.isochronicGain.connect(this.crossfadeGain);

    this.noiseGain = ctx.createGain();
    this.noiseGain.gain.setValueAtTime(config.noiseVolume, ctx.currentTime);
    this.noiseGain.connect(this.crossfadeGain);

    this.musicGain = ctx.createGain();
    this.musicGain.gain.setValueAtTime(this.currentMusicVolume, ctx.currentTime);
    this.musicGain.connect(this.masterGain);

    // Setup Binaural Beats (Stereo Splitter: Left = Base, Right = Base + Beat)
    this.merger = ctx.createChannelMerger(2);

    this.leftOsc = ctx.createOscillator();
    this.leftOsc.type = 'sine';
    this.leftOsc.frequency.setValueAtTime(this.currentBaseHz, ctx.currentTime);

    this.rightOsc = ctx.createOscillator();
    this.rightOsc.type = 'sine';
    this.rightOsc.frequency.setValueAtTime(this.currentBaseHz + this.currentBeatHz, ctx.currentTime);

    const leftGain = ctx.createGain();
    const rightGain = ctx.createGain();
    leftGain.gain.setValueAtTime(0.5, ctx.currentTime);
    rightGain.gain.setValueAtTime(0.5, ctx.currentTime);

    this.leftOsc.connect(leftGain);
    rightGain.connect(this.merger, 0, 1); // Right channel (input 1)
    this.rightOsc.connect(rightGain);
    leftGain.connect(this.merger, 0, 0); // Left channel (input 0)

    this.merger.connect(this.binauralGain);

    this.leftOsc.start();
    this.rightOsc.start();

    // Setup Isochronic Tone (Carrier + Modulated Gain)
    this.setupIsochronic(this.currentBaseHz, this.currentBeatHz, config.isochronicDutyCycle);

    // Setup Noise
    this.setupNoise(config.noiseType);

    this.isRunning = true;
    this.startGlideAnimationLoop();
  }

  /**
   * Seamless Preset Crossfade
   * Linearly crossfades gain envelope and glides frequency / mixer parameters simultaneously
   * preventing harsh transients, frequency popping, or phase artifacts.
   */
  public crossfadePreset(preset: Preset, durationSec: number = 4.0): void {
    if (!this.ctx || !this.isRunning) {
      // Just set parameters if not running
      this.currentBaseHz = preset.baseCarrierHz;
      this.targetBeatHz = preset.targetBeatHz;
      this.currentBeatHz = preset.targetBeatHz;
      return;
    }

    const ctx = this.ctx;
    const now = ctx.currentTime;
    const halfDuration = durationSec * 0.45;

    this.isCrossfading = true;

    // 1. Equal-power gain dip on crossfade bus to cushion harmonic transition
    if (this.crossfadeGain) {
      this.crossfadeGain.gain.cancelScheduledValues(now);
      this.crossfadeGain.gain.setValueAtTime(this.crossfadeGain.gain.value, now);
      // Soft dip to 45% power during midpoint
      this.crossfadeGain.gain.linearRampToValueAtTime(0.45, now + halfDuration);
      // Smooth return to full unity gain
      this.crossfadeGain.gain.linearRampToValueAtTime(1.0, now + durationSec);
    }

    // 2. Smoothly ramp base carrier frequency
    if (this.leftOsc && this.rightOsc) {
      this.leftOsc.frequency.cancelScheduledValues(now);
      this.leftOsc.frequency.linearRampToValueAtTime(preset.baseCarrierHz, now + durationSec);

      this.rightOsc.frequency.cancelScheduledValues(now);
      this.rightOsc.frequency.linearRampToValueAtTime(preset.baseCarrierHz + preset.targetBeatHz, now + durationSec);
    }

    if (this.isochronicOsc) {
      this.isochronicOsc.frequency.cancelScheduledValues(now);
      this.isochronicOsc.frequency.linearRampToValueAtTime(preset.baseCarrierHz, now + durationSec);
    }

    // 3. Smoothly ramp sub-mixer gains
    if (this.binauralGain) {
      this.binauralGain.gain.cancelScheduledValues(now);
      this.binauralGain.gain.linearRampToValueAtTime(preset.binauralMix, now + durationSec);
    }

    if (this.isochronicGain) {
      this.isochronicGain.gain.cancelScheduledValues(now);
      this.isochronicGain.gain.linearRampToValueAtTime(preset.isochronicMix, now + durationSec);
    }

    if (this.noiseGain) {
      this.noiseGain.gain.cancelScheduledValues(now);
      this.noiseGain.gain.linearRampToValueAtTime(preset.noiseVolume, now + durationSec);
    }

    // 4. Update internal state and start frequency glide
    this.currentBaseHz = preset.baseCarrierHz;
    this.glideToFrequency(preset.targetBeatHz, durationSec);
    this.setupNoise(preset.noiseType);
    this.updateIsochronicPulsar(preset.targetBeatHz, preset.isochronicDutyCycle);

    setTimeout(() => {
      this.isCrossfading = false;
    }, durationSec * 1000);
  }

  private setupIsochronic(carrierHz: number, pulseRateHz: number, dutyCycle: number) {
    if (!this.ctx || !this.isochronicGain) return;
    const ctx = this.ctx;

    this.isochronicOsc = ctx.createOscillator();
    this.isochronicOsc.type = 'sine';
    this.isochronicOsc.frequency.setValueAtTime(carrierHz, ctx.currentTime);

    this.isochronicPulsarGain = ctx.createGain();
    this.isochronicPulsarGain.gain.setValueAtTime(0, ctx.currentTime);

    this.isochronicOsc.connect(this.isochronicPulsarGain);
    this.isochronicPulsarGain.connect(this.isochronicGain);
    this.isochronicOsc.start();

    this.updateIsochronicPulsar(pulseRateHz, dutyCycle);
  }

  private updateIsochronicPulsar(rateHz: number, dutyCycle: number) {
    if (this.pulseIntervalId) {
      window.clearInterval(this.pulseIntervalId);
      this.pulseIntervalId = null;
    }

    if (!this.ctx || !this.isochronicPulsarGain) return;
    const ctx = this.ctx;

    // Period in milliseconds
    const periodMs = Math.max(10, 1000 / Math.max(0.2, rateHz));
    const onTimeSec = Math.max(0.005, (periodMs * dutyCycle) / 1000);
    const attackDecay = Math.min(0.015, onTimeSec / 3);

    const triggerPulse = () => {
      if (!this.isRunning || !this.ctx || !this.isochronicPulsarGain) return;
      const now = this.ctx.currentTime;
      const targetGain = 0.8;
      
      this.isochronicPulsarGain.gain.cancelScheduledValues(now);
      this.isochronicPulsarGain.gain.setValueAtTime(0.0001, now);
      this.isochronicPulsarGain.gain.linearRampToValueAtTime(targetGain, now + attackDecay);
      this.isochronicPulsarGain.gain.setValueAtTime(targetGain, now + onTimeSec - attackDecay);
      this.isochronicPulsarGain.gain.linearRampToValueAtTime(0.0001, now + onTimeSec);
    };

    triggerPulse();
    this.pulseIntervalId = window.setInterval(triggerPulse, periodMs);
  }

  private setupNoise(type: NoiseType) {
    if (!this.ctx || !this.noiseGain) return;
    if (this.noiseNode) {
      try {
        (this.noiseNode as AudioBufferSourceNode).stop();
      } catch {
        // ignore
      }
      this.noiseNode.disconnect();
      this.noiseNode = null;
    }

    if (type === 'none') return;

    const bufferSize = this.ctx.sampleRate * 2; // 2 seconds looping buffer
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);

    if (type === 'white') {
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
    } else if (type === 'pink') {
      // Paul Kellet's filtered pink noise algorithm
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      }
    } else if (type === 'brownian') {
      // Brownian / Red Noise (integrated white noise with leaky integrator)
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5; // Gain compensation
      }
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(this.noiseGain);
    source.start();
    this.noiseNode = source;
  }

  // Generative Atmospheric Carrier Soundscapes
  public playSyntheticCarrier(preset: 'solfeggio528' | 'ambientDrone' | 'oceanWaves' | 'lofiChords' | 'tibetanBowls' | 'cosmicPad') {
    const ctx = this.initContext();
    this.stopSyntheticCarrier();

    if (!this.musicGain) {
      this.musicGain = ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.currentMusicVolume, ctx.currentTime);
      if (this.masterGain) {
        this.musicGain.connect(this.masterGain);
      } else {
        this.musicGain.connect(ctx.destination);
      }
    }

    if (preset === 'solfeggio528') {
      const freqs = [528, 528 * 0.5, 528 * 1.5, 396];
      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = idx === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(f, ctx.currentTime);

        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.setValueAtTime(0.1 + idx * 0.05, ctx.currentTime);
        lfoGain.gain.setValueAtTime(1.5, ctx.currentTime);
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        lfo.start();

        gain.gain.setValueAtTime(0.15 / (idx + 1), ctx.currentTime);
        osc.connect(gain);
        gain.connect(this.musicGain!);
        osc.start();

        this.synthNodes.push(osc, gain, lfo, lfoGain);
      });
    } else if (preset === 'ambientDrone') {
      const root = 108; // A2 (432/4)
      const intervals = [1, 1.5, 2, 2.25, 3];
      intervals.forEach((ratio, i) => {
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        osc.type = i % 2 === 0 ? 'sawtooth' : 'triangle';
        osc.frequency.setValueAtTime(root * ratio, ctx.currentTime);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(320 + i * 80, ctx.currentTime);

        gain.gain.setValueAtTime(0.12 / intervals.length, ctx.currentTime);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain!);
        osc.start();

        this.synthNodes.push(osc, filter, gain);
      });
    } else if (preset === 'oceanWaves') {
      const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 5, ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      let lastOut = 0;
      for (let i = 0; i < data.length; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = data[i];
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;

      const waveFilter = ctx.createBiquadFilter();
      waveFilter.type = 'bandpass';
      waveFilter.frequency.setValueAtTime(300, ctx.currentTime);
      waveFilter.Q.setValueAtTime(1.5, ctx.currentTime);

      const waveGain = ctx.createGain();
      waveGain.gain.setValueAtTime(0.3, ctx.currentTime);

      const swellLfo = ctx.createOscillator();
      const swellGain = ctx.createGain();
      swellLfo.frequency.setValueAtTime(1 / 12, ctx.currentTime);
      swellGain.gain.setValueAtTime(250, ctx.currentTime);
      swellLfo.connect(swellGain);
      swellGain.connect(waveFilter.frequency);
      swellLfo.start();

      noiseSource.connect(waveFilter);
      waveFilter.connect(waveGain);
      waveGain.connect(this.musicGain!);
      noiseSource.start();

      this.synthNodes.push(noiseSource, waveFilter, waveGain, swellLfo, swellGain);
    } else if (preset === 'lofiChords') {
      const chordNotes = [
        [146.83, 174.61, 220.0, 261.63, 329.63],
        [196.0, 246.94, 293.66, 329.63, 440.0],
        [130.81, 164.81, 196.0, 246.94, 293.66],
      ];
      let chordIndex = 0;

      const playChord = () => {
        if (!this.ctx || !this.musicGain) return;
        const notes = chordNotes[chordIndex];
        chordIndex = (chordIndex + 1) % chordNotes.length;

        notes.forEach((freq) => {
          const osc = ctx.createOscillator();
          const filter = ctx.createBiquadFilter();
          const gain = ctx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, ctx.currentTime);

          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(550, ctx.currentTime);

          const now = ctx.currentTime;
          gain.gain.setValueAtTime(0.001, now);
          gain.gain.linearRampToValueAtTime(0.06, now + 1.2);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 5.8);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(this.musicGain!);

          osc.start(now);
          osc.stop(now + 6.0);
        });
      };

      playChord();
      this.synthIntervalId = window.setInterval(playChord, 6000);
    } else if (preset === 'tibetanBowls') {
      const bowlFreqs = [192, 384, 576, 960, 1344];
      bowlFreqs.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f + (Math.random() * 2 - 1), ctx.currentTime);

        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.setValueAtTime(0.2 + idx * 0.1, ctx.currentTime);
        lfoGain.gain.setValueAtTime(0.02, ctx.currentTime);
        lfo.connect(lfoGain);

        gain.gain.setValueAtTime(0.12 / (idx + 1), ctx.currentTime);
        lfoGain.connect(gain.gain);
        lfo.start();

        osc.connect(gain);
        gain.connect(this.musicGain!);
        osc.start();

        this.synthNodes.push(osc, gain, lfo, lfoGain);
      });
    } else if (preset === 'cosmicPad') {
      const padFreqs = [110, 164.81, 220, 277.18, 329.63];
      padFreqs.forEach((f) => {
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(f, ctx.currentTime);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, ctx.currentTime);
        filter.Q.setValueAtTime(4.0, ctx.currentTime);

        const filterLfo = ctx.createOscillator();
        const filterGain = ctx.createGain();
        filterLfo.frequency.setValueAtTime(0.08, ctx.currentTime);
        filterGain.gain.setValueAtTime(250, ctx.currentTime);
        filterLfo.connect(filterGain);
        filterGain.connect(filter.frequency);
        filterLfo.start();

        gain.gain.setValueAtTime(0.04, ctx.currentTime);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain!);
        osc.start();

        this.synthNodes.push(osc, filter, gain, filterLfo, filterGain);
      });
    }
  }

  public stopSyntheticCarrier() {
    if (this.synthIntervalId) {
      window.clearInterval(this.synthIntervalId);
      this.synthIntervalId = null;
    }
    this.synthNodes.forEach((node) => {
      try {
        if ('stop' in node && typeof (node as OscillatorNode).stop === 'function') {
          (node as OscillatorNode).stop();
        }
        node.disconnect();
      } catch {
        // ignore
      }
    });
    this.synthNodes = [];
  }

  public connectAudioElement(element: HTMLAudioElement) {
    const ctx = this.initContext();
    this.audioElement = element;

    if (!this.audioSourceNode) {
      try {
        this.audioSourceNode = ctx.createMediaElementSource(element);
        if (!this.musicGain) {
          this.musicGain = ctx.createGain();
          this.musicGain.gain.setValueAtTime(this.currentMusicVolume, ctx.currentTime);
          if (this.masterGain) {
            this.musicGain.connect(this.masterGain);
          } else {
            this.musicGain.connect(ctx.destination);
          }
        }
        this.audioSourceNode.connect(this.musicGain);
      } catch {
        // media element already connected or handled
      }
    }
  }

  public glideToFrequency(newTargetBeatHz: number, durationSec: number = 4.0): void {
    if (Math.abs(this.targetBeatHz - newTargetBeatHz) < 0.05) {
      return;
    }

    this.startBeatHz = this.currentBeatHz;
    this.targetBeatHz = newTargetBeatHz;
    this.glideDurationSec = durationSec;
    this.glideStartTime = performance.now();
    this.isGliding = true;

    // Direct Web Audio parameter ramp to prevent clicks/pops
    if (this.ctx && this.rightOsc) {
      const now = this.ctx.currentTime;
      const targetRightFreq = this.currentBaseHz + this.targetBeatHz;
      this.rightOsc.frequency.cancelScheduledValues(now);
      this.rightOsc.frequency.setValueAtTime(this.currentBaseHz + this.currentBeatHz, now);
      this.rightOsc.frequency.linearRampToValueAtTime(targetRightFreq, now + durationSec);
    }

    this.updateIsochronicPulsar(this.targetBeatHz, 0.5);
  }

  private startGlideAnimationLoop() {
    const loop = () => {
      if (!this.isRunning) return;

      if (this.isGliding) {
        const elapsedSec = (performance.now() - this.glideStartTime) / 1000;
        const progress = Math.min(1.0, elapsedSec / this.glideDurationSec);

        // Smooth cosine ease-in-out curve
        const smoothT = 0.5 * (1 - Math.cos(progress * Math.PI));
        this.currentBeatHz = this.startBeatHz + (this.targetBeatHz - this.startBeatHz) * smoothT;

        if (this.glideProgressCallback) {
          this.glideProgressCallback(this.currentBeatHz, progress, this.isCrossfading);
        }

        if (progress >= 1.0) {
          this.currentBeatHz = this.targetBeatHz;
          this.isGliding = false;
          this.isCrossfading = false;
          if (this.glideProgressCallback) {
            this.glideProgressCallback(this.currentBeatHz, 1.0, false);
          }
        }
      }

      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  public onGlideProgress(callback: (currentBeatHz: number, progress: number, isCrossfading?: boolean) => void) {
    this.glideProgressCallback = callback;
  }

  public setBaseCarrierHz(baseHz: number): void {
    this.currentBaseHz = baseHz;
    if (this.ctx && this.leftOsc && this.rightOsc) {
      const now = this.ctx.currentTime;
      this.leftOsc.frequency.cancelScheduledValues(now);
      this.leftOsc.frequency.linearRampToValueAtTime(baseHz, now + 0.1);
      
      this.rightOsc.frequency.cancelScheduledValues(now);
      this.rightOsc.frequency.linearRampToValueAtTime(baseHz + this.currentBeatHz, now + 0.1);
    }
    if (this.isochronicOsc && this.ctx) {
      this.isochronicOsc.frequency.linearRampToValueAtTime(baseHz, this.ctx.currentTime + 0.1);
    }
  }

  public setMasterVolume(vol: number): void {
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, vol)), this.ctx.currentTime);
    }
  }

  public setMusicVolume(vol: number): void {
    this.currentMusicVolume = Math.max(0, Math.min(1, vol));
    if (this.ctx && this.musicGain) {
      this.musicGain.gain.setValueAtTime(this.currentMusicVolume, this.ctx.currentTime);
    }
    if (this.audioElement) {
      this.audioElement.volume = this.currentMusicVolume;
    }
  }

  public setCarrierMusicVolume(vol: number): void {
    this.setMusicVolume(vol);
  }

  public setBinauralMix(mix: number): void {
    if (this.ctx && this.binauralGain) {
      this.binauralGain.gain.setValueAtTime(Math.max(0, Math.min(1, mix)), this.ctx.currentTime);
    }
  }

  public setIsochronicMix(mix: number): void {
    if (this.ctx && this.isochronicGain) {
      this.isochronicGain.gain.setValueAtTime(Math.max(0, Math.min(1, mix)), this.ctx.currentTime);
    }
  }

  public setIsochronicDutyCycle(duty: number): void {
    this.updateIsochronicPulsar(this.currentBeatHz, duty);
  }

  public setNoiseType(type: NoiseType): void {
    this.setupNoise(type);
  }

  public setNoiseVolume(vol: number): void {
    if (this.ctx && this.noiseGain) {
      this.noiseGain.gain.setValueAtTime(Math.max(0, Math.min(1, vol)), this.ctx.currentTime);
    }
  }

  public stop(): void {
    if (this.pulseIntervalId) {
      window.clearInterval(this.pulseIntervalId);
      this.pulseIntervalId = null;
    }

    try {
      this.leftOsc?.stop();
      this.rightOsc?.stop();
      this.isochronicOsc?.stop();
      if (this.noiseNode) {
        (this.noiseNode as AudioBufferSourceNode).stop();
      }
    } catch {
      // ignore
    }

    this.stopSyntheticCarrier();

    this.leftOsc = null;
    this.rightOsc = null;
    this.isochronicOsc = null;
    this.noiseNode = null;
    this.isRunning = false;
    this.isGliding = false;
    this.isCrossfading = false;
  }

  public playCompletionChime(): void {
    const ctx = this.initContext();
    const now = ctx.currentTime;
    const chimeFrequencies = [528, 660, 792]; // Solfeggio resonant triad

    chimeFrequencies.forEach((freq, idx) => {
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0, now + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.08 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 2.8);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 3.0);
      } catch {
        // audio context safety
      }
    });
  }

  public getAnalyserData(dataArray: Uint8Array): void {
    if (this.analyser) {
      this.analyser.getByteTimeDomainData(dataArray);
    }
  }

  public getFrequencyData(dataArray: Uint8Array): void {
    if (this.analyser) {
      this.analyser.getByteFrequencyData(dataArray);
    }
  }
}

export const dspEngine = new NeuroDspEngine();
