use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PersonalBaseline {
    pub resting_hr: f32,
    pub daytime_hr: f32,
    pub evening_hr: f32,
    pub sleep_hr: f32,
    pub hrv_rmssd: f32,
    pub alpha: f32,
}

impl Default for PersonalBaseline {
    fn default() -> Self {
        Self {
            resting_hr: 68.0,
            daytime_hr: 75.0,
            evening_hr: 70.0,
            sleep_hr: 58.0,
            hrv_rmssd: 55.0,
            alpha: 0.05,
        }
    }
}

impl PersonalBaseline {
    pub fn update_resting_hr(&mut self, sample_hr: f32) {
        self.resting_hr = self.resting_hr * (1.0 - self.alpha) + sample_hr * self.alpha;
    }

    pub fn update_sleep_hr(&mut self, sample_hr: f32) {
        self.sleep_hr = self.sleep_hr * (1.0 - self.alpha) + sample_hr * self.alpha;
    }
}
