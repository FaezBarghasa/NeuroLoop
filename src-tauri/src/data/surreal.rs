use serde::{Deserialize, Serialize};
use surrealdb::engine::local::{Db, SurrealKv};
use surrealdb::Surreal;
use std::io::Write;
use zip::write::SimpleFileOptions;
use zip::ZipWriter;

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
pub struct SleepStage {
    pub id: Option<String>,
    pub sleep_session_id: String,
    pub stage: String,
    pub started_at: String,
    pub ended_at: String,
    pub source: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FocusSession {
    pub id: Option<String>,
    pub started_at: String,
    pub ended_at: Option<String>,
    pub preset_id: Option<String>,
    pub completed: bool,
    pub interruption_count: u32,
    pub hr_avg: Option<f32>,
    pub hrv_avg: Option<f32>,
    pub stress_events: u32,
    pub user_rating: Option<u8>,
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

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TuningProfileRecord {
    pub id: Option<String>,
    pub version: u32,
    pub created_at: String,
    pub active: bool,
    pub profile_json: serde_json::Value,
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

    pub async fn ingest_sample(&self, sample: BiometricSample) -> Result<BiometricSample, surrealdb::Error> {
        let created: Option<BiometricSample> = self.db.create("biometric_samples").content(sample).await?;
        created.ok_or_else(|| surrealdb::Error::Db(surrealdb::error::Db::Internal("Failed to insert sample".into())))
    }

    pub async fn get_recent_samples(&self, limit: usize) -> Result<Vec<BiometricSample>, surrealdb::Error> {
        let mut response = self
            .db
            .query("SELECT * FROM biometric_samples ORDER BY timestamp DESC LIMIT $limit")
            .bind(("limit", limit))
            .await?;
        let samples: Vec<BiometricSample> = response.take(0)?;
        Ok(samples)
    }

    pub async fn start_audio_session(&self, session: AudioSession) -> Result<AudioSession, surrealdb::Error> {
        let created: Option<AudioSession> = self.db.create("audio_sessions").content(session).await?;
        created.ok_or_else(|| surrealdb::Error::Db(surrealdb::error::Db::Internal("Failed to start audio session".into())))
    }

    pub async fn end_audio_session(&self, session_id: &str, end_time: &str, reason: &str) -> Result<(), surrealdb::Error> {
        self.db
            .query("UPDATE type::thing('audio_sessions', $id) SET ended_at = $ended_at, end_reason = $reason")
            .bind(("id", session_id.to_string()))
            .bind(("ended_at", end_time.to_string()))
            .bind(("reason", reason.to_string()))
            .await?;
        Ok(())
    }

    pub async fn get_audio_sessions(&self, limit: usize) -> Result<Vec<AudioSession>, surrealdb::Error> {
        let mut response = self
            .db
            .query("SELECT * FROM audio_sessions ORDER BY started_at DESC LIMIT $limit")
            .bind(("limit", limit))
            .await?;
        let sessions: Vec<AudioSession> = response.take(0)?;
        Ok(sessions)
    }

    pub async fn record_state_event(&self, event: StateEvent) -> Result<StateEvent, surrealdb::Error> {
        let created: Option<StateEvent> = self.db.create("state_events").content(event).await?;
        created.ok_or_else(|| surrealdb::Error::Db(surrealdb::error::Db::Internal("Failed to record state event".into())))
    }

    pub async fn add_user_feedback(&self, feedback: UserFeedback) -> Result<UserFeedback, surrealdb::Error> {
        let created: Option<UserFeedback> = self.db.create("user_feedback").content(feedback).await?;
        created.ok_or_else(|| surrealdb::Error::Db(surrealdb::error::Db::Internal("Failed to insert user feedback".into())))
    }

    pub async fn record_effectiveness(&self, score: EffectivenessScore) -> Result<EffectivenessScore, surrealdb::Error> {
        let created: Option<EffectivenessScore> = self.db.create("effectiveness_scores").content(score).await?;
        created.ok_or_else(|| surrealdb::Error::Db(surrealdb::error::Db::Internal("Failed to insert score".into())))
    }

    pub async fn get_effectiveness_scores(&self) -> Result<Vec<EffectivenessScore>, surrealdb::Error> {
        let mut response = self
            .db
            .query("SELECT * FROM effectiveness_scores ORDER BY created_at DESC")
            .await?;
        let scores: Vec<EffectivenessScore> = response.take(0)?;
        Ok(scores)
    }

    pub async fn save_tuning_profile(&self, profile: TuningProfileRecord) -> Result<(), surrealdb::Error> {
        let _: Option<TuningProfileRecord> = self.db.create("tuning_profiles").content(profile).await?;
        Ok(())
    }

    pub async fn get_active_tuning_profile(&self) -> Result<Option<TuningProfileRecord>, surrealdb::Error> {
        let mut response = self
            .db
            .query("SELECT * FROM tuning_profiles WHERE active = true ORDER BY version DESC LIMIT 1")
            .await?;
        let profile: Option<TuningProfileRecord> = response.take(0)?;
        Ok(profile)
    }

    pub async fn export_all_json(&self) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
        let samples: Vec<BiometricSample> = self.db.select("biometric_samples").await?;
        let sessions: Vec<AudioSession> = self.db.select("audio_sessions").await?;
        let state_events: Vec<StateEvent> = self.db.select("state_events").await?;
        let sleep_sessions: Vec<SleepSession> = self.db.select("sleep_sessions").await?;
        let sleep_stages: Vec<SleepStage> = self.db.select("sleep_stages").await?;
        let focus_sessions: Vec<FocusSession> = self.db.select("focus_sessions").await?;
        let feedback: Vec<UserFeedback> = self.db.select("user_feedback").await?;
        let scores: Vec<EffectivenessScore> = self.db.select("effectiveness_scores").await?;
        let profiles: Vec<TuningProfileRecord> = self.db.select("tuning_profiles").await?;

        let export_doc = serde_json::json!({
            "metadata": {
                "app": "NeuroLoop",
                "schema_version": 1,
                "exported_at": chrono::Utc::now().to_rfc3339(),
                "tuning_standard": "A432",
                "database_engine": "SurrealDB"
            },
            "biometric_samples": samples,
            "audio_sessions": sessions,
            "state_events": state_events,
            "sleep_sessions": sleep_sessions,
            "sleep_stages": sleep_stages,
            "focus_sessions": focus_sessions,
            "user_feedback": feedback,
            "effectiveness_scores": scores,
            "tuning_profiles": profiles
        });

        Ok(serde_json::to_string_pretty(&export_doc)?)
    }

    pub async fn export_full_zip(&self, output_path: &str) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let file = std::fs::File::create(output_path)?;
        let mut zip = ZipWriter::new(file);
        let options = SimpleFileOptions::default().compression_method(zip::CompressionMethod::Deflated);

        // 1. Write metadata.json
        zip.start_file("metadata.json", options)?;
        let metadata = serde_json::json!({
            "app": "NeuroLoop",
            "schema_version": 1,
            "exported_at": chrono::Utc::now().to_rfc3339(),
            "tuning_standard": "A432",
            "database_engine": "SurrealDB"
        });
        zip.write_all(metadata.to_string().as_bytes())?;

        // 2. Write full json backup
        zip.start_file("full_backup.json", options)?;
        let full_json = self.export_all_json().await?;
        zip.write_all(full_json.as_bytes())?;

        // 3. Write README.txt
        zip.start_file("README.txt", options)?;
        let readme = "NeuroLoop Export Archive\n\nThis archive contains all locally stored data, biometric logs, audio sessions, feedback, and learned tuning profiles.\nAll data is local-first.\n";
        zip.write_all(readme.as_bytes())?;

        zip.finish()?;
        Ok(())
    }

    pub async fn wipe_data(&self, scope: &str) -> Result<(), surrealdb::Error> {
        match scope {
            "biometric" => {
                let _: Vec<BiometricSample> = self.db.delete("biometric_samples").await?;
                let _: Vec<SleepSession> = self.db.delete("sleep_sessions").await?;
                let _: Vec<SleepStage> = self.db.delete("sleep_stages").await?;
            }
            "feedback" => {
                let _: Vec<UserFeedback> = self.db.delete("user_feedback").await?;
                let _: Vec<EffectivenessScore> = self.db.delete("effectiveness_scores").await?;
            }
            "sessions" => {
                let _: Vec<AudioSession> = self.db.delete("audio_sessions").await?;
                let _: Vec<StateEvent> = self.db.delete("state_events").await?;
                let _: Vec<FocusSession> = self.db.delete("focus_sessions").await?;
            }
            "all" => {
                let _: Vec<BiometricSample> = self.db.delete("biometric_samples").await?;
                let _: Vec<AudioSession> = self.db.delete("audio_sessions").await?;
                let _: Vec<StateEvent> = self.db.delete("state_events").await?;
                let _: Vec<SleepSession> = self.db.delete("sleep_sessions").await?;
                let _: Vec<SleepStage> = self.db.delete("sleep_stages").await?;
                let _: Vec<FocusSession> = self.db.delete("focus_sessions").await?;
                let _: Vec<UserFeedback> = self.db.delete("user_feedback").await?;
                let _: Vec<EffectivenessScore> = self.db.delete("effectiveness_scores").await?;
                let _: Vec<TuningProfileRecord> = self.db.delete("tuning_profiles").await?;
            }
            _ => {}
        }
        Ok(())
    }
}
