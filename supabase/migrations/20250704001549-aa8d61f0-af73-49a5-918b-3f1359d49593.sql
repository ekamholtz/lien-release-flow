
-- Update the projects table to include QBO customer and job references
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS qbo_customer_id text,
ADD COLUMN IF NOT EXISTS qbo_job_id text;

-- Update the clients table to include QBO customer reference  
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS qbo_customer_id text;

-- Create a function to update sync status with user_id parameter
CREATE OR REPLACE FUNCTION public.update_sync_status(
  p_entity_type text, 
  p_entity_id uuid, 
  p_provider text, 
  p_status text, 
  p_provider_ref text DEFAULT NULL::text, 
  p_provider_meta jsonb DEFAULT NULL::jsonb, 
  p_error jsonb DEFAULT NULL::jsonb, 
  p_error_message text DEFAULT NULL::text,
  p_user_id uuid DEFAULT NULL::uuid
)
RETURNS void
LANGUAGE plpgsql
AS $function$
BEGIN
  INSERT INTO public.accounting_sync (
    entity_type, 
    entity_id, 
    provider, 
    status, 
    provider_ref,
    provider_meta,
    error,
    error_message,
    last_synced_at,
    user_id
  ) 
  VALUES (
    p_entity_type, 
    p_entity_id, 
    p_provider, 
    p_status,
    p_provider_ref,
    p_provider_meta,
    p_error,
    p_error_message,
    now(),
    p_user_id
  )
  ON CONFLICT (entity_type, entity_id, provider) 
  DO UPDATE SET
    status = p_status,
    provider_ref = COALESCE(p_provider_ref, accounting_sync.provider_ref),
    provider_meta = COALESCE(p_provider_meta, accounting_sync.provider_meta),
    error = p_error,
    error_message = p_error_message,
    last_synced_at = now(),
    user_id = COALESCE(p_user_id, accounting_sync.user_id),
    retries = CASE 
                WHEN p_status = 'error' THEN COALESCE(accounting_sync.retries, 0) + 1
                ELSE accounting_sync.retries
              END;
END;
$function$;
