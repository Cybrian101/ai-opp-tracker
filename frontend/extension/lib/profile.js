// Importing the profile exported from the PathFound web app. The file is untrusted input: validate and trim it.

const MAX_BYTES = 60000

const asArray = (v) => (Array.isArray(v) ? v : [])
const asString = (v, max = 400) => (typeof v === 'string' ? v.slice(0, max) : '')

/** @returns {{ ok: true, bundle: object } | { ok: false, error: string }} */
export function parseBundle(text) {
  if (typeof text !== 'string' || !text.trim()) return { ok: false, error: 'Choose the file exported from PathFound, or paste its contents.' }
  if (text.length > MAX_BYTES) return { ok: false, error: 'That file is too large to be a PathFound profile.' }
  let raw
  try {
    raw = JSON.parse(text)
  } catch {
    return { ok: false, error: 'That is not a valid PathFound profile file.' }
  }
  const p = raw && raw.profile
  if (!p || typeof p !== 'object' || !asArray(p.skills).length) {
    return { ok: false, error: 'This file has no skills in it. Export it again from PathFound after analysing a resume.' }
  }
  const a = raw.analysis && typeof raw.analysis === 'object' ? raw.analysis : {}
  const cb = raw.comeback && typeof raw.comeback === 'object' ? raw.comeback : null
  return {
    ok: true,
    bundle: {
      version: 1,
      language: ['en', 'ta', 'hi', 'kn'].includes(raw.language) ? raw.language : 'en',
      profile: {
        name: asString(p.name, 120),
        degree: asString(p.degree, 120),
        institution: asString(p.institution, 160),
        graduationYear: Number.isFinite(Number(p.graduationYear)) ? Number(p.graduationYear) : null,
        experienceLevel: ['fresher', 'junior', 'mid', 'senior'].includes(p.experienceLevel) ? p.experienceLevel : 'fresher',
        summary: asString(p.summary, 800),
        skills: asArray(p.skills).slice(0, 80).map((s) => ({ name: asString(s && s.name, 80), level: asString(s && s.level, 20) })).filter((s) => s.name),
        projects: asArray(p.projects).slice(0, 12).map((x) => ({ title: asString(x && x.title, 120), description: asString(x && x.description, 400), technologies: asArray(x && x.technologies).slice(0, 12).map((t) => asString(t, 40)) })),
        experience: asArray(p.experience).slice(0, 12).map((x) => ({ company: asString(x && x.company, 120), role: asString(x && x.role, 120), duration: asString(x && x.duration, 60), description: asString(x && x.description, 400) })),
        certifications: asArray(p.certifications).slice(0, 12).map((x) => ({ name: asString(x && x.name, 120) })),
        interests: asArray(p.interests).slice(0, 12).map((t) => asString(t, 60)),
        preferredDomains: asArray(p.preferredDomains).slice(0, 8).map((t) => asString(t, 60)),
        ...(cb ? { comeback: { breakMonths: Number(cb.breakMonths) || 0, hoursPerWeek: Number(cb.hoursPerWeek) || 10, flexibility: asArray(cb.flexibility).slice(0, 6).map((t) => asString(t, 30)), activities: asString(cb.activities, 1500) } } : {}),
      },
      analysis: {
        domainFit: asString(a.domainFit, 120),
        strengths: asArray(a.strengths).slice(0, 8).map((t) => asString(t, 200)),
        improvementAreas: asArray(a.improvementAreas).slice(0, 8).map((t) => asString(t, 200)),
        skillGaps: asArray(a.skillGaps).slice(0, 8).map((g) => ({ skill: asString(g && g.skill, 80) })),
        recommendedRoles: asArray(a.recommendedRoles).slice(0, 5).map((r) => ({ role: asString(r && r.role, 80) })),
      },
    },
  }
}
