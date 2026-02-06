-- Note: pg_cron extension is not available in standard PostgreSQL image
-- Cron jobs will be handled by external scheduler or backend service
-- To enable cron jobs, you would need:
-- 1. A PostgreSQL image with pg_cron extension
-- 2. Or an external cron service that calls the backend API

-- Create a function to log snapshot attempts
create or replace function log_snapshot_attempt()
returns void as $$
declare
  camera_record record;
  snapshot_url text;
  request_result text;
begin
  -- Loop through all active cameras
  for camera_record in 
    select c.id, c.camera_name, c.camera_channel, ns.nvr_ip, ns.nvr_port, ns.username, ns.password
    from cameras c
    join nvr_stations ns on c.nvr_station_id = ns.id
    where c.status = 'active' and ns.status = 'active'
  loop
    -- Construct snapshot URL (this is a placeholder - adjust based on your NVR API)
    snapshot_url := format('http://%s:%s/api/camera/%s/snapshot', 
                          camera_record.nvr_ip, 
                          camera_record.nvr_port, 
                          camera_record.camera_channel);
    
    -- Log the attempt (in a real implementation, you would make HTTP requests here)
    insert into snapshot_logs (camera_id, snapshot_status, snapshot_time)
    values (camera_record.id, 'attempted', now());
    
    -- This is where you would add HTTP request logic to fetch snapshots
    -- For now, we'll just log the attempt
    
  end loop;
end;
$$ language plpgsql;

-- Create a function to update the updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create triggers to automatically update updated_at
create trigger update_nvr_stations_updated_at 
  before update on nvr_stations 
  for each row execute function update_updated_at_column();

create trigger update_cameras_updated_at 
  before update on cameras 
  for each row execute function update_updated_at_column();

-- Note: For cron functionality, use the backend API endpoints:
-- POST /api/log-snapshots - to log snapshot attempts
-- POST /api/trigger-snapshots - to manually trigger snapshots
-- Or set up an external cron job to call these endpoints
