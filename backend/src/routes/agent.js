'use strict';

const express = require('express');
const supabase = require('../lib/supabase');
const { generateContent } = require('../lib/gemini');
const { buildIntentAnalysisPrompt } = require('../lib/prompts');
const { scoutOpportunities } = require('../agents/opportunityScout');
const { matchOpportunities } = require('../agents/matchingAgent');
const { generateCareerStrategy } = require('../agents/careerStrategyAgent');

const router = express.Router();

// ─── SSE Helper ─────────────────────────────────────────────────────────────

function sendSSE(res, type, data) {
  const payload = JSON.stringify({ type, ...data });
  res.write(`data: ${payload}\n\n`);
  if (typeof res.flush === 'function') res.flush();
}

// ─── POST /query ──────────────────────────────────────────────────────────────

router.post('/query', async (req, res) => {
  const { query, userId, filters } = req.body;

  if (!query) {
    return res.status(400).json({ error: 'query is required' });
  }

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  let actionId = null;

  try {
    // Step 1: Log action start
    const { data: actionRow, error: actionInsertErr } = await supabase
      .from('oia_agent_actions')
      .insert({
        user_id: userId,
        action: 'query_started',
        status: 'running',
        details: query,
      })
      .select('id')
      .single();

    if (actionInsertErr) {
      console.error('[AgentRoute] Failed to log action:', actionInsertErr.message);
    } else {
      actionId = actionRow?.id;
    }

    // Step 2: Intent analysis
    sendSSE(res, 'step', {
      step: 'intent_analysis',
      message: 'Analyzing your request...',
      progress: 10,
    });

    let intent;
    try {
      const intentPrompt = buildIntentAnalysisPrompt(query);
      intent = await generateContent(intentPrompt, true);
      console.log('[AgentRoute] Intent:', JSON.stringify(intent, null, 2));
    } catch (intentErr) {
      console.error('[AgentRoute] Intent analysis failed:', intentErr.message);
      // Fallback intent
      intent = {
        intent: 'search',
        categories: ['job', 'internship'],
        keywords: query.split(' ').slice(0, 5),
        location: null,
        remote: null,
        level: null,
        domains: [],
        searchQuery: query,
      };
    }

    // Apply user filters if provided
    if (filters) {
      if (filters.categories && Array.isArray(filters.categories)) {
        intent.categories = filters.categories;
      }
      if (typeof filters.remote === 'boolean') {
        intent.remote = filters.remote;
      }
      if (filters.location) {
        intent.location = filters.location;
      }
    }

    // Step 3: Scout opportunities
    sendSSE(res, 'step', {
      step: 'opportunity_scout',
      message: 'Searching opportunity database...',
      progress: 25,
    });

    const opportunities = await scoutOpportunities(intent, supabase);
    console.log(`[AgentRoute] Scouted ${opportunities.length} opportunities`);

    // Step 4: Fetch user profile
    sendSSE(res, 'step', {
      step: 'matching',
      message: `Analyzing ${opportunities.length} opportunities for your profile...`,
      progress: 40,
    });

    const profileRes = await supabase
      .from('oia_candidate_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    // Fetch skills via profile_id
    let skillsRes = { data: [] };
    if (profileRes.data?.id) {
      skillsRes = await supabase
        .from('oia_candidate_skills')
        .select('*')
        .eq('profile_id', profileRes.data.id);
    }

    if (!profileRes.data) {
      // No profile — guide user
      sendSSE(res, 'step', {
        step: 'no_profile',
        message: 'No profile found. Please upload your resume first.',
        progress: 100,
      });
      sendSSE(res, 'complete', {
        message:
          'Please upload your resume first so I can match opportunities to your profile.',
        noProfile: true,
      });
      res.end();
      return;
    }

    const profile = {
      ...profileRes.data,
      skills: skillsRes.data || [],
    };

    // Step 5: Match opportunities
    const rankedOpps = await matchOpportunities(
      profile,
      opportunities,
      userId,
      supabase
    );

    // Step 6: Prioritizing
    sendSSE(res, 'step', {
      step: 'prioritizing',
      message: 'Ranking opportunities by impact...',
      progress: 70,
    });

    // Step 7: Career strategy
    sendSSE(res, 'step', {
      step: 'career_strategy',
      message: 'Generating career recommendations...',
      progress: 85,
    });

    const strategy = await generateCareerStrategy(
      profile,
      rankedOpps.slice(0, 5),
      query,
      userId,
      supabase
    );

    // Step 8: Send results
    sendSSE(res, 'opportunities', { data: rankedOpps });
    sendSSE(res, 'career_strategy', { data: strategy });

    // Step 9: Update action status to done
    if (actionId) {
      await supabase
        .from('oia_agent_actions')
        .update({ status: 'done', details: `Found ${rankedOpps.length} opportunities` })
        .eq('id', actionId);
    }

    // Step 10: Complete
    sendSSE(res, 'complete', {
      message: 'Done! Your personalized opportunities and career strategy are ready.',
      progress: 100,
    });
  } catch (err) {
    console.error('[AgentRoute] Unhandled query error:', err.message);

    // Mark action as failed
    if (actionId) {
      await supabase
        .from('oia_agent_actions')
        .update({ status: 'failed', details: err.message })
        .eq('id', actionId)
        .catch(() => {});
    }

    sendSSE(res, 'error', { message: 'An error occurred while processing your request.' });
  }

  res.end();
});

// ─── GET /actions/:userId ─────────────────────────────────────────────────────

router.get('/actions/:userId', async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    const { data: actions, error } = await supabase
      .from('oia_agent_actions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('[AgentRoute] Actions fetch error:', error.message);
      return res.status(500).json({ error: 'Failed to fetch actions' });
    }

    return res.json({ actions: actions || [] });
  } catch (err) {
    console.error('[AgentRoute] GET /actions error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
