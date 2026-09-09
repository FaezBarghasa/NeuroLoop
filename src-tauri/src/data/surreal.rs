use serde::{Deserialize, Serialize};
use surrealdb::engine::local::{Db, SurrealKv};
use surrealdb::Surreal;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BiometricSample {
    pub id: Option<String>,
    pub timestamp: String,
    pub source: String,
    pub heart_rate: Option<f32>,
    pub hrv: Option<f32>,
    pub spo2: Option<f32>,
    pub stress: Option<f32>,
    pub movement: Option<f32>,
    pub inferred_state: Option<String>,
    pub confidence: Option<f32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AudioSession {
    pub id: Option<String>,
    pub started_at: String,
    pub ended_at: Option<String>,
    pub preset_id: String,
    pub preset_name: Option<String>,
    pub category: Option<String>,
    pub modality: Option<String>,
    pub carrier_hz: Option<f32>,
    pub beat_start_hz: Option<f32>,
    pub beat_end_hz: Option<f32>,
    pub pulse_hz: Option<f32>,
    pub volume: Option<f32>,
    pub auto_mode: bool,
    pub manual_override: bool,
    pub source: Option<String>,
    pub end_reason: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StateEvent {
    pub id: Option<String>,
    pub timestamp: String,
    pub previous_state: Option<String>,
    pub new_state: String,
    pub confidence: f32,
    pub reason: Option<String>,
    pub session_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SleepSession {
    pub id: Option<String>,
    pub started_at: String,
    pub ended_at: Option<String>,
    pub source: String,
    pub total_sleep_score: Option<f32>,
    pub efficiency: Option<f32>,
    pub hr_avg: Option<f32>,
    pub hr_min: Option<f32>,
    pub hrv_avg: Option<f32>,
    pub wake_count: Option<u32>,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserFeedback {
    pub id: Option<String>,
    pub timestamp: String,
    pub session_id: Option<String>,
    pub rating: u8,
    pub helpful: bool,
    pub too_intense: bool,
    pub too_quiet: bool,
    pub discomfort: bool,
    pub tags: Vec<String>,
    pub note: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EffectivenessScore {
    pub id: Option<String>,
    pub session_id: Option<String>,
    pub preset_id: String,
    pub category: String,
    pub objective_score: f32,
    pub subjective_score: f32,
    pub combined_score: f32,
    pub metrics: serde_json::Value,
    pub created_at: String,
}

#[derive(Debug, Clone)]
pub struct NeuroStore {
    pub db: Surreal<Db>,
}

impl NeuroStore {
    pub async fn init_embedded(db_path: &str) -> Result<Self, surrealdb::Error> {
        let db = Surreal::new::<SurrealKv>(db_path).await?;
        db.use_ns("neuroloop").use_db("wellness").await?;
        Ok(Self { db })
    }
}
