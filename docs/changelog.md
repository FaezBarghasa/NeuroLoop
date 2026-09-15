# Changelog

All notable changes to the **NeuroLoop** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.2.0] - 2026-09-15

### Added
- **Signed Android APK Pipeline**: Built-in 2048-bit RSA release signing configuration in Gradle with universal release packaging and APK Signature Scheme v2 verification.
- **Mobile Safe-Area Insets & Ergonomics**: Full screen safe-insets padding (`pb-safe`, `pt-safe`), bottom mobile navigation bar, and accessible touch targets ($\ge 48\text{px}$).
- **CMF Watch AES-128 Protocol Decryption**: Native Rust protocol helper for CMF Watch Pro 2 BLE packet parsing and AES decryption.
- **Hysteresis State Machine Filtering**: Dual-threshold deadband filtering preventing rapid oscillations during autonomic state transitions.
- **Icon Assets Generation**: Generated multi-platform PNG and Android mipmap resource icons via `tauri icon`.

### Changed
- Refactored frontend styling to Tailwind CSS v4 and Vite bundling.
- Enhanced modal views (`PresetManager`, `DataExport`, `FeedbackDialog`) to fit seamlessly on compact mobile screens with touch-scrollable content.

---

## [2.1.0] - 2026-09-12

### Added
- **Health Connect JNI Bridge**: Standardized Android health metric ingestion for Heart Rate, HRV, and Sleep stages.
- **Real-Time Oscilloscope Visualizer**: Canvas-based interactive audio phase and waveform visualizer.

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
