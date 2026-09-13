pub struct BiometricFilter {
    hr_history: Vec<f32>,
    hrv_history: Vec<f32>,
    window_size: usize,
    ema_hr: Option<f32>,
    ema_alpha: f32,
}

impl BiometricFilter {
    pub fn new(window_size: usize) -> Self {
        Self {
            hr_history: Vec::with_capacity(window_size),
            hrv_history: Vec::with_capacity(window_size),
            window_size: window_size.max(3),
            ema_hr: None,
            ema_alpha: 0.25, // Responsive yet smooth filter constant
        }
    }

    pub fn filter_hr(&mut self, raw_hr: f32) -> Option<f32> {
        // 1. Hard physiological rejection: 30 - 220 BPM
        if !(30.0..=220.0).contains(&raw_hr) {
            return None;
        }

        if self.hr_history.len() >= self.window_size {
            self.hr_history.remove(0);
        }
        self.hr_history.push(raw_hr);

        // 2. Compute median filter across window
        let mut sorted = self.hr_history.clone();
        sorted.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
        let median = sorted[sorted.len() / 2];

        // 3. Apply Exponential Moving Average (EMA)
        let smoothed = match self.ema_hr {
            Some(prev) => prev * (1.0 - self.ema_alpha) + median * self.ema_alpha,
            None => median,
        };
        self.ema_hr = Some(smoothed);

        Some(smoothed)
    }

    pub fn filter_hrv(&mut self, raw_hrv: f32) -> Option<f32> {
        // Physiological RMSSD bound: 5ms to 300ms
        if !(5.0..=300.0).contains(&raw_hrv) {
            return None;
        }

        if self.hrv_history.len() >= self.window_size {
            self.hrv_history.remove(0);
        }
        self.hrv_history.push(raw_hrv);

        let mut sorted = self.hrv_history.clone();
        sorted.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
        Some(sorted[sorted.len() / 2])
    }
}
