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

## 3. Automated Test Execution Commands

```bash
# Run all Rust unit and integration tests
cd src-tauri
cargo test -- --nocapture

# Run specific A432 tuning test suite
cargo test tuning::a432

# Frontend type checking and test suites
pnpm build
```
