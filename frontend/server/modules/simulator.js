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

// 90-day simulator: a 13-week plan sized to the hours the candidate really has.
// Features: 90-Day Career Transformation Simulator; also the roadmap behind "Returning to work".

const FOCUS = ['job', 'skills', 'switch'];
const FOCUS_TEXT = {
  job: 'getting a job offer as soon as realistically possible',
  skills: 'building the skills and portfolio evidence they are missing, without rushing to apply',
  switch: 'switching into a new role or field',
};

function validateInput(input) {
  return {
    hoursPerWeek: clamp(input?.hoursPerWeek, 3, 40, 8),
    focus: oneOf(input?.focus, FOCUS, 'job'),
    targetRole: str(input?.targetRole).slice(0, 120),
  };
}

function buildPrompt({ profile, analysis, input, language }) {
  return `You are a career coach designing a realistic 13-week (90-day) plan. The candidate has ONLY ${input.hoursPerWeek} hours per week to spend, and their focus is ${FOCUS_TEXT[input.focus]}${input.targetRole ? `. Target role: "${input.targetRole}"` : ', targeting the best-fit role from their profile'}.

CANDIDATE BRIEF:
${buildCandidateBrief(profile, analysis)}

${GROUNDING_RULES}
- Respect the hour budget strictly: no week may exceed ${input.hoursPerWeek} hours, and early weeks should be lighter to build momentum.
- Prefer free resources and one finished, visible deliverable per week.
- Build on what the candidate already has; do not restart from zero.
${languageDirective(language)}

Return JSON with EXACTLY this shape:
{
  "summary": "2 sentences: what will be true at the end of 13 weeks",
  "weeks": [ { "week": 1, "theme": "short theme", "goals": ["specific task"], "deliverable": "what exists at the end of the week", "hours": 0, "checkpoint": "how to know it went well", "readiness": 0 } ],
  "risks": [ { "risk": "what could derail this plan", "mitigation": "what to do about it" } ]
}

RULES: exactly 13 weeks numbered 1-13; goals 2-4 per week; "readiness" is the estimated 0-100 chance the candidate is interview-ready for the target role at the end of that week, never decreasing and below 90; risks 2-3 items.`;
}

function normalize(raw, ctx = {}) {
  const budget = ctx.input?.hoursPerWeek ?? 40;
  const seen = new Set();
  let floor = 0;
  const weeks = arr(raw?.weeks)
    .map((w, i) => ({
      week: clamp(w.week, 1, 13, i + 1),
      theme: str(w.theme),
      goals: strArr(w.goals, 5),
      deliverable: str(w.deliverable),
      // Never let the model exceed the hours the candidate said they have.
      hours: Math.min(budget, clamp(w.hours, 0, 60, budget)),
      checkpoint: str(w.checkpoint),
      readiness: clamp(w.readiness, 0, 95, 0),
    }))
    .filter((w) => w.theme && !seen.has(w.week) && seen.add(w.week))
    .sort((a, b) => a.week - b.week)
    .map((w) => {
      floor = Math.max(floor, w.readiness);
      return { ...w, readiness: floor };
    });

  return {
    summary: str(raw?.summary),
    hoursPerWeek: budget,
    weeks,
    risks: arr(raw?.risks)
      .map((x) => ({ risk: str(x.risk), mitigation: str(x.mitigation) }))
      .filter((x) => x.risk)
      .slice(0, 4),
  };
}

module.exports = { id: 'simulator', label: '90-Day Plan', validateInput, buildPrompt, normalize };
