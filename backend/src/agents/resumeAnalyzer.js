'use strict';

const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const { generateContent } = require('../lib/gemini');
const { buildResumeAnalysisPrompt } = require('../lib/prompts');

const PDF_MIME = 'application/pdf';
const DOCX_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

async function extractText(fileBuffer, mimeType) {
  if (mimeType === PDF_MIME) {
    const data = await pdfParse(fileBuffer);
    return data.text;
  }

  if (mimeType === DOCX_MIME) {
    const result = await mammoth.extractRawText({ buffer: fileBuffer });
    return result.value;
  }

  throw new Error(`Unsupported file type: ${mimeType}`);
}

async function analyzeResume(fileBuffer, mimeType, sendStep) {
  try {
    sendStep('extract', 'Extracting text from resume...', 20);

    let resumeText;
    try {
      resumeText = await extractText(fileBuffer, mimeType);
    } catch (extractErr) {
      console.error('[ResumeAnalyzer] Text extraction failed:', extractErr.message);
      sendStep('error', `Text extraction failed: ${extractErr.message}`, 20);
      return null;
    }

    if (!resumeText || resumeText.trim().length < 50) {
      console.error('[ResumeAnalyzer] Extracted text is too short or empty');
      sendStep('error', 'Could not extract sufficient text from the resume', 20);
      return null;
    }

    console.log(`[ResumeAnalyzer] Extracted ${resumeText.length} characters from resume`);

    sendStep('analyze', 'AI analyzing your resume with Gemini...', 50);

    const prompt = buildResumeAnalysisPrompt(resumeText);
    const profile = await generateContent(prompt, true);

    if (!profile || typeof profile !== 'object') {
      console.error('[ResumeAnalyzer] Gemini returned invalid profile');
      return null;
    }

    // Ensure arrays exist even if Gemini omits them
    profile.skills = Array.isArray(profile.skills) ? profile.skills : [];
    profile.projects = Array.isArray(profile.projects) ? profile.projects : [];
    profile.experience = Array.isArray(profile.experience) ? profile.experience : [];
    profile.certifications = Array.isArray(profile.certifications) ? profile.certifications : [];
    profile.interests = Array.isArray(profile.interests) ? profile.interests : [];
    profile.preferredDomains = Array.isArray(profile.preferredDomains) ? profile.preferredDomains : [];

    console.log(`[ResumeAnalyzer] Profile extracted for: ${profile.name || 'Unknown'}`);
    return profile;
  } catch (err) {
    console.error('[ResumeAnalyzer] Unexpected error:', err.message);
    return null;
  }
}

module.exports = { analyzeResume };
