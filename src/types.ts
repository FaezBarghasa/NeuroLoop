export type TabType = 'dashboard' | 'music' | 'presets' | 'biologics' | 'sleep' | 'devices' | 'export';

export type BrainwaveBandName = 'Delta' | 'Theta' | 'Alpha' | 'Beta' | 'Gamma';

export interface BrainwaveBand {
  name: BrainwaveBandName;
  minHz: number;
  maxHz: number;
  defaultHz: number;
  description: string;
  mentalState: string;
  color: string;
}

export const BRAINWAVE_BANDS: Record<BrainwaveBandName, BrainwaveBand> = {
  Delta: {
    name: 'Delta',
    minHz: 0.5,
    maxHz: 4.0,
    defaultHz: 2.5,
    description: 'Deep restorative slow-wave sleep, cellular repair, and autonomous physical recovery.',
    mentalState: 'Deep Non-REM Sleep & Physical Healing',
    color: '#38bdf8', // sky
  },
  Theta: {
    name: 'Theta',
    minHz: 4.0,
    maxHz: 8.0,
    defaultHz: 6.0,
    description: 'Hypnagogic sleep-wake transition, REM dreaming, deep meditation, and intuitive insight.',
    mentalState: 'Dreaming, Hypnagogia & Deep Meditation',
    color: '#818cf8', // indigo
  },
  Alpha: {
    name: 'Alpha',
    minHz: 8.0,
    maxHz: 13.0,
    defaultHz: 10.0,
    description: 'Bridge between conscious and subconscious. Calm presence and relaxed alertness.',
    mentalState: 'Calm Alertness & Stress De-escalation',
    color: '#34d399', // emerald
  },
  Beta: {
    name: 'Beta',
    minHz: 13.0,
    maxHz: 30.0,
    defaultHz: 18.0,
    description: 'Associated with active analytical cognitive processing and problem-solving.',
    mentalState: 'Active Cognitive Focus & Productivity',
    color: '#fbbf24', // amber
  },
  Gamma: {
    name: 'Gamma',
    minHz: 30.0,
    maxHz: 50.0,
    defaultHz: 40.0,
    description: 'High-frequency binding of sensory information and peak cognitive synchronization.',
    mentalState: 'Peak Cognition & Information Synthesis',
    color: '#f472b6', // pink
  },
};

export type NoiseType = 'none' | 'pink' | 'brownian' | 'white';

export interface AudioEngineState {
  isPlaying: boolean;
  baseCarrierHz: number; // e.g. 200 Hz
  targetBeatHz: number; // target beat frequency, e.g. 10.0 Hz
  currentBeatHz: number; // current smooth frequency
  glideDurationSec: number; // default 5.0s crossfade
  masterVolume: number; // 0 to 1
  binauralMix: number; // 0 to 1
  isochronicMix: number; // 0 to 1
  isochronicDutyCycle: number; // 0.1 to 0.9 (default 0.5)
  noiseType: NoiseType;
  noiseVolume: number; // 0 to 1
  waveform: 'sine' | 'triangle';
  isGliding: boolean;
  isCrossfading: boolean;
  glideProgress: number; // 0 to 100%
}

export type SleepStage = 'Awake' | 'REM' | 'Light' | 'Deep';

export type BiometricSourceType =
  | 'google_health_connect'
  | 'google_fit'
  | 'gadgetbridge_intent'
  | 'gadgetbridge_db'
  | 'health_connect'
  | 'healthkit'
  | 'cmf_ble'
  | 'ble_standard'
  | 'simulated';

export type ConnectionStrength = 'excellent' | 'good' | 'fair' | 'disconnected';

export interface GoogleHealthConfig {
  clientId?: string;
  accessToken?: string;
  isConnected: boolean;
  lastSyncTime: string | null;
  syncIntervalSec: number;
  scopesGranted: string[];
  clientStatus: 'AVAILABLE' | 'AVAILABLE_UPDATE_REQUIRED' | 'NOT_SUPPORTED';
  activeRecords: {
    heartRate: boolean;
    hrv: boolean;
    sleep: boolean;
    oxygenSaturation: boolean;
  };
}

export interface GadgetbridgeConfig {
  isConnected: boolean;
  listeningIntent: boolean;
  targetDeviceName: string;
  targetDeviceMac: string;
  lastBroadcastTime: string | null;
  broadcastAction: string;
  totalPacketsReceived: number;
  liveHRPackets: Array<{
    timestamp: string;
    bpm: number;
    rrIntervals?: number[];
    deviceMac: string;
    sourceAction: string;
  }>;
}

export interface BiometricState {
  heartRate: number; // current live BPM
  filteredHeartRate: number; // moving average smoothed
  hrvRmssd: number; // RMSSD in milliseconds
  hrvSdnn: number;
  stressIndex: number; // 0 - 100 scale (Baevsky index equivalent)
  spo2: number; // SpO2 percentage
  sleepStage: SleepStage;
  baseline7DayHR: number; // default 62 BPM
  baseline7DayHRV: number; // default 54 ms
  source: BiometricSourceType;
  connected: boolean;
  connectionStrength: ConnectionStrength;
  lastSyncSecondsAgo: number;
  deviceName: string;
  batteryPercent: number;
}

export interface BiometricHistoryPoint {
  time: string;
  rawHR: number;
  filteredHR: number;
  rmssd: number;
  stress: number;
}

export interface SleepRecord {
  time: string;
  stage: SleepStage;
  stageNumeric: number; // 1: Deep, 2: Light, 3: REM, 4: Awake
  hr: number;
  spo2: number;
}

export interface BioLogicEvent {
  id: string;
  timestamp: string;
  title: string;
  detail: string;
  type: 'intervention' | 'adaptation' | 'recovery' | 'baseline';
}

export interface BlePacketLog {
  id: string;
  timestamp: string;
  direction: 'TX' | 'RX';
  command: string;
  payloadHex: string;
  decryptedSummary: string;
  status: 'ok' | 'auth' | 'error' | 'pending';
}

export type PresetCategory = 'Rest' | 'Focus' | 'Meditation' | 'Relax' | 'Energy' | 'Bio-Adaptive' | 'Custom' | 'sleep' | 'focus' | 'meditation' | 'calm' | 'biologic';

export interface Preset {
  id: string;
  name: string;
  category: PresetCategory;
  band?: BrainwaveBandName;
  targetBand: BrainwaveBandName;
  targetBeatHz: number;
  baseCarrierHz: number;
  binauralMix: number;
  isochronicMix: number;
  isochronicDutyCycle: number;
  noiseType: NoiseType;
  noiseVolume: number;
  description: string;
  scientificGoal?: string;
  clinicalTarget?: string;
  recommendedDurationMin?: number;
  durationMinutes?: number;
  color?: string;
  subCategory?: string;
  modality?: 'binaural' | 'isochronic' | 'mixed';
  ramp?: { from: number; to: number; min: number } | null;
  tags?: string[];
  sources?: string[];
  autoAdaptiveRule?: {
    metric: string;
    operator: string;
    threshold: number | string;
    actionBeatHz: number;
    actionBand: BrainwaveBandName;
    durationSec: number;
    hysteresis: number;
  };
}

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  category: 'Atmospheric Drone' | 'Nature & Rain' | 'Lo-Fi Chill' | 'Solfeggio Frequencies' | 'Ambient Relax' | 'Local Audio';
  durationSec: number;
  src?: string;
  isSynthetic: boolean;
  synthPreset?: 'solfeggio528' | 'ambientDrone' | 'oceanWaves' | 'lofiChords' | 'tibetanBowls' | 'cosmicPad';
  coverGradient: string;
  moodTag: string;
}

export interface MusicPlayerState {
  isPlaying: boolean;
  currentTrackId: string;
  currentTime: number;
  duration: number;
  volume: number;
  carrierMode: 'overlay' | 'pure_carrier';
  loop: boolean;
  isMuted: boolean;
}

export type ThemeMode = 'deep_space' | 'high_contrast';

export interface BioAlertThreshold {
  hrSpikePercent: number; // e.g. 25% above baseline
  minHrvRmssd: number; // e.g. 28 ms
  maxStress: number; // e.g. 75
  sensitivity: 'conservative' | 'moderate' | 'sensitive';
  enabled: boolean;
}

export interface BioAlertEvent {
  id: string;
  timestamp: string;
  metric: 'heartRate' | 'hrv' | 'stress';
  value: number;
  baseline: number;
  message: string;
  severity: 'warning' | 'critical';
}

export interface SessionDataPoint {
  timestamp: number;
  timeFormatted: string;
  timeOffsetSec: number;
  beatHz: number;
  carrierHz: number;
  heartRate: number;
  hrvRmssd: number;
  stressIndex: number;
  band: BrainwaveBandName;
  bioAlert?: boolean;
}

export interface SessionSummaryData {
  id: string;
  startTime: number;
  endTime: number;
  durationSec: number;
  formattedDate: string;
  presetName: string;
  presetCategory: string;
  startHeartRate: number;
  endHeartRate: number;
  avgHeartRate: number;
  startHRV: number;
  endHRV: number;
  avgHRV: number;
  startStress: number;
  endStress: number;
  avgStress: number;
  stressDelta: number; // negative is reduction, positive is increase
  hrvDelta: number; // positive is improvement
  entrainmentResonanceScore: number; // 0 - 100%
  points: SessionDataPoint[];
  alertsTriggeredCount: number;
  tuningRecommendation?: {
    optimalCarrierHz: number;
    optimalBeatHz: number;
    recommendedBand: BrainwaveBandName;
    insightText: string;
    efficiencyGainPercent: number;
  };
}

export interface FocusTimerState {
  isActive: boolean;
  isPaused: boolean;
  durationSec: number;
  remainingSec: number;
  presetId: string;
  dndEnabled: boolean; // mutes notification-triggering signals from connected health devices
  initialDurationSec: number;
}

export interface PersonalizedTuningProfile {
  optimalCarrierHz: number;
  preferredBeatBand: BrainwaveBandName;
  recommendedGlideDurationSec: number;
  stressResonanceSensitivity: number;
  lastTunedAt: string | null;
  sessionsAnalyzed: number;
  totalDurationMinutes: number;
}
