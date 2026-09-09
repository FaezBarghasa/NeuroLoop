use super::scoring::{calculate_combined_score, normalize_score};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SleepMetrics {
    pub sleep_efficiency: f32,
    pub hr_reduction: f32,
    pub wake_count: u32,
    pub deep_sleep_ratio: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FocusMetrics {
    pub completion_ratio: f32,
    pub interruption_count: u32,
    pub hr_stability: f32,
    pub stress_event_count: u32,
}

pub fn score_sleep_session(metrics: &SleepMetrics, user_rating: Option<u8>) -> (f32, f32, f32) {
    // Objective sleep score:
    // Efficiency (40%) + HR drop (30%) + Wake penalty (20%) + Deep sleep (10%)
    let wake_penalty = (1.0 - (metrics.wake_count as f32 * 0.2)).max(0.0);
    let objective = (metrics.sleep_efficiency * 0.4)
        + (metrics.hr_reduction.clamp(0.0, 0.3) / 0.3 * 0.3)
        + (wake_penalty * 0.2)
        + (metrics.deep_sleep_ratio.clamp(0.0, 0.4) / 0.4 * 0.1);

    let obj_score = normalize_score(objective);

    let subj_score = match user_rating {
        Some(r) => normalize_score((r as f32 - 1.0) / 4.0),
        None => obj_score,
    };

    let combined = calculate_combined_score(obj_score, subj_score, 0.6, 0.4);
    (obj_score, subj_score, combined)
}

pub fn score_focus_session(metrics: &FocusMetrics, user_rating: Option<u8>) -> (f32, f32, f32) {
    let int_penalty = (1.0 - (metrics.interruption_count as f32 * 0.15)).max(0.0);
    let stress_penalty = (1.0 - (metrics.stress_event_count as f32 * 0.25)).max(0.0);

    let objective = (metrics.completion_ratio * 0.4)
        + (int_penalty * 0.3)
        + (metrics.hr_stability * 0.2)
        + (stress_penalty * 0.1);

    let obj_score = normalize_score(objective);

    let subj_score = match user_rating {
        Some(r) => normalize_score((r as f32 - 1.0) / 4.0),
        None => obj_score,
    };

    let combined = calculate_combined_score(obj_score, subj_score, 0.6, 0.4);
    (obj_score, subj_score, combined)
}
