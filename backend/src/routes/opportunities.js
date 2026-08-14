'use strict';

const express = require('express');
const supabase = require('../lib/supabase');

const router = express.Router();

// ─── SSE Helper ─────────────────────────────────────────────────────────────

function sendSSE(res, type, data) {
  const payload = JSON.stringify({ type, ...data });
  res.write(`data: ${payload}\n\n`);
  if (typeof res.flush === 'function') res.flush();
}

// ─── GET /saved/:userId ─────────────────────────────────────────────────────
// NOTE: must be defined BEFORE /:userId to avoid route collision
router.get('/saved/:userId', async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    // Fetch saved opportunity IDs for the user
    const { data: savedRows, error: savedError } = await supabase
      .from('saved_opportunities')
      .select('opportunity_id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (savedError) {
      console.error('[OpportunitiesRoute] Saved fetch error:', savedError.message);
      return res.status(500).json({ error: 'Failed to fetch saved opportunities' });
    }

    if (!savedRows || savedRows.length === 0) {
      return res.json({ opportunities: [] });
    }

    const opportunityIds = savedRows.map((r) => r.opportunity_id);

    // Fetch full opportunity data
    const { data: opportunities, error: oppError } = await supabase
      .from('opportunities')
      .select(
        `id, title, organization, category, country, city, deadline,
         eligibility, remote, application_url, source_url, tags, summary,
         description, remote_or_inperson, women_friendly, indian_eligible,
         student_eligible, recommendation_score, freshness_score, ai_confidence_score`
      )
      .in('id', opportunityIds);

    if (oppError) {
      console.error('[OpportunitiesRoute] Opp fetch error:', oppError.message);
      return res.status(500).json({ error: 'Failed to fetch opportunity details' });
    }

    // Fetch match data for these opportunities
    const { data: matches } = await supabase
      .from('oia_opportunity_matches')
      .select('opportunity_id, match_score, priority, why_it_matches, suggested_actions')
      .eq('user_id', userId)
      .in('opportunity_id', opportunityIds);

    const matchMap = {};
    if (matches) {
      matches.forEach((m) => {
        matchMap[m.opportunity_id] = m;
      });
    }

    const enriched = (opportunities || []).map((opp) => ({
      ...opp,
      savedAt: savedRows.find((r) => r.opportunity_id === opp.id)?.created_at,
      matchScore: matchMap[opp.id]?.match_score || null,
      priority: matchMap[opp.id]?.priority || null,
      whyItMatches: matchMap[opp.id]?.why_it_matches || null,
      suggestedActions: matchMap[opp.id]?.suggested_actions || [],
    }));

    return res.json({ opportunities: enriched });
  } catch (err) {
    console.error('[OpportunitiesRoute] GET /saved error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET /:userId ─────────────────────────────────────────────────────────────

router.get('/:userId', async (req, res) => {
  const { userId } = req.params;
  const { category, page = '1', limit = '20' } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const offset = (pageNum - 1) * limitNum;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    let matchQuery = supabase
      .from('oia_opportunity_matches')
      .select('opportunity_id, match_score, skill_match, experience_match, domain_match, interest_match, priority, why_it_matches, suggested_actions', { count: 'exact' })
      .eq('user_id', userId)
      .order('match_score', { ascending: false })
      .range(offset, offset + limitNum - 1);

    const { data: matchRows, error: matchError, count } = await matchQuery;

    if (matchError) {
      console.error('[OpportunitiesRoute] Match query error:', matchError.message);
      return res.status(500).json({ error: 'Failed to fetch matched opportunities' });
    }

    if (!matchRows || matchRows.length === 0) {
      return res.json({ opportunities: [], total: 0 });
    }

    const opportunityIds = matchRows.map((m) => m.opportunity_id);

    let oppQuery = supabase
      .from('opportunities')
      .select(
        `id, title, organization, category, country, city, deadline,
         eligibility, remote, application_url, source_url, tags, summary,
         description, remote_or_inperson, women_friendly, indian_eligible,
         student_eligible, recommendation_score, freshness_score, ai_confidence_score`
      )
      .in('id', opportunityIds);

    if (category) {
      oppQuery = oppQuery.contains('category', [category]);
    }

    const { data: opportunities, error: oppError } = await oppQuery;

    if (oppError) {
      console.error('[OpportunitiesRoute] Opp fetch error:', oppError.message);
      return res.status(500).json({ error: 'Failed to fetch opportunity details' });
    }

    // Merge match data into opportunities
    const matchMap = {};
    matchRows.forEach((m) => {
      matchMap[m.opportunity_id] = m;
    });

    const enriched = (opportunities || [])
      .map((opp) => {
        const match = matchMap[opp.id];
        return {
          ...opp,
          matchScore: match?.match_score || 0,
          skillMatch: match?.skill_match || 0,
          experienceMatch: match?.experience_match || 0,
          domainMatch: match?.domain_match || 0,
          interestMatch: match?.interest_match || 0,
          priority: match?.priority || 'low',
          whyItMatches: match?.why_it_matches || '',
          suggestedActions: match?.suggested_actions || [],
          matchedAt: match?.matched_at,
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore);

    return res.json({ opportunities: enriched, total: count || enriched.length });
  } catch (err) {
    console.error('[OpportunitiesRoute] GET /:userId error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET /detail/:opportunityId/:userId ──────────────────────────────────────

router.get('/detail/:opportunityId/:userId', async (req, res) => {
  const { opportunityId, userId } = req.params;

  if (!opportunityId || !userId) {
    return res.status(400).json({ error: 'opportunityId and userId are required' });
  }

  try {
    const [oppRes, matchRes, strategyRes] = await Promise.all([
      supabase
        .from('opportunities')
        .select('*')
        .eq('id', opportunityId)
        .single(),
      supabase
        .from('oia_opportunity_matches')
        .select('*')
        .eq('user_id', userId)
        .eq('opportunity_id', opportunityId)
        .maybeSingle(),
      supabase
        .from('oia_career_recommendations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (oppRes.error || !oppRes.data) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }

    return res.json({
      opportunity: oppRes.data,
      match: matchRes.data || null,
      careerRecommendation: strategyRes.data || null,
    });
  } catch (err) {
    console.error('[OpportunitiesRoute] GET /detail error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /:opportunityId/save ────────────────────────────────────────────────

router.post('/:opportunityId/save', async (req, res) => {
  const { opportunityId } = req.params;
  const { userId } = req.body;

  if (!opportunityId || !userId) {
    return res.status(400).json({ error: 'opportunityId and userId are required' });
  }

  try {
    const { error } = await supabase
      .from('saved_opportunities')
      .upsert(
        {
          user_id: userId,
          opportunity_id: opportunityId,
          created_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,opportunity_id' }
      );

    if (error) {
      console.error('[OpportunitiesRoute] Save error:', error.message);
      return res.status(500).json({ error: 'Failed to save opportunity' });
    }

    return res.json({ saved: true });
  } catch (err) {
    console.error('[OpportunitiesRoute] POST /:id/save error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── DELETE /:opportunityId/save ─────────────────────────────────────────────

router.delete('/:opportunityId/save', async (req, res) => {
  const { opportunityId } = req.params;
  const { userId } = req.body;

  if (!opportunityId || !userId) {
    return res.status(400).json({ error: 'opportunityId and userId are required' });
  }

  try {
    const { error } = await supabase
      .from('saved_opportunities')
      .delete()
      .eq('user_id', userId)
      .eq('opportunity_id', opportunityId);

    if (error) {
      console.error('[OpportunitiesRoute] Unsave error:', error.message);
      return res.status(500).json({ error: 'Failed to unsave opportunity' });
    }

    return res.json({ saved: false });
  } catch (err) {
    console.error('[OpportunitiesRoute] DELETE /:id/save error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
