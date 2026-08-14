-- OIA Career Analysis Table
-- Stores the full AI career intelligence report per user (single row per user, replaced on re-upload)
CREATE TABLE IF NOT EXISTS public.oia_career_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Scores
  resume_score int DEFAULT 0,
  employability_score int DEFAULT 0,
  career_readiness_score int DEFAULT 0,
  
  -- Domain & Level
  domain_fit text,
  experience_level text,
  
  -- Strengths / Weaknesses
  strengths text[] DEFAULT '{}',
  improvement_areas text[] DEFAULT '{}',
  
  -- Recommended Roles
  recommended_roles jsonb DEFAULT '[]',
  -- [{role, matchPercent, reason}]
  
  -- Skill Gaps
  skill_gaps jsonb DEFAULT '[]',
  -- [{skill, priority, learning}]
  
  -- Career Roadmap
  plan_30_days text[] DEFAULT '{}',
  plan_90_days text[] DEFAULT '{}',
  plan_180_days text[] DEFAULT '{}',
  
  -- AI Narrative
  ai_narrative text,
  
  -- Opportunity Matches (cached)
  opportunity_matches jsonb DEFAULT '[]',
  -- [{id, title, organization, matchScore, matchExplanation, skillGap, applyLink}]
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.oia_career_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own analysis"
  ON public.oia_career_analysis FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Service role full access - career analysis"
  ON public.oia_career_analysis FOR ALL
  TO service_role USING (true);

CREATE INDEX IF NOT EXISTS idx_oia_career_analysis_user
  ON public.oia_career_analysis(user_id);

SELECT 'oia_career_analysis created' AS status;
