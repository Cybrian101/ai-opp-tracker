'use strict';

// Helpers shared by every module. A module is a small file that exports
// { id, label, inputSchema?, buildPrompt(ctx), normalize(raw, ctx) }; see registry.js.

const LANGUAGES = {
  en: 'English',
  ta: 'Tamil (தமிழ்)',
  hi: 'Hindi (हिन्दी)',
  kn: 'Kannada (ಕನ್ನಡ)',
};

function languageDirective(code) {
  const name = LANGUAGES[code] || LANGUAGES.en;
  if (!LANGUAGES[code] || code === 'en') return '';
  return `\nLANGUAGE: Write every human-readable string value in ${name}. Keep JSON keys, fixed enum values (such as "met", "have", "high"), numbers, and widely used technical terms / skill and product names in English. Use natural, simple ${name}, not a literal translation.`;
}

const GROUNDING_RULES = `GROUNDING RULES (very important):
- Base every claim on evidence in the candidate brief. Quote or reference the specific project, role, or skill that supports it.
- Never invent employers, degrees, certifications, achievements, salaries, or statistics. If the evidence is thin, say so plainly or return fewer items rather than padding.
- Be honest, not flattering. Name real weaknesses.
- Be respectful and non-patronising. Never assume the candidate's gender, family status, or the reason for any gap in their history. Address the candidate directly as "you" (or by name); never use he, she, him, her, his or hers for them. Do not give legal advice (including about disclosure or discrimination). The candidate decides what to share.
- Write plainly, like a person: no em dashes or en dashes (use commas, colons or full stops), no hype words, no filler openers.
- Return ONLY a JSON object, no commentary.`;

// Language models occasionally drop a word in the wrong script into another language's sentence (for example a Bengali
// word inside Tamil). Words containing letters from a script that does not belong are removed rather than shown.
const ALLOWED_SCRIPTS = { en: [], ta: ['Tamil'], hi: ['Devanagari'], kn: ['Kannada'] };
function stripForeignScripts(text, lang) {
  // Unknown language: leave the text untouched rather than risk deleting real words.
  if (!ALLOWED_SCRIPTS[lang]) return String(text || '').trim();
  const extra = (ALLOWED_SCRIPTS[lang] || []).map((name) => '\\p{Script=' + name + '}').join('');
  const allowed = new RegExp('^[\\p{Script=Latin}' + extra + '\\p{Script=Common}\\p{Script=Inherited}\\p{M}\\p{N}\\p{P}\\p{S}\\p{Z}]*$', 'u');
  return String(text || '')
    .split(/(\s+)/)
    .filter((token) => /^\s+$/.test(token) || allowed.test(token))
    .join('')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// Models like to write em and en dashes. Replace them with plain punctuation: a hyphen inside number ranges, a comma elsewhere.
function cleanDashes(text) {
  return String(text)
    .replace(/(\d)\s*[\u2013\u2014]\s*(\d)/g, '$1-$2')
    .replace(/\s*[\u2013\u2014]\s*/g, ', ')
    .replace(/^,\s*/, '');
}

function str(v, fallback = '') {
  return typeof v === 'string' ? cleanDashes(v.trim()) : fallback;
}

function arr(v) {
  return Array.isArray(v) ? v : [];
}

function strArr(v, max = 12) {
  return arr(v)
    .map((x) => (typeof x === 'string' ? x.trim() : ''))
    .filter(Boolean)
    .slice(0, max);
}

function clamp(n, lo, hi, fallback = lo) {
  const x = Number(n);
  if (!Number.isFinite(x)) return fallback;
  return Math.min(hi, Math.max(lo, Math.round(x)));
}

function oneOf(v, allowed, fallback) {
  return allowed.includes(v) ? v : fallback;
}

/** Compact, model-readable summary of everything we know about the candidate. */
function buildCandidateBrief(profile = {}, analysis = {}) {
  const skills = arr(profile.skills)
    .map((s) => (typeof s === 'string' ? s : `${s.name} (${s.level || 'n/a'})`))
    .join(', ');
  const projects = arr(profile.projects)
    .map(
      (p) =>
        `- ${p.title}: ${p.description || p.impact || ''} [${arr(p.technologies).join(', ')}]`
    )
    .join('\n');
  const experience = arr(profile.experience)
    .map((e) => `- ${e.role} @ ${e.company} (${e.duration || 'n/a'}): ${e.description || ''}`)
    .join('\n');
  const certs = arr(profile.certifications)
    .map((c) => `${c.name}${c.issuer ? ` (${c.issuer})` : ''}`)
    .join(', ');

  const lines = [
    `Name: ${profile.name || 'Candidate'}`,
    `Level: ${profile.experienceLevel || 'fresher'}`,
    `Education: ${profile.degree || 'n/a'}, ${profile.institution || 'n/a'} (${profile.graduationYear || 'n/a'})`,
    `Summary: ${profile.summary || 'n/a'}`,
    `Skills: ${skills || 'none listed'}`,
    `Projects:\n${projects || '(none)'}`,
    `Experience:\n${experience || '(none)'}`,
    `Certifications: ${certs || '(none)'}`,
    `Interests: ${strArr(profile.interests, 20).join(', ') || 'n/a'}`,
  ];

  // Present only after the candidate has chosen to fill in the Returning-to-work form.
  const cb = profile.comeback;
  if (cb && typeof cb === 'object') {
    lines.push(
      `Career break (candidate-provided): about ${clamp(cb.breakMonths, 0, 240, 0)} months. ` +
        `Available hours per week: ${clamp(cb.hoursPerWeek, 1, 60, 10)}. ` +
        `Flexibility needs: ${strArr(cb.flexibility, 6).join(', ') || 'none stated'}.` +
        (str(cb.activities) ? ` What they did during the break (their words): ${str(cb.activities).slice(0, 1500)}` : '')
    );
  }

  if (analysis && analysis.domainFit) {
    lines.push(`Best-fit domain (earlier analysis): ${analysis.domainFit}`);
    lines.push(`Known strengths: ${strArr(analysis.strengths).join(', ') || 'n/a'}`);
    lines.push(`Known weaknesses: ${strArr(analysis.improvementAreas).join(', ') || 'n/a'}`);
    lines.push(
      `Known skill gaps: ${arr(analysis.skillGaps)
        .map((g) => g.skill)
        .filter(Boolean)
        .join(', ') || 'n/a'}`
    );
  }
  return lines.join('\n');
}

module.exports = {
  LANGUAGES,
  languageDirective,
  GROUNDING_RULES,
  buildCandidateBrief,
  stripForeignScripts,
  cleanDashes,
  str,
  arr,
  strArr,
  clamp,
  oneOf,
};
