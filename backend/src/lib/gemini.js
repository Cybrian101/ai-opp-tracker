'use strict';

require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const crypto = require('crypto');
const supabase = require('./supabase');

const defaultApiKey = process.env.GEMINI_API_KEY;
if (!defaultApiKey) {
  console.warn('Missing GEMINI_API_KEY environment variable. Operations will fail unless users provide their own keys.');
}

const defaultGenAI = defaultApiKey ? new GoogleGenerativeAI(defaultApiKey) : null;
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function decrypt(encryptedText, ivHex) {
  try {
    const iv = Buffer.from(ivHex, 'hex');
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('[Gemini] Decryption error:', err.message);
    return null;
  }
}

async function getUserGeminiKey(userId) {
  if (!userId) return null;
  const { data, error } = await supabase
    .from('oia_user_settings')
    .select('encrypted_gemini_key, iv_gemini')
    .eq('user_id', userId)
    .single();

  if (error || !data?.encrypted_gemini_key || !data?.iv_gemini) return null;

  return decrypt(data.encrypted_gemini_key, data.iv_gemini);
}

async function generateContent(prompt, jsonMode = true, userId = null) {
  const maxAttempts = 3;
  const delayMs = 1000;

  let lastError;
  let currentGenAI = defaultGenAI;
  let usingFallback = false;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      if (!currentGenAI) {
        if (!usingFallback && userId) {
          console.log(`[Gemini] Default key missing, attempting fallback for user ${userId}`);
          const fallbackKey = await getUserGeminiKey(userId);
          if (fallbackKey) {
            currentGenAI = new GoogleGenerativeAI(fallbackKey);
            usingFallback = true;
          } else {
            throw new Error('No default API key and no user fallback key found.');
          }
        } else {
            throw new Error('No Gemini API key available.');
        }
      }

      const generationConfig = {};
      if (jsonMode) {
        generationConfig.responseMimeType = 'application/json';
      }

      const model = currentGenAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig,
      });

      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      if (jsonMode) {
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

      return text;
    } catch (err) {
      lastError = err;
      console.error(`[Gemini] Attempt ${attempt}/${maxAttempts} failed:`, err.message);
      
      // If default key fails with auth/quota error and we haven't tried fallback yet
      if (!usingFallback && userId && (err.message.includes('API key not valid') || err.message.includes('quota'))) {
         console.log(`[Gemini] Switching to fallback key for user ${userId}...`);
         const fallbackKey = await getUserGeminiKey(userId);
         if (fallbackKey) {
            currentGenAI = new GoogleGenerativeAI(fallbackKey);
            usingFallback = true;
            attempt--; // Don't count this attempt if we are switching keys
            continue;
         }
      }

      if (attempt < maxAttempts) {
        await sleep(delayMs * attempt);
      }
    }
  }

  console.error('[Gemini] All attempts exhausted.');
  throw lastError;
}

module.exports = { generateContent };
