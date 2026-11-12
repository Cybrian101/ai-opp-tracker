import test from 'node:test'
import assert from 'node:assert/strict'
import { buildIcs } from './ics.js'

const weeks = [
  { week: 1, theme: 'Set up, with commas; and semicolons', goals: ['Install tools', 'Read "docs"'], deliverable: 'A repo', hours: 5, checkpoint: 'It runs' },
  { week: 2, theme: 'x'.repeat(200), goals: [], deliverable: '', hours: 5, checkpoint: '' },
]

test('ics: valid calendar envelope, one event per week, CRLF line endings', () => {
  const ics = buildIcs(weeks, new Date(2026, 0, 5))
  assert.ok(ics.startsWith('BEGIN:VCALENDAR\r\n'))
  assert.ok(ics.endsWith('END:VCALENDAR\r\n'))
  assert.equal((ics.match(/BEGIN:VEVENT/g) || []).length, 2)
  assert.ok(!/[^\r]\n/.test(ics), 'every newline must be CRLF')
})

test('ics: week 1 starts on the given day and week 2 a week later, all-day', () => {
  const ics = buildIcs(weeks, new Date(2026, 0, 5))
  assert.match(ics, /DTSTART;VALUE=DATE:20260105/)
  assert.match(ics, /DTEND;VALUE=DATE:20260112/)
  assert.match(ics, /DTSTART;VALUE=DATE:20260112/)
})

test('ics: escapes commas and semicolons and folds long lines to 75 octets', () => {
  const ics = buildIcs(weeks, new Date(2026, 0, 5))
  assert.match(ics, /Set up\\, with commas\\; and semicolons/)
  for (const line of ics.split('\r\n')) assert.ok(new TextEncoder().encode(line).length <= 75, `line too long: ${line.length}`)
})
