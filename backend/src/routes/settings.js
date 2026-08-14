'use strict';

const express = require('express');
const crypto = require('crypto');
const supabase = require('../lib/supabase');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

if (!process.env.ENCRYPTION_KEY) {
  throw new Error('ENCRYPTION_KEY environment variable is required');
}
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

function encrypt(text) {
  if (!text) return { encryptedData: null, iv: null };
  const iv = crypto.randomBytes(16);
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return {
    encryptedData: encrypted,
    iv: iv.toString('hex')
  };
}

router.get('/:userId', requireAuth, async (req, res) => {
  const { userId } = req.params;
  if (req.userId !== userId) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  try {
    const { data, error } = await supabase
      .from('oia_user_settings')
      .select('encrypted_openai_key, encrypted_gemini_key')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    res.json({
      hasOpenAIKey: !!data?.encrypted_openai_key,
      hasGeminiKey: !!data?.encrypted_gemini_key
    });
  } catch (err) {
    console.error('Error fetching settings:', err);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

router.post('/:userId', requireAuth, async (req, res) => {
  const { userId } = req.params;
  if (req.userId !== userId) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const { openaiKey, geminiKey } = req.body;

  try {
    const updateData = {
      user_id: userId,
      updated_at: new Date().toISOString()
    };

    if (openaiKey !== undefined) {
      if (openaiKey === '') {
        updateData.encrypted_openai_key = null;
        updateData.iv_openai = null;
      } else {
        const { encryptedData, iv } = encrypt(openaiKey);
        updateData.encrypted_openai_key = encryptedData;
        updateData.iv_openai = iv;
      }
    }

    if (geminiKey !== undefined) {
      if (geminiKey === '') {
        updateData.encrypted_gemini_key = null;
        updateData.iv_gemini = null;
      } else {
        const { encryptedData, iv } = encrypt(geminiKey);
        updateData.encrypted_gemini_key = encryptedData;
        updateData.iv_gemini = iv;
      }
    }

    const { error } = await supabase
      .from('oia_user_settings')
      .upsert(updateData, { onConflict: 'user_id' });

    if (error) throw error;

    res.json({ success: true });
  } catch (err) {
    console.error('Error saving settings:', err);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

module.exports = router;
