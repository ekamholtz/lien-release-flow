
-- 20250410_qbo_integration.sql

-- 1. Create role enum if it does not exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE public.user_role AS ENUM ('platform_admin', 'account_admin', 'user', 'guest');
  END IF;
END$$;

-- 2. Create profiles table if not exists, with at least id and role
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    CREATE TABLE public.profiles (
      id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      role public.user_role NOT NULL DEFAULT 'user',
      gc_account_id uuid,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  END IF;
END$$;

-- 3. qbo_connections table
CREATE TABLE IF NOT EXISTS public.qbo_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  realm_id text NOT NULL CHECK (char_length(realm_id) > 0),
  access_token text NOT NULL CHECK (char_length(access_token) > 0),
  refresh_token text NOT NULL CHECK (char_length(refresh_token) > 0),
  scope text,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '55 minutes'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, realm_id)
);

-- 4. qbo_logs table
CREATE TABLE IF NOT EXISTS public.qbo_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  function_name text NOT NULL,
  payload jsonb,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Add indexes
CREATE INDEX IF NOT EXISTS idx_qbo_user ON public.qbo_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_qbo_logs_user ON public.qbo_logs(user_id);

-- 6. is_platform_admin() function
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT role = 'platform_admin'
  FROM public.profiles
  WHERE id = auth.uid();
$$;

-- 7. RLS policies for qbo_connections (all actions, admin override)
ALTER TABLE public.qbo_connections ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'user_or_admin' AND tablename = 'qbo_connections'
  ) THEN
    CREATE POLICY user_or_admin ON public.qbo_connections
      USING (user_id = auth.uid() OR public.is_platform_admin())
      WITH CHECK (user_id = auth.uid() OR public.is_platform_admin());
  END IF;
END$$;

-- 8. RLS policies for qbo_logs
ALTER TABLE public.qbo_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'user_or_admin' AND tablename = 'qbo_logs'
  ) THEN
    CREATE POLICY user_or_admin ON public.qbo_logs
      USING (user_id = auth.uid() OR public.is_platform_admin())
      WITH CHECK (user_id = auth.uid() OR public.is_platform_admin() OR user_id IS NULL);
  END IF;
END$$;

