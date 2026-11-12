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

// Experience Builder: turns a missing skill into a concrete portfolio project with milestones.

function validateInput(input) {
  const skill = str(input?.skill).slice(0, 120);
  if (!skill) throw Object.assign(new Error('Choose or type a skill to build a project for.'), { status: 400 });
  return { skill, targetRole: str(input?.targetRole).slice(0, 120) };
}

function buildPrompt({ profile, analysis, input, language }) {
  return `You are a senior engineer mentoring a candidate. Design ONE portfolio project that proves the skill "${input.skill}"${input.targetRole ? ` for a "${input.targetRole}" role` : ''}, building on what the candidate already knows.

CANDIDATE BRIEF:
${buildCandidateBrief(profile, analysis)}

${GROUNDING_RULES}
- Reuse technologies the candidate already has where sensible, so the project is achievable.
- Scope it to be finishable by one person in 2-4 weeks. Use only free tools and free tiers.
${languageDirective(language)}

Return JSON with EXACTLY this shape:
{
  "title": "project name",
  "pitch": "2 sentences a recruiter would find compelling",
  "skillsProven": ["skills this project demonstrates"],
  "techStack": ["tool"],
  "difficulty": "starter|intermediate|advanced",
  "estimatedHours": 0,
  "architecture": ["step-by-step description of how the pieces fit together, 4-6 items"],
  "milestones": [ { "week": 1, "title": "milestone", "tasks": ["task"], "deliverable": "what exists at the end" } ],
  "evaluationCriteria": ["how a reviewer would judge it, measurable"],
  "stretchGoals": ["optional extension"],
  "resumeBullet": "a resume bullet to use once it is done, with placeholders like [N] for metrics the candidate must measure themselves",
  "readmeOutline": ["README section headings"]
}

RULES: 3-4 milestones, each with 3-5 tasks. evaluationCriteria: 3-5 items.`;
}

function normalize(raw) {
  const r = raw || {};
  return {
    title: str(r.title, 'Portfolio project'),
    pitch: str(r.pitch),
    skillsProven: strArr(r.skillsProven, 8),
    techStack: strArr(r.techStack, 10),
    difficulty: oneOf(r.difficulty, ['starter', 'intermediate', 'advanced'], 'intermediate'),
    estimatedHours: clamp(r.estimatedHours, 1, 400, 30),
    architecture: strArr(r.architecture, 8),
    milestones: arr(r.milestones)
      .map((m, i) => ({
        week: clamp(m.week, 1, 12, i + 1),
        title: str(m.title),
        tasks: strArr(m.tasks, 6),
        deliverable: str(m.deliverable),
      }))
      .filter((m) => m.title)
      .slice(0, 5),
    evaluationCriteria: strArr(r.evaluationCriteria, 6),
    stretchGoals: strArr(r.stretchGoals, 4),
    resumeBullet: str(r.resumeBullet),
    readmeOutline: strArr(r.readmeOutline, 10),
  };
}

module.exports = { id: 'builder', label: 'Experience Builder', validateInput, buildPrompt, normalize };
