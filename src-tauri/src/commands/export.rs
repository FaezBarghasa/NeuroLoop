use crate::data::NeuroStore;
use std::sync::Arc;
use tauri::State;

#[tauri::command]
pub async fn export_all_json(store: State<'_, Arc<NeuroStore>>) -> Result<String, String> {
    let store = store.inner().clone();
    let rt = store.rt.clone();
    rt.spawn(async move { store.export_all_json().await })
        .await
        .unwrap()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn export_full_zip(
    store: State<'_, Arc<NeuroStore>>,
    destination_path: String,
) -> Result<(), String> {
    let store = store.inner().clone();
    let rt = store.rt.clone();
    rt.spawn(async move { store.export_full_zip(&destination_path).await })
        .await
        .unwrap()
        .map_err(|e| e.to_string())
}
