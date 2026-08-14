'use strict';

const { generateContent } = require('../lib/gemini');
const { buildCareerStrategyPrompt } = require('../lib/prompts');

async function generateCareerStrategy(
  profile,
  topOpportunities,
  query,
  userId,
  supabaseClient
) {
  try {
    console.log(`[CareerStrategyAgent] Generating strategy for user ${userId}`);

    const top5 = Array.isArray(topOpportunities)
      ? topOpportunities.slice(0, 5)
      : [];

    const prompt = buildCareerStrategyPrompt(profile, top5);
    const strategy = await generateContent(prompt, true);

    if (!strategy || typeof strategy !== 'object') {
      console.error('[CareerStrategyAgent] Gemini returned invalid strategy');
      return buildFallbackStrategy(profile);
    }

    // Normalize arrays
    strategy.suggestedPath = Array.isArray(strategy.suggestedPath)
      ? strategy.suggestedPath
      : [];
    strategy.missingSkills = Array.isArray(strategy.missingSkills)
      ? strategy.missingSkills
      : [];
    strategy.suggestedResources = Array.isArray(strategy.suggestedResources)
      ? strategy.suggestedResources
      : [];
    strategy.nextSteps = Array.isArray(strategy.nextSteps)
      ? strategy.nextSteps
      : [];

    // Persist to oia_career_recommendations
    if (userId) {
      try {
        const topOpportunityIds = top5
          .filter((opp) => opp && opp.id)
          .map((opp) => opp.id);

        const { error: insertError } = await supabaseClient
          .from('oia_career_recommendations')
          .insert({
            user_id: userId,
            query: query || '',
            current_level: strategy.currentLevel || '',
            suggested_path: strategy.suggestedPath,
            missing_skills: strategy.missingSkills,
            suggested_resources: strategy.suggestedResources,
            next_steps: strategy.nextSteps,
            overall_message: strategy.overallMessage || '',
            top_opportunity_ids: topOpportunityIds,
            created_at: new Date().toISOString(),
          });

        if (insertError) {
          console.error(
            '[CareerStrategyAgent] Failed to save strategy:',
            insertError.message
          );
        } else {
          console.log(
            `[CareerStrategyAgent] Strategy saved for user ${userId}`
          );
        }
      } catch (saveErr) {
        console.error(
          '[CareerStrategyAgent] Error persisting strategy:',
          saveErr.message
        );
      }
    }

    return strategy;
  } catch (err) {
    console.error('[CareerStrategyAgent] Unexpected error:', err.message);
    return buildFallbackStrategy(profile);
  }
}

function buildFallbackStrategy(profile) {
  const level = profile?.experienceLevel || 'fresher';
  return {
    currentLevel: `You are at the ${level} stage of your career.`,
    suggestedPath: [
      {
        step: 'Build a strong portfolio with personal projects',
        reason: 'Practical work demonstrates real skills to employers',
        timeframe: 'Next 1-3 months',
      },
      {
        step: 'Apply to the matched opportunities above',
        reason: 'Taking action is the fastest path to progress',
        timeframe: 'This week',
      },
    ],
    missingSkills: [],
    suggestedResources: [
      'LinkedIn Learning for professional development',
      'GitHub for portfolio building',
    ],
    nextSteps: [
      'Review your matched opportunities',
      'Update your resume based on missing skills',
      'Apply to at least 3 opportunities this week',
    ],
    overallMessage:
      'You have a strong foundation. Keep building, keep applying, and stay consistent — your next big opportunity is closer than you think.',
  };
}

module.exports = { generateCareerStrategy };
