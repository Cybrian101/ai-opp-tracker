import test from 'node:test'
import assert from 'node:assert/strict'
import { buildBundle } from './exportBundle.js'
import { parseBundle } from '../../extension/lib/profile.js'

const state = {
  profile: { name: 'Priya', email: 'priya@example.com', phone: '+91 90000 00000', skills: [{ name: 'Python', level: 'advanced' }], interests: ['data'] },
  careerAnalysis: { domainFit: 'Data', strengths: ['Python'], improvementAreas: ['Cloud'], skillGaps: [{ skill: 'Docker', learning: 'long text' }], recommendedRoles: [{ role: 'Data Analyst', reason: 'x' }], aiNarrative: 'long narrative' },
  comeback: { breakMonths: 36, hoursPerWeek: 10, flexibility: ['remote'], activities: 'PTA treasurer' },
  language: 'ta',
}

test('the export leaves out contact details and long narrative text', () => {
  const json = JSON.stringify(buildBundle(state))
  assert.doesNotMatch(json, /priya@example\.com|90000|long narrative|long text/)
  assert.match(json, /Python/)
})

test('what the web app exports is accepted by the extension importer, end to end', () => {
  const r = parseBundle(JSON.stringify(buildBundle(state)))
  assert.equal(r.ok, true)
  assert.equal(r.bundle.language, 'ta')
  assert.equal(r.bundle.profile.comeback.hoursPerWeek, 10)
  assert.equal(r.bundle.analysis.skillGaps[0].skill, 'Docker')
})
