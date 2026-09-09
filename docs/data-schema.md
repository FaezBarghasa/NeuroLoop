# NeuroLoop - Data Schema Specification (SurrealDB)

## 1. Overview
NeuroLoop uses an embedded **SurrealDB** 3.x database engine with local `SurrealKv` persistent key-value backend (Namespace: `neuroloop`, Database: `wellness`), alongside JSON files for static preset definitions, state maps, and tuning profiles. All tables are local-first, privacy-preserving, and user-exportable.

---

## 2. Core SurrealDB Schema & Tables

### `biometric_samples`
Raw and filtered biometric readings ingested from Health Connect or BLE.
```surql
DEFINE TABLE biometric_samples SCHEMAFULL;
DEFINE FIELD timestamp ON biometric_samples TYPE datetime;
DEFINE FIELD source ON biometric_samples TYPE string;
DEFINE FIELD heart_rate ON biometric_samples TYPE option<float>;
DEFINE FIELD hrv ON biometric_samples TYPE option<float>;
DEFINE FIELD spo2 ON biometric_samples TYPE option<float>;
DEFINE FIELD stress ON biometric_samples TYPE option<float>;
DEFINE FIELD movement ON biometric_samples TYPE option<float>;
DEFINE FIELD inferred_state ON biometric_samples TYPE option<string>;
DEFINE FIELD confidence ON biometric_samples TYPE option<float>;

DEFINE INDEX idx_biometric_samples_ts ON biometric_samples FIELDS timestamp;
```

### `audio_sessions`
Log of every procedural brainwave session.
```surql
DEFINE TABLE audio_sessions SCHEMAFULL;
DEFINE FIELD started_at ON audio_sessions TYPE datetime;
DEFINE FIELD ended_at ON audio_sessions TYPE option<datetime>;
DEFINE FIELD preset_id ON audio_sessions TYPE string;
DEFINE FIELD preset_name ON audio_sessions TYPE option<string>;
DEFINE FIELD category ON audio_sessions TYPE option<string>;
DEFINE FIELD modality ON audio_sessions TYPE option<string>;
DEFINE FIELD carrier_hz ON audio_sessions TYPE option<float>;
DEFINE FIELD beat_start_hz ON audio_sessions TYPE option<float>;
DEFINE FIELD beat_end_hz ON audio_sessions TYPE option<float>;
DEFINE FIELD pulse_hz ON audio_sessions TYPE option<float>;
DEFINE FIELD volume ON audio_sessions TYPE option<float>;
DEFINE FIELD auto_mode ON audio_sessions TYPE bool;
DEFINE FIELD manual_override ON audio_sessions TYPE bool;
DEFINE FIELD source ON audio_sessions TYPE option<string>;
DEFINE FIELD end_reason ON audio_sessions TYPE option<string>;

DEFINE INDEX idx_audio_sessions_start ON audio_sessions FIELDS started_at;
```

### `state_events`
Log of all autonomic nervous system and sleep state inferences.
```surql
DEFINE TABLE state_events SCHEMAFULL;
DEFINE FIELD timestamp ON state_events TYPE datetime;
DEFINE FIELD previous_state ON state_events TYPE option<string>;
DEFINE FIELD new_state ON state_events TYPE string;
DEFINE FIELD confidence ON state_events TYPE float;
DEFINE FIELD reason ON state_events TYPE option<string>;
DEFINE FIELD session_id ON state_events TYPE option<record<audio_sessions>>;

DEFINE INDEX idx_state_events_ts ON state_events FIELDS timestamp;
```

### `sleep_sessions`
Nightly sleep summaries linked with audio playback.
```surql
DEFINE TABLE sleep_sessions SCHEMAFULL;
DEFINE FIELD started_at ON sleep_sessions TYPE datetime;
DEFINE FIELD ended_at ON sleep_sessions TYPE option<datetime>;
DEFINE FIELD source ON sleep_sessions TYPE string;
DEFINE FIELD total_sleep_score ON sleep_sessions TYPE option<float>;
DEFINE FIELD efficiency ON sleep_sessions TYPE option<float>;
DEFINE FIELD hr_avg ON sleep_sessions TYPE option<float>;
DEFINE FIELD hr_min ON sleep_sessions TYPE option<float>;
DEFINE FIELD hrv_avg ON sleep_sessions TYPE option<float>;
DEFINE FIELD wake_count ON sleep_sessions TYPE option<int>;
DEFINE FIELD notes ON sleep_sessions TYPE option<string>;
```

### `sleep_stages`
Granular sleep stage epochs (awake, light, deep, rem).
```surql
DEFINE TABLE sleep_stages SCHEMAFULL;
DEFINE FIELD sleep_session_id ON sleep_stages TYPE record<sleep_sessions>;
DEFINE FIELD stage ON sleep_stages TYPE string;
DEFINE FIELD started_at ON sleep_stages TYPE datetime;
DEFINE FIELD ended_at ON sleep_stages TYPE datetime;
DEFINE FIELD source ON sleep_stages TYPE option<string>;

DEFINE INDEX idx_sleep_stages_session ON sleep_stages FIELDS sleep_session_id;
```

### `focus_sessions`
Focus and deep work productivity tracking.
```surql
DEFINE TABLE focus_sessions SCHEMAFULL;
DEFINE FIELD started_at ON focus_sessions TYPE datetime;
DEFINE FIELD ended_at ON focus_sessions TYPE option<datetime>;
DEFINE FIELD preset_id ON focus_sessions TYPE option<string>;
DEFINE FIELD completed ON focus_sessions TYPE bool;
DEFINE FIELD interruption_count ON focus_sessions TYPE int;
DEFINE FIELD hr_avg ON focus_sessions TYPE option<float>;
DEFINE FIELD hrv_avg ON focus_sessions TYPE option<float>;
DEFINE FIELD stress_events ON focus_sessions TYPE int;
DEFINE FIELD user_rating ON focus_sessions TYPE option<int>;
DEFINE FIELD notes ON focus_sessions TYPE option<string>;
```

### `user_feedback`
Explicit user rating and qualitative feedback.
```surql
DEFINE TABLE user_feedback SCHEMAFULL;
DEFINE FIELD timestamp ON user_feedback TYPE datetime;
DEFINE FIELD session_id ON user_feedback TYPE option<record<audio_sessions>>;
DEFINE FIELD rating ON user_feedback TYPE int;
DEFINE FIELD helpful ON user_feedback TYPE bool;
DEFINE FIELD too_intense ON user_feedback TYPE bool;
DEFINE FIELD too_quiet ON user_feedback TYPE bool;
DEFINE FIELD discomfort ON user_feedback TYPE bool;
DEFINE FIELD tags ON user_feedback TYPE array<string>;
DEFINE FIELD note ON user_feedback TYPE option<string>;

DEFINE INDEX idx_user_feedback_session ON user_feedback FIELDS session_id;
```

### `effectiveness_scores`
Calculated objective and subjective performance scores for presets.
```surql
DEFINE TABLE effectiveness_scores SCHEMAFULL;
DEFINE FIELD session_id ON effectiveness_scores TYPE option<record<audio_sessions>>;
DEFINE FIELD preset_id ON effectiveness_scores TYPE string;
DEFINE FIELD category ON effectiveness_scores TYPE string;
DEFINE FIELD objective_score ON effectiveness_scores TYPE float;
DEFINE FIELD subjective_score ON effectiveness_scores TYPE float;
DEFINE FIELD combined_score ON effectiveness_scores TYPE float;
DEFINE FIELD metrics ON effectiveness_scores TYPE object;
DEFINE FIELD created_at ON effectiveness_scores TYPE datetime;

DEFINE INDEX idx_effectiveness_preset ON effectiveness_scores FIELDS preset_id;
```

### `tuning_profiles`
Versioned historical and active tuning weights.
```surql
DEFINE TABLE tuning_profiles SCHEMAFULL;
DEFINE FIELD version ON tuning_profiles TYPE int;
DEFINE FIELD created_at ON tuning_profiles TYPE datetime;
DEFINE FIELD active ON tuning_profiles TYPE bool;
DEFINE FIELD profile_json ON tuning_profiles TYPE object;
```
