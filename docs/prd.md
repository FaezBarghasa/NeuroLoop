# NeuroLoop - Product Requirements Document (PRD)

## 1. Executive Summary
**NeuroLoop** is an offline-capable, local-first, FOSS (Free and Open Source Software) bio-adaptive wellness platform. It leverages real-time and historical physiological metrics (Heart Rate, HRV, Sleep Architecture) captured from wearables (specifically the **CMF Watch Pro 2** via Android Health Connect or direct reverse-engineered BLE) to drive procedural acoustic neuromodulation. All auditory stimulation strictly adheres to **A432 Hz harmonic ladder tuning** (108, 144, 216, 324, 432 Hz) across binaural, isochronic, and monaural beat modalities.

All user data remains strictly local in an embedded **SurrealDB** instance with complete zero-telemetry guarantees, user-controlled feedback loops, and full ZIP/JSON/CSV export capabilities.

---

## 2. Product Objectives
1. **Procedural Neuromodulation**: Provide artifact-free, dynamic audio entrainment across Delta, Theta, Alpha, Beta, and Gamma brainwave bands.
2. **A432 Harmonic Standard**: Enforce mathematical coherence in carrier frequency selection based on subharmonics of 432 Hz.
3. **Continuous Physiological Inference**: Infer cognitive and autonomic states (Relaxed, High Arousal / Stress, Deep Focus, Sleep Onset, Deep Sleep, REM, Morning Wakefulness).
4. **Closed-Loop Adaptation**: Continuously adapt soundscapes using personal baseline models and Bayesian/reinforcement effectiveness weighting.
5. **Data Sovereignty & Local-First**: Zero required cloud accounts or network dependencies; total data exportability.

---

## 3. User Personas & Use Cases
- **Deep Work / Engineers**: Requires SMR (12–15 Hz) or Low-Beta entrainment for focus without auditory fatigue.
- **Insomnia / Sleep Disruption**: Requires gentle descent from Alpha into Theta (6 Hz) and sustained Delta (0.5–2 Hz) ramps with automatic cessation upon deep sleep detection.
- **Stress & Anxiety Management**: Immediate quick-rescue tone glide to Alpha (8–10 Hz) upon autonomic arousal spike detection.
- **Privacy Advocates**: Demands zero cloud tracking, local storage only, and raw data export.

---

## 4. Key Functional Features

### 4.1 Audio Generation Engine
- Modalities: Binaural beats (independent L/R channel phase synthesis), Isochronic pulses (amplitude modulated), Monaural beats.
- Carrier Frequencies: 108 Hz (Sleep/Delta), 144 Hz (Meditation/Theta), 216 Hz (Relaxation/Alpha), 324 Hz (Focus/Beta), 432 Hz (Gamma/Integration).
- Smooth crossfades and parameter glides to eliminate audible pops/clicks.

### 4.2 Biometric Telemetry & Device Integration
- Primary Ingestion: Android Health Connect API (Heart Rate, Resting HR, Sleep Sessions, SpO2).
- Secondary Ingestion: Direct CMF Watch Pro 2 BLE historical sync (AES-encrypted frame parsing) and Gadgetbridge intents.
- Outlier filtering: Rolling median filters, movement artifact dampening, and confidence scoring.

### 4.3 Adaptive Effectiveness Engine
- Subjective feedback prompt post-session (1–5 star rating, discomfort flags, tags).
- Objective feedback: HR reduction, HRV elevation, sleep efficiency, focus duration.
- Learning Model: `new_weight = old_weight * (1 - α) + session_score * α`.

### 4.4 Data Sovereignty & Export
- Local Storage: Embedded SurrealDB (`kv-surrealkv`).
- Export formats: Full ZIP archive including `metadata.json`, CSV tables for all collections, JSON backup, and tuning profiles.

---

## 5. Non-Functional Requirements
- **Safety**: Strict volume ceilings, soft-clipping limiter, immediate manual override priority.
- **Performance**: Rust audio DSP latency < 20ms, memory footprint < 100MB RAM.
- **Battery Efficiency**: Throttled polling when screen is off; audio thread execution decoupled from UI rendering.
