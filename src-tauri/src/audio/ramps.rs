#[derive(Debug, Clone)]
pub struct ParameterRamp {
    pub current: f32,
    pub target: f32,
    pub step: f32,
    pub active: bool,
}

impl ParameterRamp {
    pub fn new(initial: f32) -> Self {
        Self {
            current: initial,
            target: initial,
            step: 0.0,
            active: false,
        }
    }

    pub fn set_target(&mut self, target: f32, duration_seconds: f32, sample_rate: f32) {
        if duration_seconds <= 0.0 {
            self.current = target;
            self.target = target;
            self.step = 0.0;
            self.active = false;
            return;
        }

        let total_samples = duration_seconds * sample_rate;
        self.target = target;
        self.step = (target - self.current) / total_samples;
        self.active = true;
    }

    #[inline(always)]
    pub fn advance(&mut self) -> f32 {
        if !self.active {
            return self.current;
        }

        self.current += self.step;
        if (self.step > 0.0 && self.current >= self.target)
            || (self.step < 0.0 && self.current <= self.target)
        {
            self.current = self.target;
            self.active = false;
        }

        self.current
    }
}
