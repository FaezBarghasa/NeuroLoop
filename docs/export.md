# NeuroLoop - Data Export & Backup Specification

## 1. Overview
NeuroLoop is 100% local-first. All biometric data, audio sessions, feedback, and learned tuning profiles belong strictly to the user. The app provides built-in mechanisms to export, backup, and wipe data at any time.

---

## 2. Export Formats

### 2.1 Full ZIP Backup
An uncompressed or deflate-compressed ZIP archive named `neuroloop-export-YYYYMMDD_HHMMSS.zip` containing:
- `metadata.json`: Export manifest and schema versions.
- `biometric_samples.csv`: All logged heart rate, HRV, SpO2, and state samples.
- `audio_sessions.csv`: All brainwave session logs (frequencies, duration, volume, manual override flags).
- `state_events.csv`: Autonomic state transition history.
- `sleep_sessions.csv`: Summary metrics of nightly sleep cycles.
- `sleep_stages.csv`: Epoch-by-epoch sleep stages (light, deep, rem, awake).
- `focus_sessions.csv`: Focus productivity and distraction logs.
- `user_feedback.csv`: User subjective ratings, tags, and notes.
- `effectiveness_scores.csv`: Calculated objective/subjective scores.
- `tuning_profiles.json`: Full history of learned adaptive tuning weights.
- `settings.json`: App configurations.
- `README.txt`: Plaintext guide explaining each file.

### 2.2 JSON Backup
A single standalone JSON document encompassing all database tables and configuration objects:
```json
{
  "metadata": {
    "app": "NeuroLoop",
    "schema_version": 1,
    "export_version": 1,
    "exported_at": "2026-06-02T10:00:00Z",
    "tuning_standard": "A432"
  },
  "settings": {},
  "tuning_profiles": [],
  "biometric_samples": [],
  "audio_sessions": [],
  "state_events": [],
  "sleep_sessions": [],
  "sleep_stages": [],
  "focus_sessions": [],
  "user_feedback": [],
  "effectiveness_scores": []
}
```

---

## 3. Data Deletion Scopes
Users can selectively or completely delete data from local SQLite storage:
1. **Full Wipe**: Deletes all records across all tables, resets tuning profiles to factory defaults, and executes `VACUUM`.
2. **Biometrics Only**: Deletes `biometric_samples`, `sleep_stages`, and `sleep_sessions`.
3. **Session History Only**: Deletes `audio_sessions`, `state_events`, and `focus_sessions`.
4. **Feedback Only**: Deletes `user_feedback` and clears `effectiveness_scores`.
