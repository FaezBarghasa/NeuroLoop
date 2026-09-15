#!/usr/bin/env bash
set -euo pipefail

echo "=========================================================="
echo "         NeuroLoop Full System Verification Suite         "
echo "=========================================================="

echo "[1/6] Running Data Preset & State Validation..."
pnpm data:validate

echo "[2/6] Running Data Seeding & Retuning Simulation..."
pnpm data:seed
pnpm data:retune

echo "[3/6] Running TypeScript Strict Typecheck..."
pnpm exec tsc --noEmit

echo "[4/6] Running Frontend Production Build..."
pnpm build

echo "[5/6] Running Rust Backend Unit & Integration Tests..."
cargo test --manifest-path src-tauri/Cargo.toml

echo "[6/6] Running Rust Linter (Clippy) & Formatter Checks..."
cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings
cargo fmt --check --manifest-path src-tauri/Cargo.toml

echo "=========================================================="
echo "   [SUCCESS] All NeuroLoop verification gates passed!     "
echo "=========================================================="
