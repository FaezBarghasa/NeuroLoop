pub struct BiometricFilter {
    hr_history: Vec<f32>,
    window_size: usize,
}

impl BiometricFilter {
    pub fn new(window_size: usize) -> Self {
        Self {
            hr_history: Vec::with_capacity(window_size),
            window_size: window_size.max(3),
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

        // 2. Compute median filter
        let mut sorted = self.hr_history.clone();
        sorted.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
        let mid = sorted.len() / 2;

        Some(sorted[mid])
    }
}
