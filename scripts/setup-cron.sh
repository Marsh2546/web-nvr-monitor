#!/bin/bash

# Setup script for external cron jobs to replace pg_cron functionality
# This script sets up cron jobs on the host system to call the backend API

BACKEND_URL="http://localhost:3001"
LOG_FILE="/var/log/cctv-nvr-cron.log"

# Create log directory
sudo mkdir -p $(dirname "$LOG_FILE")
sudo touch "$LOG_FILE"
sudo chmod 666 "$LOG_FILE"

echo "Setting up cron jobs for CCTV NVR Monitor..."

# Create temporary cron file
TEMP_CRON=$(mktemp)

# Export existing crontab
crontab -l > "$TEMP_CRON" 2>/dev/null || echo "# CCTV NVR Monitor Cron Jobs" > "$TEMP_CRON"

# Add new cron jobs
cat >> "$TEMP_CRON" << EOF

# CCTV NVR Monitor - Log snapshot attempts every 5 minutes
*/5 * * * * curl -s -X POST "$BACKEND_URL/api/log-snapshots" >> "$LOG_FILE" 2>&1

# CCTV NVR Monitor - Cleanup old logs daily at 2 AM
0 2 * * * curl -s -X POST "$BACKEND_URL/api/cleanup-logs" >> "$LOG_FILE" 2>&1

# CCTV NVR Monitor - Health check every hour
0 * * * * curl -s "$BACKEND_URL/api/health" >> "$LOG_FILE" 2>&1
EOF

# Install new crontab
crontab "$TEMP_CRON"

# Clean up
rm "$TEMP_CRON"

echo "✓ Cron jobs installed successfully!"
echo ""
echo "Installed cron jobs:"
echo "  - Every 5 minutes: Log snapshot attempts"
echo "  - Daily at 2 AM: Cleanup old logs"
echo "  - Every hour: Health check"
echo ""
echo "Log file: $LOG_FILE"
echo ""
echo "To view cron jobs: crontab -l"
echo "To view logs: tail -f $LOG_FILE"
echo ""
echo "To remove cron jobs, edit with: crontab -e"
