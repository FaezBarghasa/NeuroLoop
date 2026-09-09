# NeuroLoop - Adaptive Effectiveness & Self-Tuning Engine

## 1. Overview
The Effectiveness Engine autonomously learns which brainwave presets produce optimal biometric and subjective outcomes for the individual user without transmitting telemetry off-device.

---

## 2. Objective & Subjective Input Scoring

### 2.1 Sleep Category
- **Objective Metrics**:
  - Sleep efficiency ratio: $\frac{\text{Time Asleep}}{\text{Time in Bed}}$
  - Heart rate deceleration: $\Delta \text{HR}_{\text{onset}} = \frac{\text{HR}_{\text{baseline}} - \text{HR}_{\text{sleep}}}{\text{HR}_{\text{baseline}}}$
  - Wake episodes count: Inverse penalty $S_{\text{wake}} = \max(0, 1.0 - 0.2 \times \text{wake\_count})$
  - Deep / REM sleep proportion: $\frac{T_{\text{deep}} + T_{\text{rem}}}{T_{\text{total}}}$
- **Subjective Metrics**:
  - Morning rating: Normalized $1-5 \rightarrow 0.0 - 1.0$.
  - Negative tag penalties: `too intense`, `uncomfortable`, `grogginess` $\rightarrow -0.3$ penalty.

### 2.2 Focus & Work Category
- **Objective Metrics**:
  - Focus session completion rate: $\frac{T_{\text{completed}}}{T_{\text{target}}}$
  - Autonomic stability: Low HR variance and absence of acute stress spikes.
  - Interruption frequency.
- **Subjective Metrics**:
  - Post-session rating: $1-5 \rightarrow 0.0 - 1.0$.
  - Positive tags: `helped focus`, `flow state` $\rightarrow +0.15$ boost.

### 2.3 Morning Energy Category
- **Objective Metrics**:
  - Time to achieve target daytime HR baseline.
  - Absence of relapse into sleep stages within 30 minutes.
- **Subjective Metrics**:
  - Energy rating on wake-up dialog ($1-5$).

---

## 3. Combined Score Formula
$$\text{Score}_{\text{combined}} = w_{\text{obj}} \cdot \text{Score}_{\text{obj}} + w_{\text{subj}} \cdot \text{Score}_{\text{subj}}$$
- Default weights: $w_{\text{obj}} = 0.60$, $w_{\text{subj}} = 0.40$.
- User configurable modes:
  - **Balanced** (0.6 / 0.4)
  - **Favor Biometrics** (0.8 / 0.2)
  - **Favor Feedback** (0.2 / 0.8)

---

## 4. Adaptive Preset Weight Learning
For a given state $S$ and preset $P$, the weight $W(S, P)$ updates via exponential moving average:
$$W_{\text{new}}(S, P) = W_{\text{old}}(S, P) \cdot (1 - \eta) + \text{Score}_{\text{combined}} \cdot \eta$$
- Learning rate: $\eta = 0.10$.
- Clamping limits: $0.05 \le W \le 1.00$.

---

## 5. Safety Invariants & Fallbacks
1. **Discomfort Tag Quarantine**: If a preset receives `too intense` or `discomfort` tags, its weight is reduced by 50% immediately, and isochronic/gamma modes are downgraded to binaural/alpha-theta.
2. **Confidence Gating**: Biometric state transitions require confidence $\ge 0.70$ and $\ge 60\text{s}$ state persistence before triggering adaptive preset fading.
3. **Manual Override Supremacy**: Any manual track selection freezes auto-adaptation for the remainder of the active session.
