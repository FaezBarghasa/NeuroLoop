use crate::analytics::TuningProfile;
use crate::data::{EffectivenessScore as DbScore, NeuroStore, TuningProfileRecord};
use std::sync::Arc;
use tauri::State;

#[tauri::command]
pub async fn get_tuning_profile(
    store: State<'_, Arc<NeuroStore>>,
) -> Result<TuningProfile, String> {
    if let Ok(Some(record)) = store.get_active_tuning_profile().await {
        if let Ok(profile) = serde_json::from_value::<TuningProfile>(record.profile_json) {
            return Ok(profile);
        }
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
