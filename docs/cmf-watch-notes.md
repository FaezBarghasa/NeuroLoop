# NeuroLoop - CMF Watch Pro 2 Integration Notes

## 1. Overview
The CMF Watch Pro 2 (by Nothing) provides heart rate, SpO2, stress, sleep stages, and accelerometer motion tracking. NeuroLoop integrates with the device through two distinct tiers:
1. **Primary**: Android Health Connect (Battery-friendly, standardized OS permissions).
2. **Secondary / Direct**: Optional reverse-engineered Bluetooth Low Energy (BLE) sync.

---

## 2. Android Health Connect Tier
- Uses `androidx.health.connect.client`.
- Ingests:
  - `HeartRateRecord` (sample series in BPM)
  - `SleepSessionRecord` with `SleepStageRecord` (awake, light, deep, rem)
  - `OxygenSaturationRecord` (SpO2 percentage)
- Advantages: Zero background battery drain overhead on the watch; no risk of disconnecting official Nothing X companion app.

---

## 3. Direct BLE Protocol (Optional High-Fidelity Historical Sync)
- **GATT Service UUID**: `0000fee0-0000-1000-8000-00805f9b34fb` (or custom vendor UUID).
- **Packet Structure**:
  - 11-byte header: `[0xAB, Length (2B), CommandOpcode (2B), Sequence (2B), CRC (2B), Reserved (2B)]`.
  - Encrypted payload: AES-128-CBC or AES-128-ECB session handshake.
- **Historical Commands**:
  - `0x0201`: Sync daily step & movement epoch buffers.
  - `0x0204`: Sync historical heart rate & HRV inter-beat intervals.
  - `0x0208`: Sync granular sleep onset & REM timestamp ranges.
- **Fail-safe**: If BLE sync drops or authentication fails, graceful fallback to Health Connect polling occurs automatically.
