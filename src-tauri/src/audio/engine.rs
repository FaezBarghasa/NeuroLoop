use super::oscillator::{Modality, OscillatorState};
use crate::tuning::a432::snap_to_a432_ladder;
use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use cpal::{SampleFormat, Stream, StreamConfig};
use std::sync::{Arc, Mutex};

pub struct AudioEngine {
    pub state: Arc<Mutex<OscillatorState>>,
    pub is_playing: Arc<Mutex<bool>>,
    _stream: Option<Stream>,
}

unsafe impl Send for AudioEngine {}
unsafe impl Sync for AudioEngine {}

impl AudioEngine {
    pub fn new() -> Result<Self, String> {
        let host = cpal::default_host();
        let device = host
            .default_output_device()
            .ok_or_else(|| "No audio output device found".to_string())?;

        let supported_config = device
            .default_output_config()
            .map_err(|e| format!("Failed to get default output config: {}", e))?;

        let sample_format = supported_config.sample_format();
        let stream_config: StreamConfig = supported_config.into();
        let sample_rate = stream_config.sample_rate as f32;
        let channels = stream_config.channels as usize;

        let osc_state = Arc::new(Mutex::new(OscillatorState::new(
            sample_rate,
            216.0,
            6.0,
            Modality::Binaural,
        )));
        let is_playing = Arc::new(Mutex::new(false));

        let osc_clone = Arc::clone(&osc_state);
        let playing_clone = Arc::clone(&is_playing);

        let err_fn = |err| eprintln!("NeuroLoop audio stream error: {}", err);

        let stream = match sample_format {
            SampleFormat::F32 => device.build_output_stream(
                stream_config,
                move |data: &mut [f32], _: &cpal::OutputCallbackInfo| {
                    let playing = *playing_clone.lock().unwrap_or_else(|e| e.into_inner());
                    if !playing {
                        for sample in data.iter_mut() {
                            *sample = 0.0;
                        }
                        return;
                    }

                    if let Ok(mut osc) = osc_clone.lock() {
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
                    }
                },
                err_fn,
                None,
            ),
            SampleFormat::I16 => device.build_output_stream(
                stream_config,
                move |data: &mut [i16], _: &cpal::OutputCallbackInfo| {
                    let playing = *playing_clone.lock().unwrap_or_else(|e| e.into_inner());
                    if !playing {
                        for sample in data.iter_mut() {
                            *sample = 0;
                        }
                        return;
                    }

                    if let Ok(mut osc) = osc_clone.lock() {
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
            state: osc_state,
            is_playing,
            _stream: Some(stream),
        })
    }

    pub fn set_preset(
        &self,
        carrier: f32,
        beat: f32,
        modality: Modality,
        duration_sec: Option<f32>,
    ) {
        let a432_carrier = snap_to_a432_ladder(carrier);
        if let Ok(mut osc) = self.state.lock() {
            let sample_rate = osc.sample_rate;
            let ramp_dur = duration_sec.unwrap_or(3.0);
            osc.carrier_ramp
                .set_target(a432_carrier, ramp_dur, sample_rate);
            osc.beat_ramp.set_target(beat, ramp_dur, sample_rate);
            osc.pulse_freq = beat;
            osc.modality = modality;
        }
    }

    pub fn set_volume(&self, volume: f32, ramp_seconds: Option<f32>) {
        let clamped = volume.clamp(0.0, 1.0);
        if let Ok(mut osc) = self.state.lock() {
            let sample_rate = osc.sample_rate;
            osc.volume_ramp
                .set_target(clamped, ramp_seconds.unwrap_or(0.2), sample_rate);
        }
    }

    pub fn play(&self) {
        if let Ok(mut playing) = self.is_playing.lock() {
            *playing = true;
        }
    }

    pub fn stop(&self) {
        if let Ok(mut playing) = self.is_playing.lock() {
            *playing = false;
        }
    }
}
