'use strict';

const {
  languageDirective,
  GROUNDING_RULES,
  buildCandidateBrief,
  str,
  arr,
  strArr,
  clamp,
  oneOf,
} = require('./shared');

// Returning to work: honest framing of a career break, caregiving/household experience translated into
// professional language, and a refresher list. The 13-week roadmap itself comes from the simulator module.

const FIELDS = ['engineering', 'teaching', 'other'];
const FLEX = ['remote', 'part-time', 'school-hours', 'flexible-start'];

function validateInput(input) {
  const breakMonths = clamp(input?.breakMonths, 1, 240, NaN);
  if (!Number.isFinite(breakMonths)) {
    throw Object.assign(new Error('Tell us roughly how long your break was.'), { status: 400 });
  }
  return {
    breakMonths,
    activities: str(input?.activities).slice(0, 1500),
    hoursPerWeek: clamp(input?.hoursPerWeek, 1, 60, 10),
    flexibility: strArr(input?.flexibility, 6).filter((f) => FLEX.includes(f)),
    field: oneOf(input?.field, FIELDS, 'engineering'),
  };
}

function buildPrompt({ profile, analysis, input, language }) {
  // The form answers are the candidate's own; pass them through the same brief used by every module.
  const withBreak = { ...profile, comeback: input };
  const hasActivities = input.activities.length > 0;
  return `You are a warm, direct career coach helping someone return to work after a career break. The break was ${input.breakMonths} months and they are targeting the field "${input.field}". They can work about ${input.hoursPerWeek} hours per week.

CANDIDATE BRIEF:
${buildCandidateBrief(withBreak, analysis)}

${GROUNDING_RULES}
- Never advise hiding or lying about the break. Help the candidate explain it with confidence and brevity.
- "transferable" may only translate activities the candidate wrote in their own words. ${hasActivities ? '' : 'They wrote nothing, so return an empty array for "transferable".'}
- "refresh" is about what has likely changed in the field since they left. It is an ESTIMATE from general knowledge: say so in "confidence", never cite statistics, and keep each refresher small and time-boxed to fit their hours.
- The confidence note must cite something concrete from the resume, not generic praise.
${languageDirective(language)}

Return JSON with EXACTLY this shape:
{
  "gapFraming": { "lines": ["a one-sentence honest way to explain the break"], "interviewAnswer": "a 3-4 sentence spoken answer to 'Tell me about your career break', first person, positive but truthful" },
  "transferable": [ { "activity": "what they did, in their words", "competency": "the professional competency it demonstrates", "resumeBullet": "a ready-to-use resume bullet, with no invented numbers" } ],
  "refresh": [ { "area": "skill, tool or practice", "whatMayHaveChanged": "what has likely moved on", "confidence": "low|medium|high", "refresher": "a concrete, time-boxed step", "hours": 0 } ],
  "confidenceNote": "2-3 sentences of concrete, evidence-based encouragement"
}

RULES: gapFraming.lines: 2-3 items. refresh: 3-5 items, ordered by importance, hours 1-20 each. transferable: up to 5 items.`;
}

// Words of 4+ letters, lowercased, to check that a "transferable" item really comes from what the user wrote.
const words = (t) => new Set(String(t || '').toLowerCase().match(/[a-z]{4,}/g) || []);

function normalize(raw, ctx = {}) {
  const r = raw || {};
  const written = words(ctx.input?.activities);
  return {
    gapFraming: {
      lines: strArr(r.gapFraming?.lines, 4),
      interviewAnswer: str(r.gapFraming?.interviewAnswer),
    },
    transferable: arr(r.transferable)
      .map((t) => ({
        activity: str(t.activity),
        competency: str(t.competency),
        resumeBullet: str(t.resumeBullet),
      }))
      .filter((t) => t.activity && t.competency)
      // Keep only items traceable to the candidate's own words about the break (no resume experience, no invention).
      .filter((t) => [...words(t.activity)].some((w) => written.has(w)))
      .slice(0, 5),
    refresh: arr(r.refresh)
      .map((x) => ({
        area: str(x.area),
        whatMayHaveChanged: str(x.whatMayHaveChanged),
        confidence: oneOf(x.confidence, ['low', 'medium', 'high'], 'low'),
        refresher: str(x.refresher),
        hours: clamp(x.hours, 1, 40, 4),
      }))
      .filter((x) => x.area)
      .slice(0, 6),
    confidenceNote: str(r.confidenceNote),
  };
}

module.exports = { id: 'comeback', label: 'Returning to work', validateInput, buildPrompt, normalize };
