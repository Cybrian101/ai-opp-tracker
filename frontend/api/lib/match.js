'use strict';

// Deterministic opportunity matching: no model call, no tokens, same input always gives the same answer.
// It scores tag/skill overlap, category fit for the candidate's level, and eligibility wording.

const ALIASES = {
  js: 'javascript',
  ts: 'typescript',
  'node.js': 'node',
  nodejs: 'node',
  py: 'python',
  ml: 'machine learning',
  ai: 'artificial intelligence',
  k8s: 'kubernetes',
  'react.js': 'react',
  reactjs: 'react',
  postgres: 'postgresql',
  'c++': 'cpp',
  'c#': 'csharp',
  golang: 'go',
};

// Tags that describe a programme rather than a skill count for less.
const GENERIC_TAGS = new Set([
  'programming', 'mentorship', 'community', 'research', 'career', 'students', 'learning', 'networking',
  'startup', 'remote', 'internship', 'fellowship', 'scholarship', 'women in tech', 'competition', 'job search', 'full-time',
  'equity', 'remote work', 'big tech', 'exchange', 'publishing', 'career growth', 'graduate study', 'diversity', 'india',
  'hackathon', 'student', 'teamwork', 'prototyping',
]);

// Opportunity tags are mostly fields ("backend", "data science"), not skills. This maps each field to the
// concrete skills/tools that evidence it, so a Pandas user matches "data science" without the model guessing.
const CONCEPTS = {
  'software engineering': ['python', 'java', 'javascript', 'typescript', 'cpp', 'csharp', 'go', 'rust', 'kotlin', 'swift', 'backend', 'frontend', 'full stack', 'software'],
  'software development engineer': ['python', 'java', 'cpp', 'csharp', 'go', 'backend', 'software'],
  backend: ['flask', 'django', 'spring', 'spring boot', 'node', 'express', 'fastapi', 'rest', 'api', 'java', 'sql', 'backend'],
  web: ['html', 'css', 'javascript', 'typescript', 'react', 'angular', 'vue', 'flask', 'django', 'node', 'web'],
  'data science': ['pandas', 'numpy', 'sql', 'data analysis', 'data analytics', 'statistics', 'tableau', 'power bi', 'scikit-learn', 'data science'],
  'machine learning': ['machine learning', 'scikit-learn', 'tensorflow', 'pytorch', 'deep learning', 'artificial intelligence', 'nlp'],
  cloud: ['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'cloud', 'terraform'],
  'cloud native': ['kubernetes', 'docker', 'helm', 'cloud'],
  linux: ['linux', 'bash', 'shell', 'unix'],
  'open source': ['git', 'github', 'open source'],
  git: ['git', 'github'],
  design: ['figma', 'ui', 'ux', 'design', 'sketch'],
  documentation: ['technical writing', 'documentation', 'writing'],
  teamwork: ['team leadership', 'leadership', 'teamwork', 'collaboration'],
  prototyping: ['flask', 'react', 'python', 'figma'],
  research: ['research', 'statistics', 'machine learning', 'publication'],
};

const FRESH_LEVELS = new Set(['fresher', 'junior']);

// Most years of experience a listing may ask for before it is above the candidate's level (senior has no cap).
const MAX_ASK = { fresher: 1, junior: 3, mid: 6 };

function norm(s) {
  const t = String(s || '').toLowerCase().trim().replace(/[^a-z0-9+#.\s/-]/g, ' ').replace(/\s+/g, ' ').trim();
  return ALIASES[t] || t;
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hasTerm(hay, term) {
  if (!term) return false;
  return new RegExp(`(^|[^a-z0-9+#])${escapeRe(term)}([^a-z0-9+#]|$)`).test(hay);
}

/** Everything we know about what the candidate can do or cares about, as one searchable string. */
function candidateHaystack(profile = {}, analysis = {}) {
  const parts = [];
  for (const s of profile.skills || []) parts.push(norm(typeof s === 'string' ? s : s.name));
  for (const p of profile.projects || []) {
    for (const t of p.technologies || []) parts.push(norm(t));
    parts.push(norm(p.domain));
  }
  for (const c of profile.certifications || []) parts.push(norm(c.name));
  for (const i of profile.interests || []) parts.push(norm(i));
  for (const d of profile.preferredDomains || []) parts.push(norm(d));
  parts.push(norm(analysis.domainFit));
  for (const r of analysis.recommendedRoles || []) parts.push(norm(r.role));
  return ` ${parts.filter(Boolean).join(' | ')} `;
}

function isStudentLike(profile) {
  const year = Number(profile.graduationYear);
  return profile.experienceLevel === 'fresher' || (Number.isFinite(year) && year >= new Date().getFullYear() - 1);
}

function scoreOpportunity(opp, profile, analysis, hay) {
  const tags = (opp.tags || []).map(norm).filter(Boolean);
  const matched = []; // [{ tag, via }]: via is the candidate-side term that evidences the tag
  let skillPoints = 0;
  for (const tag of tags) {
    let via = hasTerm(hay, tag) ? tag : (CONCEPTS[tag] || []).find((term) => hasTerm(hay, term));
    if (!via) continue;
    // Weak, generic evidence (e.g. a lone "git") counts less than a field-level match.
    const generic = GENERIC_TAGS.has(tag) || tag === 'git' || tag === 'open source';
    matched.push({ tag, via, generic });
    skillPoints += generic ? 5 : 16;
  }
  skillPoints = Math.min(skillPoints, 56);

  const level = profile.experienceLevel || 'fresher';
  const cats = Array.isArray(opp.category) ? opp.category : [opp.category];
  let categoryFit = 0;
  if (FRESH_LEVELS.has(level)) {
    if (cats.includes('internship')) categoryFit += 8;
    if (cats.includes('fellowship')) categoryFit += 5;
    if (cats.includes('hackathon') || cats.includes('open_source')) categoryFit += 4;
    if (cats.includes('job')) categoryFit += 1;
  } else {
    if (cats.includes('job')) categoryFit += 10;
    if (cats.includes('fellowship') || cats.includes('community')) categoryFit += 3;
    if (cats.includes('internship')) categoryFit -= 6;
  }

  const eligibility = String(opp.eligibility || '').toLowerCase();
  let eligibilityFit = 0;
  let note = '';
  if (/(student|undergrad|enrolled|university)/.test(eligibility)) {
    if (isStudentLike(profile)) eligibilityFit += 5;
    else {
      eligibilityFit -= 22;
      note = 'Aimed at students, so you may not be eligible.';
    }
  }
  if (/(beginner|new to|first)/.test(eligibility) && FRESH_LEVELS.has(level)) eligibilityFit += 4;

  // Listings that state the experience they want (min_years) are compared with the candidate's level.
  // A "Senior", "Lead" or "Staff" title with no stated years is treated as asking for about five.
  const asked = Number.isFinite(opp.min_years) ? opp.min_years : /\b(senior|sr\.?|lead|staff|principal)\b/i.test(opp.title || '') ? 5 : null;
  const cap = MAX_ASK[level];
  let levelFit = 0;
  let aboveLevel = false;
  if (asked !== null && cap !== undefined && asked > cap) {
    levelFit -= 30;
    aboveLevel = true;
    note = note || `Asks for ${asked}+ years, above your level.`;
  } else if (asked !== null && level === 'senior' && asked <= 2) {
    levelFit -= 15;
  }

  const score = Math.max(15, Math.min(95, Math.round(28 + skillPoints + categoryFit + eligibilityFit + levelFit)));
  return { score, matched, note, aboveLevel };
}

/**
 * Returns every opportunity with matchScore (0-100), a one-line matchExplanation built from real overlaps,
 * and skillGap listing the candidate's known gaps that this opportunity also mentions.
 */
function matchOpportunities(profile, analysis, opportunities) {
  const hay = candidateHaystack(profile, analysis);
  const gaps = (analysis.skillGaps || []).map((g) => norm(g.skill)).filter(Boolean);

  return opportunities
    .map((opp) => {
      const { score, matched, note, aboveLevel } = scoreOpportunity(opp, profile, analysis, hay);
      const oppText = ` ${(opp.tags || []).map(norm).join(' | ')} ${norm(opp.summary)} `;
      const skillGap = gaps.filter((g) => hasTerm(oppText, g)).slice(0, 3);
      const specific = matched.filter((m) => !m.generic).slice(0, 2);
      let explanation;
      if (specific.length) {
        explanation = `Fits ${specific.map((m) => (m.tag === m.via ? m.tag : `${m.tag} (you list ${m.via})`)).join(' and ')}.`;
      } else if (matched.length) explanation = `Loosely related: you list ${matched[0].via}.`;
      else explanation = 'Open to your level, but there is no direct skill overlap yet.';
      if (note) explanation += ` ${note}`;
      return { ...opp, matchScore: score, matchExplanation: explanation, skillGap, aboveLevel };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
}

module.exports = { matchOpportunities, norm };
