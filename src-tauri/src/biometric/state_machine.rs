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
    pub confidence: f32,
    pub baseline: PersonalBaseline,
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
            confidence: 0.5,
            baseline: PersonalBaseline::default(),
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

        // State inference rules with hysteresis
        let new_state = if is_nighttime && mov < 0.05 && hr < (self.baseline.sleep_hr + 4.0) {
            if hr < self.baseline.sleep_hr - 2.0 {
                InferredState::SleepDeep
            } else if hr < self.baseline.sleep_hr + 2.0 {
                InferredState::SleepLight
            } else {
                InferredState::SleepOnset
            }
        } else if hr > (self.baseline.resting_hr + 12.0) && mov < 0.15 {
            InferredState::Stressed
        } else if hr < (self.baseline.resting_hr - 3.0) && mov < 0.1 {
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
        };

        // Confidence estimation
        let confidence = if movement.is_some() && hrv.is_some() {
            0.85
        } else if movement.is_some() {
            0.75
        } else {
            0.60
        };

        self.current_state = new_state;
        self.confidence = confidence;

        (new_state, confidence)
    }
}
