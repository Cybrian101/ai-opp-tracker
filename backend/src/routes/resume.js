'use strict';

const express = require('express');
const multer = require('multer');
const supabase = require('../lib/supabase');
const { analyzeResume } = require('../agents/resumeAnalyzer');

const router = express.Router();

// ─── Multer configuration ────────────────────────────────────────────────────

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and DOCX files are accepted'), false);
    }
  },
});

// ─── SSE Helper ─────────────────────────────────────────────────────────────

function sendSSE(res, type, data) {
  const payload = JSON.stringify({ type, ...data });
  res.write(`data: ${payload}\n\n`);
  if (typeof res.flush === 'function') res.flush();
}

// ─── POST /analyze ────────────────────────────────────────────────────────────

router.post('/analyze', (req, res) => {
  // Handle multer manually so we can stream SSE errors too
  const uploader = upload.single('resume');

  uploader(req, res, async (multerErr) => {
    // Set SSE headers immediately
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    if (multerErr) {
      sendSSE(res, 'error', { message: multerErr.message });
      res.end();
      return;
    }

    if (!req.file) {
      sendSSE(res, 'error', { message: 'No resume file provided' });
      res.end();
      return;
    }

    const userId = req.body?.userId || req.headers['x-user-id'];
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!userId || !uuidPattern.test(userId)) {
      sendSSE(res, 'error', {
        message: 'A valid authenticated userId is required',
      });
      res.end();
      return;
    }

    try {
      // Step 1: acknowledge upload
      sendSSE(res, 'step', {
        step: 'upload',
        stepId: 'upload',
        message: 'Resume received...',
        progress: 10,
      });

      // Step 2: analyze resume
      const stepCallback = (stepId, message, progress) => {
        sendSSE(res, 'step', { step: stepId, stepId, message, progress });
      };

      const profile = await analyzeResume(
        req.file.buffer,
        req.file.mimetype,
        stepCallback
      );

      if (!profile) {
        sendSSE(res, 'error', {
          message: 'Failed to analyze resume. Please try a different file.',
        });
        res.end();
        return;
      }

      // Step 3: building profile
      sendSSE(res, 'step', {
        step: 'build',
        stepId: 'build',
        message: 'Building your intelligence profile...',
        progress: 45,
      });

      // Step 4: save to Supabase
      await saveProfileToSupabase(userId, profile);

      // ── Career Intelligence Pipeline (steps 5–9) ──────────────────────────
      sendSSE(res, 'step', {
        step: 'career_analysis',
        stepId: 'career_analysis',
        message: 'Running AI career analysis...',
        progress: 55,
      });

      const fullProfile = {
        ...profile,
        user_id: userId,
      };

      try {
        const careerAnalysisEngine = require('../agents/careerAnalysisEngine');
        const { careerData, opportunityMatches } =
          await careerAnalysisEngine.runCareerIntelligencePipeline(
            userId,
            fullProfile,
            (stepId, message, progress) => {
              sendSSE(res, 'step', { step: stepId, stepId, message, progress });
            }
          );

        // Send career intelligence payload to frontend
        sendSSE(res, 'career_analysis', { data: careerData });
        sendSSE(res, 'opportunity_matches', { data: opportunityMatches });
      } catch (analysisErr) {
        console.error(
          '[ResumeRoute] Career analysis failed (non-fatal):',
          analysisErr.message
        );
        // Non-fatal: the core profile is already saved — continue to completion
      }

      // Step 10: send full profile
      sendSSE(res, 'profile', { data: { ...profile, userId } });

      // Step 11: ready
      sendSSE(res, 'step', {
        step: 'ready',
        stepId: 'ready',
        message: 'Profile ready!',
        progress: 100,
      });

      // Step 12: complete
      sendSSE(res, 'complete', {
        message: 'Profile ready!',
        progress: 100,
      });
    } catch (err) {
      console.error('[ResumeRoute] Unhandled error:', err.message);
      sendSSE(res, 'error', { message: 'An unexpected error occurred' });
    }

    // End stream
    res.end();
  });
});

// ─── Save Profile Helper ──────────────────────────────────────────────────────

async function saveProfileToSupabase(userId, profile) {
  // ─── DIAGNOSTIC LOGGING ──────────────────────────────────────────────
  console.log('\n' + '='.repeat(60));
  console.log('[ResumeRoute] PROFILE SAVE DIAGNOSTICS');
  console.log('='.repeat(60));
  console.log('[ResumeRoute] Received userId:', userId);
  console.log('[ResumeRoute] userId type:', typeof userId);
  console.log('[ResumeRoute] Profile name:', profile.name);
  console.log('[ResumeRoute] Supabase URL:', process.env.SUPABASE_URL);
  console.log('[ResumeRoute] Service Role Key prefix:', process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) + '...');
  console.log('='.repeat(60) + '\n');

  // Ensure a public users row exists for the foreign key before upserting profile
  const { error: userUpsertError } = await supabase
    .from('users')
    .upsert(
      {
        id: userId,
        email: profile.email || null,
        full_name: profile.name || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

  if (userUpsertError) {
    console.error('[ResumeRoute] Failed to upsert public user row:', userUpsertError.message);
    throw userUpsertError;
  }

  // Upsert main profile (conflict on user_id) and retrieve profile_id
  const { data: profileData, error: profileError } = await supabase
    .from('oia_candidate_profiles')
    .upsert(
      {
        user_id: userId,
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        degree: profile.degree,
        institution: profile.institution,
        graduation_year: profile.graduationYear,
        experience_level: profile.experienceLevel,
        summary: profile.summary,
        interests: profile.interests,
        preferred_domains: profile.preferredDomains,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )
    .select('id');

  if (profileError) {
    console.error('[ResumeRoute] 🔴 UPSERT FAILED');
    console.error('[ResumeRoute] Error code:', profileError.code);
    console.error('[ResumeRoute] Error message:', profileError.message);
    console.error('[ResumeRoute] Error details:', profileError.details);
    console.error('[ResumeRoute] Error hint:', profileError.hint);
    throw profileError;
  }

  const profileId = Array.isArray(profileData)
    ? profileData[0]?.id
    : profileData?.id;

  if (!profileId) {
    throw new Error('Failed to retrieve profile ID after upsert');
  }

  console.log('[ResumeRoute] ✅ Profile upserted successfully');
  console.log('[ResumeRoute] Profile ID:', profileId);

  // Skills — delete old, insert new
  await supabase
    .from('oia_candidate_skills')
    .delete()
    .eq('profile_id', profileId);

  if (Array.isArray(profile.skills) && profile.skills.length > 0) {
    const skillRows = profile.skills.map((skill) => ({
      profile_id: profileId,
      name: skill.name,
      category: skill.category,
      level: skill.level,
    }));
    const { error: skillsError } = await supabase
      .from('oia_candidate_skills')
      .insert(skillRows);
    if (skillsError) {
      console.error('[ResumeRoute] Failed to insert skills:', skillsError.message);
    } else {
      console.log('[ResumeRoute] ✅ Inserted', skillRows.length, 'skills');
    }
  }

  // Projects
  if (Array.isArray(profile.projects) && profile.projects.length > 0) {
    const projectRows = profile.projects.map((proj) => ({
      profile_id: profileId,
      title: proj.title,
      technologies: proj.technologies,
      domain: proj.domain,
      impact: proj.impact,
      description: proj.description,
    }));
    const { error: projError } = await supabase
      .from('oia_candidate_projects')
      .insert(projectRows);
    if (projError) {
      console.error('[ResumeRoute] Failed to insert projects:', projError.message);
    } else {
      console.log('[ResumeRoute] ✅ Inserted', projectRows.length, 'projects');
    }
  }

  // Experience
  if (Array.isArray(profile.experience) && profile.experience.length > 0) {
    const expRows = profile.experience.map((exp) => ({
      profile_id: profileId,
      company: exp.company,
      role: exp.role,
      duration: exp.duration,
      description: exp.description,
    }));
    const { error: expError } = await supabase
      .from('oia_candidate_experience')
      .insert(expRows);
    if (expError) {
      console.error('[ResumeRoute] Failed to insert experience:', expError.message);
    } else {
      console.log('[ResumeRoute] ✅ Inserted', expRows.length, 'experiences');
    }
  }

  // Certifications
  if (
    Array.isArray(profile.certifications) &&
    profile.certifications.length > 0
  ) {
    const certRows = profile.certifications.map((cert) => ({
      profile_id: profileId,
      name: cert.name,
      issuer: cert.issuer,
      year: cert.year,
    }));
    const { error: certError } = await supabase
      .from('oia_candidate_certifications')
      .insert(certRows);
    if (certError) {
      console.error(
        '[ResumeRoute] Failed to insert certifications:',
        certError.message
      );
    } else {
      console.log('[ResumeRoute] ✅ Inserted', certRows.length, 'certifications');
    }
  }

  console.log(`[ResumeRoute] ✅ Profile saved successfully for user ${userId}`);
}

// ─── GET /profile/:userId ─────────────────────────────────────────────────────

router.get('/profile/:userId', async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    // First fetch the profile to get its ID
    const profileRes = await supabase
      .from('oia_candidate_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (profileRes.error || !profileRes.data) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const profileId = profileRes.data.id;

    // Now fetch child tables in parallel using the resolved profile ID
    const [skillsRes, projectsRes, experienceRes, certsRes, analysisRes] =
      await Promise.all([
        supabase.from('oia_candidate_skills').select('*').eq('profile_id', profileId),
        supabase.from('oia_candidate_projects').select('*').eq('profile_id', profileId),
        supabase.from('oia_candidate_experience').select('*').eq('profile_id', profileId),
        supabase.from('oia_candidate_certifications').select('*').eq('profile_id', profileId),
        supabase.from('oia_career_analysis').select('*').eq('user_id', userId).maybeSingle(),
      ]);

    const fullProfile = {
      ...profileRes.data,
      skills: skillsRes.data || [],
      projects: projectsRes.data || [],
      experience: experienceRes.data || [],
      certifications: certsRes.data || [],
    };

    return res.json({ profile: fullProfile, analysis: analysisRes.data || null });
  } catch (err) {
    console.error('[ResumeRoute] GET /profile error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

module.exports = router;
