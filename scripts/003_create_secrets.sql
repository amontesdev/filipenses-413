-- Create secrets table for encrypted credentials
CREATE TABLE IF NOT EXISTS public.secrets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  encrypted_value TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, name)
);

-- Enable RLS
ALTER TABLE public.secrets ENABLE ROW LEVEL SECURITY;

-- RLS policies for secrets
DROP POLICY IF EXISTS "secrets_select_own" ON public.secrets;
DROP POLICY IF EXISTS "secrets_insert_own" ON public.secrets;
DROP POLICY IF EXISTS "secrets_update_own" ON public.secrets;
DROP POLICY IF EXISTS "secrets_delete_own" ON public.secrets;

CREATE POLICY "secrets_select_own" ON public.secrets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "secrets_insert_own" ON public.secrets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "secrets_update_own" ON public.secrets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "secrets_delete_own" ON public.secrets FOR DELETE USING (auth.uid() = user_id);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_secrets_user_id ON public.secrets(user_id);
CREATE INDEX IF NOT EXISTS idx_secrets_project_id ON public.secrets(project_id);
