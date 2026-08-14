-- 004_fix_settings_iv.sql
-- Fixes shared IV bug: OpenAI and Gemini keys were sharing one `iv` column,
-- so saving one key's IV overwrote the other's, corrupting decryption.

ALTER TABLE public.oia_user_settings
  ADD COLUMN IF NOT EXISTS iv_openai text,
  ADD COLUMN IF NOT EXISTS iv_gemini text;

ALTER TABLE public.oia_user_settings
  DROP COLUMN IF EXISTS iv;
