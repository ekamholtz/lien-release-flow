
-- Add NOT NULL constraint for refresh_token on qbo_connections table
ALTER TABLE public.qbo_connections
ALTER COLUMN refresh_token SET NOT NULL;

-- Update our sync_status type to include more specific error types
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'error_type') THEN
        CREATE TYPE public.error_type AS ENUM (
            'token-expired',
            'customer-error',
            'connectivity',
            'unknown'
        );
    END IF;
END$$;
