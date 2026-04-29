CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.unschedule('link-health-sweep-jobs')
  WHERE EXISTS (
    SELECT 1 FROM cron.job 
    WHERE jobname = 'link-health-sweep-jobs'
  );

SELECT cron.unschedule('link-health-sweep-all')
  WHERE EXISTS (
    SELECT 1 FROM cron.job 
    WHERE jobname = 'link-health-sweep-all'
  );

SELECT cron.schedule(
  'link-health-sweep-jobs',
  '0 17 * * *',
  $$
  SELECT net.http_post(
    url := (
      SELECT value FROM public.platform_settings 
      WHERE key = 'supabase_url'
      LIMIT 1
    ) || '/functions/v1/link-health-sweep',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (
        SELECT value FROM public.platform_settings
        WHERE key = 'scan_api_key'
        LIMIT 1
      )
    ),
    body := '{"category":"Jobs"}'::jsonb
  );
  $$
);

SELECT cron.schedule(
  'link-health-sweep-all',
  '0 18 * * 0',
  $$
  SELECT net.http_post(
    url := (
      SELECT value FROM public.platform_settings 
      WHERE key = 'supabase_url'
      LIMIT 1
    ) || '/functions/v1/link-health-sweep',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (
        SELECT value FROM public.platform_settings
        WHERE key = 'scan_api_key'
        LIMIT 1
      )
    ),
    body := '{}'::jsonb
  );
  $$
);