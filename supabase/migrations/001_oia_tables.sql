-- =============================================================
-- Opportunity Intelligence Agent (OIA) — New Tables Only
-- These tables are SEPARATE from the existing schema.
-- Run this in Supabase SQL Editor.
-- =============================================================

-- Enable pgvector if not already enabled
-- CREATE EXTENSION IF NOT EXISTS vector;

-- =============================================================
-- OIA Candidate Profiles
-- =============================================================
CREATE TABLE IF NOT EXISTS public.oia_candidate_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name text,
  email text,
  phone text,
  degree text,
  institution text,
  graduation_year int,
  experience_level text DEFAULT 'fresher',
  -- fresher | junior | mid | senior
  summary text,
  preferred_domains text[] DEFAULT '{}',
  interests text[] DEFAULT '{}',
  raw_resume_text text,
  resume_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- =============================================================
-- OIA Candidate Skills
-- =============================================================
CREATE TABLE IF NOT EXISTS public.oia_candidate_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.oia_candidate_profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text DEFAULT 'other',
  -- programming | cloud | ai | design | management | security | data | other
  level text DEFAULT 'intermediate'
  -- beginner | intermediate | advanced
);

-- =============================================================
-- OIA Candidate Projects
-- =============================================================
CREATE TABLE IF NOT EXISTS public.oia_candidate_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.oia_candidate_profiles(id) ON DELETE CASCADE,
  title text,
  technologies text[] DEFAULT '{}',
  domain text,
  impact text,
  description text
);

-- =============================================================
-- OIA Candidate Experience
-- =============================================================
CREATE TABLE IF NOT EXISTS public.oia_candidate_experience (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.oia_candidate_profiles(id) ON DELETE CASCADE,
  company text,
  role text,
  duration text,
  description text
);

-- =============================================================
-- OIA Candidate Certifications
-- =============================================================
CREATE TABLE IF NOT EXISTS public.oia_candidate_certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.oia_candidate_profiles(id) ON DELETE CASCADE,
  name text,
  issuer text,
  year int
);

-- =============================================================
-- OIA Opportunity Matches
-- Stores AI-computed match scores between users and opportunities
-- =============================================================
CREATE TABLE IF NOT EXISTS public.oia_opportunity_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  opportunity_id uuid NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  match_score int DEFAULT 0,
  skill_match int DEFAULT 0,
  experience_match int DEFAULT 0,
  domain_match int DEFAULT 0,
  interest_match int DEFAULT 0,
  why_it_matches text,
  priority text DEFAULT 'medium',
  -- high | medium | low
  suggested_actions text[] DEFAULT '{}',
  query_context text,
  -- what query generated this match
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, opportunity_id)
);

-- =============================================================
-- OIA Career Recommendations
-- AI-generated career strategy per query session
-- =============================================================
CREATE TABLE IF NOT EXISTS public.oia_career_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  query text,
  current_level text,
  suggested_path jsonb DEFAULT '[]',
  missing_skills text[] DEFAULT '{}',
  suggested_resources text[] DEFAULT '{}',
  next_steps text[] DEFAULT '{}',
  overall_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =============================================================
-- OIA Agent Actions
-- Real-time pipeline activity log
-- =============================================================
CREATE TABLE IF NOT EXISTS public.oia_agent_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  session_id text,
  action text NOT NULL,
  status text DEFAULT 'running',
  -- running | done | failed
  details text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =============================================================
-- Row Level Security Policies
-- =============================================================

ALTER TABLE public.oia_candidate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oia_candidate_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oia_candidate_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oia_candidate_experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oia_candidate_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oia_opportunity_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oia_career_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oia_agent_actions ENABLE ROW LEVEL SECURITY;

-- Service role bypass (for backend server) — Define FIRST and most permissive
CREATE POLICY "Service role - profiles full access"
  ON public.oia_candidate_profiles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role - skills full access"
  ON public.oia_candidate_skills FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role - projects full access"
  ON public.oia_candidate_projects FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role - experience full access"
  ON public.oia_candidate_experience FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role - certifications full access"
  ON public.oia_candidate_certifications FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role - matches full access"
  ON public.oia_opportunity_matches FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role - recommendations full access"
  ON public.oia_career_recommendations FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role - agent actions full access"
  ON public.oia_agent_actions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Users can only see their own data
CREATE POLICY "Users manage own profile"
  ON public.oia_candidate_profiles FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users manage own skills"
  ON public.oia_candidate_skills FOR ALL
  USING (profile_id IN (SELECT id FROM public.oia_candidate_profiles WHERE user_id = auth.uid()))
  WITH CHECK (profile_id IN (SELECT id FROM public.oia_candidate_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users manage own projects"
  ON public.oia_candidate_projects FOR ALL
  USING (profile_id IN (SELECT id FROM public.oia_candidate_profiles WHERE user_id = auth.uid()))
  WITH CHECK (profile_id IN (SELECT id FROM public.oia_candidate_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users manage own experience"
  ON public.oia_candidate_experience FOR ALL
  USING (profile_id IN (SELECT id FROM public.oia_candidate_profiles WHERE user_id = auth.uid()))
  WITH CHECK (profile_id IN (SELECT id FROM public.oia_candidate_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users manage own certifications"
  ON public.oia_candidate_certifications FOR ALL
  USING (profile_id IN (SELECT id FROM public.oia_candidate_profiles WHERE user_id = auth.uid()))
  WITH CHECK (profile_id IN (SELECT id FROM public.oia_candidate_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users manage own matches"
  ON public.oia_opportunity_matches FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users manage own recommendations"
  ON public.oia_career_recommendations FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users manage own agent actions"
  ON public.oia_agent_actions FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =============================================================
-- Indexes
-- =============================================================
CREATE INDEX IF NOT EXISTS idx_oia_matches_user ON public.oia_opportunity_matches(user_id);
CREATE INDEX IF NOT EXISTS idx_oia_matches_score ON public.oia_opportunity_matches(match_score DESC);
CREATE INDEX IF NOT EXISTS idx_oia_actions_user ON public.oia_agent_actions(user_id, created_at DESC);

-- Done!
SELECT 'OIA tables created successfully' AS status;
