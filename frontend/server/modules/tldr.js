'use strict';

const { languageDirective, GROUNDING_RULES, str, arr, strArr, clamp, oneOf, stripForeignScripts } = require('./shared');

// TLDR: a very short, warm summary of the whole report, so the user need not read every section.
// Small on purpose: only the key report facts go in, and a few short lines come out.

// Where each point can be read in more detail (the UI scrolls to it or opens the tab).
const SECTIONS = ['overview', 'intelligence', 'roles', 'opportunities', 'gaps', 'roadmap', 'narrative', 'dna', 'multiverse', 'skillmap', 'jdlab', 'plan', 'builder', 'comeback'];

const TONES = {
  celebrate: 'Open with genuine, happy congratulations and name one specific strength. Then be honest and brief about what is still worth polishing.',
  steady: 'Open warmly and encouragingly: they have a solid base, and you name one specific strength. Then be honest and practical.',
  support: 'Open with kind emotional support: acknowledge that a report like this can feel discouraging, and that many strong careers start from here. Mention one real strength. No false promises and no "but". Then give practical, gentle steps.',
};

/** The tone follows the scores, decided by code, so the model cannot pick a mood that does not fit the numbers. */
function toneFor(analysis) {
  const scores = ['resumeScore', 'employabilityScore', 'careerReadinessScore'].map((k) => Number(analysis?.[k])).filter(Number.isFinite);
  if (!scores.length) return { tone: 'steady', average: null };
  const average = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  return { tone: average >= 70 ? 'celebrate' : average >= 50 ? 'steady' : 'support', average };
}

function validateInput(input, ctx = {}) {
  return toneFor(ctx.analysis);
}

function buildPrompt({ profile, analysis, input, language }) {
  const a = analysis || {};
  const list = (v, n) => strArr(v, n).join('; ') || 'none';
  const gaps = arr(a.skillGaps).map((g) => g.skill).filter(Boolean).slice(0, 4).join(', ') || 'none';
  const roles = arr(a.recommendedRoles).map((r) => r.role).filter(Boolean).slice(0, 3).join(', ') || 'none';
  return `You write a very short "TLDR" for someone who has just received a long career report, so they do not have to read every section.

CANDIDATE: ${str(profile?.name, 'the candidate')} (${str(profile?.experienceLevel, 'fresher')})
REPORT FACTS (use only these):
Scores out of 100: resume ${a.resumeScore ?? 'n/a'}, employability ${a.employabilityScore ?? 'n/a'}, career readiness ${a.careerReadinessScore ?? 'n/a'}${input.average !== null ? ` (average ${input.average})` : ''}
Best-fit field: ${str(a.domainFit, 'n/a')}
Strengths: ${list(a.strengths, 3)}
To improve: ${list(a.improvementAreas, 4)}
Skill gaps: ${gaps}
Roles that fit: ${roles}

TONE: ${TONES[input.tone]}

${GROUNDING_RULES}
${languageDirective(language)}

Return JSON with EXACTLY this shape:
{
  "opener": "1-2 short sentences in the tone above",
  "missing": [ { "point": "something important that is missing", "section": "where to read more" } ],
  "improve": [ { "point": "what would improve the report most", "section": "where to read more" } ],
  "next": [ { "point": "one concrete action to take now", "section": "where to read more" } ],
  "pursue": [ { "point": "a direction or role worth pursuing, and why in a few words", "section": "where to read more" } ]
}

RULES:
- "section" must be one of: ${SECTIONS.join(', ')}. Pick the section that best explains the point (gaps = skill gaps, intelligence = strengths and areas to improve, roles = recommended roles, roadmap = 30/90/180-day plan, skillmap = the skill map, plan = the 90-day plan, multiverse = career paths, jdlab = checking a specific job).
- Speak to the reader directly as "you", never in the third person.
- The opener must not quote any score number and must not use the full name (the first name at most once).
- Each point is at most 14 words, in plain everyday words. At most 3 points in each list. No markdown, no emojis, no repeating the same idea twice.
- Use only the facts above. Do not invent scores, skills or experience.`;
}

function points(list, lang, max = 3) {
  return arr(list)
    .map((p) => ({ point: stripForeignScripts(str(p?.point), lang).slice(0, 140), section: oneOf(p?.section, SECTIONS, '') }))
    .filter((p) => p.point)
    .slice(0, max);
}

function normalize(raw, ctx = {}) {
  const r = raw || {};
  return {
    // The mood comes from the scores (see toneFor), never from the model.
    tone: oneOf(ctx.input?.tone, Object.keys(TONES), 'steady'),
    average: clamp(ctx.input?.average, 0, 100, 0),
    opener: stripForeignScripts(str(r.opener), ctx.language).slice(0, 280),
    missing: points(r.missing, ctx.language),
    improve: points(r.improve, ctx.language),
    next: points(r.next, ctx.language),
    pursue: points(r.pursue, ctx.language),
  };
}

module.exports = { id: 'tldr', label: 'TLDR', validateInput, buildPrompt, normalize, toneFor, SECTIONS };
