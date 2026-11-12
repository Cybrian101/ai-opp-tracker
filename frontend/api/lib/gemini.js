'use strict';

const { GoogleGenerativeAI } = require('@google/generative-ai');

const defaultApiKey = process.env.GEMINI_API_KEY || null;

// Two model tiers, each an ordered list of models to try.
//   quality: the full flash model first for the few reasoning-heavy outputs (analysis, career paths, JD comparison)
//   fast:    the lite model for everything else (it has a far larger free daily allowance and answers in seconds)
// If a model is retired (404) or out of quota (429), we fall through to the next one instead of failing.
const FAST_MODEL = process.env.GEMINI_FAST_MODEL || 'gemini-3.5-flash-lite';
const MODELS = {
  quality: [process.env.GEMINI_MODEL || 'gemini-2.5-flash', FAST_MODEL],
  fast: [FAST_MODEL, 'gemini-flash-lite-latest'],
};

// Only 2.5-series models accept thinkingBudget; newer models reject it with "invalid argument".
const supportsThinkingBudget = (name) => /^gemini-2.5/.test(name);
const isRetiredModelError = (msg) => /404|no longer available|not found|is not supported/i.test(msg);
const isQuotaError = (msg) => /quota|resource_exhausted|429/i.test(msg) && !/503|overloaded|high demand/i.test(msg);

// Remember models that just ran out of quota so later requests skip them instead of failing slowly first.
const exhaustedUntil = new Map();
const EXHAUSTED_MS = 10 * 60 * 1000;
const available = (name) => (exhaustedUntil.get(name) || 0) <= Date.now();

const MAX_ATTEMPTS = 3;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function callGemini(genAI, modelName, prompt, jsonMode, { thinkingBudget, maxOutputTokens }) {
  const generationConfig = jsonMode ? { responseMimeType: 'application/json' } : {};
  // Structured-output calls rarely need Gemini's slow "thinking" phase; pass 0 to skip it.
  if (thinkingBudget !== undefined && supportsThinkingBudget(modelName)) generationConfig.thinkingConfig = { thinkingBudget };
  // A generous cap that only exists to stop a runaway response from burning tokens.
  if (maxOutputTokens) generationConfig.maxOutputTokens = maxOutputTokens;
  generationConfig.temperature = 0.4; // consistent, factual output; creativity is not what these prompts need

  const model = genAI.getGenerativeModel({ model: modelName, generationConfig });
  const result = await model.generateContent(prompt);
  const text = result.response.text();

  if (!jsonMode) return text;

  try {
    return JSON.parse(text);
  } catch (parseErr) {
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch && jsonMatch[1]) {
      return JSON.parse(jsonMatch[1].trim());
    }
    throw new Error(`Failed to parse Gemini JSON response: ${parseErr.message}`);
  }
}

/**
 * Tries the platform's default key first, then falls back to a user-supplied key
 * (used only for this single call — never stored or logged).
 * options: { tier: 'quality'|'fast', thinkingBudget, maxOutputTokens }
 */
async function generateContent(prompt, jsonMode = true, userApiKey = null, options = {}) {
  const opts = { tier: 'quality', ...options };
  const keysToTry = [];
  if (defaultApiKey) keysToTry.push({ key: defaultApiKey, isDefault: true });
  if (userApiKey && userApiKey !== defaultApiKey) keysToTry.push({ key: userApiKey, isDefault: false });

  if (keysToTry.length === 0) {
    throw new Error('No Gemini API key available. Please provide your own key.');
  }

  let lastErr;
  for (const { key } of keysToTry) {
    const genAI = new GoogleGenerativeAI(key);
    const all = MODELS[opts.tier] || MODELS.quality;
    const names = all.filter(available).length ? all.filter(available) : all;
    let modelIdx = 0;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        return await callGemini(genAI, names[modelIdx], prompt, jsonMode, opts);
      } catch (err) {
        lastErr = err;
        const msg = err.message || '';
        const retired = isRetiredModelError(msg);
        const quota = !retired && isQuotaError(msg);
        if ((retired || quota) && modelIdx < names.length - 1) {
          if (quota) exhaustedUntil.set(names[modelIdx], Date.now() + EXHAUSTED_MS);
          modelIdx += 1; // retired or out of quota: fall through to the next model right away
          attempt -= 1;
          continue;
        }
        // Free-tier 503 "high demand" and per-minute 429s are transient: back off and retry.
        const isTransient = /503|overloaded|high demand|unavailable|429|rate limit|per ?minute/i.test(msg) && !/per ?day/i.test(msg);
        const isKeyIssue = !isTransient && /API key not valid|quota|permission|API_KEY_INVALID/i.test(msg);
        if (isKeyIssue) break; // don't retry this key — move to the next one (if any)
        if (attempt < MAX_ATTEMPTS) await sleep((isTransient ? 2500 : 800) * attempt);
      }
    }
  }

  throw lastErr;
}

module.exports = { generateContent, MODELS };
