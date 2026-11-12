import test from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { mergeFrames } from './extract.js'
import { runFixture } from './jdHarness.js'

const fixture = (name) => fileURLToPath(new URL(`../fixtures/jd/${name}`, import.meta.url))
const read = (name, url, options) => runFixture(fixture(name), url, options)

// One row per supported page shape. Add a row (and a file in fixtures/jd/) when a site is read badly.
const CASES = [
  { file: 'linkedin-job.html', url: 'https://www.linkedin.com/jobs/view/123456/', mustHave: ['SQL', 'Python', 'Tableau'], mustNot: ['Try Premium', 'Product Manager'] },
  { file: 'indeed-job.html', url: 'https://in.indeed.com/viewjob?jk=abc', mustHave: ['SQL', 'Python', 'Tableau'], mustNot: ['Company reviews', 'Similar jobs'] },
  { file: 'careers-jsonld.html', url: 'https://careers.acme.example/jobs/42', mustHave: ['SQL', 'Python'], mustNot: ['Blog Contact'] },
  { file: 'generic-careers-main.html', url: 'https://acme.example/careers/junior-data-analyst', mustHave: ['SQL', 'Python'], mustNot: ['Cookie settings', 'Products Pricing'] },
  { file: 'greenhouse-board.html', url: 'https://job-boards.greenhouse.io/acme/jobs/1', mustHave: ['SQL', 'Python', 'Tableau'], mustNot: ['Cookie preferences', 'Powered by Greenhouse'] },
  { file: 'lever-posting.html', url: 'https://jobs.lever.co/acme/abc', mustHave: ['SQL', 'Python', 'Tableau'], mustNot: ['Sales Lead', 'powered by Lever'] },
  { file: 'workday-spa.html', url: 'https://acme.wd5.myworkdayjobs.com/en-US/careers/job/Pune/Data-Analyst_R1', mustHave: ['SQL', 'Python', 'Tableau'], mustNot: ['Loading...'] },
  { file: 'naukri-job.html', url: 'https://www.naukri.com/job-listings-data-analyst-acme-1', mustHave: ['SQL', 'Python', 'Tableau'], mustNot: ['Java Developer', 'Accountant Manager'] },
]

for (const c of CASES) {
  test(`reads the job text from ${c.file} without page chrome`, () => {
    const page = read(c.file, c.url)
    assert.ok(page.text.length > 300, `text too short (${page.text.length})`)
    for (const s of c.mustHave) assert.ok(page.text.includes(s), `missing "${s}"`)
    for (const s of c.mustNot) assert.ok(!page.text.includes(s), `leaked "${s}"`)
    assert.equal(page.usedSelection, false)
    assert.equal(page.url, c.url)
  })
}

test('schema.org JobPosting data is extracted from careers pages', () => {
  const { structured } = read('careers-jsonld.html', 'https://careers.acme.example/jobs/42')
  assert.equal(structured.title, 'Junior Data Analyst')
  assert.equal(structured.company, 'Acme Analytics')
  assert.equal(structured.location, 'Chennai, Tamil Nadu, IN')
  assert.equal(structured.employmentType, 'FULL_TIME')
  assert.equal(structured.validThrough, '2026-06-30')
  assert.match(structured.salary, /500000 - 700000 INR YEAR/)
})

test('JobPosting inside an @graph is found, and a thin client-rendered page falls back to its description', () => {
  const page = read('careers-spa-thin.html', 'https://jobs.acme.example/apply/9')
  assert.equal(page.structured.company, 'Acme Analytics')
  assert.ok(page.text.includes('Tableau'), 'should fall back to the structured description')
  assert.ok(!page.text.includes('Loading...'))
})

test('a user selection of at least 40 characters wins over the page body', () => {
  const sel = 'Requirements: strong SQL, working knowledge of Python and good communication.'
  const page = read('linkedin-job.html', 'https://www.linkedin.com/jobs/view/123456/', { selection: sel })
  assert.equal(page.usedSelection, true)
  assert.equal(page.text, sel)
})

test('scam-style posts are still extracted verbatim so the scam check can see the red flags', () => {
  const page = read('scam-post.html', 'https://sketchy.example/job')
  for (const s of ['registration fee', 'Aadhaar', 'WhatsApp']) assert.ok(page.text.includes(s), `missing "${s}"`)
})

test('extractPage output is bounded', () => {
  const big = `<html><body><main>${'word '.repeat(10000)}</main></body></html>`
  assert.ok(read('scam-post.html', 'https://x.example/').text.length <= 14000)
  assert.ok(runFixtureHtml(big).text.length <= 14000)
})

import { runExtract } from './jdHarness.js'
function runFixtureHtml(html) { return runExtract(html, 'https://x.example/big') }

test('job text inside an iframe is merged with the host page (mergeFrames)', () => {
  const top = { ...read('careers-iframe-host.html', 'https://acme.example/careers'), isTop: true }
  const inner = { ...read('careers-iframe-inner.html', 'https://boards.example/embed/9'), isTop: false }
  const page = mergeFrames([{ frameId: 0, result: top }, { frameId: 5, result: inner }])
  assert.equal(page.url, 'https://acme.example/careers')
  assert.ok(page.text.includes('Join us') && page.text.includes('Tableau') && page.text.includes('[Embedded content]'))
})
