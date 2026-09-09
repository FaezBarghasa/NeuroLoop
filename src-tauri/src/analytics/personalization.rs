pub fn update_preset_weight(
    current_weight: f32,
    session_score: f32,
    learning_rate: Option<f32>,
) -> f32 {
    let lr = learning_rate.unwrap_or(0.10);
    let updated = current_weight * (1.0 - lr) + session_score * lr;
    updated.clamp(0.05, 1.0)
}

pub fn apply_discomfort_penalty(current_weight: f32) -> f32 {
    (current_weight * 0.5).max(0.05)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_weight_update() {
        let w = update_preset_weight(0.5, 0.9, Some(0.1));
        assert!((w - 0.54).abs() < 0.001);
    }

    #[test]
    fn test_discomfort_penalty() {
        let w = apply_discomfort_penalty(0.8);
        assert_eq!(w, 0.4);
    }
}
