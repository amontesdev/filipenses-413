-- Add Ollama support to user_ai_keys table
-- Run this after scripts 007 and 008

-- 1. Make encrypted_value nullable for local providers (Ollama, etc.)
ALTER TABLE public.user_ai_keys 
ALTER COLUMN encrypted_value DROP NOT NULL;

-- 2. Add model_name column for local model providers
ALTER TABLE public.user_ai_keys
ADD COLUMN IF NOT EXISTS model_name TEXT;

COMMENT ON COLUMN public.user_ai_keys.model_name IS 'Model name for local providers (e.g. llama3.2 for Ollama). Null for cloud providers.';

-- 3. Update CHECK constraint to include ollama
ALTER TABLE public.user_ai_keys 
DROP CONSTRAINT IF EXISTS user_ai_keys_provider_check;

ALTER TABLE public.user_ai_keys 
ADD CHECK (provider IN ('openai', 'anthropic', 'google', 'deepseek', 'ollama'));

-- 4. Update user_ai_preferences to include ollama
ALTER TABLE public.user_ai_preferences 
DROP CONSTRAINT IF EXISTS user_ai_preferences_provider_check;

ALTER TABLE public.user_ai_preferences 
ADD CHECK (preferred_provider IN ('openai', 'deepseek', 'ollama'));