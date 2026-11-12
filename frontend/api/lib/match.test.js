'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { matchOpportunities, norm } = require('./match');
const opportunities = require('../data/opportunities.json');
const fixture = require('../../server/fixtures/sample-profile.json');

test('aliases normalise common shorthand', () => {
  assert.equal(norm('JS'), 'javascript');
  assert.equal(norm('Node.js'), 'node');
  assert.equal(norm(' K8s '), 'kubernetes');
});

test('returns every opportunity once, sorted by score, with bounded scores', () => {
  const out = matchOpportunities(fixture.profile, fixture.analysis, opportunities);
  assert.equal(out.length, opportunities.length);
  assert.equal(new Set(out.map((o) => o.id)).size, opportunities.length);
  for (let i = 1; i < out.length; i++) assert.ok(out[i - 1].matchScore >= out[i].matchScore);
  assert.ok(out.every((o) => o.matchScore >= 15 && o.matchScore <= 95));
});

test('is deterministic', () => {
  const a = matchOpportunities(fixture.profile, fixture.analysis, opportunities);
  const b = matchOpportunities(fixture.profile, fixture.analysis, opportunities);
  assert.deepEqual(a, b);
});

test('explanations cite a term the candidate really lists', () => {
  const out = matchOpportunities(fixture.profile, fixture.analysis, opportunities);
  const known = JSON.stringify(fixture).toLowerCase();
  const withOverlap = out.filter((o) => /you list|^Fits /.test(o.matchExplanation));
  assert.ok(withOverlap.length >= 3, 'several opportunities should match real skills');
  for (const o of out) {
    for (const m of o.matchExplanation.matchAll(/you list ([^).]+)/g)) {
      const via = m[1].trim();
      assert.ok(known.includes(via) || known.includes(via.replace('cpp', 'c++')), `invented: ${via}`);
    }
  }
});

test('field tags match via concrete skills: a data/Python candidate fits Kaggle and software roles', () => {
  const out = Object.fromEntries(matchOpportunities(fixture.profile, fixture.analysis, opportunities).map((o) => [o.id, o]));
  assert.match(out['kaggle-competitions'].matchExplanation, /data science \(you list/);
  assert.ok(out['kaggle-competitions'].matchScore > out['gates-cambridge'].matchScore);
  assert.ok(out['google-careers'].matchScore > out['gates-cambridge'].matchScore);
});

test('student-only programmes are penalised for experienced candidates but not for freshers', () => {
  const student = opportunities.find((o) => /student/i.test(o.eligibility || ''));
  assert.ok(student, 'fixture data should contain a student-aimed programme');
  const fresher = matchOpportunities({ ...fixture.profile, experienceLevel: 'fresher' }, fixture.analysis, [student])[0];
  const senior = matchOpportunities({ ...fixture.profile, experienceLevel: 'senior', graduationYear: 2010 }, fixture.analysis, [student])[0];
  assert.ok(fresher.matchScore > senior.matchScore);
  assert.match(senior.matchExplanation, /may not be eligible/);
});

test('skillGap only lists gaps the candidate actually has', () => {
  const out = matchOpportunities(fixture.profile, fixture.analysis, opportunities);
  const gaps = fixture.analysis.skillGaps.map((g) => g.skill.toLowerCase());
  for (const o of out) for (const g of o.skillGap) assert.ok(gaps.includes(g));
});
