use crate::data::{AudioSession, BiometricSample, NeuroStore, UserFeedback};
use std::sync::Arc;
use tauri::State;

#[tauri::command]
pub async fn ingest_biometric_sample(
    store: State<'_, Arc<NeuroStore>>,
    sample: BiometricSample,
) -> Result<BiometricSample, String> {
    let store = store.inner().clone();
    let rt = store.rt.clone();
    rt.spawn(async move { store.ingest_sample(sample).await })
        .await
        .unwrap()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_recent_biometrics(
    store: State<'_, Arc<NeuroStore>>,
    limit: usize,
) -> Result<Vec<BiometricSample>, String> {
    let store = store.inner().clone();
    let rt = store.rt.clone();
    rt.spawn(async move { store.get_recent_samples(limit).await })
        .await
        .unwrap()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn start_audio_session(
    store: State<'_, Arc<NeuroStore>>,
    session: AudioSession,
) -> Result<AudioSession, String> {
    let store = store.inner().clone();
    let rt = store.rt.clone();
    rt.spawn(async move { store.start_audio_session(session).await })
        .await
        .unwrap()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn end_audio_session(
    store: State<'_, Arc<NeuroStore>>,
    session_id: String,
    end_time: String,
    reason: String,
) -> Result<(), String> {
    let store = store.inner().clone();
    let rt = store.rt.clone();
    rt.spawn(async move {
        store
            .end_audio_session(&session_id, &end_time, &reason)
            .await
    })
    .await
    .unwrap()
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn submit_user_feedback(
    store: State<'_, Arc<NeuroStore>>,
    feedback: UserFeedback,
) -> Result<UserFeedback, String> {
    let store = store.inner().clone();
    let rt = store.rt.clone();
    rt.spawn(async move { store.add_user_feedback(feedback).await })
        .await
        .unwrap()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn wipe_data(store: State<'_, Arc<NeuroStore>>, scope: String) -> Result<(), String> {
    let store = store.inner().clone();
    let rt = store.rt.clone();
    rt.spawn(async move { store.wipe_data(&scope).await })
        .await
        .unwrap()
        .map_err(|e| e.to_string())
}
