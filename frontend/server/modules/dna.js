'use strict';

const {
  languageDirective,
  GROUNDING_RULES,
  buildCandidateBrief,
  str,
  arr,
  strArr,
  clamp,
} = require('./shared');

// Career DNA: professional identity, hidden potential, and translated informal experience
// (features: Career DNA Engine, Hidden Potential Detector, Invisible Experience Translator).

const RADAR_AXES = [
  'Technical depth',
  'Problem solving',
  'Communication',
  'Leadership',
  'Domain breadth',
  'Delivery',
];

function buildPrompt({ profile, analysis, language }) {
  return `You are a career psychologist and technical recruiter. Build this candidate's "Career DNA": a distinctive professional identity that goes beyond a list of skills.

CANDIDATE BRIEF:
${buildCandidateBrief(profile, analysis)}

${GROUNDING_RULES}
${languageDirective(language)}

Return JSON with EXACTLY this shape:
{
  "archetype": { "title": "2-4 word identity, e.g. 'The Data-Minded Builder'", "tagline": "one punchy sentence", "description": "2-3 sentences explaining why, citing evidence" },
  "superpower": "the single most distinctive strength, one sentence, with evidence",
  "workingStyle": [ { "trait": "short trait", "evidence": "what in the brief suggests it" } ],
  "hiddenPotentials": [ { "title": "capability or career direction the candidate may not realise they have", "evidence": "the specific project/skill combination that implies it", "whyItMatters": "why employers value it", "roles": ["role 1", "role 2"] } ],
  "transferableSkills": [ { "skill": "skill", "from": "where it was built", "appliesTo": "where else it helps" } ],
  "informalExperience": [ { "activity": "non-job activity visible in the brief (club role, volunteering, event, freelance, personal project, family business)", "professionalTranslation": "the professional competency it demonstrates", "resumeBullet": "a ready-to-use resume bullet, honest and quantified only if the brief gives numbers" } ],
  "blindSpots": [ { "risk": "honest weakness or risk", "fix": "concrete way to address it" } ],
  "radar": [ { "axis": "${RADAR_AXES[0]}", "score": 0 } ]
}

RULES:
- workingStyle: 3 items. hiddenPotentials: 3 items. transferableSkills: 3-5 items. blindSpots: 2-3 items.
- informalExperience: only activities actually present in the brief. If there are none, return an empty array.
- radar: exactly these 6 axes in order: ${RADAR_AXES.join(', ')}. Scores 0-100, realistic for the evidence and level (a fresher rarely exceeds 75 on Leadership).`;
}

function normalize(raw) {
  const r = raw || {};
  const radarByAxis = {};
  for (const item of arr(r.radar)) radarByAxis[str(item.axis)] = clamp(item.score, 0, 100, 40);
  return {
    archetype: {
      title: str(r.archetype?.title, 'Emerging Professional'),
      tagline: str(r.archetype?.tagline),
      description: str(r.archetype?.description),
    },
    superpower: str(r.superpower),
    workingStyle: arr(r.workingStyle)
      .map((w) => ({ trait: str(w.trait), evidence: str(w.evidence) }))
      .filter((w) => w.trait)
      .slice(0, 4),
    hiddenPotentials: arr(r.hiddenPotentials)
      .map((h) => ({
        title: str(h.title),
        evidence: str(h.evidence),
        whyItMatters: str(h.whyItMatters),
        roles: strArr(h.roles, 4),
      }))
      .filter((h) => h.title)
      .slice(0, 5),
    transferableSkills: arr(r.transferableSkills)
      .map((t) => ({ skill: str(t.skill), from: str(t.from), appliesTo: str(t.appliesTo) }))
      .filter((t) => t.skill)
      .slice(0, 6),
    informalExperience: arr(r.informalExperience)
      .map((i) => ({
        activity: str(i.activity),
        professionalTranslation: str(i.professionalTranslation),
        resumeBullet: str(i.resumeBullet),
      }))
      .filter((i) => i.activity)
      .slice(0, 5),
    blindSpots: arr(r.blindSpots)
      .map((b) => ({ risk: str(b.risk), fix: str(b.fix) }))
      .filter((b) => b.risk)
      .slice(0, 4),
    radar: RADAR_AXES.map((axis) => ({ axis, score: radarByAxis[axis] ?? 40 })),
  };
}

module.exports = { id: 'dna', label: 'Career DNA', buildPrompt, normalize };
