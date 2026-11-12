import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { NODES, ROLES, nodeById, detectHave, readiness, routeTo, mapRoleTitle, resolveRequirements, allEdges, neighbors } from './skillGraph.js'

const fixture = JSON.parse(readFileSync(new URL('../../server/fixtures/sample-profile.json', import.meta.url), 'utf8'))

test('graph integrity: unique ids, every reference exists, prerequisites are never at a higher level', () => {
  const ids = NODES.map((n) => n.id)
  assert.equal(new Set(ids).size, ids.length, 'duplicate node id')
  for (const n of NODES) {
    for (const p of n.prereqs) {
      assert.ok(nodeById[p], `${n.id} has unknown prerequisite ${p}`)
      assert.ok(nodeById[p].level <= n.level, `${n.id} (level ${n.level}) needs higher-level ${p}`)
    }
  }
  for (const r of ROLES) {
    for (const [req] of r.requires) {
      for (const id of typeof req === 'string' ? [req] : req.anyOf) assert.ok(nodeById[id], `${r.id} requires unknown ${id}`)
    }
  }
})

test('graph is acyclic: every skill can be ordered after its prerequisites', () => {
  const done = new Set()
  const skills = NODES.filter((n) => n.type === 'skill')
  while (done.size < skills.length) {
    const next = skills.filter((n) => !done.has(n.id) && n.prereqs.every((p) => done.has(p)))
    assert.ok(next.length, 'cycle detected')
    next.forEach((n) => done.add(n.id))
  }
})

test('detectHave finds named skills and marks their prerequisites as implied', () => {
  const have = detectHave(fixture.profile)
  assert.equal(have.get('python').status, 'have')
  assert.equal(have.get('sql').status, 'have')
  assert.equal(have.get('pandas').status, 'have')
  assert.equal(have.get('python-web').status, 'have') // Flask
  assert.equal(have.get('programming-basics').status, 'implied')
  assert.equal(have.get('docker'), undefined)
  assert.equal(have.get('k8s'), undefined)
})

test('detectHave does not confuse Java with JavaScript', () => {
  const have = detectHave({ skills: [{ name: 'JavaScript' }] })
  assert.equal(have.get('javascript').status, 'have')
  assert.equal(have.get('java'), undefined)
})

test('readiness is bounded and reflects the candidate: data analyst beats frontend for a Python/SQL profile', () => {
  const have = detectHave(fixture.profile)
  for (const r of ROLES) {
    const v = readiness(r.id, have)
    assert.ok(v >= 0 && v <= 100)
  }
  assert.ok(readiness('data-analyst', have) > readiness('frontend-dev', have))
  assert.equal(readiness('backend-dev', new Map()), 0)
})

test('routeTo orders every step after its prerequisites and totals hours', () => {
  const have = detectHave(fixture.profile)
  const route = routeTo('data-engineer', have, 8)
  const position = Object.fromEntries(route.steps.map((s, i) => [s.id, i]))
  for (const s of route.steps) {
    for (const p of nodeById[s.id].prereqs) if (p in position) assert.ok(position[p] < position[s.id], `${p} must precede ${s.id}`)
  }
  assert.ok(route.steps.length > 0)
  assert.equal(route.totalHours, route.steps.reduce((a, s) => a + s.hours, 0))
  assert.equal(route.weeks, Math.ceil(route.totalHours / 8))
  assert.ok(route.routeIds.has('data-engineer'))
  assert.ok(route.steps.some((s) => s.id === 'docker'), 'a data engineer route needs Docker')
  assert.ok(!route.steps.some((s) => s.id === 'python'), 'already-owned skills are not steps')
})

test('an owned skill is never listed as a step, and a complete profile has an empty route', () => {
  const everything = new Map(NODES.filter((n) => n.type === 'skill').map((n) => [n.id, { status: 'have', via: 'x' }]))
  assert.equal(routeTo('backend-dev', everything).steps.length, 0)
  assert.equal(readiness('backend-dev', everything), 100)
})

test('"any of" requirements use the option the candidate already owns, else the cheapest', () => {
  const owned = resolveRequirements('backend-dev', detectHave({ skills: [{ name: 'Spring Boot' }] }))
  assert.equal(owned.find((r) => r.label === 'A backend framework').id, 'spring')
  const cheapest = resolveRequirements('backend-dev', new Map())
  const pick = cheapest.find((r) => r.label === 'A backend framework').id
  assert.ok(['python-web', 'node-express', 'spring'].includes(pick))
})

test('role titles from the analysis map to graph roles, longest alias first', () => {
  assert.equal(mapRoleTitle('Junior Data Analyst'), 'data-analyst')
  assert.equal(mapRoleTitle('Associate Software Engineer (Python/Flask)'), 'backend-dev')
  assert.equal(mapRoleTitle('Full Stack Developer'), 'fullstack-dev')
  assert.equal(mapRoleTitle('QA Automation Engineer'), 'qa-engineer')
  assert.equal(mapRoleTitle('Technical Instructor'), 'tech-instructor')
  assert.equal(mapRoleTitle('Astronaut'), null)
})

test('edges and neighbours are consistent', () => {
  const edges = allEdges()
  assert.ok(edges.length > 100)
  for (const e of edges) assert.ok(nodeById[e.from] && nodeById[e.to])
  const n = neighbors('docker')
  assert.ok(n.unlocks.some((u) => u.id === 'k8s'))
  assert.ok(n.roles.some((r) => r.id === 'devops-engineer'))
})

test('prose words do not create false skills, and only foundations are ever implied', () => {
  // A backend engineer whose project text mentions "audit logging" and who lists Jenkins, but never Docker or cloud.
  const profile = {
    skills: [{ name: 'Java' }, { name: 'Spring Boot' }, { name: 'SQL' }, { name: 'Jenkins' }],
    projects: [{ title: 'Settlement Service', technologies: ['Java', 'MySQL'], description: 'Idempotent service with retries and audit logging, deployed on the cloud.' }],
    experience: [{ role: 'Software Engineer', description: 'Built APIs, monitoring dashboards and mentored two juniors.' }],
  }
  const have = detectHave(profile)
  assert.equal(have.get('observability'), undefined, '"logging" in prose must not count')
  assert.equal(have.get('cloud-basics'), undefined, '"cloud" in prose must not count')
  assert.equal(have.get('docker'), undefined, 'Docker must not be implied by anything')
  assert.equal(have.get('java').status, 'have')
  assert.equal(have.get('cicd').status, 'have') // Jenkins
  assert.equal(have.get('git').status, 'implied') // foundation under CI/CD
  for (const [id, h] of have) if (h.status === 'implied') assert.ok(nodeById[id].level <= 1, `${id} is implied but not foundational`)
})
