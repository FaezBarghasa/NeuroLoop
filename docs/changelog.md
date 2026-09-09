# Changelog

All notable changes to the **NeuroLoop** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.2.0] - 2026-09-09

### Added
- **SurrealDB Embedded Integration**: Embedded local KV-SurrealKV data store in Rust core replacing SQLite.
- **A432 Harmonic Ladder Module**: Standardized carrier frequencies (108 Hz, 144 Hz, 216 Hz, 324 Hz, 432 Hz) with snapping utilities.
- **Procedural Audio Synthesis**: Thread-safe Rust audio engine with binaural, isochronic, and monaural beat synthesis.
- **Adaptive Effectiveness Report View**: React UI component visualizing personalized preset weights and Bayesian ranking metrics.
- **Post-Session Feedback Dialog**: 1–5 star rating modal with discomfort flags and tags for real-time model tuning.
- **Data & Privacy Controls**: Local data export interface supporting full ZIP archives (JSON + CSV tables) and complete local database erasure.
- **Comprehensive Documentation**: PRD, Architecture, TDD, App Flow, Design, Design Brief, and Perspective specifications in `docs/`.

### Changed
- Migrated package manager workflow strictly to **pnpm**.
- Updated `src-tauri/Cargo.toml` with `surrealdb v2/v3`, `tokio`, `cpal`, `zip`, and `chrono`.
- Updated navigation bar and dashboard to support the new Data Export and Effectiveness tabs.

---

## [0.1.0] - Initial Foundation

### Added
- Base Tauri v2 + React 19 + TypeScript scaffolding.
- Preset manager and carrier music player prototype.
- Android Health Connect and Gadgetbridge bridge service definitions.
- Sleep hypnogram and bio-threshold alert banner components.
