'use strict';

const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const { generateContent } = require('./lib/gemini');
const { buildResumeAnalysisPrompt, buildCareerAnalysisPrompt } = require('./lib/prompts');
const { matchOpportunities } = require('./lib/match');
const { curateOpportunities } = require('./lib/curate');
const { checkRateLimit } = require('./lib/rateLimit');
const { LANGUAGES } = require('../server/modules/shared');
const opportunities = require('./data/opportunities.json');

const PDF_MIME = 'application/pdf';
const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const MAX_FILE_BYTES = 3 * 1024 * 1024; // keep base64 body well under Vercel's request size limit

function sendSSE(res, type, data) {
  res.write(`data: ${JSON.stringify({ type, ...data })}\n\n`);
}

function getClientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (fwd) return String(fwd).split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

async function extractText(buffer, mimeType) {
  if (mimeType === PDF_MIME) {
    const data = await pdfParse(buffer);
    return data.text;
  }
  if (mimeType === DOCX_MIME) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }
  throw new Error('Unsupported file type. Please upload a PDF or DOCX resume.');
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { fileBase64, mimeType, apiKey, language } = req.body || {};
  const lang = typeof language === 'string' && LANGUAGES[language] ? language : 'en';

  if (!fileBase64 || !mimeType) {
    res.status(400).json({ error: 'No resume file provided' });
    return;
  }

  let buffer;
  try {
    buffer = Buffer.from(fileBase64, 'base64');
  } catch {
    res.status(400).json({ error: 'Invalid file data' });
    return;
  }

  if (buffer.length > MAX_FILE_BYTES) {
    res.status(400).json({ error: 'File too large. Please upload a resume under 3 MB.' });
    return;
  }

  const userKey = typeof apiKey === 'string' && apiKey.trim() ? apiKey.trim() : null;

  const ip = getClientIp(req);
  const rl = await checkRateLimit(ip);
  if (!rl.allowed) {
    res.status(429).json({
      error: `This tool has already been used from your network (limit: ${rl.max} use${rl.max === 1 ? '' : 's'} per day). If you have your own free Gemini API key, enter it above and try again.`,
    });
    return;
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  try {
    sendSSE(res, 'step', { stepId: 'upload', message: 'Resume received...', progress: 10 });

    let resumeText;
    try {
      resumeText = await extractText(buffer, mimeType);
    } catch (err) {
      sendSSE(res, 'error', { message: err.message });
      res.end();
      return;
    }

    if (!resumeText || resumeText.trim().length < 50) {
      sendSSE(res, 'error', { message: 'Could not extract enough text from this resume. Try a different file.' });
      res.end();
      return;
    }

    sendSSE(res, 'step', { stepId: 'analyzing', message: 'AI analyzing your resume...', progress: 30 });
    const profile = await generateContent(buildResumeAnalysisPrompt(resumeText), true, userKey, {
      tier: 'fast', // pure extraction: the lite model is accurate here and has the larger free allowance
      thinkingBudget: 0,
      maxOutputTokens: 4000,
    });
    profile.skills = Array.isArray(profile.skills) ? profile.skills : [];
    profile.projects = Array.isArray(profile.projects) ? profile.projects : [];
    profile.experience = Array.isArray(profile.experience) ? profile.experience : [];
    profile.certifications = Array.isArray(profile.certifications) ? profile.certifications : [];
    profile.interests = Array.isArray(profile.interests) ? profile.interests : [];
    profile.preferredDomains = Array.isArray(profile.preferredDomains) ? profile.preferredDomains : [];

    sendSSE(res, 'step', {
      stepId: 'career_analysis',
      message: 'Scoring your resume and finding improvement areas...',
      progress: 55,
    });
    let careerData;
    try {
      careerData = await generateContent(buildCareerAnalysisPrompt(profile, lang), true, userKey, {
        tier: 'quality',
        thinkingBudget: 512,
        maxOutputTokens: 4000,
      });
    } catch (err) {
      careerData = {
        resumeScore: 0,
        employabilityScore: 0,
        careerReadinessScore: 0,
        domainFit: 'Technology',
        strengths: [],
        improvementAreas: [],
        recommendedRoles: [],
        skillGaps: [],
        plan30Days: [],
        plan90Days: [],
        plan180Days: [],
        aiNarrative: 'Career analysis could not be completed this time. Please try again.',
      };
    }

    sendSSE(res, 'step', {
      stepId: 'opportunity_matching',
      message: 'Matching opportunities to your profile...',
      progress: 80,
    });
    // Deterministic scoring first (see lib/match.js), then one cheap model call keeps only what suits this candidate
    // (lib/curate.js). If that call fails, a deterministic shortlist is used, so this step never blocks the report.
    const scored = matchOpportunities(profile, careerData, opportunities);
    const opportunityMatches = await curateOpportunities({
      profile,
      analysis: careerData,
      scored,
      language: lang,
      generate: (prompt) => generateContent(prompt, true, userKey, { tier: 'fast', thinkingBudget: 0, maxOutputTokens: 2200 }),
    });

    sendSSE(res, 'profile', { data: profile });
    sendSSE(res, 'career_analysis', { data: careerData });
    sendSSE(res, 'opportunity_matches', { data: opportunityMatches });

    sendSSE(res, 'step', { stepId: 'complete_intelligence', message: 'Intelligence ready!', progress: 100 });
    sendSSE(res, 'complete', { message: 'Done!' });
  } catch (err) {
    const isKeyIssue = /No Gemini API key|API key not valid|quota|permission/i.test(err.message || '');
    sendSSE(res, 'error', {
      message: isKeyIssue
        ? 'The shared Gemini quota is exhausted right now. Please enter your own free Gemini API key above and try again.'
        : `An unexpected error occurred: ${err.message || 'unknown error'}`,
    });
  }

  res.end();
};
