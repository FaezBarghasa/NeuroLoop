use super::ramps::ParameterRamp;
use serde::{Deserialize, Serialize};
use std::f32::consts::PI;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Modality {
    Binaural,
    Isochronic,
    Monaural,
    Mixed,
}

pub struct OscillatorState {
    pub sample_rate: f32,
    pub carrier_ramp: ParameterRamp,
    pub beat_ramp: ParameterRamp,
    pub volume_ramp: ParameterRamp,
    pub pulse_freq: f32,
    pub modality: Modality,
    phase_l: f32,
    phase_r: f32,
    pulse_phase: f32,
}

impl OscillatorState {
    pub fn new(sample_rate: f32, carrier_freq: f32, beat_freq: f32, modality: Modality) -> Self {
        Self {
            sample_rate,
            carrier_ramp: ParameterRamp::new(carrier_freq),
            beat_ramp: ParameterRamp::new(beat_freq),
            volume_ramp: ParameterRamp::new(0.5),
            pulse_freq: beat_freq,
            modality,
            phase_l: 0.0,
            phase_r: 0.0,
            pulse_phase: 0.0,
        }
    }

    #[inline(always)]
    pub fn next_sample(&mut self) -> (f32, f32) {
        let carrier = self.carrier_ramp.advance();
        let beat = self.beat_ramp.advance();
        let vol = self.volume_ramp.advance();

        if vol <= 0.0001 {
            return (0.0, 0.0);
        }

        match self.modality {
            Modality::Binaural => {
                let freq_l = carrier - (beat / 2.0);
                let freq_r = carrier + (beat / 2.0);

                let sample_l = (self.phase_l * 2.0 * PI).sin() * vol;
                let sample_r = (self.phase_r * 2.0 * PI).sin() * vol;

                self.phase_l = (self.phase_l + freq_l / self.sample_rate).fract();
                self.phase_r = (self.phase_r + freq_r / self.sample_rate).fract();

                (sample_l, sample_r)
            }
            Modality::Isochronic => {
                let carrier_sample = (self.phase_l * 2.0 * PI).sin();
                // Smooth Hann-window pulse envelope to prevent harsh harmonics
                let pulse_mod = 0.5 * (1.0 - (self.pulse_phase * 2.0 * PI).cos());
                let out = carrier_sample * pulse_mod * vol;

                self.phase_l = (self.phase_l + carrier / self.sample_rate).fract();
                self.pulse_phase = (self.pulse_phase + beat / self.sample_rate).fract();

                (out, out)
            }
            Modality::Monaural => {
                let carrier_sample = (self.phase_l * 2.0 * PI).sin();
                // Amplitude modulation at beat frequency
                let mod_sample = 0.5 * (1.0 + (self.phase_r * 2.0 * PI).sin());
                let out = carrier_sample * mod_sample * vol;

                self.phase_l = (self.phase_l + carrier / self.sample_rate).fract();
                self.phase_r = (self.phase_r + beat / self.sample_rate).fract();

                (out, out)
            }
            Modality::Mixed => {
                // Binaural base with subtle gentle isochronic pulse
                let freq_l = carrier - (beat / 2.0);
                let freq_r = carrier + (beat / 2.0);

                let pulse_mod = 0.7 + 0.3 * (0.5 * (1.0 - (self.pulse_phase * 2.0 * PI).cos()));
                let sample_l = (self.phase_l * 2.0 * PI).sin() * pulse_mod * vol;
                let sample_r = (self.phase_r * 2.0 * PI).sin() * pulse_mod * vol;

                self.phase_l = (self.phase_l + freq_l / self.sample_rate).fract();
                self.phase_r = (self.phase_r + freq_r / self.sample_rate).fract();
                self.pulse_phase = (self.pulse_phase + (beat * 0.5) / self.sample_rate).fract();

                (sample_l, sample_r)
            }
        }
    }
}
