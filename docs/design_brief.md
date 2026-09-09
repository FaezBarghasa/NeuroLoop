# NeuroLoop - Design Brief

## 1. Project Identity & Purpose
- **Project Name**: NeuroLoop
- **Tagline**: Local-First Bio-Adaptive Neuromodulation
- **Core Problem**: Existing binaural and soundscape apps rely on static, unverified audio loops, require mandatory cloud accounts, and lack physiological closed-loop feedback.
- **Solution**: A privacy-first desktop and mobile tool using A432-tuned procedural audio that dynamically adapts to real-time biometric telemetry (CMF Watch Pro 2 via Android Health Connect / BLE) with embedded SurrealDB local learning.

---

## 2. Target Audience & Key Needs
- **High-Focus Professionals & Developers**: Fast, one-click start into deep-work presets without intrusive notifications or ads.
- **People with Sleep / Circadian Challenges**: Automatic sleep onset detection that dims volume and transitions into restorative Delta frequencies without requiring screen interaction in bed.
- **Biohackers & Privacy Advocates**: Full ownership of all raw physiological time-series data with zero cloud telemetry and one-click ZIP/CSV export.

---

## 3. Core Deliverables & UX Pillars
1. **Zero-Latency Audio**: Rust `cpal` audio DSP running on dedicated background threads.
2. **Harmonic Consistency**: Mathematical lock to 432 Hz subharmonics (108, 144, 216, 324, 432 Hz).
3. **Data Sovereignty**: Complete SQLite/SurrealDB embedded persistence with JSON/CSV/ZIP export.
4. **Adaptive Learning**: Continuous Bayesian preset weight personalization based on post-session feedback and autonomic response trajectories.
