# NeuroLoop - System Architecture

## 1. System Overview

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
|                                                                         |
|  +--------------------------------+   +------------------------------+  |
|  |      CMF Watch BLE Sync        |   |     Health Connect Bridge    |  |
|  |   (btleplug + AES Protocol)    |   |     (Android JNI / Intent)   |  |
|  +--------------------------------+   +------------------------------+  |
+------------------------------------+------------------------------------+
                                     |
+------------------------------------v------------------------------------+
|                         Operating System & Hardware                     |
|                                                                         |
|  CMF Watch Pro 2  |  Android Health Connect  |  ALSA/Audio Subsystem   |
+-------------------------------------------------------------------------+
```

---

## 2. Component Boundaries & Responsibilities

### 2.1 Frontend Presentation Tier (`src/`)
- **Technology**: React 19, TypeScript (strict mode, zero `any`), Tailwind CSS, Zustand, Recharts.
- **Role**: Render reactive views, capture user intent/feedback, stream oscilloscope telemetry, and trigger IPC commands without hosting raw signal processing.

### 2.2 Audio Signal Processing Pipeline (`src-tauri/src/audio/`)
- **Technology**: `cpal` with low-latency buffer management.
- **Oscillator Math**:
  - Binaural: $f_L = f_{\text{carrier}} - \frac{\Delta f}{2}$, $f_R = f_{\text{carrier}} + \frac{\Delta f}{2}$
  - Isochronic: $s(t) = \sin(2\pi f_c t) \cdot \text{Pulse}(f_p t, D)$
  - Monaural: $s(t) = \sin(2\pi f_c t) \cdot [0.5 + 0.5\sin(2\pi \Delta f t)]$
- **Safety**: Built-in tanh-based soft-clipper and parameter slew limiting (exponential smoothing) across parameter updates.

### 2.3 Tuning Module (`src-tauri/src/tuning/`)
- Pure functional harmonic mapping snapping any target frequency to the geometric A432 ladder:
  $$\mathcal{L} = \{108, 144, 216, 324, 432\} \text{ Hz}$$

### 2.4 Data Tier (`src-tauri/src/data/`)
- **Storage**: Embedded **SurrealDB** 2.x/3.x running on the local filesystem (`kv-surrealkv`).
- **Namespace/Database**: `neuroloop / wellness`.
- **Collections**: `biometric_samples`, `audio_sessions`, `state_events`, `sleep_sessions`, `user_feedback`, `effectiveness_scores`, `tuning_profiles`.

### 2.5 Biometric & State Classification (`src-tauri/src/biometric/`)
- **Noise Rejection**: Rolling median filters for HR; RR-interval outlier rejection for RMSSD/HRV.
- **State Machine**: Evaluates $\Delta \text{HR}$, $\text{HRV}_{\text{RMSSD}}$, and movement thresholds against personal rolling baselines.
