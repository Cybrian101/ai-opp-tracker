'use strict';

const express = require('express');
const supabase = require('../lib/supabase');

const router = express.Router();

// ─── GET /:userId ─────────────────────────────────────────────────────────────

router.get('/:userId', async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    // Step 1: Get the candidate profile
    const { data: profileData, error: profileError } = await supabase
      .from('oia_candidate_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (profileError) throw profileError;

    if (!profileData) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const profileId = profileData.id;

    // Step 2: Get child tables using profile_id (not user_id)
    const [skillsRes, projectsRes, experienceRes, certsRes, matchesRes, strategyRes, actionsRes] =
      await Promise.all([
        supabase
          .from('oia_candidate_skills')
          .select('*')
          .eq('profile_id', profileId),
        supabase
          .from('oia_candidate_projects')
          .select('*')
          .eq('profile_id', profileId),
        supabase
          .from('oia_candidate_experience')
          .select('*')
          .eq('profile_id', profileId),
        supabase
          .from('oia_candidate_certifications')
          .select('*')
          .eq('profile_id', profileId),
        supabase
          .from('oia_opportunity_matches')
          .select('opportunity_id, match_score, priority, why_it_matches, suggested_actions')
          .eq('user_id', userId)
          .order('match_score', { ascending: false })
          .limit(10),
        supabase
          .from('oia_career_recommendations')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('oia_agent_actions')
          .select('action, status, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

    const fullProfile = {
      ...profileData,
      skills: skillsRes.data || [],
      projects: projectsRes.data || [],
      experience: experienceRes.data || [],
      certifications: certsRes.data || [],
      recentMatches: matchesRes.data || [],
      latestCareerStrategy: strategyRes.data || null,
      recentActions: actionsRes.data || [],
    };

    return res.json({ profile: fullProfile });
  } catch (err) {
    console.error('[ProfileRoute] GET /:userId error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /upsert ─────────────────────────────────────────────────────────────

router.post('/upsert', async (req, res) => {
  const { userId, ...profileData } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    // Upsert user into public.users
    const { error: userError } = await supabase
      .from('users')
      .upsert(
        {
          id: userId,
          email: profileData.email || null,
          full_name: profileData.name || null,
          avatar_url: profileData.avatarUrl || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

    if (userError) {
      console.error('[ProfileRoute] User upsert error:', userError.message);
      return res.status(500).json({ error: 'Failed to upsert user' });
    }

    // Optionally upsert profile data if present
    if (Object.keys(profileData).length > 0) {
      const profileUpsert = {};
      if (profileData.name) profileUpsert.name = profileData.name;
      if (profileData.email) profileUpsert.email = profileData.email;
      if (profileData.phone) profileUpsert.phone = profileData.phone;
      if (profileData.degree) profileUpsert.degree = profileData.degree;
      if (profileData.institution) profileUpsert.institution = profileData.institution;
      if (profileData.graduationYear) profileUpsert.graduation_year = profileData.graduationYear;
      if (profileData.experienceLevel) profileUpsert.experience_level = profileData.experienceLevel;
      if (profileData.summary) profileUpsert.summary = profileData.summary;
      if (profileData.interests) profileUpsert.interests = profileData.interests;
      if (profileData.preferredDomains) profileUpsert.preferred_domains = profileData.preferredDomains;

      if (Object.keys(profileUpsert).length > 0) {
        profileUpsert.user_id = userId;
        profileUpsert.updated_at = new Date().toISOString();

        await supabase
          .from('oia_candidate_profiles')
          .upsert(profileUpsert, { onConflict: 'user_id' });
      }
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('[ProfileRoute] POST /upsert error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
