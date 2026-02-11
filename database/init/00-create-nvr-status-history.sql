-- Create NVR Status History Table with complete schema
CREATE TABLE IF NOT EXISTS nvr_status_history (
  id BIGSERIAL PRIMARY KEY,
  nvr_id TEXT NOT NULL,
  nvr_name TEXT NOT NULL,
  district TEXT NOT NULL,
  location TEXT NOT NULL,
  onu_ip TEXT,
  ping_onu BOOLEAN DEFAULT true,
  nvr_ip TEXT NOT NULL,
  ping_nvr BOOLEAN DEFAULT true,
  hdd_status BOOLEAN DEFAULT true,
  normal_view BOOLEAN DEFAULT true,
  check_login BOOLEAN DEFAULT true,
  camera_count INTEGER DEFAULT 0,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_nvr_status_history_nvr_name ON nvr_status_history(nvr_name);
CREATE INDEX IF NOT EXISTS idx_nvr_status_history_recorded_at ON nvr_status_history(recorded_at);
CREATE INDEX IF NOT EXISTS idx_nvr_status_history_district ON nvr_status_history(district);
CREATE INDEX IF NOT EXISTS idx_nvr_status_history_nvr_id ON nvr_status_history(nvr_id);

-- Migrate data from nvr_snapshot_history to nvr_status_history
-- This creates aggregated NVR status records from snapshot data
INSERT INTO nvr_status_history (
  nvr_id,
  nvr_name,
  district,
  location,
  onu_ip,
  ping_onu,
  nvr_ip,
  ping_nvr,
  hdd_status,
  normal_view,
  check_login,
  camera_count,
  recorded_at
)
SELECT 
  ROW_NUMBER() OVER (ORDER BY nvr_name)::TEXT as nvr_id,
  nvr_name,
  'Unknown' as district, -- TODO: Update with actual district data
  'Unknown' as location, -- TODO: Update with actual location data
  '' as onu_ip,
  true as ping_onu,
  nvr_ip,
  -- Determine ping_nvr based on recent snapshot success rate
  (COUNT(CASE WHEN snapshot_status = 'success' THEN 1 END)::FLOAT / COUNT(*)) > 0.8 as ping_nvr,
  -- Assume HDD is ok if snapshots are being recorded
  (COUNT(CASE WHEN snapshot_status = 'success' THEN 1 END)::FLOAT / COUNT(*)) > 0.5 as hdd_status,
  -- Normal view based on snapshot success
  (COUNT(CASE WHEN snapshot_status = 'success' THEN 1 END)::FLOAT / COUNT(*)) > 0.7 as normal_view,
  true as check_login,
  COUNT(DISTINCT camera_name) as camera_count,
  MAX(recorded_at) as recorded_at
FROM nvr_snapshot_history
WHERE recorded_at >= NOW() - INTERVAL '7 days' -- Only recent data
GROUP BY nvr_name, nvr_ip
ON CONFLICT DO NOTHING;

-- Add comment to table
COMMENT ON TABLE nvr_status_history IS 'Historical status records for NVR stations including network, hardware, and operational status';
