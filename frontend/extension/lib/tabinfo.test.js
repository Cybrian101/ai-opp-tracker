import test from 'node:test'
import assert from 'node:assert/strict'
import { classifyUrl, looksLikeJobUrl, describeTab } from './tabinfo.js'

test('unknown url is not reported as unreadable', () => {
  assert.equal(classifyUrl(undefined).state, 'unknown')
  assert.equal(classifyUrl('').state, 'unknown')
})

test('unreadable pages get a friendly message', () => {
  for (const u of ['chrome://extensions', 'chrome-extension://abc/x.html', 'https://chromewebstore.google.com/detail/x', 'about:blank', 'view-source:https://a.com'])
    assert.equal(classifyUrl(u).state, 'blocked', u)
  assert.equal(classifyUrl('https://a.com/job.pdf?x=1').state, 'pdf')
  assert.equal(classifyUrl('file:///c:/job.html').state, 'file')
  assert.match(classifyUrl('chrome://newtab').message, /Open the job page/)
  assert.equal(classifyUrl('https://acme.example/careers/1').state, 'ok')
})

test('job-looking urls are recognised from the url alone', () => {
  for (const u of ['https://www.linkedin.com/jobs/view/1', 'https://acme.wd5.myworkdayjobs.com/en-US/x', 'https://acme.example/careers/data-analyst', 'https://x.example/?currentJobId=9'])
    assert.equal(looksLikeJobUrl(u), true, u)
  for (const u of ['https://news.example/article/1', 'https://mail.google.com/mail', 'nonsense', 'chrome://x'])
    assert.equal(looksLikeJobUrl(u), false, u)
})

test('describeTab tolerates missing fields', () => {
  assert.equal(describeTab(null).state, 'unknown')
  const d = describeTab({ url: 'https://jobs.lever.co/acme/1', title: 'Data Analyst' })
  assert.deepEqual([d.host, d.title, d.jobLike], ['jobs.lever.co', 'Data Analyst', true])
})
