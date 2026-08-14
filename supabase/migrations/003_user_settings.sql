-- 003_user_settings.sql

-- Settings table for storing encrypted API keys per user
CREATE TABLE IF NOT EXISTS public.oia_user_settings (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    encrypted_openai_key text,
    encrypted_gemini_key text,
    iv text, -- Initialization Vector for AES encryption
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT oia_user_settings_pkey PRIMARY KEY (id),
    CONSTRAINT oia_user_settings_user_id_key UNIQUE (user_id)
);

-- RLS
ALTER TABLE public.oia_user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own settings" 
ON public.oia_user_settings FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" 
ON public.oia_user_settings FOR ALL 
USING (auth.uid() = user_id);
