# NeuroLoop - Design System & UI Architecture

## 1. Design Principles
1. **Bio-Calm Dark Aesthetic**: Deep zinc/slate canvases (`bg-zinc-950`, `bg-slate-900`) preventing circadian disruption during evening/sleep sessions.
2. **Harmonic Visual Feedback**: Waveform and state visualization mirroring the A432 frequency spectrum.
3. **Glanceable Telemetry**: Micro-stat cards with high-contrast indicator pills for heart rate, HRV, and sleep stages.
4. **Zero Layout Shifts**: Fluid responsive grid designed for mobile-first hand operation and wide desktop dashboards.

---

## 2. Color Palette & Brainwave Spectral Tokens

| Band | Frequency Range | Aesthetic Token | Tailwind Representation | Purpose / State |
| :--- | :--- | :--- | :--- | :--- |
| **Delta** | $0.5 - 4.0\text{ Hz}$ | Electric Sky / Cyan | `text-sky-400 bg-sky-500/10` | Restorative Deep Sleep |
| **Theta** | $4.0 - 8.0\text{ Hz}$ | Lavender Indigo | `text-indigo-400 bg-indigo-500/10` | Hypnagogia, Dream State |
| **Alpha** | $8.0 - 13.0\text{ Hz}$ | Emerald Glow | `text-emerald-400 bg-emerald-500/10` | Calm Awareness, Stress Rescue |
| **Beta** | $13.0 - 30.0\text{ Hz}$ | Radiant Amber | `text-amber-400 bg-amber-500/10` | Active Cognition, SMR Work |
| **Gamma** | $30.0 - 50.0\text{ Hz}$ | High-Voltage Violet | `text-purple-400 bg-purple-500/10` | Memory Consolidation, Peak Flow |

---

## 3. Typography & Micro-Interactions
- **Display Headings**: Inter / System Sans, font-weight 700/800, tracking tight.
- **Telemetry & Numerical Values**: Font-mono with fixed character widths (`font-mono text-emerald-400`) to avoid layout jitter during live biometric streams.
- **Haptic Feedback**: Subtle vibration triggers (`light`, `medium`, `heavy`, `success`) on touch devices for tactile confirmation.
- **Glassmorphism**: Backdrop blur (`backdrop-blur-2xl bg-zinc-950/60 border border-white/5`) for floating control docks and navbars.
