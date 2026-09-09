import { Preset, SleepRecord } from '../types';
import rawPresets from './presets.json';

// Helper to determine brainwave band from targetBeatHz
function getBandFromBeat(beatHz: number): Preset['targetBand'] {
  if (beatHz < 4.0) return 'Delta';
  if (beatHz < 8.0) return 'Theta';
  if (beatHz < 13.0) return 'Alpha';
  if (beatHz < 30.0) return 'Beta';
  return 'Gamma';
}

function mapCategory(cat: string): Preset['category'] {
  switch (cat) {
    case 'sleep': return 'Rest';
    case 'focus': return 'Focus';
    case 'energy': return 'Energy';
    case 'relax': return 'Relax';
    case 'meditation': return 'Meditation';
    default: return 'Custom';
  }
}

// Convert JSON presets catalog into rich Preset objects
const CATALOG_PRESETS: Preset[] = (rawPresets as Array<{
  id: string;
  name: string;
  cat: string;
  sub: string;
  mod: string;
  carrier: number;
  beat: number;
  pulse: number | null;
  ramp: { from: number; to: number; min: number } | null;
  dur: number;
  tags: string[];
  src: string[];
}>).map((p) => {
  const targetBand = getBandFromBeat(p.beat);
  const category = mapCategory(p.cat);
  const modality = (p.mod as Preset['modality']) || 'binaural';

  const descriptions: Record<string, string> = {
    'sleep.onset.alpha-theta': 'Gentle descent from relaxing alpha down to dreamy theta, ideal for falling asleep naturally.',
    'sleep.deep.delta': 'Slow 2Hz delta rhythmic entrainment to induce restorative, slow-wave deep sleep.',
    'sleep.maintenance.theta': 'Continuous theta waves that sustain REM dreaming and prevent middle-of-the-night waking.',
    'sleep.calm-night': 'Warm evening soundscape to quiet racing thoughts before sleep.',
    'sleep.nap.theta': 'Quick 25-minute power nap sequence to recharge without grogginess.',
    'sleep.rem-lucid': 'Theta resonance targeting REM sleep cycles and heightened dream lucidity.',
    'sleep.gentle-wake': 'Gradual upward frequency ramp from sleep delta up into alert morning alpha.',
    'sleep.delta-isochronic': 'Rhythmic isochronic pulses engineered to lock brainwaves into deep sleep.',
    'sleep.brown-noise-delta': 'Deep brown noise mask coupled with 2Hz delta beats for noisy environments.',
    'sleep.theta-ramp': 'Long 60-minute theta descent protocol for insomnia relief.',
    'focus.deep-work-beta': '18Hz beta frequency tuned for high-demand problem solving and deep work sprints.',
    'focus.coding-smr': '13.5Hz Sensorimotor Rhythm (SMR) ideal for calm, sustained software development.',
    'focus.reading-alpha-beta': '14Hz hybrid state balancing calm retention with active reading comprehension.',
    'focus.study-beta': '20Hz beta stimulation for active study sessions and memorization.',
    'focus.memory-gamma': '40Hz gamma coherence wave to enhance cognitive processing and memory recall.',
    'focus.flow-beta': '16Hz sweet spot for effortless creative and analytical flow state.',
    'focus.writing-alpha': '11Hz high alpha promoting fluid verbal fluency and creative writing.',
    'focus.attention-smr': '12.5Hz SMR calibration for ADHD focus management and distraction shielding.',
    'focus.iso-beta': '18Hz isochronic pulse train for intense laser-like attention.',
    'focus.gamma-burst': 'Short 15-minute 40Hz gamma session for mental clarity and breakthrough thinking.',
    'focus.monaural-beta': '18Hz monaural tone mix providing clear acoustic entrainment even through speakers.',
    'focus.low-beta-calm': '14.5Hz relaxed focus without the jitter or anxiety of high beta.',
    'morning.sunrise-alpha-beta': 'Morning wake-up curve rising smoothly from 8Hz relaxation to 14Hz morning energy.',
    'morning.energy-beta': '18Hz burst of invigorating neural stimulation to replace morning fatigue.',
    'morning.iso-alert': '22Hz high-energy isochronic rhythm for rapid alertness and motivation.',
    'morning.gamma-clarity': '36Hz gamma session for instant morning mental sharpness and brain fog clearing.',
    'morning.walk-rhythm': '15Hz rhythm matched to brisk walking cadence and outdoor vitality.',
    'midday.reset-alpha': '10Hz 10-minute midday reboot to clear afternoon mental fatigue.',
    'preworkout.high-beta': '25Hz high beta drive for peak physical activation and workout motivation.',
    'wake.gentle-alpha': '10Hz gentle wakefulness ramp for a soft, alarm-free morning rise.',
    'relax.alpha-unwind': '9.5Hz alpha wave to release muscle tension and workday stress.',
    'relax.evening-theta': '6Hz deep evening theta to transition peacefully into night mode.',
    'meditation.alpha': '10Hz traditional zen meditation frequency for stillness and present awareness.',
    'meditation.theta': '6.5Hz deep theta for transcendental meditation and subconscious stillness.',
    'meditation.gamma-compassion': '40Hz loving-kindness gamma synchrony based on neuroimaging research.',
    'calm.low-alpha': '8.5Hz low alpha to soothe panic, agitation, or sensory overload.',
    'unwind.breath-theta': '6Hz theta coupled to diaphragmatic breathing patterns.',
    'body-scan-theta': '6.2Hz frequency designed specifically for somatic body scan meditation.',
    'mindfulness-alpha': '9Hz mindfulness anchor for seated breath observation.',
    'nature-alpha': '9.5Hz alpha frequency nestled in a soft natural harmonic noise texture.',
    'monaural-alpha': '10Hz monaural beat suitable for meditation without headphones.',
    'iso-relax-theta': '6Hz isochronic soothing tone for effortless nervous system down-regulation.',
    'band.delta': 'Pure 2.0Hz Delta reference band tone.',
    'band.theta': 'Pure 6.0Hz Theta reference band tone.',
    'band.alpha': 'Pure 10.0Hz Alpha reference band tone.',
    'band.smr': 'Pure 13.0Hz SMR reference band tone.',
    'band.beta': 'Pure 20.0Hz Beta reference band tone.',
    'band.gamma': 'Pure 40.0Hz Gamma reference band tone.',
  };

  return {
    id: p.id,
    name: p.name,
    description: descriptions[p.id] || `${p.name} - ${targetBand} band entrainment targeting ${p.beat} Hz.`,
    category,
    subCategory: p.sub,
    baseCarrierHz: p.carrier,
    targetBeatHz: p.beat,
    targetBand,
    binauralMix: modality === 'isochronic' ? 0.2 : 0.85,
    isochronicMix: modality === 'isochronic' || modality === 'mixed' ? 0.7 : 0.15,
    isochronicDutyCycle: 0.5,
    noiseType: p.tags.includes('brown-noise') ? 'brownian' : (category === 'Rest' ? 'pink' : 'none'),
    noiseVolume: p.tags.includes('brown-noise') ? 0.35 : 0.15,
    durationMinutes: p.dur,
    ramp: p.ramp,
    modality,
    tags: p.tags,
    sources: p.src,
  };
});

// Bio-Adaptive Closed-Loop Presets
const BIO_ADAPTIVE_PRESETS: Preset[] = [
  {
    id: 'bio.jitai.stress-shield',
    name: 'Auto-Adaptive Stress Shield',
    description: 'Autonomous closed-loop bio-intervention: continuously monitors HR and RMSSD to glide into Alpha when sympathetic tone spikes.',
    category: 'Bio-Adaptive',
    subCategory: 'jitai',
    baseCarrierHz: 210,
    targetBeatHz: 8.5,
    targetBand: 'Alpha',
    binauralMix: 0.9,
    isochronicMix: 0.2,
    isochronicDutyCycle: 0.5,
    noiseType: 'pink',
    noiseVolume: 0.25,
    durationMinutes: 45,
    tags: ['bio-adaptive', 'jitai', 'stress-relief', 'hrv'],
    autoAdaptiveRule: {
      metric: 'stress',
      operator: '>',
      threshold: 65,
      actionBeatHz: 8.0,
      actionBand: 'Alpha',
      durationSec: 180,
      hysteresis: 3,
    },
  },
  {
    id: 'bio.jitai.sleep-optimizer',
    name: 'Smart Sleep Stage Synchronizer',
    description: 'Dynamically shifts beat frequencies based on live sleep stages (Light -> Delta 2Hz, REM -> Theta 6Hz).',
    category: 'Bio-Adaptive',
    subCategory: 'sleep-sync',
    baseCarrierHz: 190,
    targetBeatHz: 2.0,
    targetBand: 'Delta',
    binauralMix: 0.9,
    isochronicMix: 0.1,
    isochronicDutyCycle: 0.5,
    noiseType: 'brownian',
    noiseVolume: 0.3,
    durationMinutes: 90,
    tags: ['bio-adaptive', 'sleep', 'delta', 'stages'],
    autoAdaptiveRule: {
      metric: 'sleepStage',
      operator: '==',
      threshold: 'Light',
      actionBeatHz: 1.8,
      actionBand: 'Delta',
      durationSec: 300,
      hysteresis: 2,
    },
  },
];

export const DEFAULT_PRESETS: Preset[] = [...BIO_ADAPTIVE_PRESETS, ...CATALOG_PRESETS];

// 8-hour sleep session telemetry parsed from smartwatch health sync
export const MOCK_SLEEP_DATA: SleepRecord[] = [
  { time: '23:00', stage: 'Awake', stageNumeric: 4, hr: 72, spo2: 98 },
  { time: '23:20', stage: 'Light', stageNumeric: 2, hr: 66, spo2: 98 },
  { time: '23:45', stage: 'Deep', stageNumeric: 1, hr: 58, spo2: 97 },
  { time: '00:15', stage: 'Deep', stageNumeric: 1, hr: 55, spo2: 97 },
  { time: '00:45', stage: 'Light', stageNumeric: 2, hr: 60, spo2: 98 },
  { time: '01:10', stage: 'REM', stageNumeric: 3, hr: 64, spo2: 96 },
  { time: '01:40', stage: 'Light', stageNumeric: 2, hr: 61, spo2: 97 },
  { time: '02:00', stage: 'Deep', stageNumeric: 1, hr: 54, spo2: 97 },
  { time: '02:40', stage: 'Deep', stageNumeric: 1, hr: 53, spo2: 96 },
  { time: '03:15', stage: 'Light', stageNumeric: 2, hr: 59, spo2: 97 },
  { time: '03:40', stage: 'REM', stageNumeric: 3, hr: 66, spo2: 96 },
  { time: '04:20', stage: 'REM', stageNumeric: 3, hr: 68, spo2: 95 },
  { time: '04:50', stage: 'Light', stageNumeric: 2, hr: 62, spo2: 97 },
  { time: '05:15', stage: 'Deep', stageNumeric: 1, hr: 56, spo2: 97 },
  { time: '05:45', stage: 'Light', stageNumeric: 2, hr: 63, spo2: 98 },
  { time: '06:10', stage: 'REM', stageNumeric: 3, hr: 67, spo2: 97 },
  { time: '06:45', stage: 'Awake', stageNumeric: 4, hr: 74, spo2: 98 },
  { time: '07:00', stage: 'Awake', stageNumeric: 4, hr: 78, spo2: 99 },
];
