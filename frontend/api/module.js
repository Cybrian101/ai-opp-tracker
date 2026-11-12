'use strict';

const { generateContent } = require('./lib/gemini');
const { checkRateLimit } = require('./lib/rateLimit');
const { registry } = require('../server/modules/registry');
const { LANGUAGES } = require('../server/modules/shared');

const MODULE_RATE_MAX = parseInt(process.env.RATE_LIMIT_MODULE_MAX || '40', 10);
const MAX_JSON_CHARS = 60000;

function getClientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (fwd) return String(fwd).split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

/**
 * Orchestrator endpoint: POST { module, profile, analysis, input?, language?, apiKey? }.
 * Looks the module up in the registry, builds its prompt, calls Gemini and returns schema-safe JSON.
 * Nothing is stored; the client passes the profile it already holds.
 */
module.exports = async (req, res) => {
  // The browser extension calls this endpoint from its own origin. No cookies or credentials are involved.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { module: moduleId, profile, analysis, input, language, apiKey } = req.body || {};
  const mod = typeof moduleId === 'string' ? registry[moduleId] : null;
  if (!mod) {
    res.status(400).json({ error: 'Unknown module.' });
    return;
  }
  if (!profile || typeof profile !== 'object') {
    res.status(400).json({ error: 'Analyze a resume first.' });
    return;
  }
  if (JSON.stringify(profile).length + JSON.stringify(analysis || {}).length > MAX_JSON_CHARS) {
    res.status(400).json({ error: 'Profile data is too large.' });
    return;
  }

  let cleanInput = input || {};
  if (mod.validateInput) {
    try {
      cleanInput = mod.validateInput(input, { profile, analysis });
    } catch (err) {
      res.status(err.status || 400).json({ error: err.message });
      return;
    }
  }

  const userKey = typeof apiKey === 'string' && apiKey.trim() ? apiKey.trim() : null;
  const lang = typeof language === 'string' && LANGUAGES[language] ? language : 'en';

  const rl = await checkRateLimit(getClientIp(req), { bucket: 'module', max: MODULE_RATE_MAX });
  if (!rl.allowed) {
    res.status(429).json({
      error: `Daily limit reached for this network (${rl.max} module runs). Add your own free Gemini API key to keep going.`,
    });
    return;
  }

  try {
    const prompt = mod.buildPrompt({ profile, analysis: analysis || {}, input: cleanInput, language: lang });
    const raw = await generateContent(prompt, true, userKey, {
      tier: mod.tier,
      maxOutputTokens: mod.maxOutputTokens,
      thinkingBudget: 0,
    });
    res.status(200).json({ module: mod.id, language: lang, data: mod.normalize(raw, { input: cleanInput, language: lang }) });
  } catch (err) {
    const isKeyIssue = /No Gemini API key|API key not valid|quota|permission/i.test(err.message || '');
    res.status(isKeyIssue ? 429 : 500).json({
      error: isKeyIssue
        ? 'The shared Gemini quota is exhausted right now. Add your own free Gemini API key and try again.'
        : `This module could not complete: ${err.message || 'unknown error'}`,
    });
  }
};
