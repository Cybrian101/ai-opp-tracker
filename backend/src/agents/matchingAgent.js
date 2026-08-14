'use strict';

const { generateContent } = require('../lib/gemini');
const { buildMatchScoringPrompt } = require('../lib/prompts');

const BATCH_SIZE = 5;
const BATCH_DELAY_MS = 500;
const MAX_OPPORTUNITIES = 15;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function buildProfileSummary(profile) {
  const topSkills = Array.isArray(profile.skills)
    ? profile.skills.slice(0, 10)
    : [];

  return {
    name: profile.name || 'Candidate',
    experienceLevel: profile.experienceLevel || 'fresher',
    skills: topSkills,
    domains: profile.preferredDomains || [],
    interests: profile.interests || [],
  };
}

function buildOpportunitySummary(opportunity) {
  return {
    title: opportunity.title,
    organization: opportunity.organization,
    category: opportunity.category,
    eligibility: opportunity.eligibility,
    tags: opportunity.tags,
    summary: opportunity.summary,
  };
}

async function scoreOpportunity(profileSummary, opportunity) {
  try {
    const oppSummary = buildOpportunitySummary(opportunity);
    const prompt = buildMatchScoringPrompt(profileSummary, oppSummary);
    const scoring = await generateContent(prompt, true);

    return {
      matchScore: scoring.matchScore || 0,
      skillMatch: scoring.skillMatch || 0,
      experienceMatch: scoring.experienceMatch || 0,
      domainMatch: scoring.domainMatch || 0,
      interestMatch: scoring.interestMatch || 0,
      whyItMatches: scoring.whyItMatches || '',
      priority: scoring.priority || 'low',
      suggestedActions: Array.isArray(scoring.suggestedActions)
        ? scoring.suggestedActions
        : [],
    };
  } catch (err) {
    console.error(
      `[MatchingAgent] Scoring failed for "${opportunity.title}":`,
      err.message
    );
    return {
      matchScore: 0,
      skillMatch: 0,
      experienceMatch: 0,
      domainMatch: 0,
      interestMatch: 0,
      whyItMatches: 'Unable to score this opportunity at this time.',
      priority: 'low',
      suggestedActions: [],
    };
  }
}

async function matchOpportunities(profile, opportunities, userId, supabaseClient) {
  try {
    if (!Array.isArray(opportunities) || opportunities.length === 0) {
      console.log('[MatchingAgent] No opportunities to match');
      return [];
    }

    const oppsToScore = opportunities.slice(0, MAX_OPPORTUNITIES);
    console.log(
      `[MatchingAgent] Scoring ${oppsToScore.length} opportunities for user ${userId}`
    );

    const profileSummary = buildProfileSummary(profile);
    const results = [];

    // Process in batches of BATCH_SIZE
    for (let i = 0; i < oppsToScore.length; i += BATCH_SIZE) {
      const batch = oppsToScore.slice(i, i + BATCH_SIZE);
      console.log(
        `[MatchingAgent] Processing batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} opportunities`
      );

      const batchResults = await Promise.all(
        batch.map((opp) => scoreOpportunity(profileSummary, opp))
      );

      batch.forEach((opp, idx) => {
        results.push({ ...opp, ...batchResults[idx] });
      });

      // Delay between batches to avoid rate limiting
      if (i + BATCH_SIZE < oppsToScore.length) {
        await sleep(BATCH_DELAY_MS);
      }
    }

    // Sort by matchScore descending
    results.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

    // Persist results to oia_opportunity_matches
    if (userId && results.length > 0) {
      try {
        const matchRows = results.map((opp) => ({
          user_id: userId,
          opportunity_id: opp.id,
          match_score: opp.matchScore,
          skill_match: opp.skillMatch,
          experience_match: opp.experienceMatch,
          domain_match: opp.domainMatch,
          interest_match: opp.interestMatch,
          why_it_matches: opp.whyItMatches,
          priority: opp.priority,
          suggested_actions: opp.suggestedActions,
        }));

        const { error: upsertError } = await supabaseClient
          .from('oia_opportunity_matches')
          .upsert(matchRows, {
            onConflict: 'user_id,opportunity_id',
            ignoreDuplicates: false,
          });

        if (upsertError) {
          console.error(
            '[MatchingAgent] Failed to save matches:',
            upsertError.message
          );
        } else {
          console.log(
            `[MatchingAgent] Saved ${matchRows.length} match records for user ${userId}`
          );
        }
      } catch (saveErr) {
        console.error('[MatchingAgent] Error persisting matches:', saveErr.message);
      }
    }

    return results;
  } catch (err) {
    console.error('[MatchingAgent] Unexpected error:', err.message);
    return [];
  }
}

module.exports = { matchOpportunities };
