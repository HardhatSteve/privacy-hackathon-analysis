#!/bin/bash

# SOLVOID TACTICAL LAUNCHER
# Initiates the root protocol stack and the command center dashboard

echo "--- [SOLVOID TACTICAL LAUNCHER] ---"

# Check dependencies
if ! command -v node &> /dev/null
then
    echo "[!] ERROR: Node.js not found. Installation required."
    exit
fi

# Build root SDK if needed
if [ ! -d "dist" ]; then
    echo "[i] First run detected. Building SDK..."
    npm run build
fi

# Launch dashboard
echo "[i] Engaging Tactical Command Center..."
npm run dashboard:dev
