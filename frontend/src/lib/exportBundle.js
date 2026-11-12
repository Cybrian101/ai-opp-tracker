// "Export for extension": the profile the browser extension needs, as a small JSON file.
// Contact details are left out on purpose: the verdict does not need them, so they never leave this device.

export function buildBundle({ profile, careerAnalysis, comeback, language }) {
  const { email: _email, phone: _phone, ...safeProfile } = profile || {}
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    language: language || 'en',
    profile: safeProfile,
    analysis: careerAnalysis
      ? {
          domainFit: careerAnalysis.domainFit,
          strengths: careerAnalysis.strengths,
          improvementAreas: careerAnalysis.improvementAreas,
          skillGaps: (careerAnalysis.skillGaps || []).map((g) => ({ skill: g.skill })),
          recommendedRoles: (careerAnalysis.recommendedRoles || []).map((r) => ({ role: r.role })),
        }
      : {},
    comeback: comeback || null,
  }
}

export function downloadBundle(state) {
  const blob = new Blob([JSON.stringify(buildBundle(state), null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'pathfound-profile.json'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
