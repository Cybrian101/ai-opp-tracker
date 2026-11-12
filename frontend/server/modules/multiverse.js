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

// Career Multiverse + Future Me: several parallel career paths from the same starting point,
// each with a year-by-year timeline (features: Career Multiverse, Parallel Universes, Future Me).

function buildPrompt({ profile, analysis, language }) {
  const startYear = new Date().getFullYear();
  const years = [0, 1, 2, 3, 4].map((i) => startYear + i);
  return `You are a career strategist. From this ONE candidate, simulate four parallel career universes: three realistic paths plus one "wildcard" path that is unconventional but plausible.

CANDIDATE BRIEF:
${buildCandidateBrief(profile, analysis)}

${GROUNDING_RULES}
- Do NOT state salaries or invent market statistics. Describe seniority and scope instead.
- Timelines must be believable for the candidate's current level.
${languageDirective(language)}

Return JSON with EXACTLY this shape:
{
  "universes": [
    {
      "id": "u1",
      "role": "target role title",
      "kind": "realistic|stretch|wildcard",
      "tagline": "one evocative sentence",
      "fitScore": 0,
      "difficulty": "easy|moderate|hard",
      "monthsToFirstRole": 0,
      "whyYou": "why this path suits the candidate, citing evidence",
      "dayInLife": "2 sentences describing a typical working day in this role",
      "timeline": [ { "year": ${years[0]}, "title": "role or stage that year", "milestone": "what is achieved", "skillsGained": ["skill"] } ],
      "futureTitle": "title held in ${years[4]}",
      "risks": ["honest risk"],
      "firstStep": "the single concrete action to take this week",
      "upside": "best-case outcome",
      "downside": "worst-case / trade-off"
    }
  ]
}

RULES:
- Exactly 4 universes with ids u1..u4; order by fitScore descending, but the wildcard may sit anywhere.
- Timeline: exactly 5 entries, for years ${years.join(', ')}.
- fitScore 0-100 reflects current evidence, honestly. monthsToFirstRole is 0 only if the candidate is already in that role.
- Universes must differ meaningfully (different domain, employer type, or trajectory), not be minor title variants.`;
}

function normalize(raw) {
  const universes = arr(raw?.universes)
    .map((u, i) => ({
      id: str(u.id, `u${i + 1}`),
      role: str(u.role),
      kind: oneOf(u.kind, ['realistic', 'stretch', 'wildcard'], 'realistic'),
      tagline: str(u.tagline),
      fitScore: clamp(u.fitScore, 0, 100, 50),
      difficulty: oneOf(u.difficulty, ['easy', 'moderate', 'hard'], 'moderate'),
      monthsToFirstRole: clamp(u.monthsToFirstRole, 0, 120, 6),
      whyYou: str(u.whyYou),
      dayInLife: str(u.dayInLife),
      timeline: arr(u.timeline)
        .map((t) => ({
          year: clamp(t.year, 2000, 2100, new Date().getFullYear()),
          title: str(t.title),
          milestone: str(t.milestone),
          skillsGained: strArr(t.skillsGained, 5),
        }))
        .filter((t) => t.title)
        .slice(0, 6),
      futureTitle: str(u.futureTitle),
      risks: strArr(u.risks, 4),
      firstStep: str(u.firstStep),
      upside: str(u.upside),
      downside: str(u.downside),
    }))
    .filter((u) => u.role)
    .slice(0, 4);
  return { universes };
}

module.exports = { id: 'multiverse', label: 'Career Multiverse', buildPrompt, normalize };
