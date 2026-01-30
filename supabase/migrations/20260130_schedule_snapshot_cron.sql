-- Enable the pg_cron extension
create extension if not exists pg_cron;

-- Schedule the job to run every day at 00:00 (Midnight)
-- Note: Replace [PROJECT_REF] and [SERVICE_ROLE_KEY] with actual values
-- You can find these in your Supabase Dashboard -> Project Settings -> API
select cron.schedule(
  'fetch-snapshots-daily', -- name of the cron job
  '0 0 * * *',             -- schedule (at 00:00 every day)
  $$
  select
    net.http_post(
      url:='https://axqbxpsheochasxosfkl.supabase.co/functions/v1/server/log-snapshots',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4cWJ4cHNoZW9jaGFzeG9zZmtsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODM1OTgwMCwiZXhwIjoyMDgzOTM1ODAwfQ.qf079UIZ8YzCsVjHoOFGv3D7l_MHyVPXIgk5Ki6SApg"}'::jsonb,
      body:='{}'::jsonb
    ) as request_id;
  $$
);

-- To check scheduled jobs:
-- select * from cron.job;

-- To unschedule:
-- select cron.unschedule('fetch-snapshots-daily');
