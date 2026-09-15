use super::baseline::PersonalBaseline;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum InferredState {
    Awake,
    Relaxed,
    Stressed,
    FocusDeep,
    FocusCalm,
    Sleepy,
    SleepOnset,
    SleepLight,
    SleepDeep,
    SleepRem,
    MorningWake,
}

pub struct StateClassifier {
    pub current_state: InferredState,
    pub candidate_state: InferredState,
    pub candidate_count: usize,
    pub confidence: f32,
    pub baseline: PersonalBaseline,
    pub min_dwell_cycles: usize,
}

impl Default for StateClassifier {
    fn default() -> Self {
        Self::new()
    }
}

impl StateClassifier {
    pub fn new() -> Self {
        Self {
            current_state: InferredState::Awake,
            candidate_state: InferredState::Awake,
            candidate_count: 0,
            confidence: 0.5,
            baseline: PersonalBaseline::default(),
            min_dwell_cycles: 3, // Require 3 consecutive cycles before flipping state
        }
    }

    pub fn classify(
        &mut self,
        hr: Option<f32>,
        hrv: Option<f32>,
        movement: Option<f32>,
        is_nighttime: bool,
    ) -> (InferredState, f32) {
        let hr = hr.unwrap_or(self.baseline.resting_hr);
        let mov = movement.unwrap_or(0.0);

        // State inference with deadbands (hysteresis)
        // Entry thresholds vs Exit thresholds prevent jitter around boundary points
        let instant_state = match self.current_state {
            InferredState::SleepDeep => {
                // Exit deep sleep if HR rises above sleep_hr + 1.0 or movement occurs
                if mov >= 0.08 || hr > (self.baseline.sleep_hr + 1.0) {
                    InferredState::SleepLight
                } else {
                    InferredState::SleepDeep
                }
            }
            InferredState::SleepLight => {
                if mov < 0.04 && hr <= (self.baseline.sleep_hr - 2.0) {
                    InferredState::SleepDeep
                } else if mov >= 0.15 || hr > (self.baseline.sleep_hr + 8.0) {
                    InferredState::Awake
                } else {
                    InferredState::SleepLight
                }
            }
            InferredState::SleepOnset => {
                if mov < 0.04 && hr <= self.baseline.sleep_hr {
                    InferredState::SleepLight
                } else if mov >= 0.20 || hr > (self.baseline.sleep_hr + 10.0) {
                    InferredState::Awake
                } else {
                    InferredState::SleepOnset
                }
            }
            InferredState::Stressed => {
                // Exit stressed only when HR drops well below stress boundary (deadband of 4 BPM)
                if hr <= (self.baseline.resting_hr + 6.0) {
                    InferredState::Awake
                } else {
                    InferredState::Stressed
                }
            }
            InferredState::Relaxed => {
                // Exit relaxed when HR rises above resting_hr
                if hr >= self.baseline.resting_hr {
                    InferredState::Awake
                } else {
                    InferredState::Relaxed
                }
            }
            _ => {
                // Default / Awake state evaluation:
                if is_nighttime && mov < 0.05 && hr < (self.baseline.sleep_hr + 4.0) {
                    if hr < self.baseline.sleep_hr - 2.0 {
                        InferredState::SleepDeep
                    } else if hr < self.baseline.sleep_hr + 2.0 {
                        InferredState::SleepLight
                    } else {
                        InferredState::SleepOnset
                    }
                } else if hr > (self.baseline.resting_hr + 12.0) && mov < 0.15 {
                    InferredState::Stressed
                } else if hr < (self.baseline.resting_hr - 4.0) && mov < 0.1 {
                    InferredState::Relaxed
                } else if hr <= (self.baseline.daytime_hr + 3.0) && mov < 0.1 {
                    if let Some(h) = hrv {
                        if h > 50.0 {
                            InferredState::FocusCalm
                        } else {
                            InferredState::FocusDeep
                        }
                    } else {
                        InferredState::FocusDeep
                    }
                } else {
                    InferredState::Awake
                }
            }
        };

        // Apply temporal dwell filtering: require consecutive cycles to confirm transition
        if instant_state == self.current_state {
            self.candidate_state = instant_state;
            self.candidate_count = 0;
        } else if instant_state == self.candidate_state {
            self.candidate_count += 1;
            if self.candidate_count >= self.min_dwell_cycles {
                self.current_state = instant_state;
                self.candidate_count = 0;
            }
        } else {
            self.candidate_state = instant_state;
            self.candidate_count = 1;
        }

        // Confidence estimation
        let confidence = if movement.is_some() && hrv.is_some() {
            0.90
        } else if movement.is_some() {
            0.75
        } else {
            0.60
        };

        self.confidence = confidence;

        (self.current_state, confidence)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_hysteresis_dwell_prevention() {
        let mut classifier = StateClassifier::new();
        assert_eq!(classifier.current_state, InferredState::Awake);

        // Single cycle of stressed condition (HR > baseline + 12)
        let (state, _) = classifier.classify(Some(90.0), Some(40.0), Some(0.0), false);
        // Should NOT immediately transition due to min_dwell_cycles = 3
        assert_eq!(state, InferredState::Awake);

        // Cycle 2
        let (state, _) = classifier.classify(Some(90.0), Some(40.0), Some(0.0), false);
        assert_eq!(state, InferredState::Awake);

        // Cycle 3 - meets threshold
        let (state, _) = classifier.classify(Some(90.0), Some(40.0), Some(0.0), false);
        assert_eq!(state, InferredState::Stressed);
    }

    #[test]
    fn test_hysteresis_deadband_stability() {
        let mut classifier = StateClassifier::new();
        // Transition to Stressed
        for _ in 0..3 {
            classifier.classify(Some(90.0), Some(30.0), Some(0.0), false);
        }
        assert_eq!(classifier.current_state, InferredState::Stressed);

        // Slight HR drop to 77 BPM (baseline 65 + 12 = 77 threshold).
        // Due to deadband, stress is maintained until <= baseline + 6 (71 BPM).
        for _ in 0..5 {
            classifier.classify(Some(75.0), Some(40.0), Some(0.0), false);
        }
        assert_eq!(classifier.current_state, InferredState::Stressed);

        // Drop below exit threshold (<= 71 BPM) for 3 cycles
        for _ in 0..3 {
            classifier.classify(Some(68.0), Some(45.0), Some(0.0), false);
        }
        assert_eq!(classifier.current_state, InferredState::Awake);
    }
}
