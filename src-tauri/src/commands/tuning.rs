use crate::analytics::TuningProfile;
use crate::data::{EffectivenessScore as DbScore, NeuroStore, TuningProfileRecord};
use std::sync::Arc;
use tauri::State;

#[tauri::command]
pub async fn get_tuning_profile(
    store: State<'_, Arc<NeuroStore>>,
) -> Result<TuningProfile, String> {
    if let Ok(Some(record)) = store.get_active_tuning_profile().await
        && let Ok(profile) = serde_json::from_value::<TuningProfile>(record.profile_json)
    {
        return Ok(profile);
    }
    Ok(TuningProfile::default())
}

#[tauri::command]
pub async fn save_tuning_profile(
    store: State<'_, Arc<NeuroStore>>,
    profile: TuningProfile,
) -> Result<(), String> {
    let profile_json = serde_json::to_value(&profile).map_err(|e| e.to_string())?;
    let record = TuningProfileRecord {
        id: None,
        version: profile.version,
        created_at: chrono::Utc::now().to_rfc3339(),
        active: true,
        profile_json,
    };
    store
        .save_tuning_profile(record)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_effectiveness_scores(
    store: State<'_, Arc<NeuroStore>>,
) -> Result<Vec<DbScore>, String> {
    store
        .get_effectiveness_scores()
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn record_effectiveness_score(
    store: State<'_, Arc<NeuroStore>>,
    score: DbScore,
) -> Result<DbScore, String> {
    store
        .record_effectiveness(score)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn evaluate_session(
    store: State<'_, Arc<NeuroStore>>,
    session_id: String,
    user_rating: Option<u8>,
) -> Result<DbScore, String> {
    use crate::analytics::{
        FocusMetrics, SleepMetrics, score_focus_session, score_sleep_session, update_preset_weight,
    };

    let session = store
        .get_audio_session(&session_id)
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Audio session with id {session_id} not found"))?;

    let samples = store
        .get_samples_for_session(&session.started_at, session.ended_at.as_deref())
        .await
        .map_err(|e| e.to_string())?;

    let hr_values: Vec<f32> = samples.iter().filter_map(|s| s.heart_rate).collect();
    let hrv_values: Vec<f32> = samples.iter().filter_map(|s| s.hrv).collect();

    let category = session.category.clone().unwrap_or_else(|| "sleep".to_string());
    let (obj_score, subj_score, combined) = if category.contains("focus") || category.contains("work") {
        let hr_stability = if hr_values.len() >= 2 {
            let mean: f32 = hr_values.iter().sum::<f32>() / hr_values.len() as f32;
            let variance: f32 = hr_values.iter().map(|&x| (x - mean).powi(2)).sum::<f32>()
                / hr_values.len() as f32;
            (1.0 - (variance.sqrt() / 20.0)).clamp(0.0, 1.0)
        } else {
            0.70
        };

        let metrics = FocusMetrics {
            completion_ratio: if session.ended_at.is_some() { 1.0 } else { 0.5 },
            interruption_count: 0,
            hr_stability,
            stress_event_count: samples.iter().filter(|s| s.stress.is_some_and(|st| st > 60.0)).count() as u32,
        };
        score_focus_session(&metrics, user_rating)
    } else {
        // Sleep category
        let hr_reduction = if hr_values.len() >= 2 {
            let first_hr = hr_values[0];
            let min_hr = hr_values.iter().cloned().fold(f32::INFINITY, f32::min);
            ((first_hr - min_hr) / first_hr).clamp(0.0, 0.5)
        } else {
            0.05
        };

        let deep_count = samples
            .iter()
            .filter(|s| s.inferred_state.as_deref() == Some("sleep_deep"))
            .count();
        let deep_ratio = if !samples.is_empty() {
            deep_count as f32 / samples.len() as f32
        } else {
            0.20
        };

        let metrics = SleepMetrics {
            sleep_efficiency: 0.85,
            hr_reduction,
            wake_count: 0,
            deep_sleep_ratio: deep_ratio,
        };
        score_sleep_session(&metrics, user_rating)
    };

    // Close the self-tuning feedback loop: Update active TuningProfile preset weights
    let mut profile = if let Ok(Some(record)) = store.get_active_tuning_profile().await
        && let Ok(p) = serde_json::from_value::<TuningProfile>(record.profile_json)
    {
        p
    } else {
        TuningProfile::default()
    };

    let cat_weights = profile
        .preset_weights
        .entry(category.clone())
        .or_default();

    let current_weight = *cat_weights.get(&session.preset_id).unwrap_or(&0.70);
    let new_weight = update_preset_weight(current_weight, combined, Some(0.15));
    cat_weights.insert(session.preset_id.clone(), new_weight);

    profile.version += 1;
    let profile_record = TuningProfileRecord {
        id: None,
        version: profile.version,
        created_at: chrono::Utc::now().to_rfc3339(),
        active: true,
        profile_json: serde_json::to_value(&profile).map_err(|e| e.to_string())?,
    };
    store.save_tuning_profile(profile_record).await.map_err(|e| e.to_string())?;

    // Record effectiveness score
    let score_record = DbScore {
        id: None,
        session_id: Some(session_id),
        preset_id: session.preset_id,
        category,
        objective_score: obj_score,
        subjective_score: subj_score,
        combined_score: combined,
        metrics: serde_json::json!({
            "sample_count": samples.len(),
            "avg_hr": if !hr_values.is_empty() { Some(hr_values.iter().sum::<f32>() / hr_values.len() as f32) } else { None },
            "avg_hrv": if !hrv_values.is_empty() { Some(hrv_values.iter().sum::<f32>() / hrv_values.len() as f32) } else { None },
        }),
        created_at: chrono::Utc::now().to_rfc3339(),
    };

    store.record_effectiveness(score_record).await.map_err(|e| e.to_string())
}
