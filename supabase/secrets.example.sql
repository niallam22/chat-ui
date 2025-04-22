-- Make sure to replace with your actual values!
ALTER SYSTEM SET custom.supabase.project_url = 'supabase-kong-url:external-port';
ALTER SYSTEM SET custom.supabase.service_role_key = 'service-role-key';

-- You need to reload the configuration for changes to take effect
SELECT pg_reload_conf();