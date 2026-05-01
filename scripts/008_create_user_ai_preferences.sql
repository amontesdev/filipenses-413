CREATE TABLE public.user_ai_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  preferred_provider TEXT NOT NULL DEFAULT 'openai' CHECK (preferred_provider IN ('openai', 'deepseek', 'ollama')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_ai_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_prefs_select_own" ON public.user_ai_preferences;
DROP POLICY IF EXISTS "ai_prefs_insert_own" ON public.user_ai_preferences;
DROP POLICY IF EXISTS "ai_prefs_update_own" ON public.user_ai_preferences;

CREATE POLICY "ai_prefs_select_own" ON public.user_ai_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ai_prefs_insert_own" ON public.user_ai_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ai_prefs_update_own" ON public.user_ai_preferences FOR UPDATE USING (auth.uid() = user_id);