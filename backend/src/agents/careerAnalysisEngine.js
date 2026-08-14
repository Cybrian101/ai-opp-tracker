'use strict';

const { generateContent } = require('../lib/gemini');
const {
  buildCareerAnalysisPrompt,
  buildOpportunityMatchPrompt,
  buildOpportunityGenerationPrompt,
} = require('../lib/prompts');
const supabase = require('../lib/supabase');

async function runCareerIntelligencePipeline(userId, profile, sendStep) {
  // ─── Step 1: AI Career Analysis ────────────────────────────────────────────
  sendStep('career_analysis', 'Running AI career analysis...', 55);

  let careerData = null;
  try {
    const careerPrompt = buildCareerAnalysisPrompt(profile);
    careerData = await generateContent(careerPrompt, true, userId);
    console.log('[CareerEngine] ✅ Career analysis complete for user:', userId);
  } catch (err) {
    console.error('[CareerEngine] Career analysis Gemini call failed:', err.message);
    careerData = {
      resumeScore: 0,
      employabilityScore: 0,
      careerReadinessScore: 0,
      domainFit: 'Technology',
      strengths: [],
      improvementAreas: [],
      recommendedRoles: [],
      skillGaps: [],
      plan30Days: [],
      plan90Days: [],
      plan180Days: [],
      aiNarrative: 'Career analysis could not be completed at this time. Please try again.',
    };
  }

  // ─── Step 2: Fetch Top Opportunities from DB ────────────────────────────────
  sendStep('opportunity_search', 'Searching opportunity database...', 65);

  let dbOpportunities = [];
  try {
    const { data, error } = await supabase
      .from('opportunities')
      .select(
        'id, title, organization, category, country, city, deadline, eligibility, tags, summary, application_url, recommendation_score, remote'
      )
      .order('recommendation_score', { ascending: false, nullsFirst: false })
      .limit(20);

    if (error) {
      console.error('[CareerEngine] Opportunity fetch error:', error.message);
    } else {
      dbOpportunities = data || [];
      console.log('[CareerEngine] ✅ Fetched', dbOpportunities.length, 'opportunities from DB');
    }
  } catch (err) {
    console.error('[CareerEngine] Failed to fetch opportunities:', err.message);
  }

  // ─── Step 3: Generate AI Opportunities (fallback or supplement) ────────────
  sendStep('opportunity_matching', 'Discovering opportunities tailored to your profile...', 75);

  let aiOpportunities = [];

  // Always generate AI opportunities to ensure we have coverage across all categories
  // This also supplements sparse DB results
  const shouldGenerateAI = dbOpportunities.length < 10;

  if (shouldGenerateAI) {
    try {
      console.log('[CareerEngine] Generating AI opportunities (DB had', dbOpportunities.length, 'results)');
      const genPrompt = buildOpportunityGenerationPrompt({
        ...profile,
        domainFit: careerData.domainFit,
      });
      const genResult = await generateContent(genPrompt, true, userId);

      if (genResult && Array.isArray(genResult.opportunities)) {
        aiOpportunities = genResult.opportunities.map((opp, idx) => ({
          ...opp,
          id: opp.id || `ai-gen-${Date.now()}-${idx}`,
          // Normalize category to array
          category: Array.isArray(opp.category) ? opp.category : [opp.category || 'job'],
          isAIGenerated: true,
        }));
        console.log('[CareerEngine] ✅ Generated', aiOpportunities.length, 'AI opportunities');
      }
    } catch (err) {
      console.error('[CareerEngine] AI opportunity generation failed:', err.message);
    }
  }

  // ─── Step 4: Match DB Opportunities ────────────────────────────────────────
  let mergedOpportunities = [];

  if (dbOpportunities.length > 0) {
    try {
      const profileSummary = {
        name: profile.name,
        experienceLevel: profile.experienceLevel || profile.experience_level,
        skills: profile.skills,
        summary: profile.summary,
        domainFit: careerData.domainFit,
        preferredDomains: profile.preferredDomains,
      };

      const matchPrompt = buildOpportunityMatchPrompt(profileSummary, dbOpportunities);
      const matchResult = await generateContent(matchPrompt, true, userId);

      const matchMap = {};
      if (matchResult && Array.isArray(matchResult.matches)) {
        for (const m of matchResult.matches) {
          if (m.opportunityId) {
            matchMap[m.opportunityId] = m;
          }
        }
      }

      const dbMatched = dbOpportunities.map((opp) => {
        const match = matchMap[opp.id] || {};
        return {
          ...opp,
          matchScore: match.matchScore ?? 50,
          matchExplanation: match.matchExplanation ?? '',
          skillGap: match.skillGap ?? [],
        };
      });

      mergedOpportunities = [...dbMatched];
      console.log('[CareerEngine] ✅ DB opportunity matching complete');
    } catch (err) {
      console.error('[CareerEngine] DB opportunity matching failed:', err.message);
      mergedOpportunities = dbOpportunities.map((opp) => ({
        ...opp,
        matchScore: 50,
        matchExplanation: '',
        skillGap: [],
      }));
    }
  }

  // Merge AI-generated opportunities (they already have matchScore from prompt)
  if (aiOpportunities.length > 0) {
    mergedOpportunities = [...mergedOpportunities, ...aiOpportunities];
  }

  // Sort by matchScore descending
  mergedOpportunities.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

  // Deduplicate by title+organization to prevent duplicates
  const seen = new Set();
  mergedOpportunities = mergedOpportunities.filter((opp) => {
    const key = `${(opp.title || '').toLowerCase()}_${(opp.organization || '').toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  console.log('[CareerEngine] ✅ Total merged opportunities:', mergedOpportunities.length);

  // ─── Step 5: Save to Supabase ───────────────────────────────────────────────
  sendStep('saving', 'Saving your intelligence report...', 88);

  try {
    const { error: upsertError } = await supabase
      .from('oia_career_analysis')
      .upsert(
        {
          user_id: userId,
          resume_score: careerData.resumeScore || 0,
          employability_score: careerData.employabilityScore || 0,
          career_readiness_score: careerData.careerReadinessScore || 0,
          domain_fit: careerData.domainFit || 'Technology',
          experience_level: profile.experience_level || profile.experienceLevel,
          strengths: Array.isArray(careerData.strengths) ? careerData.strengths : [],
          improvement_areas: Array.isArray(careerData.improvementAreas) ? careerData.improvementAreas : [],
          recommended_roles: Array.isArray(careerData.recommendedRoles) ? careerData.recommendedRoles : [],
          skill_gaps: Array.isArray(careerData.skillGaps) ? careerData.skillGaps : [],
          plan_30_days: Array.isArray(careerData.plan30Days) ? careerData.plan30Days : [],
          plan_90_days: Array.isArray(careerData.plan90Days) ? careerData.plan90Days : [],
          plan_180_days: Array.isArray(careerData.plan180Days) ? careerData.plan180Days : [],
          ai_narrative: careerData.aiNarrative || '',
          opportunity_matches: mergedOpportunities.slice(0, 20),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

    if (upsertError) {
      console.error('[CareerEngine] Failed to upsert oia_career_analysis:', upsertError.message);
    } else {
      console.log('[CareerEngine] ✅ Career analysis saved for user:', userId);
    }
  } catch (err) {
    console.error('[CareerEngine] DB save threw an exception:', err.message);
  }

  // ─── Step 6: Complete ────────────────────────────────────────────────────────
  sendStep('complete_intelligence', 'Career intelligence ready!', 95);

  return { careerData, opportunityMatches: mergedOpportunities };
}

module.exports = { runCareerIntelligencePipeline };
