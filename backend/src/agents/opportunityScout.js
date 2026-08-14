'use strict';

async function scoutOpportunities(intent, supabaseClient) {
  try {
    console.log('[OpportunityScout] Scouting with intent:', JSON.stringify(intent, null, 2));

    let query = supabaseClient
      .from('opportunities')
      .select(
        `id, title, organization, category, country, city, deadline,
         eligibility, remote, application_url, source_url, tags, summary,
         description, remote_or_inperson, women_friendly, indian_eligible,
         student_eligible, recommendation_score, freshness_score, ai_confidence_score`
      );

    // Filter by categories (overlap with intent.categories)
    if (Array.isArray(intent.categories) && intent.categories.length > 0) {
      // category is a text ARRAY column — use overlap operator
      query = query.overlaps('category', intent.categories);
    }

    // Filter by remote preference
    if (intent.remote === true) {
      query = query.eq('remote', true);
    } else if (intent.remote === false) {
      query = query.eq('remote', false);
    }

    // Filter by location (country or city)
    if (intent.location && typeof intent.location === 'string') {
      const loc = intent.location.trim();
      query = query.or(`country.ilike.%${loc}%,city.ilike.%${loc}%`);
    }

    // Filter by keywords in title or summary
    if (Array.isArray(intent.keywords) && intent.keywords.length > 0) {
      // Build OR filter for all keywords across title and summary
      const keywordFilters = intent.keywords
        .slice(0, 5) // limit to first 5 keywords to avoid overly restrictive queries
        .map((kw) => `title.ilike.%${kw}%,summary.ilike.%${kw}%`)
        .join(',');
      query = query.or(keywordFilters);
    }

    // Order and limit
    query = query
      .order('recommendation_score', { ascending: false, nullsFirst: false })
      .order('freshness_score', { ascending: false, nullsFirst: false })
      .limit(30);

    const { data, error } = await query;

    if (error) {
      console.error('[OpportunityScout] Supabase query error:', error.message);
      return [];
    }

    console.log(`[OpportunityScout] Found ${data ? data.length : 0} opportunities`);
    return data || [];
  } catch (err) {
    console.error('[OpportunityScout] Unexpected error:', err.message);
    return [];
  }
}

module.exports = { scoutOpportunities };
