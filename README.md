# NeuroLoop 🧠🔄

> **Local-First Bio-Adaptive Acoustic Neuromodulation Platform**  
> Dynamic brainwave entrainment (A432 Hz harmonic ladder) driven by real-time wearable biometrics (CMF Watch Pro 2 / Health Connect) with embedded SurrealDB local learning.

[![Tauri v2](https://img.shields.io/badge/Tauri-v2-blue.svg)](https://tauri.app/)
[![Rust](https://img.shields.io/badge/Rust-2024_Edition-orange.svg)](https://www.rust-lang.org/)
[![React 19](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![SurrealDB](https://img.shields.io/badge/SurrealDB-v3.2_Embedded-ff00a0.svg)](https://surrealdb.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 🌟 Overview

**NeuroLoop** is an offline-capable, local-first, FOSS bio-adaptive wellness application. It leverages real-time and historical physiological metrics (Heart Rate, HRV RMSSD, Sleep Architecture) captured from wearables (specifically the **CMF Watch Pro 2** via Android Health Connect or direct BLE) to drive procedural acoustic neuromodulation.

All auditory stimulation strictly adheres to the **A432 Harmonic Ladder standard** ($108, 144, 216, 324, 432\text{ Hz}$) across binaural, isochronic, and monaural beat modalities.

All user data remains strictly local in an embedded **SurrealDB** database instance with zero remote telemetry and complete ZIP/CSV/JSON exportability.

---

## 🚀 Key Features

- **Procedural Audio Synthesis (Rust `cpal`)**: Real-time sine, isochronic pulse, and monaural beat synthesis with soft-limiting and click-free parameter glides.
- **A432 Harmonic Ladder Tuning**: Mathematically coherent carrier frequencies locked to subharmonics and multiples of 432 Hz ($108, 144, 216, 324, 432\text{ Hz}$).
- **Continuous Biometric Inference**: Autonomous classification of cognitive and autonomic states (Relaxed, High Arousal/Stress, Deep Focus, Sleep Onset, Deep Sleep, REM, Wakefulness).
- **Closed-Loop Adaptation**: Self-tuning Bayesian preset weight updates driven by post-session feedback and physiological shifts.
- **Data Sovereignty & Zero-Telemetry**: Embedded SurrealDB (`kv-surrealkv` / `kv-mem`) with one-click full ZIP (JSON + CSV tables) export and granular database purge options.

---

## 🏗️ Architecture

```text
+-------------------------------------------------------------------------+
|                  Frontend UI (React 19 + TypeScript)                    |
|                                                                         |
|   Dashboard   |   Presets   |   Reports   |   Data Export   |  Tuning   |
+------------------------------------+------------------------------------+
                                     |
                                     | Tauri 2.0 IPC (Strictly Typed Commands & Events)
                                     |
+------------------------------------v------------------------------------+
|                         Rust Backend Core                               |
|                                                                         |
|  +--------------------------------+   +------------------------------+  |
|  |       Tuning System            |   |     Procedural Audio DSP     |  |
|  |  (A432 Hz Ladder Math)         |   |  (CPAL, Sine/Iso/Mon Synth)  |  |
|  +--------------------------------+   +------------------------------+  |
|                                                                         |
|  +--------------------------------+   +------------------------------+  |
|  |     State Inference Engine     |   |     Effectiveness Engine     |  |
|  | (Autonomic Classifier & Filters|   |  (Bayesian Weight Updating)  |  |
|  +--------------------------------+   +------------------------------+  |
|                                                                         |
|  +--------------------------------+   +------------------------------+  |
|  |     Embedded SurrealDB         |   |         Export Engine        |  |
|  |    (KV-SurrealKV Local)        |   |    (ZIP / CSV / JSON Builder)|  |
|  +--------------------------------+   +------------------------------+  |
+------------------------------------+------------------------------------+
                                     |
+------------------------------------v------------------------------------+
|                         Operating System & Hardware                     |
|                                                                         |
|  CMF Watch Pro 2  |  Android Health Connect  |  ALSA/Audio Subsystem    |
+-------------------------------------------------------------------------+
```

---

## 🛠️ Tech Stack

- **Core / Backend**: Rust (Tauri v2), `cpal` (audio DSP), `surrealdb` 3.x (`kv-surrealkv`, `kv-mem`), `tokio`, `chrono`, `zip`, `csv`.
- **Frontend**: React 19, TypeScript (strict mode, zero `any`), Tailwind CSS, Lucide Icons, Recharts, Zustand.
- **Biometric Gateways**: Android Health Connect API, BLE GATT client (`btleplug`), Gadgetbridge Broadcast Intents.

---

## 📖 Documentation Index

All detailed specifications and technical docs are available in [`docs/`](docs/):

- [`docs/prd.md`](docs/prd.md) — Product Requirements Document.
- [`docs/architecture.md`](docs/architecture.md) — System Architecture & Component Boundaries.
- [`docs/data-schema.md`](docs/data-schema.md) — SurrealDB Data Schema & Collections.
- [`docs/effectiveness.md`](docs/effectiveness.md) — Adaptive Effectiveness & Bayesian Self-Tuning Formulae.
- [`docs/app_flow.md`](docs/app_flow.md) — User Journeys & Autonomous Closed-Loop Flowcharts.
- [`docs/cmf-watch-notes.md`](docs/cmf-watch-notes.md) — CMF Watch Pro 2 BLE & Health Connect Protocols.
- [`docs/export.md`](docs/export.md) — Data Export, ZIP Packaging & Deletion Scopes.
- [`docs/design.md`](docs/design.md) — Bio-Calm Dark Design System & Brainwave Color Tokens.
- [`docs/design_brief.md`](docs/design_brief.md) — Product Identity & UX Pillars.
- [`docs/perspective.md`](docs/perspective.md) — Strategic Perspective & Engineering Vision.
- [`docs/safety.md`](docs/safety.md) — Safety Invariants, Volume Limits & Medical Disclaimers.
- [`docs/privacy.md`](docs/privacy.md) — Zero-Cloud & Local-First Privacy Manifesto.
- [`docs/tdd.md`](docs/tdd.md) — Test-Driven Development Matrix & Verification Commands.
- [`docs/changelog.md`](docs/changelog.md) — Project Release & Version History.

---

## 💻 Development & Building

### Prerequisites

- [Rust](https://rustup.rs/) (stable, 2024 edition support)
- [Node.js](https://nodejs.org/) (v20+) & [pnpm](https://pnpm.io/)
- System dependencies for Tauri on Linux:
  ```bash
  sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev libasound2-dev
  ```

### Quick Start

```bash
# 1. Install frontend dependencies
pnpm install

# 2. Run in development mode (with Tauri v2)
pnpm tauri dev

# 3. Type-check frontend
pnpm exec tsc --noEmit

# 4. Run Rust unit tests
cd src-tauri
cargo test -- --nocapture
```

### Data Management Scripts

```bash
# Validate data schema and presets
pnpm data:validate

# Seed default brainwave presets
pnpm data:seed

# Retune preset collection to A432 ladder
pnpm data:retune
```

---

## 🔒 Safety & Health Disclaimer

NeuroLoop is an experimental wellness and meditation tool, **not a medical device**. It is not designed to diagnose, treat, or prevent any neurological or sleep disorders. Individuals with a history of seizures or epilepsy should not use isochronic pulse or high-frequency brainwave entrainment. Please review [`docs/safety.md`](docs/safety.md) before use.

---

## 📄 License

Distributed under the [MIT License](LICENSE). Copyright (c) 2026 Faez Barghasa.
