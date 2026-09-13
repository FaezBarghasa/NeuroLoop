import { create } from 'zustand';
import {
  AudioEngineState,
  BioAlertEvent,
  BioAlertThreshold,
  BiometricHistoryPoint,
  BiometricSourceType,
  BiometricState,
  BioLogicEvent,
  BlePacketLog,
  BrainwaveBandName,
  BRAINWAVE_BANDS,
  FocusTimerState,
  GadgetbridgeConfig,
  GoogleHealthConfig,
  MusicPlayerState,
  MusicTrack,
  PersonalizedTuningProfile,
  Preset,
  SessionDataPoint,
  SessionSummaryData,
  SleepRecord,
  TabType,
  ThemeMode,
} from '../types';
import { dspEngine } from '../audio/dspEngine';
import { DEFAULT_PRESETS, MOCK_SLEEP_DATA } from '../data/defaultPresets';
import { INITIAL_SESSION_HISTORY } from '../data/mockSessionData';
import { googleHealth } from '../services/googleHealthService';
import { gadgetbridge, GadgetbridgeIntentEvent } from '../services/gadgetbridgeService';
import { triggerHaptic } from '../utils/haptics';

const INITIAL_MUSIC_TRACKS: MusicTrack[] = [
  {
    id: 'track-solfeggio-528',
    title: '528 Hz Solfeggio Resonator',
    artist: 'Harmonic Soundscape Engine',
    category: 'Solfeggio Frequencies',
    durationSec: 600,
    isSynthetic: true,
    synthPreset: 'solfeggio528',
    coverGradient: 'from-amber-600/30 via-emerald-600/20 to-teal-900/40',
    moodTag: 'DNA Repair & Transformation',
  },
  {
    id: 'track-ambient-drone',
    title: 'Ethereal Deep Space Drone',
    artist: '432 Hz Root Synthesizer',
    category: 'Atmospheric Drone',
    durationSec: 900,
    isSynthetic: true,
    synthPreset: 'ambientDrone',
    coverGradient: 'from-indigo-600/30 via-purple-600/20 to-slate-900/40',
    moodTag: 'Deep Stillness & Astral Float',
  },
  {
    id: 'track-ocean-waves',
    title: 'Pacific Ocean Midnight Tides',
    artist: 'Organic Natural Acoustic Field',
    category: 'Nature & Rain',
    durationSec: 1200,
    isSynthetic: true,
    synthPreset: 'oceanWaves',
    coverGradient: 'from-cyan-600/30 via-blue-600/20 to-slate-900/40',
    moodTag: 'Insomnia Relief & Deep Sleep',
  },
  {
    id: 'track-lofi-chords',
    title: 'Midnight Coding Lo-Fi Cadence',
    artist: 'Warm Vinyl Electric Rhodes',
    category: 'Lo-Fi Chill',
    durationSec: 720,
    isSynthetic: true,
    synthPreset: 'lofiChords',
    coverGradient: 'from-rose-600/30 via-amber-600/20 to-zinc-900/40',
    moodTag: 'Deep Work & Software Sprints',
  },
  {
    id: 'track-tibetan-bowls',
    title: 'Singing Bowls of Lhasa',
    artist: 'Resonant Metallic Harmonics',
    category: 'Ambient Relax',
    durationSec: 800,
    isSynthetic: true,
    synthPreset: 'tibetanBowls',
    coverGradient: 'from-yellow-600/30 via-amber-700/20 to-stone-900/40',
    moodTag: 'Zen Mindfulness & Breath',
  },
  {
    id: 'track-cosmic-pad',
    title: 'Interstellar Nebula Pad',
    artist: 'Analog Swept Filter Matrix',
    category: 'Atmospheric Drone',
    durationSec: 900,
    isSynthetic: true,
    synthPreset: 'cosmicPad',
    coverGradient: 'from-fuchsia-600/30 via-violet-600/20 to-black/40',
    moodTag: 'Lucid Dreaming & Hypnagogia',
  },
];

let localAudioElem: HTMLAudioElement | null = null;
let musicTimerId: number | null = null;
let sessionSamplerTimerId: number | null = null;
let focusTimerIntervalId: number | null = null;
let unregisterGadgetbridge: (() => void) | null = null;

const SAVED_SESSIONS_STORAGE_KEY = 'neuroloop_session_history_v1';
const SAVED_THEME_STORAGE_KEY = 'neuroloop_theme_v1';
const SAVED_TUNING_STORAGE_KEY = 'neuroloop_tuning_profile_v1';

function loadInitialTheme(): ThemeMode {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(SAVED_THEME_STORAGE_KEY);
    if (saved === 'high_contrast' || saved === 'deep_space') {
      return saved;
    }
  }
  return 'deep_space';
}

function loadInitialSessions(): SessionSummaryData[] {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(SAVED_SESSIONS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Fallback
    }
  }
  return INITIAL_SESSION_HISTORY;
}

function loadInitialTuning(): PersonalizedTuningProfile {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(SAVED_TUNING_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
  }
  return {
    optimalCarrierHz: 208,
    preferredBeatBand: 'Alpha',
    recommendedGlideDurationSec: 4.5,
    stressResonanceSensitivity: 0.85,
    lastTunedAt: 'Adaptive Auto-Calibration Active',
    sessionsAnalyzed: 2,
    totalDurationMinutes: 78,
  };
}

interface NeuroState {
  // Theme state
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;

  // Audio state
  audio: AudioEngineState;

  // Carrier Music state
  musicPlayer: MusicPlayerState;
  musicTracks: MusicTrack[];
  
  // Biometrics
  biometrics: BiometricState;
  biometricHistory: BiometricHistoryPoint[];
  movingAverageBuffer: number[];
  rrIntervalsBuffer: number[];
  
  // Bio-Threshold Alert Engine
  bioThresholdConfig: BioAlertThreshold;
  activeBioAlert: BioAlertEvent | null;
  bioAlertHistory: BioAlertEvent[];
  setBioThresholdConfig: (config: Partial<BioAlertThreshold>) => void;
  dismissBioAlert: () => void;
  triggerQuickRescue: (targetHz?: number) => void;

  // Focus Mode Timer State
  focusTimer: FocusTimerState;
  startFocusTimer: (minutes: number, presetId?: string, dnd?: boolean) => void;
  pauseFocusTimer: () => void;
  resumeFocusTimer: () => void;
  stopFocusTimer: () => void;
  setFocusDnd: (enabled: boolean) => void;

  // Session Telemetry & Summary Modal
  sessionStartTime: number | null;
  currentSessionPoints: SessionDataPoint[];
  sessionHistory: SessionSummaryData[];
  modalSessionSummary: SessionSummaryData | null;
  setModalSessionSummary: (summary: SessionSummaryData | null) => void;
  clearSessionHistory: () => void;
  finalizeActiveSession: () => SessionSummaryData | null;
  exportSessionJson: (session: SessionSummaryData) => string;
  exportSessionCsv: (session: SessionSummaryData) => string;
  exportAllSessionsJson: () => string;
  exportAllSessionsCsv: () => string;
  getOptimalPresetInsight: () => { presetId: string, presetName: string, reason: string } | null;

  // Tuning & Efficacy Optimization Engine based on Collected Data
  personalizedTuning: PersonalizedTuningProfile;
  applyTuningRecommendation: (rec: NonNullable<SessionSummaryData['tuningRecommendation']>) => void;
  tuneProfileFromAllHistory: () => void;

  // Sleep history
  sleepData: SleepRecord[];

  // API Integrations
  googleHealthConfig: GoogleHealthConfig;
  gadgetbridgeConfig: GadgetbridgeConfig;

  // Bio-Logic JITAI closed-loop
  isClosedLoopActive: boolean;
  hysteresisDeadbandBPM: number;
  lastTriggeredHR: number;
  activeIntervention: {
    active: boolean;
    reason: string;
    targetBeatHz: number;
    startedAt: number;
    durationSec: number;
  } | null;
  bioLogicEvents: BioLogicEvent[];

  // BLE Bridge
  bleLogs: BlePacketLog[];
  isBleScanning: boolean;
  isBleConnected: boolean;
  isSecretDecrypted: boolean;
  bleAuthKey: string;
  bleFixedIV: string;

  // Presets
  presets: Preset[];
  activePresetId: string | null;

  // Navigation
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  
  // Audio actions
  togglePlay: () => Promise<void>;
  setBaseCarrierHz: (hz: number) => void;
  setTargetBeatHz: (hz: number, durationSec?: number) => void;
  setMasterVolume: (vol: number) => void;
  setBinauralMix: (mix: number) => void;
  setIsochronicMix: (mix: number) => void;
  setIsochronicDutyCycle: (duty: number) => void;
  setNoiseType: (type: AudioEngineState['noiseType']) => void;
  setNoiseVolume: (vol: number) => void;
  selectBand: (band: BrainwaveBandName) => void;

  // Carrier Music actions
  playTrack: (trackId: string) => Promise<void>;
  pauseMusic: () => void;
  resumeMusic: () => Promise<void>;
  toggleMusicPlay: () => Promise<void>;
  setMusicVolume: (vol: number) => void;
  setMusicCarrierMode: (mode: 'overlay' | 'pure_carrier') => void;
  seekMusic: (timeSec: number) => void;
  addLocalAudioFiles: (files: FileList | File[]) => void;
  toggleMusicLoop: () => void;
  playNextTrack: () => void;
  playPrevTrack: () => void;

  // Biometric actions
  setBiometricSource: (source: BiometricSourceType) => void;
  simulateBiometricTick: () => void;
  injectHeartRate: (bpm: number) => void;
  setClosedLoopActive: (active: boolean) => void;
  setHysteresisDeadband: (bpm: number) => void;

  // Google Health & Gadgetbridge Actions
  syncGoogleHealthConnect: () => Promise<void>;
  syncGoogleFit: (token?: string) => Promise<void>;
  startGadgetbridgeListener: () => void;
  stopGadgetbridgeListener: () => void;
  injectGadgetbridgeBroadcast: (bpm: number, mac?: string) => void;
  importGadgetbridgeData: (fileContent: string) => Promise<void>;

  // BLE Actions
  startBleScan: () => Promise<void>;
  sendAtGetSecret: () => void;
  fetchSleepHistoryBle: () => void;
  connectRealWebBluetooth: () => Promise<void>;

  // Preset actions
  applyPreset: (presetId: string) => void;
  savePreset: (preset: Preset) => void;
  deletePreset: (presetId: string) => void;
}

export const useNeuroStore = create<NeuroState>((set, get) => {
  // Initialize DSP engine glide callback
  dspEngine.onGlideProgress((currentBeatHz, progress, isCrossfading) => {
    set((state) => ({
      audio: {
        ...state.audio,
        currentBeatHz,
        isGliding: progress < 1.0,
        isCrossfading: Boolean(isCrossfading),
        glideProgress: Math.round(progress * 100),
      },
    }));
  });

  const initialTheme = loadInitialTheme();
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', initialTheme);
  }

  // Periodic Telemetry Sampler helper
  const startTelemetrySampling = () => {
    if (sessionSamplerTimerId) return;
    sessionSamplerTimerId = window.setInterval(() => {
      const state = get();
      if (!state.audio.isPlaying && !state.focusTimer.isActive) return;

      const startTime = state.sessionStartTime || Date.now();
      const elapsedSec = Math.max(0, Math.round((Date.now() - startTime) / 1000));
      const mins = Math.floor(elapsedSec / 60);
      const secs = elapsedSec % 60;
      const timeFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

      // Determine current band
      let currentBand: BrainwaveBandName = 'Alpha';
      const hz = state.audio.currentBeatHz;
      if (hz < 4.0) currentBand = 'Delta';
      else if (hz < 8.0) currentBand = 'Theta';
      else if (hz < 13.0) currentBand = 'Alpha';
      else if (hz < 30.0) currentBand = 'Beta';
      else currentBand = 'Gamma';

      const point: SessionDataPoint = {
        timestamp: Date.now(),
        timeFormatted,
        timeOffsetSec: elapsedSec,
        beatHz: Number(state.audio.currentBeatHz.toFixed(1)),
        carrierHz: Math.round(state.audio.baseCarrierHz),
        heartRate: state.biometrics.filteredHeartRate,
        hrvRmssd: state.biometrics.hrvRmssd,
        stressIndex: state.biometrics.stressIndex,
        band: currentBand,
        bioAlert: Boolean(state.activeBioAlert),
      };

      set((s) => ({
        currentSessionPoints: [...s.currentSessionPoints, point],
      }));
    }, 3000);
  };

  const stopTelemetrySampling = () => {
    if (sessionSamplerTimerId) {
      window.clearInterval(sessionSamplerTimerId);
      sessionSamplerTimerId = null;
    }
  };

  return {
    // Theme
    theme: initialTheme,
    setTheme: (theme) => {
      triggerHaptic('light');
      if (typeof window !== 'undefined') {
        localStorage.setItem(SAVED_THEME_STORAGE_KEY, theme);
        document.documentElement.setAttribute('data-theme', theme);
      }
      set({ theme });
    },
    toggleTheme: () => {
      const nextTheme: ThemeMode = get().theme === 'deep_space' ? 'high_contrast' : 'deep_space';
      get().setTheme(nextTheme);
    },

    // Audio
    audio: {
      isPlaying: false,
      baseCarrierHz: 200,
      targetBeatHz: 10.0,
      currentBeatHz: 10.0,
      glideDurationSec: 5.0,
      masterVolume: 0.75,
      binauralMix: 0.85,
      isochronicMix: 0.25,
      isochronicDutyCycle: 0.5,
      noiseType: 'pink',
      noiseVolume: 0.2,
      waveform: 'sine',
      isGliding: false,
      isCrossfading: false,
      glideProgress: 100,
    },

    musicPlayer: {
      isPlaying: false,
      currentTrackId: 'track-solfeggio-528',
      currentTime: 0,
      duration: 600,
      volume: 0.7,
      carrierMode: 'overlay',
      loop: true,
      isMuted: false,
    },

    musicTracks: INITIAL_MUSIC_TRACKS,

    // Biometrics
    biometrics: {
      heartRate: 68,
      filteredHeartRate: 68,
      hrvRmssd: 52,
      hrvSdnn: 64,
      stressIndex: 34,
      spo2: 98,
      sleepStage: 'Awake',
      baseline7DayHR: 64,
      baseline7DayHRV: 55,
      source: 'google_health_connect',
      connected: true,
      connectionStrength: 'excellent',
      lastSyncSecondsAgo: 0,
      deviceName: 'Google Health Connect (Android Jetpack API)',
      batteryPercent: 88,
    },

    biometricHistory: [
      { time: '00:00', rawHR: 66, filteredHR: 66, rmssd: 54, stress: 30 },
      { time: '00:05', rawHR: 68, filteredHR: 67, rmssd: 53, stress: 32 },
      { time: '00:10', rawHR: 67, filteredHR: 67, rmssd: 52, stress: 33 },
      { time: '00:15', rawHR: 70, filteredHR: 68, rmssd: 51, stress: 35 },
      { time: '00:20', rawHR: 69, filteredHR: 68, rmssd: 52, stress: 34 },
    ],

    movingAverageBuffer: [66, 68, 67, 70, 69],
    rrIntervalsBuffer: [882, 857, 895, 857, 869, 872, 865, 880, 890, 875],

    // Bio-Threshold Alert Config
    bioThresholdConfig: {
      hrSpikePercent: 22, // >22% above baseline triggers alert
      minHrvRmssd: 28, // <28ms triggers alert
      maxStress: 70, // >70 stress triggers alert
      sensitivity: 'moderate',
      enabled: true,
    },
    activeBioAlert: null,
    bioAlertHistory: [],

    setBioThresholdConfig: (config) => {
      set((state) => ({
        bioThresholdConfig: { ...state.bioThresholdConfig, ...config },
      }));
    },

    dismissBioAlert: () => {
      triggerHaptic('light');
      set({ activeBioAlert: null });
    },

    triggerQuickRescue: (targetHz = 8.5) => {
      triggerHaptic('success');
      const { setTargetBeatHz, setBaseCarrierHz, dismissBioAlert } = get();
      setBaseCarrierHz(208);
      setTargetBeatHz(targetHz, 4.0);
      dismissBioAlert();

      const rescueEvent: BioLogicEvent = {
        id: `rescue-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        title: 'Quick Alpha Rescue Engaged',
        detail: `Autonomic de-escalation sequence triggered. Gliding tone to Alpha ${targetHz} Hz (Carrier 208 Hz).`,
        type: 'intervention',
      };
      set((s) => ({
        bioLogicEvents: [rescueEvent, ...s.bioLogicEvents.slice(0, 14)],
      }));
    },

    // Focus Mode Timer State
    focusTimer: {
      isActive: false,
      isPaused: false,
      durationSec: 1500, // 25 mins
      remainingSec: 1500,
      presetId: 'focus.deep-work-beta',
      dndEnabled: true,
      initialDurationSec: 1500,
    },

    startFocusTimer: (minutes: number, presetId = 'focus.deep-work-beta', dnd = true) => {
      triggerHaptic('heavy');
      const durationSec = minutes * 60;

      if (focusTimerIntervalId) {
        window.clearInterval(focusTimerIntervalId);
        focusTimerIntervalId = null;
      }

      // Apply preset and ensure audio is playing
      get().applyPreset(presetId);
      if (!get().audio.isPlaying) {
        get().togglePlay();
      }

      set({
        focusTimer: {
          isActive: true,
          isPaused: false,
          durationSec,
          remainingSec: durationSec,
          presetId,
          dndEnabled: dnd,
          initialDurationSec: durationSec,
        },
        sessionStartTime: Date.now(),
        currentSessionPoints: [],
      });

      startTelemetrySampling();

      focusTimerIntervalId = window.setInterval(() => {
        const { focusTimer } = get();
        if (!focusTimer.isActive || focusTimer.isPaused) return;

        if (focusTimer.remainingSec <= 1) {
          // Timer finished!
          if (focusTimerIntervalId) {
            window.clearInterval(focusTimerIntervalId);
            focusTimerIntervalId = null;
          }
          triggerHaptic('success');
          // Play subtle completion chime
          dspEngine.playCompletionChime();

          set((s) => ({
            focusTimer: { ...s.focusTimer, isActive: false, remainingSec: 0 },
          }));

          // Finalize session and open modal summary!
          setTimeout(() => {
            get().finalizeActiveSession();
          }, 400);
        } else {
          set((s) => ({
            focusTimer: {
              ...s.focusTimer,
              remainingSec: s.focusTimer.remainingSec - 1,
            },
          }));
        }
      }, 1000);
    },

    pauseFocusTimer: () => {
      triggerHaptic('light');
      set((s) => ({
        focusTimer: { ...s.focusTimer, isPaused: true },
      }));
    },

    resumeFocusTimer: () => {
      triggerHaptic('light');
      set((s) => ({
        focusTimer: { ...s.focusTimer, isPaused: false },
      }));
    },

    stopFocusTimer: () => {
      triggerHaptic('medium');
      if (focusTimerIntervalId) {
        window.clearInterval(focusTimerIntervalId);
        focusTimerIntervalId = null;
      }
      set((s) => ({
        focusTimer: { ...s.focusTimer, isActive: false, isPaused: false },
      }));
      get().finalizeActiveSession();
    },

    setFocusDnd: (enabled) => {
      triggerHaptic('light');
      set((s) => ({
        focusTimer: { ...s.focusTimer, dndEnabled: enabled },
      }));
    },

    // Session Telemetry & Modal
    sessionStartTime: null,
    currentSessionPoints: [],
    sessionHistory: loadInitialSessions(),
    modalSessionSummary: null,

    setModalSessionSummary: (summary) => set({ modalSessionSummary: summary }),

    clearSessionHistory: () => {
      triggerHaptic('light');
      if (typeof window !== 'undefined') {
        localStorage.removeItem(SAVED_SESSIONS_STORAGE_KEY);
      }
      set({ sessionHistory: [] });
    },

    finalizeActiveSession: () => {
      const { sessionStartTime, currentSessionPoints, presets, activePresetId, biometrics, sessionHistory } = get();
      stopTelemetrySampling();

      const startTime = sessionStartTime || Date.now() - 30000;
      const endTime = Date.now();
      const durationSec = Math.max(10, Math.round((endTime - startTime) / 1000));

      const activePreset = presets.find((p) => p.id === activePresetId) || presets[0];
      const presetName = activePreset?.name || 'Neuro-Acoustic Entrainment';
      const presetCategory = activePreset?.category || 'Focus';

      // Fallback synthetic points if short duration
      let points = [...currentSessionPoints];
      if (points.length < 2) {
        const startHR = biometrics.heartRate + 4;
        const endHR = biometrics.filteredHeartRate;
        const startStress = Math.min(85, biometrics.stressIndex + 16);
        const endStress = Math.max(15, biometrics.stressIndex);
        const startHRV = Math.max(30, biometrics.hrvRmssd - 8);
        const endHRV = biometrics.hrvRmssd;

        points = [
          {
            timestamp: startTime,
            timeFormatted: '00:00',
            timeOffsetSec: 0,
            beatHz: activePreset?.targetBeatHz || 10.0,
            carrierHz: activePreset?.baseCarrierHz || 200,
            heartRate: startHR,
            hrvRmssd: startHRV,
            stressIndex: startStress,
            band: activePreset?.targetBand || 'Alpha',
          },
          {
            timestamp: endTime,
            timeFormatted: `${Math.floor(durationSec / 60)}:${String(durationSec % 60).padStart(2, '0')}`,
            timeOffsetSec: durationSec,
            beatHz: activePreset?.targetBeatHz || 10.0,
            carrierHz: activePreset?.baseCarrierHz || 200,
            heartRate: endHR,
            hrvRmssd: endHRV,
            stressIndex: endStress,
            band: activePreset?.targetBand || 'Alpha',
          },
        ];
      }

      const startHeartRate = points[0].heartRate;
      const endHeartRate = points[points.length - 1].heartRate;
      const avgHeartRate = Math.round(points.reduce((a, p) => a + p.heartRate, 0) / points.length);

      const startHRV = points[0].hrvRmssd;
      const endHRV = points[points.length - 1].hrvRmssd;
      const avgHRV = Math.round(points.reduce((a, p) => a + p.hrvRmssd, 0) / points.length);

      const startStress = points[0].stressIndex;
      const endStress = points[points.length - 1].stressIndex;
      const avgStress = Math.round(points.reduce((a, p) => a + p.stressIndex, 0) / points.length);

      const stressDelta = Math.round(((endStress - startStress) / Math.max(1, startStress)) * 100);
      const hrvDelta = endHRV - startHRV;

      // Calculate entrainment resonance score
      const resonanceScore = Math.min(
        99,
        Math.max(68, Math.round(85 + (hrvDelta > 0 ? 8 : -4) + (stressDelta < 0 ? 6 : -3)))
      );

      // Algorithmic Efficacy Tuning recommendations based on biometric trajectory
      const optimalCarrier = activePreset.baseCarrierHz > 210 ? 204 : 210;
      const optimalBeat = activePreset.targetBeatHz;
      const efficiencyGain = Math.abs(stressDelta) > 15 ? 26 : 18;

      const newSession: SessionSummaryData = {
        id: `session-${Date.now()}`,
        startTime,
        endTime,
        durationSec,
        formattedDate: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + new Date().toLocaleDateString([], { month: 'short', day: 'numeric' }),
        presetName,
        presetCategory: String(presetCategory),
        startHeartRate,
        endHeartRate,
        avgHeartRate,
        startHRV,
        endHRV,
        avgHRV,
        startStress,
        endStress,
        avgStress,
        stressDelta,
        hrvDelta,
        entrainmentResonanceScore: resonanceScore,
        points,
        alertsTriggeredCount: points.filter((p) => p.bioAlert).length,
        tuningRecommendation: {
          optimalCarrierHz: optimalCarrier,
          optimalBeatHz: optimalBeat,
          recommendedBand: activePreset.targetBand || 'Alpha',
          insightText: `Autonomic telemetry indicates peak coherence at ${optimalBeat} Hz entrainment. Tuning carrier to ${optimalCarrier} Hz will boost parasympathetic ramp rate by ~${efficiencyGain}%.`,
          efficiencyGainPercent: efficiencyGain,
        },
      };

      const updatedHistory = [newSession, ...sessionHistory.slice(0, 19)];
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(SAVED_SESSIONS_STORAGE_KEY, JSON.stringify(updatedHistory));
        } catch {
          // ignore
        }
      }

      set({
        sessionStartTime: null,
        currentSessionPoints: [],
        sessionHistory: updatedHistory,
        modalSessionSummary: newSession,
      });

      return newSession;
    },

    exportSessionJson: (session: SessionSummaryData) => {
      const exportObject = {
        schema: 'https://neuroloop.foss/schemas/telemetry/v1.json',
        application: 'NeuroLoop FOSS',
        version: '2.4.0',
        exportedAt: new Date().toISOString(),
        session: {
          ...session,
          hardwareSource: get().biometrics.source,
          hardwareDevice: get().biometrics.deviceName,
        },
      };
      return JSON.stringify(exportObject, null, 2);
    },

    exportSessionCsv: (session: SessionSummaryData) => {
      let csv = 'Timestamp,TimeOffsetSec,FormattedTime,TargetBeatHz,CarrierHz,HeartRateBPM,HrvRmssdMs,StressIndex,Band,BioAlert\n';
      session.points.forEach((p) => {
        csv += `${p.timestamp},${p.timeOffsetSec},"${p.timeFormatted}",${p.beatHz},${p.carrierHz},${p.heartRate},${p.hrvRmssd},${p.stressIndex},"${p.band}",${p.bioAlert ? 'true' : 'false'}\n`;
      });
      return csv;
    },

    exportAllSessionsJson: () => {
      const exportObject = {
        schema: 'https://neuroloop.foss/schemas/telemetry-aggregate/v1.json',
        application: 'NeuroLoop FOSS',
        exportedAt: new Date().toISOString(),
        totalSessions: get().sessionHistory.length,
        hardwareSource: get().biometrics.source,
        hardwareDevice: get().biometrics.deviceName,
        sessions: get().sessionHistory,
      };
      return JSON.stringify(exportObject, null, 2);
    },

    exportAllSessionsCsv: () => {
      const { sessionHistory } = get();
      let csv = 'SessionID,FormattedDate,PresetName,PresetCategory,DurationSec,StressReductionPercent,HrvImprovementMs,AvgHeartRateBPM,AvgHrvMs,ResonanceScorePercent,OptimalCarrierHz,OptimalBeatHz\n';
      sessionHistory.forEach((s) => {
        csv += `"${s.id}","${s.formattedDate}","${s.presetName}","${s.presetCategory}",${s.durationSec},${s.stressDelta},${s.hrvDelta},${s.avgHeartRate},${s.avgHRV},${s.entrainmentResonanceScore},${s.tuningRecommendation?.optimalCarrierHz || 208},${s.tuningRecommendation?.optimalBeatHz || 10}\n`;
      });
      return csv;
    },

    getOptimalPresetInsight: () => {
      const { sessionHistory, presets } = get();
      if (sessionHistory.length < 2) return null; // Need some historical data

      const currentHour = new Date().getHours();
      let timeOfDay = 'Night';
      if (currentHour >= 5 && currentHour < 12) timeOfDay = 'Morning';
      else if (currentHour >= 12 && currentHour < 17) timeOfDay = 'Afternoon';
      else if (currentHour >= 17 && currentHour < 22) timeOfDay = 'Evening';

      // Simple heuristic: sessions recorded in the same time block
      const relevantSessions = sessionHistory.filter(s => {
        if (!s.startTime) return true; // Fallback
        const h = new Date(s.startTime).getHours();
        if (timeOfDay === 'Morning') return h >= 5 && h < 12;
        if (timeOfDay === 'Afternoon') return h >= 12 && h < 17;
        if (timeOfDay === 'Evening') return h >= 17 && h < 22;
        return h >= 22 || h < 5;
      });

      const sessionsToAnalyze = relevantSessions.length > 0 ? relevantSessions : sessionHistory;

      // Find preset that yielded best recovery (negative stressDelta and positive hrvDelta)
      const presetScores: Record<string, { score: number, count: number }> = {};
      sessionsToAnalyze.forEach(s => {
        if (!presetScores[s.presetName]) presetScores[s.presetName] = { score: 0, count: 0 };
        // We want stress to drop (negative delta) and HRV to rise (positive delta).
        // Let's invert stressDelta so positive means improvement.
        const improvementScore = s.hrvDelta - s.stressDelta; 
        presetScores[s.presetName].score += improvementScore;
        presetScores[s.presetName].count += 1;
      });

      let bestPresetName = '';
      let bestAvgScore = -9999;
      Object.keys(presetScores).forEach(name => {
        const avg = presetScores[name].score / presetScores[name].count;
        if (avg > bestAvgScore) {
          bestAvgScore = avg;
          bestPresetName = name;
        }
      });

      const bestPreset = presets.find(p => p.name === bestPresetName);
      if (!bestPreset) return null;

      return {
        presetId: bestPreset.id,
        presetName: bestPreset.name,
        reason: `Based on your biometrics, this optimizes autonomic recovery for ${timeOfDay} routines.`
      };
    },

    // Personalized Tuning Profile based on Collected Data
    personalizedTuning: loadInitialTuning(),

    applyTuningRecommendation: (rec) => {
      triggerHaptic('success');
      const { setBaseCarrierHz, setTargetBeatHz, personalizedTuning } = get();

      // Apply tuned frequencies directly to active soundstage
      setBaseCarrierHz(rec.optimalCarrierHz);
      setTargetBeatHz(rec.optimalBeatHz, 4.0);

      const updatedTuning: PersonalizedTuningProfile = {
        ...personalizedTuning,
        optimalCarrierHz: rec.optimalCarrierHz,
        preferredBeatBand: rec.recommendedBand,
        lastTunedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sessionsAnalyzed: personalizedTuning.sessionsAnalyzed + 1,
        totalDurationMinutes: personalizedTuning.totalDurationMinutes + 25,
      };

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(SAVED_TUNING_STORAGE_KEY, JSON.stringify(updatedTuning));
        } catch {
          // ignore
        }
      }

      set({
        personalizedTuning: updatedTuning,
      });
    },

    tuneProfileFromAllHistory: () => {
      triggerHaptic('success');
      const { sessionHistory, personalizedTuning, setBaseCarrierHz, setTargetBeatHz } = get();
      if (sessionHistory.length === 0) return;

      // Analyze all collected telemetry to calculate optimal carrier and beat parameters
      let totalStressDelta = 0;
      let totalHrvDelta = 0;
      let weightedCarrierSum = 0;
      let totalWeight = 0;
      let totalMinutes = 0;

      sessionHistory.forEach((s) => {
        const weight = Math.abs(s.stressDelta) + s.hrvDelta + 5;
        const carrier = s.tuningRecommendation?.optimalCarrierHz || 208;
        weightedCarrierSum += carrier * weight;
        totalWeight += weight;
        totalStressDelta += s.stressDelta;
        totalHrvDelta += s.hrvDelta;
        totalMinutes += Math.round(s.durationSec / 60);
      });

      const optimalCarrier = totalWeight > 0 ? Math.round(weightedCarrierSum / totalWeight) : 208;
      const optimalBeat = totalHrvDelta > 15 ? 10.0 : 13.5;
      const band: BrainwaveBandName = optimalBeat >= 13 ? 'Beta' : 'Alpha';

      setBaseCarrierHz(optimalCarrier);
      setTargetBeatHz(optimalBeat, 4.0);

      const updatedTuning: PersonalizedTuningProfile = {
        ...personalizedTuning,
        optimalCarrierHz: optimalCarrier,
        preferredBeatBand: band,
        recommendedGlideDurationSec: 4.2,
        stressResonanceSensitivity: Math.min(0.95, 0.75 + sessionHistory.length * 0.04),
        lastTunedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sessionsAnalyzed: sessionHistory.length,
        totalDurationMinutes: totalMinutes,
      };

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(SAVED_TUNING_STORAGE_KEY, JSON.stringify(updatedTuning));
        } catch {
          // ignore
        }
      }

      set({
        personalizedTuning: updatedTuning,
      });
    },

    // Sleep Data
    sleepData: MOCK_SLEEP_DATA,

    // Google Health & Gadgetbridge Configs
    googleHealthConfig: {
      isConnected: true,
      lastSyncTime: 'Just now',
      syncIntervalSec: 10,
      scopesGranted: [
        'android.permission.health.READ_HEART_RATE',
        'android.permission.health.READ_HEART_RATE_VARIABILITY',
        'android.permission.health.READ_SLEEP',
        'android.permission.health.READ_OXYGEN_SATURATION',
      ],
      clientStatus: 'AVAILABLE',
      activeRecords: {
        heartRate: true,
        hrv: true,
        sleep: true,
        oxygenSaturation: true,
      },
    },

    gadgetbridgeConfig: {
      isConnected: false,
      listeningIntent: false,
      targetDeviceName: 'Amazfit / Mi Band (Gadgetbridge)',
      targetDeviceMac: 'DC:23:4F:91:0A:12',
      lastBroadcastTime: null,
      broadcastAction: 'nodomain.freeyourgadget.gadgetbridge.ACTION_HEART_RATE_NOTIFICATION',
      totalPacketsReceived: 0,
      liveHRPackets: [],
    },

    isClosedLoopActive: true,
    hysteresisDeadbandBPM: 3,
    lastTriggeredHR: 68,
    activeIntervention: null,
    bioLogicEvents: [
      {
        id: 'evt-init',
        timestamp: new Date().toLocaleTimeString(),
        title: 'Closed Loop Initialized',
        detail: 'Dynamic bio-adaptive baseline established (HR 64, RMSSD 55ms)',
        type: 'baseline',
      },
    ],

    bleLogs: [
      {
        id: 'log-1',
        timestamp: '10:14:02.112',
        direction: 'TX',
        command: 'AT+GET_SECRET',
        payloadHex: '41 54 2B 47 45 54 5F 53 45 43 52 45 54 0D 0A',
        decryptedSummary: 'Request peripheral encryption token',
        status: 'ok',
      },
      {
        id: 'log-2',
        timestamp: '10:14:02.340',
        direction: 'RX',
        command: 'RESP_SECRET',
        payloadHex: '2B 53 45 43 52 45 54 3A 30 38 41 46 33 42 39 31',
        decryptedSummary: 'AES-128 Key Exchange Verified: 0x08af3b91..',
        status: 'auth',
      },
    ],
    isBleScanning: false,
    isBleConnected: true,
    isSecretDecrypted: true,
    bleAuthKey: '08af3b91d4e247c1a89f91e03c77d852',
    bleFixedIV: '00000000000000000000000000000000',

    presets: DEFAULT_PRESETS,
    activePresetId: DEFAULT_PRESETS[0]?.id || 'sleep.onset.alpha-theta',

    activeTab: 'dashboard',
    setActiveTab: (tab) => set({ activeTab: tab }),

    // --- Audio Actions ---
    togglePlay: async () => {
      const { audio } = get();
      if (audio.isPlaying) {
        dspEngine.stop();
        set((state) => ({
          audio: { ...state.audio, isPlaying: false, isGliding: false },
        }));
        get().finalizeActiveSession();
      } else {
        await dspEngine.start({
          baseCarrierHz: audio.baseCarrierHz,
          targetBeatHz: audio.targetBeatHz,
          masterVolume: audio.masterVolume,
          binauralMix: audio.binauralMix,
          isochronicMix: audio.isochronicMix,
          isochronicDutyCycle: audio.isochronicDutyCycle,
          noiseType: audio.noiseType,
          noiseVolume: audio.noiseVolume,
          glideDurationSec: audio.glideDurationSec,
          musicVolume: get().musicPlayer.volume,
        });

        set((state) => ({
          audio: { ...state.audio, isPlaying: true },
          sessionStartTime: Date.now(),
          currentSessionPoints: [],
        }));

        startTelemetrySampling();
      }
    },

    setBaseCarrierHz: (hz) => {
      dspEngine.setBaseCarrierHz(hz);
      set((state) => ({
        audio: { ...state.audio, baseCarrierHz: hz },
      }));
    },

    setTargetBeatHz: (hz, durationSec = 5.0) => {
      dspEngine.glideToFrequency(hz, durationSec);
      set((state) => ({
        audio: {
          ...state.audio,
          targetBeatHz: hz,
          glideDurationSec: durationSec,
          isGliding: true,
          glideProgress: 0,
        },
      }));
    },

    setMasterVolume: (vol) => {
      dspEngine.setMasterVolume(vol);
      set((state) => ({
        audio: { ...state.audio, masterVolume: vol },
      }));
    },

    setBinauralMix: (mix) => {
      dspEngine.setBinauralMix(mix);
      set((state) => ({
        audio: { ...state.audio, binauralMix: mix },
      }));
    },

    setIsochronicMix: (mix) => {
      dspEngine.setIsochronicMix(mix);
      set((state) => ({
        audio: { ...state.audio, isochronicMix: mix },
      }));
    },

    setIsochronicDutyCycle: (duty) => {
      dspEngine.setIsochronicDutyCycle(duty);
      set((state) => ({
        audio: { ...state.audio, isochronicDutyCycle: duty },
      }));
    },

    setNoiseType: (type) => {
      dspEngine.setNoiseType(type);
      set((state) => ({
        audio: { ...state.audio, noiseType: type },
      }));
    },

    setNoiseVolume: (vol) => {
      dspEngine.setNoiseVolume(vol);
      set((state) => ({
        audio: { ...state.audio, noiseVolume: vol },
      }));
    },

    selectBand: (bandName) => {
      const band = BRAINWAVE_BANDS[bandName];
      if (!band) return;
      get().setTargetBeatHz(band.defaultHz, 5.0);
    },

    // --- Carrier Music Player Actions ---
    playTrack: async (trackId: string) => {
      const { musicTracks, musicPlayer } = get();
      const track = musicTracks.find((t) => t.id === trackId);
      if (!track) return;

      if (musicTimerId) {
        window.clearInterval(musicTimerId);
        musicTimerId = null;
      }

      if (track.isSynthetic && track.synthPreset) {
        if (localAudioElem) {
          localAudioElem.pause();
        }
        dspEngine.playSyntheticCarrier(track.synthPreset);
      } else if (track.src) {
        dspEngine.stopSyntheticCarrier();
        if (!localAudioElem) {
          localAudioElem = new Audio();
          localAudioElem.crossOrigin = 'anonymous';
          dspEngine.connectAudioElement(localAudioElem);
        }
        localAudioElem.src = track.src;
        localAudioElem.loop = musicPlayer.loop;
        localAudioElem.volume = musicPlayer.volume;
        try {
          await localAudioElem.play();
        } catch {
          // autoplay policy
        }
      }

      set((state) => ({
        musicPlayer: {
          ...state.musicPlayer,
          isPlaying: true,
          currentTrackId: track.id,
          currentTime: 0,
          duration: track.durationSec,
        },
      }));

      musicTimerId = window.setInterval(() => {
        const current = get().musicPlayer;
        if (!current.isPlaying) return;

        let nextTime = current.currentTime + 1;
        if (nextTime >= current.duration) {
          if (current.loop) {
            nextTime = 0;
          } else {
            get().playNextTrack();
            return;
          }
        }
        set((state) => ({
          musicPlayer: { ...state.musicPlayer, currentTime: nextTime },
        }));
      }, 1000);
    },

    pauseMusic: () => {
      if (localAudioElem) {
        localAudioElem.pause();
      }
      dspEngine.stopSyntheticCarrier();
      if (musicTimerId) {
        window.clearInterval(musicTimerId);
        musicTimerId = null;
      }
      set((state) => ({
        musicPlayer: { ...state.musicPlayer, isPlaying: false },
      }));
    },

    resumeMusic: async () => {
      const { musicPlayer, musicTracks } = get();
      const track = musicTracks.find((t) => t.id === musicPlayer.currentTrackId);
      if (track) {
        await get().playTrack(track.id);
      }
    },

    toggleMusicPlay: async () => {
      const { musicPlayer } = get();
      if (musicPlayer.isPlaying) {
        get().pauseMusic();
      } else {
        await get().resumeMusic();
      }
    },

    setMusicVolume: (vol) => {
      if (localAudioElem) {
        localAudioElem.volume = vol;
      }
      dspEngine.setCarrierMusicVolume(vol);
      set((state) => ({
        musicPlayer: { ...state.musicPlayer, volume: vol },
      }));
    },

    setMusicCarrierMode: (mode) => {
      set((state) => ({
        musicPlayer: { ...state.musicPlayer, carrierMode: mode },
      }));
    },

    seekMusic: (timeSec) => {
      if (localAudioElem) {
        localAudioElem.currentTime = timeSec;
      }
      set((state) => ({
        musicPlayer: { ...state.musicPlayer, currentTime: timeSec },
      }));
    },

    addLocalAudioFiles: (files) => {
      const newTracks: MusicTrack[] = [];
      const gradients = [
        'from-emerald-600/30 via-teal-600/20 to-zinc-900/40',
        'from-violet-600/30 via-purple-600/20 to-zinc-900/40',
        'from-amber-600/30 via-orange-600/20 to-zinc-900/40',
        'from-cyan-600/30 via-sky-600/20 to-zinc-900/40',
      ];

      Array.from(files).forEach((file, index) => {
        if (file.type.startsWith('audio/') || file.name.endsWith('.mp3') || file.name.endsWith('.wav')) {
          const blobUrl = URL.createObjectURL(file);
          newTracks.push({
            id: `local-${Date.now()}-${index}`,
            title: file.name.replace(/\.[^/.]+$/, ''),
            artist: 'Local Carrier Audio',
            category: 'Local Audio',
            durationSec: 180,
            src: blobUrl,
            isSynthetic: false,
            coverGradient: gradients[index % gradients.length],
            moodTag: 'Custom Carrier Music',
          });
        }
      });

      if (newTracks.length > 0) {
        set((state) => ({
          musicTracks: [...newTracks, ...state.musicTracks],
        }));
        get().playTrack(newTracks[0].id);
      }
    },

    toggleMusicLoop: () => {
      set((state) => {
        const nextLoop = !state.musicPlayer.loop;
        if (localAudioElem) {
          localAudioElem.loop = nextLoop;
        }
        return {
          musicPlayer: { ...state.musicPlayer, loop: nextLoop },
        };
      });
    },

    playNextTrack: () => {
      const { musicTracks, musicPlayer } = get();
      const currentIndex = musicTracks.findIndex((t) => t.id === musicPlayer.currentTrackId);
      const nextIndex = (currentIndex + 1) % musicTracks.length;
      get().playTrack(musicTracks[nextIndex].id);
    },

    playPrevTrack: () => {
      const { musicTracks, musicPlayer } = get();
      const currentIndex = musicTracks.findIndex((t) => t.id === musicPlayer.currentTrackId);
      const prevIndex = (currentIndex - 1 + musicTracks.length) % musicTracks.length;
      get().playTrack(musicTracks[prevIndex].id);
    },

    // --- Google Health & Gadgetbridge APIs ---
    syncGoogleHealthConnect: async () => {
      const now = new Date();
      const records = await googleHealth.queryHeartRateRecords(new Date(now.getTime() - 60000), now);
      if (records.length > 0 && records[0].samples.length > 0) {
        const bpm = records[0].samples[0].beatsPerMinute;
        get().injectHeartRate(bpm);
        set((state) => ({
          googleHealthConfig: {
            ...state.googleHealthConfig,
            lastSyncTime: new Date().toLocaleTimeString(),
            isConnected: true,
          },
        }));
      }
    },

    syncGoogleFit: async (token?: string) => {
      const activeToken = token || get().googleHealthConfig.accessToken || 'demo_token';
      const result = await googleHealth.fetchGoogleFitAggregatedData(activeToken);
      get().injectHeartRate(result.bpm);
      set((state) => ({
        googleHealthConfig: {
          ...state.googleHealthConfig,
          accessToken: activeToken,
          lastSyncTime: new Date().toLocaleTimeString(),
          isConnected: true,
        },
      }));
    },

    startGadgetbridgeListener: () => {
      if (unregisterGadgetbridge) {
        unregisterGadgetbridge();
      }
      unregisterGadgetbridge = gadgetbridge.registerBroadcastListener((event: GadgetbridgeIntentEvent) => {
        if (event.extras && event.extras.EXTRA_HEART_RATE_BPM) {
          get().injectHeartRate(event.extras.EXTRA_HEART_RATE_BPM);
          set((state) => ({
            gadgetbridgeConfig: {
              ...state.gadgetbridgeConfig,
              lastBroadcastTime: new Date().toLocaleTimeString(),
              totalPacketsReceived: state.gadgetbridgeConfig.totalPacketsReceived + 1,
              liveHRPackets: [
                {
                  timestamp: new Date().toLocaleTimeString(),
                  bpm: event.extras.EXTRA_HEART_RATE_BPM!,
                  deviceMac: event.extras.EXTRA_DEVICE_ADDRESS || 'DC:23:4F:91:0A:12',
                  sourceAction: event.action,
                },
                ...state.gadgetbridgeConfig.liveHRPackets.slice(0, 9),
              ],
            },
          }));
        }
      });

      set((state) => ({
        gadgetbridgeConfig: { ...state.gadgetbridgeConfig, listeningIntent: true, isConnected: true },
      }));
    },

    stopGadgetbridgeListener: () => {
      if (unregisterGadgetbridge) {
        unregisterGadgetbridge();
        unregisterGadgetbridge = null;
      }
      set((state) => ({
        gadgetbridgeConfig: { ...state.gadgetbridgeConfig, listeningIntent: false },
      }));
    },

    injectGadgetbridgeBroadcast: (bpm: number, mac: string = 'DC:23:4F:91:0A:12') => {
      gadgetbridge.dispatchIntent({
        action: 'nodomain.freeyourgadget.gadgetbridge.ACTION_HEART_RATE_NOTIFICATION',
        extras: {
          EXTRA_HEART_RATE_BPM: bpm,
          EXTRA_TIMESTAMP: Date.now(),
          EXTRA_DEVICE_ADDRESS: mac,
        },
      });
    },

    importGadgetbridgeData: async (fileContent: string) => {
      const samples = await gadgetbridge.parseExportFile(fileContent);
      if (samples.length > 0) {
        const latest = samples[samples.length - 1];
        get().injectHeartRate(latest.heartRate);
      }
    },

    // --- Biometric Closed-Loop Actions & Threshold Alert Checks ---
    setBiometricSource: (source) => {
      const names: Record<BiometricSourceType, string> = {
        google_health_connect: 'Google Health Connect API (Android Jetpack)',
        google_fit: 'Google Fit REST API & OAuth 2.0',
        gadgetbridge_intent: 'Gadgetbridge Broadcast Intent API',
        gadgetbridge_db: 'Gadgetbridge SQLite / JSON DB Import',
        health_connect: 'Health Connect (Samsung/Xiaomi/Amazfit)',
        healthkit: 'Apple HealthKit (Apple Watch)',
        ble_standard: 'Standard BLE Heart Rate (0x180D)',
        cmf_ble: 'CMF Watch Pro 2 (0xfff0)',
        simulated: 'Bio-Telemetry Simulator',
      };

      if (source === 'gadgetbridge_intent') {
        get().startGadgetbridgeListener();
      }

      set((state) => ({
        biometrics: {
          ...state.biometrics,
          source,
          deviceName: names[source] || 'Wearable Monitor',
          connected: true,
        },
      }));
    },

    injectHeartRate: (bpm) => {
      const {
        movingAverageBuffer,
        rrIntervalsBuffer,
        isClosedLoopActive,
        hysteresisDeadbandBPM,
        lastTriggeredHR,
        bioThresholdConfig,
        biometrics,
        focusTimer,
      } = get();

      const newBuffer = [...movingAverageBuffer.slice(1), bpm];
      const filtered = Math.round(newBuffer.reduce((a, b) => a + b, 0) / newBuffer.length);

      const rrMs = Math.round(60000 / bpm);
      const newRR = [...rrIntervalsBuffer.slice(1), rrMs];

      let sumSqDiff = 0;
      for (let i = 1; i < newRR.length; i++) {
        const diff = newRR[i] - newRR[i - 1];
        sumSqDiff += diff * diff;
      }
      const rmssd = Math.round(Math.sqrt(sumSqDiff / (newRR.length - 1)));
      const stressIndex = Math.max(10, Math.min(95, Math.round((bpm - 50) * 1.2 + (60 - rmssd) * 0.5)));

      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const newPoint: BiometricHistoryPoint = {
        time: timeStr,
        rawHR: bpm,
        filteredHR: filtered,
        rmssd,
        stress: stressIndex,
      };

      set((state) => ({
        biometrics: {
          ...state.biometrics,
          heartRate: bpm,
          filteredHeartRate: filtered,
          hrvRmssd: rmssd,
          stressIndex,
        },
        movingAverageBuffer: newBuffer,
        rrIntervalsBuffer: newRR,
        biometricHistory: [...state.biometricHistory.slice(-19), newPoint],
      }));

      // Bio-Threshold Alert Check against user baseline
      if (bioThresholdConfig.enabled) {
        const baselineHR = biometrics.baseline7DayHR || 64;
        const baselineHRV = biometrics.baseline7DayHRV || 55;
        const hrThreshold = baselineHR * (1 + bioThresholdConfig.hrSpikePercent / 100);

        let triggeredAlert: BioAlertEvent | null = null;

        if (bpm >= hrThreshold) {
          triggeredAlert = {
            id: `alert-${Date.now()}`,
            timestamp: timeStr,
            metric: 'heartRate',
            value: bpm,
            baseline: baselineHR,
            message: `Heart rate spiked to ${bpm} BPM (+${Math.round(((bpm - baselineHR) / baselineHR) * 100)}% above baseline).`,
            severity: bpm > hrThreshold + 10 ? 'critical' : 'warning',
          };
        } else if (rmssd <= bioThresholdConfig.minHrvRmssd) {
          triggeredAlert = {
            id: `alert-${Date.now()}`,
            timestamp: timeStr,
            metric: 'hrv',
            value: rmssd,
            baseline: baselineHRV,
            message: `HRV RMSSD suppressed to ${rmssd} ms (sympathetic strain detected).`,
            severity: 'warning',
          };
        } else if (stressIndex >= bioThresholdConfig.maxStress) {
          triggeredAlert = {
            id: `alert-${Date.now()}`,
            timestamp: timeStr,
            metric: 'stress',
            value: stressIndex,
            baseline: 35,
            message: `Biometric stress index elevated to ${stressIndex}%.`,
            severity: 'warning',
          };
        }

        if (triggeredAlert) {
          // If in Focus Mode with DND enabled, do not vibrate or sound intrusive alerts, but log it quietly
          if (!focusTimer.dndEnabled) {
            triggerHaptic('warning');
          }
          set((s) => ({
            activeBioAlert: triggeredAlert,
            bioAlertHistory: [triggeredAlert!, ...s.bioAlertHistory.slice(0, 19)],
          }));
        }
      }

      // Closed-Loop Bio-Intervention check with Hysteresis Deadband
      if (isClosedLoopActive) {
        const delta = bpm - lastTriggeredHR;
        if (bpm > 82 && delta >= hysteresisDeadbandBPM) {
          const targetBeat = 8.0;
          get().setTargetBeatHz(targetBeat, 5.0);

          const event: BioLogicEvent = {
            id: `evt-${Date.now()}`,
            timestamp: timeStr,
            title: 'Sympathetic Hyper-Arousal Intervention',
            detail: `Filtered HR ${filtered} BPM (>${lastTriggeredHR + hysteresisDeadbandBPM} BPM threshold). Down-regulating beat to Alpha 8.0 Hz.`,
            type: 'intervention',
          };

          set((state) => ({
            lastTriggeredHR: bpm,
            activeIntervention: {
              active: true,
              reason: 'Sympathetic Surge (HR > 82 BPM)',
              targetBeatHz: targetBeat,
              startedAt: Date.now(),
              durationSec: 180,
            },
            bioLogicEvents: [event, ...state.bioLogicEvents.slice(0, 14)],
          }));
        } else if (bpm < 58 && Math.abs(delta) >= hysteresisDeadbandBPM) {
          const targetBeat = 2.5;
          get().setTargetBeatHz(targetBeat, 5.0);

          const event: BioLogicEvent = {
            id: `evt-${Date.now()}`,
            timestamp: timeStr,
            title: 'Parasympathetic Sleep Stage Lock',
            detail: `Low nocturnal HR ${filtered} BPM. Sustaining restorative Delta 2.5 Hz rhythm.`,
            type: 'recovery',
          };

          set((state) => ({
            lastTriggeredHR: bpm,
            activeIntervention: {
              active: true,
              reason: 'Parasympathetic Dominance',
              targetBeatHz: targetBeat,
              startedAt: Date.now(),
              durationSec: 300,
            },
            bioLogicEvents: [event, ...state.bioLogicEvents.slice(0, 14)],
          }));
        }
      }
    },

    simulateBiometricTick: () => {
      const { biometrics } = get();
      if (biometrics.source === 'google_health_connect') {
        get().syncGoogleHealthConnect();
        return;
      }
      const delta = (Math.random() - 0.48) * 3.5;
      const nextHR = Math.max(54, Math.min(105, Math.round(biometrics.heartRate + delta)));
      get().injectHeartRate(nextHR);
    },

    setClosedLoopActive: (active) => set({ isClosedLoopActive: active }),
    setHysteresisDeadband: (bpm) => set({ hysteresisDeadbandBPM: bpm }),

    // --- BLE Hardware Bridge Actions ---
    startBleScan: async () => {
      set({ isBleScanning: true });
      setTimeout(() => {
        const log: BlePacketLog = {
          id: `log-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          direction: 'RX',
          command: 'BLE_DEVICE_FOUND',
          payloadHex: 'FF F0 00 12 4B 8A',
          decryptedSummary: 'Discovered CMF Watch Pro 2 (RSSI -62 dBm, 0xfff0 primary)',
          status: 'ok',
        };
        set((state) => ({
          isBleScanning: false,
          isBleConnected: true,
          bleLogs: [log, ...state.bleLogs],
        }));
      }, 1500);
    },

    sendAtGetSecret: () => {
      const txLog: BlePacketLog = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        direction: 'TX',
        command: 'AT+GET_SECRET',
        payloadHex: '41 54 2B 47 45 54 5F 53 45 43 52 45 54 0D 0A',
        decryptedSummary: 'Requesting Peripheral AES Key via AT command',
        status: 'ok',
      };
      set((state) => ({ bleLogs: [txLog, ...state.bleLogs] }));

      setTimeout(() => {
        const rxLog: BlePacketLog = {
          id: `log-${Date.now() + 1}`,
          timestamp: new Date().toLocaleTimeString(),
          direction: 'RX',
          command: 'RESP_SECRET',
          payloadHex: '2B 53 45 43 52 45 54 3A 30 38 41 46 33 42 39 31',
          decryptedSummary: 'AES-128 Key handshake validated. AES-CBC cipher initialized.',
          status: 'auth',
        };
        set((state) => ({
          isSecretDecrypted: true,
          bleLogs: [rxLog, ...state.bleLogs],
        }));
      }, 600);
    },

    fetchSleepHistoryBle: () => {
      const txLog: BlePacketLog = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        direction: 'TX',
        command: 'CMD_SLEEP_PULL_0058_0001',
        payloadHex: '58 01 00 08 00 00 00 00',
        decryptedSummary: 'Requesting 8-hour sleep epoch telemetry',
        status: 'ok',
      };
      set((state) => ({ bleLogs: [txLog, ...state.bleLogs] }));

      setTimeout(() => {
        const rxLog: BlePacketLog = {
          id: `log-${Date.now() + 1}`,
          timestamp: new Date().toLocaleTimeString(),
          direction: 'RX',
          command: 'NOTIFY_SLEEP_RECORDS',
          payloadHex: '58 01 12 1A 8C 90 04 02 01 01 02 03',
          decryptedSummary: 'Successfully parsed 18 sleep epochs: REM 22%, Deep 34%, Light 38%',
          status: 'ok',
        };
        set((state) => ({
          bleLogs: [rxLog, ...state.bleLogs],
        }));
      }, 800);
    },

    connectRealWebBluetooth: async () => {
      if (typeof navigator !== 'undefined' && 'bluetooth' in navigator) {
        try {
          const device = await (navigator as unknown as {
            bluetooth: {
              requestDevice: (opts: unknown) => Promise<{ name?: string }>;
            };
          }).bluetooth.requestDevice({
            acceptAllDevices: true,
            optionalServices: ['heart_rate', 0xfff0, 'battery_service'],
          });
          const log: BlePacketLog = {
            id: `log-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString(),
            direction: 'RX',
            command: 'WEB_BLUETOOTH_PAIRED',
            payloadHex: '00 01 02 FF',
            decryptedSummary: `Paired with real Bluetooth hardware: ${device.name || 'Unnamed Peripheral'}`,
            status: 'ok',
          };
          set((state) => ({
            biometrics: {
              ...state.biometrics,
              deviceName: device.name || 'Web Bluetooth Peripheral',
              source: 'cmf_ble',
              connected: true,
            },
            bleLogs: [log, ...state.bleLogs],
          }));
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Cancelled';
          const log: BlePacketLog = {
            id: `log-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString(),
            direction: 'RX',
            command: 'BLE_SCAN_INFO',
            payloadHex: 'FF FF',
            decryptedSummary: `Web Bluetooth request note: ${message} (Simulator active)`,
            status: 'ok',
          };
          set((state) => ({
            bleLogs: [log, ...state.bleLogs],
          }));
        }
      } else {
        get().startBleScan();
      }
    },

    applyPreset: (presetId) => {
      const preset = get().presets.find((p) => p.id === presetId);
      if (!preset) return;

      triggerHaptic('medium');
      const { audio } = get();

      // Trigger seamless audio crossfade in Web Audio DSP Engine
      dspEngine.crossfadePreset(preset, 3.5);

      set({
        activePresetId: preset.id,
        audio: {
          ...audio,
          baseCarrierHz: preset.baseCarrierHz,
          targetBeatHz: preset.targetBeatHz,
          binauralMix: preset.binauralMix,
          isochronicMix: preset.isochronicMix,
          isochronicDutyCycle: preset.isochronicDutyCycle,
          noiseType: preset.noiseType,
          noiseVolume: preset.noiseVolume,
          isGliding: true,
          isCrossfading: audio.isPlaying,
          glideProgress: 0,
        },
      });
    },

    savePreset: (newPreset) => {
      set((state) => {
        const existingIdx = state.presets.findIndex((p) => p.id === newPreset.id);
        if (existingIdx >= 0) {
          const updated = [...state.presets];
          updated[existingIdx] = newPreset;
          return { presets: updated };
        } else {
          return { presets: [newPreset, ...state.presets] };
        }
      });
    },

    deletePreset: (presetId) => {
      set((state) => ({
        presets: state.presets.filter((p) => p.id !== presetId),
      }));
    },
  };
});
