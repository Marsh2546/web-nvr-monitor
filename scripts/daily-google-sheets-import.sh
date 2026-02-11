#!/bin/bash

# Google Sheets Daily Import Script for CCTV NVR Monitor
# This script runs the import-google-sheets.cjs script daily

# Set working directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Log file
LOG_FILE="/var/log/google-sheets-daily-import.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

echo "========================================" >> "$LOG_FILE"
echo "🚀 Google Sheets Daily Import - $DATE" >> "$LOG_FILE"
echo "========================================" >> "$LOG_FILE"

# Change to project directory
cd "$PROJECT_DIR"

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js." >> "$LOG_FILE"
    exit 1
fi

# Check if the import script exists
if [ ! -f "scripts/import-google-sheets.cjs" ]; then
    echo "❌ Import script not found: scripts/import-google-sheets.cjs" >> "$LOG_FILE"
    exit 1
fi

# Run the import script
echo "📊 Starting Google Sheets import..." >> "$LOG_FILE"

if node scripts/import-google-sheets.cjs >> "$LOG_FILE" 2>&1; then
    echo "✅ Google Sheets import completed successfully!" >> "$LOG_FILE"
else
    echo "❌ Google Sheets import failed with exit code $?" >> "$LOG_FILE"
    exit 1
fi

echo "📊 Import process finished at $(date '+%Y-%m-%d %H:%M:%S')" >> "$LOG_FILE"
echo "========================================" >> "$LOG_FILE"
