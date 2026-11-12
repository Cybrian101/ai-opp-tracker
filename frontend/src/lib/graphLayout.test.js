import test from 'node:test'
import assert from 'node:assert/strict'
import { radialLayout, pillW, PILL_H } from './radialLayout.js'
import { ROLES, NODES } from '../data/skillGraph.js'
import { detectHave, focusSubgraph, routeTo } from './skillGraph.js'

const profile = { skills: [{ name: 'Python' }, { name: 'SQL' }, { name: 'Pandas' }, { name: 'Git' }] }

// The default view: the role, its requirements, and only the skills still missing beneath them.
function routeView(roleId, have) {
  const focus = focusSubgraph(roleId, have)
  const route = routeTo(roleId, have, 8)
  const shown = new Set([roleId, ...focus.requirementIds, ...route.steps.map((s) => s.id)])
  return { nodes: focus.nodes.filter((n) => shown.has(n.id)), edges: focus.edges.filter((e) => shown.has(e.from) && shown.has(e.to)), route, focus }
}

test('every role lays out with a position for each node, deterministically', () => {
  const have = detectHave(profile)
  for (const role of ROLES) {
    const { nodes, edges } = routeView(role.id, have)
    const a = radialLayout(nodes, edges, role.id, { maxRing: 2 })
    const b = radialLayout(nodes, edges, role.id, { maxRing: 2 })
    assert.equal(a.pos.size, nodes.length, role.id)
    for (const n of nodes) assert.deepEqual(a.pos.get(n.id), b.pos.get(n.id))
  }
})

test('no two labels overlap, for every role, in both the compact and the full-prerequisite view', () => {
  const have = detectHave(profile)
  for (const role of ROLES) {
    const compact = routeView(role.id, have)
    const full = compact.focus
    for (const [name, nodes, edges, maxRing] of [['compact', compact.nodes, compact.edges, 2], ['full', full.nodes, full.edges, 3]]) {
      const { pos } = radialLayout(nodes, edges, role.id, { maxRing })
      const items = nodes.map((n) => ({ id: n.id, p: pos.get(n.id), w: pillW(n.label, n.id === role.id) }))
      for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
        const dx = Math.abs(items[i].p.x - items[j].p.x)
        const dy = Math.abs(items[i].p.y - items[j].p.y)
        const hit = dx < (items[i].w + items[j].w) / 2 - 1 && dy < PILL_H - 1
        assert.ok(!hit, `${role.id} ${name}: ${items[i].id} overlaps ${items[j].id}`)
      }
    }
  }
})

test('the role is at the centre and its requirements share the first ring, grouped by domain', () => {
  const have = detectHave(profile)
  const { nodes, edges, focus } = routeView('data-engineer', have)
  const { pos, cx, cy, sectors } = radialLayout(nodes, edges, 'data-engineer', { maxRing: 2 })
  assert.deepEqual([pos.get('data-engineer').x, pos.get('data-engineer').y], [cx, cy])
  for (const id of focus.requirementIds) assert.equal(pos.get(id).ring, 1, `${id} should be on ring 1`)
  const domains = sectors.map((s) => s.domain)
  assert.equal(new Set(domains).size, domains.length, 'each domain forms one contiguous cluster')
})

test('everything stays inside the canvas', () => {
  const have = detectHave(profile)
  for (const role of ROLES) {
    const { nodes, edges } = routeView(role.id, have)
    const { pos, box } = radialLayout(nodes, edges, role.id, { maxRing: 2 })
    for (const n of nodes) {
      const p = pos.get(n.id)
      const w = pillW(n.label, n.id === role.id)
      assert.ok(p.x - w / 2 >= box.x && p.x + w / 2 <= box.x + box.w && p.y - PILL_H / 2 >= box.y && p.y + PILL_H / 2 <= box.y + box.h, `${role.id}/${n.id} outside the cropped canvas`)
    }
  }
})

test('the compact view is much smaller than the full prerequisite tree', () => {
  const have = detectHave(profile)
  const { nodes, focus } = routeView('data-engineer', have)
  assert.ok(nodes.length <= focus.nodes.length)
  assert.ok(nodes.length < NODES.length / 3)
})

test('a role subgraph contains the role, its requirements and everything beneath them, and nothing unrelated', () => {
  const sub = focusSubgraph('data-analyst', detectHave({ skills: [{ name: 'Python' }, { name: 'SQL' }] }))
  assert.ok(sub.nodeIds.has('data-analyst') && sub.nodeIds.has('sql') && sub.nodeIds.has('data-viz') && sub.nodeIds.has('excel'))
  assert.ok(!sub.nodeIds.has('k8s') && !sub.nodeIds.has('react') && !sub.nodeIds.has('frontend-dev'))
  for (const e of sub.edges) assert.ok(sub.nodeIds.has(e.from) && sub.nodeIds.has(e.to))
})
