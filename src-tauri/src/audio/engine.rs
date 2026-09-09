use super::oscillator::{Modality, OscillatorState};
use crate::tuning::a432::snap_to_a432_ladder;
use std::sync::{Arc, Mutex};

pub struct AudioEngine {
    pub state: Arc<Mutex<OscillatorState>>,
    pub is_playing: Arc<Mutex<bool>>,
}

impl AudioEngine {
    pub fn new(sample_rate: f32) -> Self {
        let osc = OscillatorState::new(sample_rate, 216.0, 6.0, Modality::Binaural);
        Self {
            state: Arc::new(Mutex::new(osc)),
            is_playing: Arc::new(Mutex::new(false)),
        }
    }

    pub fn set_preset(&self, carrier: f32, beat: f32, modality: Modality) {
        let a432_carrier = snap_to_a432_ladder(carrier);
        if let Ok(mut osc) = self.state.lock() {
            osc.carrier_freq = a432_carrier;
            osc.beat_freq = beat;
            osc.pulse_freq = beat;
            osc.modality = modality;
        }
    }

    pub fn set_volume(&self, volume: f32) {
        let clamped = volume.clamp(0.0, 1.0);
        if let Ok(mut osc) = self.state.lock() {
            osc.volume = clamped;
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
