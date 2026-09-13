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
    use std::sync::atomic::Ordering;
    let is_playing = engine.params.is_playing.load(Ordering::Relaxed);
    let carrier_hz = f32::from_bits(engine.params.target_carrier.load(Ordering::Relaxed));
    let beat_hz = f32::from_bits(engine.params.target_beat.load(Ordering::Relaxed));
    let volume = f32::from_bits(engine.params.target_volume.load(Ordering::Relaxed));
    let modality_u8 = engine.params.modality.load(Ordering::Relaxed);

    let modality = match modality_u8 {
        1 => "isochronic",
        2 => "monaural",
        3 => "mixed",
        _ => "binaural",
    }
    .to_string();

    Ok(AudioStatus {
        is_playing,
        carrier_hz,
        beat_hz,
        volume,
        modality,
    })
}
