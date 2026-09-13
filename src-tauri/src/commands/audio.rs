use crate::audio::{AudioEngine, Modality};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tauri::State;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PresetPayload {
    pub id: String,
    pub name: String,
    pub carrier: f32,
    pub beat: f32,
    pub modality: String,
    pub volume: Option<f32>,
    pub ramp_duration: Option<f32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AudioStatus {
    pub is_playing: bool,
    pub carrier_hz: f32,
    pub beat_hz: f32,
    pub volume: f32,
    pub modality: String,
}

#[tauri::command]
pub fn play_preset(
    engine: State<'_, Arc<AudioEngine>>,
    preset: PresetPayload,
) -> Result<(), String> {
    let modality = match preset.modality.to_lowercase().as_str() {
        "isochronic" => Modality::Isochronic,
        "monaural" => Modality::Monaural,
        "mixed" => Modality::Mixed,
        _ => Modality::Binaural,
    };

    if let Some(vol) = preset.volume {
        engine.set_volume(vol, Some(0.3));
    }

    engine.set_preset(preset.carrier, preset.beat, modality, preset.ramp_duration);
    engine.play();
    Ok(())
}

#[tauri::command]
pub fn stop_audio(engine: State<'_, Arc<AudioEngine>>) -> Result<(), String> {
    engine.stop();
    Ok(())
}

#[tauri::command]
pub fn set_volume(engine: State<'_, Arc<AudioEngine>>, volume: f32) -> Result<(), String> {
    engine.set_volume(volume, Some(0.1));
    Ok(())
}

#[tauri::command]
pub fn fade_to_preset(
    engine: State<'_, Arc<AudioEngine>>,
    preset: PresetPayload,
    duration_seconds: f32,
) -> Result<(), String> {
    let modality = match preset.modality.to_lowercase().as_str() {
        "isochronic" => Modality::Isochronic,
        "monaural" => Modality::Monaural,
        "mixed" => Modality::Mixed,
        _ => Modality::Binaural,
    };

    engine.set_preset(
        preset.carrier,
        preset.beat,
        modality,
        Some(duration_seconds),
    );
    Ok(())
}

#[tauri::command]
pub fn get_audio_status(engine: State<'_, Arc<AudioEngine>>) -> Result<AudioStatus, String> {
    let is_playing = *engine.is_playing.lock().map_err(|e| e.to_string())?;
    let osc = engine.state.lock().map_err(|e| e.to_string())?;

    let modality = match osc.modality {
        Modality::Binaural => "binaural",
        Modality::Isochronic => "isochronic",
        Modality::Monaural => "monaural",
        Modality::Mixed => "mixed",
    }
    .to_string();

    Ok(AudioStatus {
        is_playing,
        carrier_hz: osc.carrier_ramp.current,
        beat_hz: osc.beat_ramp.current,
        volume: osc.volume_ramp.current,
        modality,
    })
}
