'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { matchOpportunities } = require('./match');
const { curateOpportunities, normalizeCuration, buildCurationPrompt, fallbackSelection } = require('./curate');
const opportunities = require('../data/opportunities.json');
const fixture = require('../../server/fixtures/sample-profile.json');

const scored = () => matchOpportunities(fixture.profile, fixture.analysis, opportunities);

test('stored listings are complete and every one links to an application page', () => {
  const ids = new Set();
  for (const o of opportunities) {
    assert.ok(o.id && o.title && o.organization && o.category, `incomplete: ${o.id}`);
    assert.ok(!ids.has(o.id), `duplicate id ${o.id}`);
    ids.add(o.id);
    assert.match(o.application_url, /^https:\/\//, `bad link: ${o.id}`);
    if (o.source_date) assert.match(o.source_date, /^\d{4}-\d{2}-\d{2}$/);
    if (o.deadline) assert.match(o.deadline, /^\d{4}-\d{2}-\d{2}$/);
  }
});

test('women-focused programmes are marked, including the NariYukti hackathon', () => {
  const women = opportunities.filter((o) => o.audience === 'women');
  assert.ok(women.some((o) => o.id === 'nariyukti-techhack-11'));
  assert.ok(women.length >= 3);
});

test('a fresher is not matched to listings that ask for many years', () => {
  const out = scored();
  const senior = out.filter((o) => o.min_years >= 4);
  assert.ok(senior.length > 0);
  assert.ok(senior.every((o) => o.aboveLevel === true));
  assert.ok(out.filter((o) => o.min_years != null && o.min_years <= 1).every((o) => !o.aboveLevel));
});

test('normalizeCuration keeps only offered ids, once each, with clamped scores', () => {
  const valid = new Set(['a', 'b', 'c']);
  const out = normalizeCuration(
    { picks: [{ id: 'a', score: 140, reason: ' good ' }, { id: 'x', score: 90, reason: 'invented' }, { id: 'a', score: 10 }, { id: 'b', score: 'n/a' }, null, { id: 'c', score: -5, reason: 7 }] },
    valid
  );
  assert.deepEqual(out.map((p) => p.id), ['a', 'b', 'c']);
  assert.equal(out[0].score, 100);
  assert.equal(out[0].reason, 'good');
  assert.equal(out[1].score, null);
  assert.equal(out[2].score, 0);
  assert.equal(out[2].reason, '');
  assert.deepEqual(normalizeCuration([{ id: 'b', score: 70, reason: 'bare list' }], valid).map((p) => p.id), ['b']);
  assert.deepEqual(normalizeCuration(null, valid), []);
  assert.deepEqual(normalizeCuration({ picks: 'nope' }, valid), []);
});

test('the prompt only offers listings the candidate is not above-level for, and never women-only ones', () => {
  const s = scored();
  const calls = [];
  return curateOpportunities({
    profile: fixture.profile, analysis: fixture.analysis, scored: s,
    generate: async (prompt) => { calls.push(prompt); return { picks: [] }; },
  }).then(() => {
    assert.equal(calls.length, 1);
    assert.ok(!calls[0].includes('id=nariyukti-techhack-11'));
    const above = s.find((o) => o.aboveLevel);
    assert.ok(!calls[0].includes(`id=${above.id} `));
    assert.match(calls[0], /Return ONLY JSON/);
  });
});

test('curated picks use the model score and reason, ignore invented ids, and women-focused entries follow', async () => {
  const s = scored();
  const eligible = s.filter((o) => o.audience !== 'women' && !o.aboveLevel);
  const [first, second] = eligible;
  const out = await curateOpportunities({
    profile: fixture.profile, analysis: fixture.analysis, scored: s,
    generate: async () => ({ picks: [{ id: second.id, score: 61, reason: 'Fits your Python.' }, { id: 'made-up', score: 99, reason: 'x' }, { id: first.id, score: 88, reason: 'Fits your SQL.' }] }),
  });
  const curated = out.filter((o) => o.curated);
  assert.deepEqual(curated.map((o) => o.id), [first.id, second.id]);
  assert.equal(curated[0].matchScore, 88);
  assert.equal(curated[0].matchExplanation, 'Fits your SQL.');
  assert.ok(!out.some((o) => o.id === 'made-up'));
  const women = out.filter((o) => o.audience === 'women');
  assert.ok(women.length >= 3);
  assert.deepEqual(out.slice(-women.length).map((o) => o.id), women.map((o) => o.id), 'women-focused entries come last');
  // anything that is not a model pick or a women-focused entry is a top-up real employer opening
  const extras = out.filter((o) => !o.curated && o.audience !== 'women');
  assert.ok(extras.every((o) => o.listing_source && o.category.includes('job') && !o.aboveLevel));
});

test('real employer openings are topped up when the model returns only programmes', async () => {
  const s = scored();
  const programme = s.find((o) => !o.listing_source && o.audience !== 'women' && !o.aboveLevel);
  const out = await curateOpportunities({
    profile: fixture.profile, analysis: fixture.analysis, scored: s,
    generate: async () => ({ picks: [{ id: programme.id, score: 90, reason: 'Fits.' }] }),
  });
  const jobs = out.filter((o) => o.listing_source && o.category.includes('job') && o.audience !== 'women');
  assert.ok(jobs.length >= 1 && jobs.length <= 3);
  assert.ok(jobs.every((o) => o.matchScore >= 60 && !o.aboveLevel));
});

test('falls back to a deterministic shortlist when the model fails', async () => {
  const s = scored();
  const out = await curateOpportunities({
    profile: fixture.profile, analysis: fixture.analysis, scored: s,
    generate: async () => { throw new Error('quota'); },
  });
  const shown = out.filter((o) => o.audience !== 'women');
  assert.ok(shown.length > 0 && shown.length <= 14);
  assert.ok(shown.every((o) => !o.aboveLevel && o.matchScore >= 40));
  assert.deepEqual(shown.map((o) => o.id), fallbackSelection(s).map((o) => o.id));
});

test('the prompt names the candidate level and skills so the model can judge suitability', () => {
  const p = buildCurationPrompt(fixture.profile, fixture.analysis, scored().slice(0, 3), 'en');
  assert.match(p, /Level: fresher/);
  assert.ok(fixture.profile.skills.length === 0 || p.includes('Skills:'));
});
