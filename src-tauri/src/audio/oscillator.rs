use std::f32::consts::PI;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Modality {
    Binaural,
    Isochronic,
    Monaural,
}

pub struct OscillatorState {
    pub sample_rate: f32,
    pub carrier_freq: f32,
    pub beat_freq: f32,
    pub pulse_freq: f32,
    pub modality: Modality,
    pub volume: f32,
    phase_l: f32,
    phase_r: f32,
    pulse_phase: f32,
}

impl OscillatorState {
    pub fn new(sample_rate: f32, carrier_freq: f32, beat_freq: f32, modality: Modality) -> Self {
        Self {
            sample_rate,
            carrier_freq,
            beat_freq,
            pulse_freq: beat_freq,
            modality,
            volume: 0.5,
            phase_l: 0.0,
            phase_r: 0.0,
            pulse_phase: 0.0,
        }
    }

    pub fn next_sample(&mut self) -> (f32, f32) {
        match self.modality {
            Modality::Binaural => {
                let freq_l = self.carrier_freq - (self.beat_freq / 2.0);
                let freq_r = self.carrier_freq + (self.beat_freq / 2.0);

                let sample_l = (self.phase_l * 2.0 * PI).sin() * self.volume;
                let sample_r = (self.phase_r * 2.0 * PI).sin() * self.volume;

                self.phase_l = (self.phase_l + freq_l / self.sample_rate).fract();
                self.phase_r = (self.phase_r + freq_r / self.sample_rate).fract();

                (sample_l, sample_r)
            }
            Modality::Isochronic => {
                let carrier_sample = (self.phase_l * 2.0 * PI).sin();
                let pulse = if self.pulse_phase < 0.5 { 1.0 } else { 0.0 };

                let out = carrier_sample * pulse * self.volume;

                self.phase_l = (self.phase_l + self.carrier_freq / self.sample_rate).fract();
                self.pulse_phase = (self.pulse_phase + self.pulse_freq / self.sample_rate).fract();

                (out, out)
            }
            Modality::Monaural => {
                let carrier_sample = (self.phase_l * 2.0 * PI).sin();
                let mod_sample = 0.5 * (1.0 + (self.phase_r * 2.0 * PI).sin());

                let out = carrier_sample * mod_sample * self.volume;

                self.phase_l = (self.phase_l + self.carrier_freq / self.sample_rate).fract();
                self.phase_r = (self.phase_r + self.beat_freq / self.sample_rate).fract();

                (out, out)
            }
        }
    }
}
