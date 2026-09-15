# NeuroLoop - Test-Driven Development (TDD) Specification

## 1. Testing Philosophy
Every algorithmic, statistical, and audio DSP calculation in NeuroLoop must be strictly validated with automated unit tests before production integration. No unchecked `unwrap()` or panic-inducing code paths are permitted.

---

## 2. Unit Testing Matrix

### 2.1 A432 Tuning & Carrier Math
- **File**: [`src-tauri/src/tuning/a432.rs`](file:///home/jrad/RustroverProjects/NeuroLoop/src-tauri/src/tuning/a432.rs)
- **Tests**:
  - `test_snap_to_a432_ladder`: Verify boundary snapping for arbitrary inputs (e.g. 100 Hz $\to$ 108 Hz, 200 Hz $\to$ 216 Hz, 440 Hz $\to$ 432 Hz).
  - `test_recommended_carrier_by_category`: Validate that Sleep maps to 108 Hz, Focus to 324 Hz, Relaxation to 216 Hz.

### 2.2 Procedural Oscillator Synthesis
- **File**: [`src-tauri/src/audio/oscillator.rs`](file:///home/jrad/RustroverProjects/NeuroLoop/src-tauri/src/audio/oscillator.rs)
- **Tests**:
  - `test_binaural_sample_phase_continuity`: Verify that phases wrap continuously in $[0.0, 1.0)$ without discontinuities.
  - `test_soft_clipping_bounds`: Verify output sample amplitude never exceeds $[-1.0, 1.0]$.
  - `test_isochronic_duty_cycle`: Verify square/pulse gating transitions cleanly.

### 2.3 Effectiveness Scoring & Bayesian Learning
- **File**: `src-tauri/src/analytics/effectiveness.rs`
- **Tests**:
  - `test_combined_score_normalization`: Verify output range $[0.0, 1.0]$ under edge conditions (all negative vs all positive metrics).
  - `test_preset_weight_dampening_on_discomfort`: Validate that a session tagged with `discomfort` reduces preset weight by at least $40\%$.
  - `test_learning_rate_stability`: Ensure weights converge asymptotically and remain within $[0.05, 1.0]$.

### 2.4 SurrealDB CRUD & Data Export
- **File**: [`src-tauri/src/data/surreal.rs`](file:///home/jrad/RustroverProjects/NeuroLoop/src-tauri/src/data/surreal.rs)
- **Tests**:
  - `test_surreal_embedded_initialization`: Verify in-memory / local KV initialization.
  - `test_biometric_sample_serialization`: Ensure timestamps (ISO-8601) and nullable floats serialize losslessly.
  - `test_export_zip_integrity`: Ensure generated ZIP archive contains valid `metadata.json` and UTF-8 encoded CSV tables.

---

### 2.5 CMF Watch BLE Protocol & Decryption
- **File**: `src-tauri/src/biometric/cmf_protocol.rs`
- **Tests**:
  - `test_cmf_packet_header_validation`: Verify magic byte `0xAB` and payload length parsing.
  - `test_aes_128_payload_decryption`: Ensure sample encrypted telemetry frame decrypts cleanly to raw heart rate and timestamp struct.

### 2.6 Autonomic State Machine & Hysteresis
- **File**: `src-tauri/src/biometric/state_machine.rs`
- **Tests**:
  - `test_deadband_filtering_prevents_chatter`: Verify rapid $\pm 1$ BPM jitter does not trigger back-to-back state transitions.
  - `test_sleep_onset_classification`: Validate transition to Sleep Onset when $\Delta\text{HR} < -8$ BPM and movement $< 5$.

---

## 3. Automated Test Execution Commands

```bash
# Run all Rust unit and integration tests (all 15 tests)
cd src-tauri
cargo test -- --nocapture

# Run specific A432 tuning test suite
cargo test tuning::a432

# Run CMF protocol and biometric test suites
cargo test biometric::

# Frontend type checking and build
pnpm exec tsc --noEmit
pnpm build

# Android APK Signature Scheme v2 validation
$ANDROID_HOME/build-tools/36.0.0/apksigner verify --verbose src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release.apk
```
