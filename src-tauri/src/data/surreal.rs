use serde::{Deserialize, Serialize};
use std::io::Write;
use surrealdb::Surreal;
use surrealdb::engine::local::{Db, SurrealKv};
use zip::ZipWriter;
use zip::write::SimpleFileOptions;

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

    pub async fn ingest_sample(
        &self,
        sample: BiometricSample,
    ) -> Result<BiometricSample, surrealdb::Error> {
        let val =
            serde_json::to_value(&sample).map_err(|e| surrealdb::Error::thrown(e.to_string()))?;
        let mut response = self
            .db
            .query("CREATE biometric_samples CONTENT $data")
            .bind(("data", val))
            .await?;
        let raw: Vec<serde_json::Value> = response.take(0).unwrap_or_default();
        raw.into_iter()
            .next()
            .and_then(|v| serde_json::from_value(v).ok())
            .ok_or_else(|| surrealdb::Error::thrown("Failed to insert sample".to_string()))
    }

    pub async fn get_recent_samples(
        &self,
        limit: usize,
    ) -> Result<Vec<BiometricSample>, surrealdb::Error> {
        let mut response = self
            .db
            .query("SELECT * FROM biometric_samples ORDER BY timestamp DESC LIMIT $limit")
            .bind(("limit", limit))
            .await?;
        let raw: Vec<serde_json::Value> = response.take(0)?;
        let samples: Vec<BiometricSample> = raw
            .into_iter()
            .filter_map(|v| serde_json::from_value(v).ok())
            .collect();
        Ok(samples)
    }

    pub async fn start_audio_session(
        &self,
        session: AudioSession,
    ) -> Result<AudioSession, surrealdb::Error> {
        let val =
            serde_json::to_value(&session).map_err(|e| surrealdb::Error::thrown(e.to_string()))?;
        let mut response = self
            .db
            .query("CREATE audio_sessions CONTENT $data")
            .bind(("data", val))
            .await?;
        let raw: Vec<serde_json::Value> = response.take(0).unwrap_or_default();
        raw.into_iter()
            .next()
            .and_then(|v| serde_json::from_value(v).ok())
            .ok_or_else(|| surrealdb::Error::thrown("Failed to start audio session".to_string()))
    }

    pub async fn end_audio_session(
        &self,
        session_id: &str,
        end_time: &str,
        reason: &str,
    ) -> Result<(), surrealdb::Error> {
        self.db
            .query("UPDATE type::thing('audio_sessions', $id) SET ended_at = $ended_at, end_reason = $reason")
            .bind(("id", session_id.to_string()))
            .bind(("ended_at", end_time.to_string()))
            .bind(("reason", reason.to_string()))
            .await?;
        Ok(())
    }

    pub async fn get_audio_sessions(
        &self,
        limit: usize,
    ) -> Result<Vec<AudioSession>, surrealdb::Error> {
        let mut response = self
            .db
            .query("SELECT * FROM audio_sessions ORDER BY started_at DESC LIMIT $limit")
            .bind(("limit", limit))
            .await?;
        let raw: Vec<serde_json::Value> = response.take(0)?;
        let sessions: Vec<AudioSession> = raw
            .into_iter()
            .filter_map(|v| serde_json::from_value(v).ok())
            .collect();
        Ok(sessions)
    }

    pub async fn record_state_event(
        &self,
        event: StateEvent,
    ) -> Result<StateEvent, surrealdb::Error> {
        let val =
            serde_json::to_value(&event).map_err(|e| surrealdb::Error::thrown(e.to_string()))?;
        let mut response = self
            .db
            .query("CREATE state_events CONTENT $data")
            .bind(("data", val))
            .await?;
        let raw: Vec<serde_json::Value> = response.take(0).unwrap_or_default();
        raw.into_iter()
            .next()
            .and_then(|v| serde_json::from_value(v).ok())
            .ok_or_else(|| surrealdb::Error::thrown("Failed to record state event".to_string()))
    }

    pub async fn add_user_feedback(
        &self,
        feedback: UserFeedback,
    ) -> Result<UserFeedback, surrealdb::Error> {
        let val =
            serde_json::to_value(&feedback).map_err(|e| surrealdb::Error::thrown(e.to_string()))?;
        let mut response = self
            .db
            .query("CREATE user_feedback CONTENT $data")
            .bind(("data", val))
            .await?;
        let raw: Vec<serde_json::Value> = response.take(0).unwrap_or_default();
        raw.into_iter()
            .next()
            .and_then(|v| serde_json::from_value(v).ok())
            .ok_or_else(|| surrealdb::Error::thrown("Failed to insert user feedback".to_string()))
    }

    pub async fn record_effectiveness(
        &self,
        score: EffectivenessScore,
    ) -> Result<EffectivenessScore, surrealdb::Error> {
        let val =
            serde_json::to_value(&score).map_err(|e| surrealdb::Error::thrown(e.to_string()))?;
        let mut response = self
            .db
            .query("CREATE effectiveness_scores CONTENT $data")
            .bind(("data", val))
            .await?;
        let raw: Vec<serde_json::Value> = response.take(0).unwrap_or_default();
        raw.into_iter()
            .next()
            .and_then(|v| serde_json::from_value(v).ok())
            .ok_or_else(|| surrealdb::Error::thrown("Failed to insert score".to_string()))
    }

    pub async fn get_effectiveness_scores(
        &self,
    ) -> Result<Vec<EffectivenessScore>, surrealdb::Error> {
        let mut response = self
            .db
            .query("SELECT * FROM effectiveness_scores ORDER BY created_at DESC")
            .await?;
        let raw: Vec<serde_json::Value> = response.take(0)?;
        let scores: Vec<EffectivenessScore> = raw
            .into_iter()
            .filter_map(|v| serde_json::from_value(v).ok())
            .collect();
        Ok(scores)
    }

    pub async fn save_tuning_profile(
        &self,
        profile: TuningProfileRecord,
    ) -> Result<(), surrealdb::Error> {
        let val =
            serde_json::to_value(&profile).map_err(|e| surrealdb::Error::thrown(e.to_string()))?;
        self.db
            .query("CREATE tuning_profiles CONTENT $data")
            .bind(("data", val))
            .await?;
        Ok(())
    }

    pub async fn get_active_tuning_profile(
        &self,
    ) -> Result<Option<TuningProfileRecord>, surrealdb::Error> {
        let mut response = self
            .db
            .query(
                "SELECT * FROM tuning_profiles WHERE active = true ORDER BY version DESC LIMIT 1",
            )
            .await?;
        let raw: Vec<serde_json::Value> = response.take(0).unwrap_or_default();
        let profile = raw
            .into_iter()
            .next()
            .and_then(|v| serde_json::from_value(v).ok());
        Ok(profile)
    }

    pub async fn export_all_json(
        &self,
    ) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
        let mut resp_samples = self.db.query("SELECT * FROM biometric_samples").await?;
        let raw_samples: Vec<serde_json::Value> = resp_samples.take(0).unwrap_or_default();
        let samples: Vec<BiometricSample> = raw_samples
            .into_iter()
            .filter_map(|v| serde_json::from_value(v).ok())
            .collect();

        let mut resp_sessions = self.db.query("SELECT * FROM audio_sessions").await?;
        let raw_sessions: Vec<serde_json::Value> = resp_sessions.take(0).unwrap_or_default();
        let sessions: Vec<AudioSession> = raw_sessions
            .into_iter()
            .filter_map(|v| serde_json::from_value(v).ok())
            .collect();

        let mut resp_events = self.db.query("SELECT * FROM state_events").await?;
        let raw_events: Vec<serde_json::Value> = resp_events.take(0).unwrap_or_default();
        let state_events: Vec<StateEvent> = raw_events
            .into_iter()
            .filter_map(|v| serde_json::from_value(v).ok())
            .collect();

        let mut resp_sleep = self.db.query("SELECT * FROM sleep_sessions").await?;
        let raw_sleep: Vec<serde_json::Value> = resp_sleep.take(0).unwrap_or_default();
        let sleep_sessions: Vec<SleepSession> = raw_sleep
            .into_iter()
            .filter_map(|v| serde_json::from_value(v).ok())
            .collect();

        let mut resp_stages = self.db.query("SELECT * FROM sleep_stages").await?;
        let raw_stages: Vec<serde_json::Value> = resp_stages.take(0).unwrap_or_default();
        let sleep_stages: Vec<SleepStage> = raw_stages
            .into_iter()
            .filter_map(|v| serde_json::from_value(v).ok())
            .collect();

        let mut resp_focus = self.db.query("SELECT * FROM focus_sessions").await?;
        let raw_focus: Vec<serde_json::Value> = resp_focus.take(0).unwrap_or_default();
        let focus_sessions: Vec<FocusSession> = raw_focus
            .into_iter()
            .filter_map(|v| serde_json::from_value(v).ok())
            .collect();

        let mut resp_feedback = self.db.query("SELECT * FROM user_feedback").await?;
        let raw_feedback: Vec<serde_json::Value> = resp_feedback.take(0).unwrap_or_default();
        let feedback: Vec<UserFeedback> = raw_feedback
            .into_iter()
            .filter_map(|v| serde_json::from_value(v).ok())
            .collect();

        let mut resp_scores = self.db.query("SELECT * FROM effectiveness_scores").await?;
        let raw_scores: Vec<serde_json::Value> = resp_scores.take(0).unwrap_or_default();
        let scores: Vec<EffectivenessScore> = raw_scores
            .into_iter()
            .filter_map(|v| serde_json::from_value(v).ok())
            .collect();

        let mut resp_profiles = self.db.query("SELECT * FROM tuning_profiles").await?;
        let raw_profiles: Vec<serde_json::Value> = resp_profiles.take(0).unwrap_or_default();
        let profiles: Vec<TuningProfileRecord> = raw_profiles
            .into_iter()
            .filter_map(|v| serde_json::from_value(v).ok())
            .collect();

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

    pub async fn export_full_zip(
        &self,
        output_path: &str,
    ) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let file = std::fs::File::create(output_path)?;
        let mut zip = ZipWriter::new(file);
        let options =
            SimpleFileOptions::default().compression_method(zip::CompressionMethod::Deflated);

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
            "biometrics" => {
                self.db.query("DELETE biometric_samples; DELETE user_feedback; DELETE effectiveness_scores;").await?;
            }
            "sessions" => {
                self.db
                    .query("DELETE audio_sessions; DELETE state_events; DELETE focus_sessions;")
                    .await?;
            }
            "all" => {
                self.db.query("DELETE biometric_samples; DELETE audio_sessions; DELETE state_events; DELETE sleep_sessions; DELETE sleep_stages; DELETE focus_sessions; DELETE user_feedback; DELETE effectiveness_scores; DELETE tuning_profiles;").await?;
            }
            _ => {}
        }
        Ok(())
    }
}
