
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

SELECT cron.schedule(
  'refresh-weekly-top-mics',
  '0 6 * * 1',
  $$
  SELECT net.http_post(
    url := 'https://cotfweyhlglpjmgqxwqx.supabase.co/functions/v1/refresh-weekly-top-mics',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvdGZ3ZXlobGdscGptZ3F4d3F4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2NDU0OTEsImV4cCI6MjA2NDIyMTQ5MX0.cgAtNE4qE4dgeHUu_Q1yQEJBimQlDoy8yDDC_if8GuY"}'::jsonb,
    body := '{"time": "weekly"}'::jsonb
  ) AS request_id;
  $$
);
