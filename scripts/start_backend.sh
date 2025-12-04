#!/bin/bash

# ==============================
# Start ZK-MedShard Backend
# ==============================

# Navigate to backend folder
cd "$(dirname "$0")/../backend" || exit

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "[Error] .env file not found in backend/. Please copy .env.example to .env"
    exit 1
fi

echo "[Info] Loading environment variables from .env..."
export $(grep -v '^#' .env | xargs)

echo "[Info] Building backend..."
cargo build

if [ $? -ne 0 ]; then
    echo "[Error] Build failed. Fix errors before running."
    exit 1
fi

echo "[Info] Starting backend server..."
RUST_LOG=info cargo run
