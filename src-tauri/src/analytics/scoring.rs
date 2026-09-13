pub fn normalize_score(score: f32) -> f32 {
    score.clamp(0.0, 1.0)
}

pub fn calculate_combined_score(
    objective_score: f32,
    subjective_score: f32,
    objective_weight: f32,
    subjective_weight: f32,
) -> f32 {
    let total_weight = objective_weight + subjective_weight;
    if total_weight <= 0.0 {
        return normalize_score(0.5 * (objective_score + subjective_score));
    }
    let combined =
        (objective_score * objective_weight + subjective_score * subjective_weight) / total_weight;
    normalize_score(combined)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_combined_scoring() {
        let score = calculate_combined_score(0.8, 0.9, 0.6, 0.4);
        assert!((score - 0.84).abs() < 0.001);
    }
}
