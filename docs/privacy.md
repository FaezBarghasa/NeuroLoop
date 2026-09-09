# NeuroLoop - Privacy & Local-First Manifesto

## 1. Zero Cloud Dependency
NeuroLoop operates exclusively on your local device. It requires:
- **No account creation or registration**
- **No analytics tracking or remote telemetry**
- **No internet connection or background cloud syncing**
- **No subscriptions or advertising SDKs**

---

## 2. On-Device Storage
All biometric readings, sleep reports, focus logs, and personal tuning weights are stored in an embedded SurrealDB database located within your device's private app data directory.

---

## 3. Data Sovereignty & Portability
- You can export 100% of your data at any time into open formats (JSON, CSV, ZIP).
- You can selectively purge or permanently delete all local data with a single click in Settings.
- When uninstalling the app, all local databases and configuration files are permanently erased by the operating system.
