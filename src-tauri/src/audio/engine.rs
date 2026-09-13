use super::oscillator::{Modality, OscillatorState};
use crate::tuning::a432::snap_to_a432_ladder;
use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use cpal::{SampleFormat, Stream, StreamConfig};
use std::sync::Arc;
use std::sync::atomic::{AtomicBool, AtomicU8, AtomicU32, AtomicU64, Ordering};

pub struct AudioParams {
    pub is_playing: AtomicBool,
    pub target_carrier: AtomicU32,
    pub target_beat: AtomicU32,
    pub target_volume: AtomicU32,
    pub ramp_duration: AtomicU32,
    pub modality: AtomicU8,
    pub version: AtomicU64,
}

impl AudioParams {
    pub fn new() -> Self {
        Self {
            is_playing: AtomicBool::new(false),
            target_carrier: AtomicU32::new(216.0f32.to_bits()),
            target_beat: AtomicU32::new(6.0f32.to_bits()),
            target_volume: AtomicU32::new(0.5f32.to_bits()),
            ramp_duration: AtomicU32::new(3.0f32.to_bits()),
            modality: AtomicU8::new(0), // 0: Binaural, 1: Isochronic, 2: Monaural, 3: Mixed
            version: AtomicU64::new(1),
        }
    }

    pub fn modality_from_u8(val: u8) -> Modality {
        match val {
            1 => Modality::Isochronic,
            2 => Modality::Monaural,
            3 => Modality::Mixed,
            _ => Modality::Binaural,
        }
    }

    pub fn modality_to_u8(m: Modality) -> u8 {
        match m {
            Modality::Binaural => 0,
            Modality::Isochronic => 1,
            Modality::Monaural => 2,
            Modality::Mixed => 3,
        }
    }
}

impl Default for AudioParams {
    fn default() -> Self {
        Self::new()
    }
}

pub struct AudioEngine {
    pub params: Arc<AudioParams>,
    _stream: Option<Stream>,
}

unsafe impl Send for AudioEngine {}
unsafe impl Sync for AudioEngine {}

impl AudioEngine {
    pub fn new() -> Result<Self, String> {
        let params = Arc::new(AudioParams::new());
        let host = cpal::default_host();
        let device = match host.default_output_device() {
            Some(dev) => dev,
            None => {
                eprintln!(
                    "Warning: No audio output device found at startup. Running in mock/standby mode."
                );
                return Ok(Self {
                    params,
                    _stream: None,
                });
            }
        };

        let supported_config = device
            .default_output_config()
            .map_err(|e| format!("Failed to get default output config: {}", e))?;

        let sample_format = supported_config.sample_format();
        let stream_config: StreamConfig = supported_config.into();
        let sample_rate = stream_config.sample_rate as f32;
        let channels = stream_config.channels as usize;

        let mut osc = OscillatorState::new(sample_rate, 216.0, 6.0, Modality::Binaural);
        let mut last_version = 0u64;

        let params_clone = Arc::clone(&params);
        let err_fn = |err| eprintln!("NeuroLoop audio stream error: {}", err);

        let stream = match sample_format {
            SampleFormat::F32 => device.build_output_stream(
                stream_config,
                move |data: &mut [f32], _: &cpal::OutputCallbackInfo| {
                    let playing = params_clone.is_playing.load(Ordering::Relaxed);
                    if !playing {
                        for sample in data.iter_mut() {
                            *sample = 0.0;
                        }
                        return;
                    }

                    let current_ver = params_clone.version.load(Ordering::Acquire);
                    if current_ver != last_version {
                        let carrier =
                            f32::from_bits(params_clone.target_carrier.load(Ordering::Relaxed));
                        let beat = f32::from_bits(params_clone.target_beat.load(Ordering::Relaxed));
                        let vol =
                            f32::from_bits(params_clone.target_volume.load(Ordering::Relaxed));
                        let ramp_sec =
                            f32::from_bits(params_clone.ramp_duration.load(Ordering::Relaxed));
                        let mod_u8 = params_clone.modality.load(Ordering::Relaxed);

                        osc.carrier_ramp.set_target(carrier, ramp_sec, sample_rate);
                        osc.beat_ramp.set_target(beat, ramp_sec, sample_rate);
                        osc.volume_ramp.set_target(vol, 0.2, sample_rate);
                        osc.pulse_freq = beat;
                        osc.modality = AudioParams::modality_from_u8(mod_u8);
                        last_version = current_ver;
                    }

                    for frame in data.chunks_mut(channels) {
                        let (l, r) = osc.next_sample();
                        if frame.len() >= 2 {
                            frame[0] = l;
                            frame[1] = r;
                            for sample in &mut frame[2..] {
                                *sample = 0.0;
                            }
                        } else if !frame.is_empty() {
                            frame[0] = 0.5 * (l + r);
                        }
                    }
                },
                err_fn,
                None,
            ),
            SampleFormat::I16 => device.build_output_stream(
                stream_config,
                move |data: &mut [i16], _: &cpal::OutputCallbackInfo| {
                    let playing = params_clone.is_playing.load(Ordering::Relaxed);
                    if !playing {
                        for sample in data.iter_mut() {
                            *sample = 0;
                        }
                        return;
                    }

                    let current_ver = params_clone.version.load(Ordering::Acquire);
                    if current_ver != last_version {
                        let carrier =
                            f32::from_bits(params_clone.target_carrier.load(Ordering::Relaxed));
                        let beat = f32::from_bits(params_clone.target_beat.load(Ordering::Relaxed));
                        let vol =
                            f32::from_bits(params_clone.target_volume.load(Ordering::Relaxed));
                        let ramp_sec =
                            f32::from_bits(params_clone.ramp_duration.load(Ordering::Relaxed));
                        let mod_u8 = params_clone.modality.load(Ordering::Relaxed);

                        osc.carrier_ramp.set_target(carrier, ramp_sec, sample_rate);
                        osc.beat_ramp.set_target(beat, ramp_sec, sample_rate);
                        osc.volume_ramp.set_target(vol, 0.2, sample_rate);
                        osc.pulse_freq = beat;
                        osc.modality = AudioParams::modality_from_u8(mod_u8);
                        last_version = current_ver;
                    }

                    for frame in data.chunks_mut(channels) {
                        let (l, r) = osc.next_sample();
                        let l_i16 = (l.clamp(-1.0, 1.0) * i16::MAX as f32) as i16;
                        let r_i16 = (r.clamp(-1.0, 1.0) * i16::MAX as f32) as i16;

                        if frame.len() >= 2 {
                            frame[0] = l_i16;
                            frame[1] = r_i16;
                            for sample in &mut frame[2..] {
                                *sample = 0;
                            }
                        } else if !frame.is_empty() {
                            frame[0] = ((l_i16 as i32 + r_i16 as i32) / 2) as i16;
                        }
                    }
                },
                err_fn,
                None,
            ),
            _ => return Err("Unsupported audio sample format".to_string()),
        }
        .map_err(|e| format!("Failed to build audio output stream: {}", e))?;

        stream
            .play()
            .map_err(|e| format!("Failed to start audio stream: {}", e))?;

        Ok(Self {
            params,
            _stream: Some(stream),
        })
    }

    pub fn standby() -> Self {
        Self {
            params: Arc::new(AudioParams::new()),
            _stream: None,
        }
    }

    pub fn set_preset(
        &self,
        carrier: f32,
        beat: f32,
        modality: Modality,
        duration_sec: Option<f32>,
    ) {
        let a432_carrier = snap_to_a432_ladder(carrier);
        self.params
            .target_carrier
            .store(a432_carrier.to_bits(), Ordering::Relaxed);
        self.params
            .target_beat
            .store(beat.to_bits(), Ordering::Relaxed);
        self.params
            .ramp_duration
            .store(duration_sec.unwrap_or(3.0).to_bits(), Ordering::Relaxed);
        self.params
            .modality
            .store(AudioParams::modality_to_u8(modality), Ordering::Relaxed);
        self.params.version.fetch_add(1, Ordering::Release);
    }

    pub fn set_volume(&self, volume: f32, _ramp_seconds: Option<f32>) {
        let clamped = volume.clamp(0.0, 1.0);
        self.params
            .target_volume
            .store(clamped.to_bits(), Ordering::Relaxed);
        self.params.version.fetch_add(1, Ordering::Release);
    }

    pub fn play(&self) {
        self.params.is_playing.store(true, Ordering::Release);
    }

    pub fn stop(&self) {
        self.params.is_playing.store(false, Ordering::Release);
    }
}
