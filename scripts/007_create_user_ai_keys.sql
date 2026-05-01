CREATE TABLE public.user_ai_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('openai', 'anthropic', 'google', 'deepseek', 'ollama')),
  name TEXT NOT NULL,
  encrypted_value TEXT, -- Nullable to support local providers like Ollama
  model_name TEXT, -- Model name for local providers (e.g. llama3.2 for Ollama)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, provider, name)
);

ALTER TABLE public.user_ai_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_keys_select_own" ON public.user_ai_keys;
DROP POLICY IF EXISTS "ai_keys_insert_own" ON public.user_ai_keys;
DROP POLICY IF EXISTS "ai_keys_update_own" ON public.user_ai_keys;
DROP POLICY IF EXISTS "ai_keys_delete_own" ON public.user_ai_keys;

CREATE POLICY "ai_keys_select_own" ON public.user_ai_keys FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ai_keys_insert_own" ON public.user_ai_keys FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ai_keys_update_own" ON public.user_ai_keys FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "ai_keys_delete_own" ON public.user_ai_keys FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_ai_keys_user_id ON public.user_ai_keys(user_id);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_ai_keys_updated_at
  BEFORE UPDATE ON public.user_ai_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();