# NeuroLoop - Strategic Perspective & Engineering Vision

## 1. Technical & Strategic Vision
NeuroLoop bridges the gap between consumer wearable biometrics, procedural audio DSP, and local-first data systems.

### 1.1 Why Local-First Matters in Bio-Tech
Physiological data (continuous HR, HRV RMSSD, sleep stages, stress markers) is among the most sensitive personal data a user generates. Most commercial wellness platforms monetize or centralize this telemetry on remote servers. NeuroLoop proves that advanced adaptive neuromodulation, Bayesian preference learning, and time-series analytics can execute entirely on-device using Rust and embedded **SurrealDB**.

### 1.2 Mathematical Coherence: The A432 Standard
Rather than generating arbitrary acoustic carriers, NeuroLoop structures all soundscapes around whole-number harmonic divisions and multiples of 432 Hz:
- $108\text{ Hz} = \frac{432}{4}$ (Grounding Delta base)
- $144\text{ Hz} = \frac{432}{3}$ (Theta meditation base)
- $216\text{ Hz} = \frac{432}{2}$ (Alpha relaxation base)
- $324\text{ Hz} = 432 \times \frac{3}{4}$ (Beta cognition base)
- $432\text{ Hz}$ (Harmonic reference)

---

## 2. Hardware Ecosystem Strategy (CMF Watch Pro 2)
1. **Health Connect (Primary Gateway)**: Seamless, battery-efficient ingestion of standardized records on modern Android devices.
2. **Reverse-Engineered BLE Protocol (Direct Option)**: Direct Bluetooth Low Energy communication with the CMF Watch Pro 2 GATT characteristics, decrypting historical sleep and stress frames for granular offline data recovery.
3. **Gadgetbridge Interoperability**: Android broadcast intent listener allowing open-source companion apps to stream HR directly to NeuroLoop.
