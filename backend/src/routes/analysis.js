'use strict';

const express = require('express');
const supabase = require('../lib/supabase');
const { generateContent } = require('../lib/gemini');

const router = express.Router();

// ─── SSE Helper ──────────────────────────────────────────────────────────────

function sendSSE(res, type, data) {
  const payload = JSON.stringify({ type, ...data });
  res.write(`data: ${payload}\n\n`);
  if (typeof res.flush === 'function') res.flush();
}

// ─── GET /:userId ─────────────────────────────────────────────────────────────

router.get('/:userId', async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    // Fetch career analysis
    const { data: analysisData, error: analysisError } = await supabase
      .from('oia_career_analysis')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (analysisError && analysisError.code !== 'PGRST116') {
      console.error('[AnalysisRoute] Error fetching career analysis:', analysisError.message);
    }

    // Fetch candidate profile
    const { data: profileData, error: profileError } = await supabase
      .from('oia_candidate_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('[AnalysisRoute] Error fetching profile:', profileError.message);
    }

    // Fetch skills if profile exists
    let skills = [];
    if (profileData?.id) {
      const { data: skillsData } = await supabase
        .from('oia_candidate_skills')
        .select('*')
        .eq('profile_id', profileData.id);
      skills = skillsData || [];
    }

    return res.json({
      analysis: analysisData || null,
      profile: profileData ? { ...profileData, skills } : null,
    });
  } catch (err) {
    console.error('[AnalysisRoute] GET /:userId error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch career analysis' });
  }
});

// ─── POST /query ──────────────────────────────────────────────────────────────

router.post('/query', async (req, res) => {
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const { userId, query } = req.body;

  if (!userId || !query) {
    sendSSE(res, 'error', { message: 'userId and query are required' });
    res.end();
    return;
  }

  try {
    // Signal thinking
    sendSSE(res, 'thinking', { message: 'Processing your question...' });

    // ── Fetch user context ──────────────────────────────────────────────────
    const [analysisRes, profileRes] = await Promise.all([
      supabase
        .from('oia_career_analysis')
        .select(
          'resume_score, employability_score, career_readiness_score, domain_fit, strengths, improvement_areas, recommended_roles, skill_gaps, ai_narrative'
        )
        .eq('user_id', userId)
        .single(),
      supabase
        .from('oia_candidate_profiles')
        .select('name, experience_level, summary, preferred_domains, interests')
        .eq('user_id', userId)
        .single(),
    ]);

    const analysis = analysisRes.data || {};
    const profile = profileRes.data || {};

    // ── Build conversational prompt ─────────────────────────────────────────
    const prompt = buildConversationalPrompt(query, profile, analysis);

    // ── Call Gemini ─────────────────────────────────────────────────────────
    const result = await generateContent(prompt, true, userId);

    // ── Determine if we need to re-fetch filtered opportunities ────────────
    let opportunities = null;
    if (result.answerType === 'opportunities') {
      const { data: oppData } = await supabase
        .from('oia_career_analysis')
        .select('opportunity_matches')
        .eq('user_id', userId)
        .single();

      if (oppData?.opportunity_matches) {
        // Return top 10 relevant from stored matches
        opportunities = oppData.opportunity_matches.slice(0, 10);
      }
    }

    // ── Build answer payload ────────────────────────────────────────────────
    const answerPayload = {
      text: result.answer || '',
      highlights: result.highlights || [],
      answerType: result.answerType || 'narrative',
      uiAction: result.uiAction || null
    };

    if (opportunities) {
      answerPayload.opportunities = opportunities;
    }

    if (result.answerType === 'skills') {
      answerPayload.skillGaps = analysis.skill_gaps || [];
    }

    if (result.answerType === 'roles') {
      answerPayload.roleComparison = analysis.recommended_roles || [];
    }

    // Send answer
    sendSSE(res, 'answer', { data: answerPayload });

    // Send complete
    sendSSE(res, 'complete', {});
  } catch (err) {
    console.error('[AnalysisRoute] POST /query error:', err.message);
    sendSSE(res, 'error', { message: 'Failed to process your question. Please try again.' });
  }

  res.end();
});

// ─── Conversational Prompt Builder ───────────────────────────────────────────

function buildConversationalPrompt(query, profile, analysis) {
  const strengths = Array.isArray(analysis.strengths)
    ? analysis.strengths.join(', ')
    : 'Not available';

  const improvementAreas = Array.isArray(analysis.improvement_areas)
    ? analysis.improvement_areas.join(', ')
    : 'Not available';

  const recommendedRoles = Array.isArray(analysis.recommended_roles)
    ? analysis.recommended_roles
        .map((r) => `${r.role} (${r.matchPercent}% match)`)
        .join(', ')
    : 'Not available';

  const skillGaps = Array.isArray(analysis.skill_gaps)
    ? analysis.skill_gaps
        .map((g) => `${g.skill} [${g.priority} priority]`)
        .join(', ')
    : 'Not available';

  return `You are an expert AI career advisor with deep knowledge of the tech industry. Answer this user's career question based on their profile and existing career analysis.

USER QUESTION: "${query}"

CANDIDATE PROFILE:
Name: ${profile.name || 'User'}
Experience Level: ${profile.experience_level || 'fresher'}
Summary: ${profile.summary || 'Not provided'}
Preferred Domains: ${Array.isArray(profile.preferred_domains) ? profile.preferred_domains.join(', ') : 'Not specified'}
Interests: ${Array.isArray(profile.interests) ? profile.interests.join(', ') : 'Not specified'}

EXISTING CAREER ANALYSIS:
Resume Score: ${analysis.resume_score ?? 'N/A'}/100
Employability Score: ${analysis.employability_score ?? 'N/A'}/100
Career Readiness: ${analysis.career_readiness_score ?? 'N/A'}/100
Domain Fit: ${analysis.domain_fit || 'Unknown'}
Strengths: ${strengths}
Improvement Areas: ${improvementAreas}
Recommended Roles: ${recommendedRoles}
Skill Gaps: ${skillGaps}
AI Narrative: ${analysis.ai_narrative || 'Not available'}

Analyze the question and determine its type:
a) "skills" → user is asking about specific skill gaps or what to learn
b) "roles" → user is asking about job roles, career paths, or position comparisons
c) "opportunities" → user wants to see relevant opportunities or wants filtering
d) "narrative" → general career advice, motivation, or other questions

Return a JSON object with EXACTLY this structure:
{
  "answerType": "narrative|opportunities|skills|roles",
  "answer": "Your detailed, helpful answer to the user's specific question",
  "highlights": ["key point 1", "key point 2", "key point 3"],
  "uiAction": {
    "type": "filter_dashboard|none",
    "searchQuery": "string (keywords to filter dashboard by, e.g. 'remote internship')",
    "minScore": "number (e.g. 80 if they ask for >80% match, else 0)"
  }
}

RULES:
- answerType must be one of the four values above
- answer should be specific to THIS user's profile
- answer should be direct and practical
- highlights: 2-4 short bullet point takeaways
- uiAction: If the user's request sounds like filtering the current dashboard (e.g., "show remote internships", "only above 80%"), return uiAction.type = "filter_dashboard", else "none".

Return ONLY the JSON object, no additional text.`;
}

module.exports = router;
