use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TuningProfile {
    pub version: u32,
    pub auto_sensitivity: f32,
    pub fade_seconds: f32,
    pub tuning_standard: String,
    pub carrier_overrides: HashMap<String, f32>,
    pub state_thresholds: HashMap<String, f32>,
    pub preset_weights: HashMap<String, HashMap<String, f32>>,
}

impl Default for TuningProfile {
    fn default() -> Self {
        let mut carrier_overrides = HashMap::new();
        carrier_overrides.insert("sleep".to_string(), 108.0);
        carrier_overrides.insert("relax".to_string(), 216.0);
        carrier_overrides.insert("meditation".to_string(), 216.0);
        carrier_overrides.insert("focus".to_string(), 324.0);
        carrier_overrides.insert("energy".to_string(), 324.0);

        let mut state_thresholds = HashMap::new();
        state_thresholds.insert("sleep_onset_hr_drop".to_string(), 5.0);
        state_thresholds.insert("stress_hr_increase".to_string(), 8.0);
        state_thresholds.insert("low_hrv_penalty".to_string(), 0.15);
        state_thresholds.insert("movement_sleep_max".to_string(), 0.05);

        let mut preset_weights = HashMap::new();
        let mut sleep_weights = HashMap::new();
        sleep_weights.insert("sleep.deep.delta".to_string(), 0.85);
        sleep_weights.insert("sleep.onset.alpha-theta".to_string(), 0.75);
        sleep_weights.insert("sleep.calm-night".to_string(), 0.60);
        preset_weights.insert("sleep".to_string(), sleep_weights);

        let mut focus_weights = HashMap::new();
        focus_weights.insert("focus.deep-work-beta".to_string(), 0.80);
        focus_weights.insert("focus.coding-smr".to_string(), 0.75);
        preset_weights.insert("focus".to_string(), focus_weights);

        Self {
            version: 1,
            auto_sensitivity: 0.7,
            fade_seconds: 90.0,
            tuning_standard: "A432".to_string(),
            carrier_overrides,
            state_thresholds,
            preset_weights,
        }
    }
}
