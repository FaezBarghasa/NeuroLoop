pub mod analytics;
pub mod audio;
pub mod biometric;
pub mod commands;
pub mod data;
pub mod tuning;

use audio::AudioEngine;
use commands::*;
use data::NeuroStore;
use std::sync::Arc;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let app_data_dir = app
                .path()
                .app_data_dir()
                .unwrap_or_else(|_| std::path::PathBuf::from("./neuroloop_data"));
            std::fs::create_dir_all(&app_data_dir).ok();

            let db_path = app_data_dir.join("neuroloop.db");
            let db_path_str = db_path.to_str().unwrap_or("./neuroloop_data/neuroloop.db");

            // Initialize SurrealDB local storage asynchronously in Tokio
            let store = tauri::async_runtime::block_on(async {
                NeuroStore::init_embedded(db_path_str)
                    .await
                    .expect("Failed to initialize SurrealDB engine")
            });

            let audio_engine = AudioEngine::new().unwrap_or_else(|e| {
                eprintln!("Warning: Audio engine fallback: {}", e);
                // Handle fallback if running without physical sound card
                panic!("Failed to init CPAL engine: {}", e);
            });

            app.manage(Arc::new(store));
            app.manage(Arc::new(audio_engine));

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            play_preset,
            stop_audio,
            set_volume,
            fade_to_preset,
            get_audio_status,
            ingest_biometric_sample,
            get_recent_biometrics,
            start_audio_session,
            end_audio_session,
            submit_user_feedback,
            wipe_data,
            export_all_json,
            export_full_zip,
            get_tuning_profile,
            save_tuning_profile,
            get_effectiveness_scores,
            record_effectiveness_score
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
