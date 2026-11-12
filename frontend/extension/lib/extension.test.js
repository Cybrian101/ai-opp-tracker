import test from 'node:test'
import assert from 'node:assert/strict'
import { parseBundle } from './profile.js'
import { buildCsv, makeEntry, safeUrl } from './tracker.js'
import { mergeFrames } from './extract.js'

const good = { version: 1, language: 'en', profile: { name: 'A', email: 'secret@x.com', phone: '999', skills: [{ name: 'Python', level: 'advanced' }], interests: ['data'] }, analysis: { domainFit: 'Data' } }

test('profile import accepts a valid export and drops contact details and unknown fields', () => {
  const r = parseBundle(JSON.stringify({ ...good, evil: '<script>' }))
  assert.equal(r.ok, true)
  assert.equal(r.bundle.profile.skills[0].name, 'Python')
  assert.doesNotMatch(JSON.stringify(r.bundle), /secret@x\.com|999|evil/)
})

test('profile import rejects garbage, empty profiles, and oversized files with a helpful message', () => {
  assert.equal(parseBundle('').ok, false)
  assert.match(parseBundle('not json').error, /valid PathFound/)
  assert.match(parseBundle(JSON.stringify({ profile: { skills: [] } })).error, /no skills/)
  assert.equal(parseBundle('x'.repeat(70000)).ok, false)
})

test('profile import clamps field lengths and enums', () => {
  const r = parseBundle(JSON.stringify({ ...good, language: 'xx', profile: { ...good.profile, experienceLevel: 'wizard', summary: 'y'.repeat(5000) } }))
  assert.equal(r.bundle.language, 'en')
  assert.equal(r.bundle.profile.experienceLevel, 'fresher')
  assert.equal(r.bundle.profile.summary.length, 800)
})

test('csv export defuses spreadsheet formulas and escapes quotes and commas', () => {
  const csv = buildCsv([{ ts: Date.UTC(2026, 0, 5), role: '=HYPERLINK("http://evil")', company: 'Acme, Inc', decision: 'apply', score: 80, status: 'applied', url: 'https://x.com/j' }])
  assert.match(csv, /"'=HYPERLINK\(""http:\/\/evil""\)"/)
  assert.match(csv, /"Acme, Inc"/)
  assert.ok(csv.startsWith('Date,Role,Company'))
  assert.ok(csv.endsWith('\r\n'))
})

test('log entries keep only origin and path of the page address', () => {
  assert.equal(safeUrl('https://careers.example.com/jobs/7?token=SECRET#x'), 'https://careers.example.com/jobs/7')
  const e = makeEntry({ role: 'Dev', company: 'Acme', decision: 'apply', score: 70 }, { url: 'https://a.com/p?q=SECRET' }, 5)
  assert.equal(e.url, 'https://a.com/p')
  assert.doesNotMatch(JSON.stringify(e), /SECRET/)
})

test('mergeFrames prefers a selection, and adds embedded frames (e.g. a Google Form) without duplicating text', () => {
  const top = { isTop: true, title: 'T', url: 'https://x.com/a', text: 'Careers page. '.repeat(30), usedSelection: false, structured: {} }
  const form = { isTop: false, title: '', url: 'https://docs.google.com/forms/x', text: 'Application form. Your name. Your CV. '.repeat(15), usedSelection: false, structured: {} }
  const merged = mergeFrames([{ frameId: 0, result: top }, { frameId: 3, result: form }, { frameId: 4, result: form }])
  assert.match(merged.text, /\[Embedded content\]/)
  assert.equal(merged.text.split('[Embedded content]').length - 1, 1, 'the same frame text must not be added twice')
  const picked = mergeFrames([{ frameId: 0, result: top }, { frameId: 2, result: { ...form, usedSelection: true, text: 'chosen text' } }])
  assert.equal(picked.text, 'chosen text')
  assert.equal(picked.url, 'https://x.com/a')
  assert.equal(mergeFrames([]), null)
})

import { resolveTheme, nextTheme } from './theme.js'

test('theme: saved choice wins, then system preference, default dark', () => {
  assert.equal(resolveTheme('light', false), 'light')
  assert.equal(resolveTheme('dark', true), 'dark')
  assert.equal(resolveTheme(undefined, true), 'light')
  assert.equal(resolveTheme('junk', false), 'dark')
  assert.equal(resolveTheme(undefined, undefined), 'dark')
  assert.equal(nextTheme('dark'), 'light')
  assert.equal(nextTheme('light'), 'dark')
})

test('profile import keeps Kannada as the chosen language', () => {
  assert.equal(parseBundle(JSON.stringify({ ...good, language: 'kn' })).bundle.language, 'kn')
})
