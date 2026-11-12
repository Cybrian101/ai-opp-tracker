import { NODES, ROLES } from '../data/skillGraph.js'

// Pure logic for the Skill Map: detect what a candidate has, then compute the exact route to a role.
// No network and no model calls, so it is instant, free, and identical every time for the same input.

export const nodeById = Object.fromEntries(NODES.map((n) => [n.id, n]))
export const roleById = Object.fromEntries(ROLES.map((r) => [r.id, r]))

const unlocksIndex = {}
for (const n of NODES) for (const p of n.prereqs) (unlocksIndex[p] ||= []).push(n.id)

const rolesRequiringIndex = {}
for (const r of ROLES) {
  for (const [req, weight] of r.requires) {
    const ids = typeof req === 'string' ? [req] : req.anyOf
    for (const id of ids) (rolesRequiringIndex[id] ||= []).push({ roleId: r.id, weight })
  }
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const clean = (s) => ` ${String(s || '').toLowerCase().replace(/[^a-z0-9+#./\s-]/g, ' ').replace(/\s+/g, ' ').trim()} `
const hasTerm = (hay, term) => new RegExp(`(^|[^a-z0-9+#])${escapeRe(term.toLowerCase())}([^a-z0-9+#]|$)`).test(hay)

function allPrereqs(id, seen = new Set()) {
  for (const p of nodeById[id]?.prereqs || []) {
    if (!seen.has(p)) {
      seen.add(p)
      allPrereqs(p, seen)
    }
  }
  return seen
}

/**
 * What does the candidate already have? Returns Map<nodeId, { status: 'have' | 'implied', via: string }>.
 * 'have' = named in skills, project technologies, certifications or experience text.
 * 'implied' = a FOUNDATIONAL prerequisite (level 0-1) of something they have: you cannot use React without
 * JavaScript. Specific tools are never implied (using the cloud does not mean you know Docker).
 */
// Broad words that appear in ordinary resume prose ("audit logging", "cloud-based", "unit testing of...") are
// too ambiguous to count as evidence on their own, so they only count when listed as a skill, tech or certification.
const PROSE_AMBIGUOUS = new Set([
  'logging', 'monitoring', 'cloud', 'testing', 'communication', 'documentation', 'architecture', 'scalability', 'dashboards',
  'analytics', 'containers', 'teaching', 'training', 'coaching', 'tutoring', 'presentation', 'api', 'apis', 'web services',
  'data pipeline', 'data pipelines', 'database design', 'authentication', 'authorization', 'programming', 'coding',
])

export function detectHave(profile = {}) {
  const strong = [
    ...(profile.skills || []).map((s) => (typeof s === 'string' ? s : s.name)),
    ...(profile.projects || []).flatMap((p) => p.technologies || []),
    ...(profile.certifications || []).map((c) => c.name),
  ].join(' | ')
  const weak = [
    ...(profile.experience || []).map((e) => `${e.role || ''} ${e.description || ''}`),
    ...(profile.projects || []).map((p) => `${p.title || ''} ${p.description || ''}`),
    profile.summary || '',
  ].join(' | ')
  const strongHay = clean(strong)
  const weakHay = clean(weak)

  const have = new Map()
  for (const n of NODES) {
    if (n.type !== 'skill') continue
    const terms = [n.label, ...n.aliases]
    const strongHit = terms.find((t) => hasTerm(strongHay, t))
    if (strongHit) {
      have.set(n.id, { status: 'have', via: strongHit })
      continue
    }
    // Resume prose is weaker evidence, so only multi-letter, unambiguous aliases count from it.
    const weakHit = terms.find((t) => t.length > 3 && !PROSE_AMBIGUOUS.has(t.toLowerCase()) && hasTerm(weakHay, t))
    if (weakHit) have.set(n.id, { status: 'have', via: weakHit })
  }

  for (const [id] of [...have]) {
    for (const p of allPrereqs(id)) {
      if (!have.has(p) && nodeById[p].level <= 1) have.set(p, { status: 'implied', via: nodeById[id].label })
    }
  }
  return have
}

const owns = (have, id) => have.has(id)

function costToLearn(id, have) {
  let hours = owns(have, id) ? 0 : nodeById[id].hours
  for (const p of allPrereqs(id)) if (!owns(have, p)) hours += nodeById[p].hours
  return hours
}

/** Resolve a role's requirement list into concrete skill nodes (choosing the cheapest option for "any of"). */
export function resolveRequirements(roleId, have) {
  const role = roleById[roleId]
  if (!role) return []
  return role.requires.map(([req, weight, label]) => {
    if (typeof req === 'string') return { id: req, weight, label: nodeById[req].label, options: null }
    const owned = req.anyOf.find((id) => owns(have, id))
    const chosen = owned || [...req.anyOf].sort((a, b) => costToLearn(a, have) - costToLearn(b, have))[0]
    return { id: chosen, weight, label: label || nodeById[chosen].label, options: req.anyOf }
  })
}

/** 0-100: weighted share of the role's requirements the candidate has (implied counts as half). */
export function readiness(roleId, have) {
  const reqs = resolveRequirements(roleId, have)
  const total = reqs.reduce((s, r) => s + r.weight, 0)
  if (!total) return 0
  const got = reqs.reduce((s, r) => {
    const h = have.get(r.id)
    return s + r.weight * (h ? (h.status === 'have' ? 1 : 0.5) : 0)
  }, 0)
  return Math.round((got / total) * 100)
}

/**
 * The exact route: every missing skill the role needs plus the missing prerequisites beneath them,
 * ordered so each step's prerequisites come first. Returns steps, total hours and an estimate in weeks.
 */
export function routeTo(roleId, have, hoursPerWeek = 8) {
  const reqs = resolveRequirements(roleId, have)
  const weightOf = {}
  const requiredFor = {}
  for (const r of reqs) {
    weightOf[r.id] = Math.max(weightOf[r.id] || 0, r.weight)
    requiredFor[r.id] = roleById[roleId].label
  }

  const needed = new Set()
  for (const r of reqs) {
    if (owns(have, r.id) && have.get(r.id).status === 'have') continue
    needed.add(r.id)
    for (const p of allPrereqs(r.id)) if (!owns(have, p)) needed.add(p)
  }
  // An "implied" requirement is likely known but unproven; keep it as a verification step only if it is directly required.
  const steps = []
  const remaining = new Set(needed)
  const placed = new Set()
  while (remaining.size) {
    const ready = [...remaining].filter((id) => nodeById[id].prereqs.every((p) => !needed.has(p) || placed.has(p)))
    if (!ready.length) break // defensive: the graph is a DAG, so this cannot happen
    ready.sort((a, b) => nodeById[a].level - nodeById[b].level || (weightOf[b] || 0) - (weightOf[a] || 0) || nodeById[a].hours - nodeById[b].hours)
    const id = ready[0]
    remaining.delete(id)
    placed.add(id)
    const node = nodeById[id]
    const feeds = (unlocksIndex[id] || []).filter((u) => needed.has(u)).map((u) => nodeById[u].label)
    steps.push({
      id,
      label: node.label,
      domain: node.domain,
      hours: have.get(id)?.status === 'implied' ? Math.ceil(node.hours / 4) : node.hours, // quick refresher if likely known
      weight: weightOf[id] || 0,
      direct: id in requiredFor,
      why: requiredFor[id] ? `Required for ${requiredFor[id]}` : feeds.length ? `Unlocks ${feeds.slice(0, 2).join(' and ')}` : 'Builds the foundation',
      refresher: have.get(id)?.status === 'implied',
    })
  }
  const totalHours = steps.reduce((s, x) => s + x.hours, 0)
  const perWeek = Math.max(1, hoursPerWeek)
  return {
    roleId,
    steps,
    totalHours,
    weeks: Math.ceil(totalHours / perWeek),
    routeIds: new Set([...steps.map((s) => s.id), ...reqs.filter((r) => owns(have, r.id)).map((r) => r.id), roleId]),
    requirements: reqs,
  }
}

/**
 * The subgraph for one role: the skills it needs (resolved to the option the candidate owns or the cheapest),
 * everything beneath them, and the role itself. This is what the graph shows when a role is picked.
 */
export function focusSubgraph(roleId, have) {
  const reqs = resolveRequirements(roleId, have)
  const ids = new Set([roleId])
  for (const r of reqs) {
    ids.add(r.id)
    for (const p of allPrereqs(r.id)) ids.add(p)
  }
  const reqIds = new Set(reqs.map((r) => r.id))
  const edges = []
  for (const id of ids) {
    if (id === roleId) continue
    for (const p of nodeById[id].prereqs) if (ids.has(p)) edges.push({ from: p, to: id, kind: 'prereq' })
  }
  for (const r of reqs) edges.push({ from: r.id, to: roleId, kind: 'role', weight: r.weight })
  return { nodeIds: ids, nodes: [...ids].map((id) => nodeById[id]), edges, requirementIds: reqIds }
}

/** Map a free-text job title (e.g. from the analysis) to one of our roles; longest alias wins. */
export function mapRoleTitle(title) {
  const hay = clean(title)
  let best = null
  let bestLen = 0
  for (const r of ROLES) {
    for (const a of [r.label, ...r.aliases]) {
      if (a.length > bestLen && hasTerm(hay, a)) {
        best = r.id
        bestLen = a.length
      }
    }
  }
  return best
}

export function neighbors(id) {
  const node = nodeById[id]
  return {
    prereqs: (node?.prereqs || []).map((p) => nodeById[p]),
    unlocks: (unlocksIndex[id] || []).map((u) => nodeById[u]),
    roles: (rolesRequiringIndex[id] || []).map((r) => ({ ...roleById[r.roleId], weight: r.weight })),
  }
}

/** Every edge of the graph for rendering: skill -> skill prerequisites, and skill -> role requirements. */
export function allEdges() {
  const edges = []
  for (const n of NODES) for (const p of n.prereqs) edges.push({ from: p, to: n.id, kind: 'prereq' })
  for (const r of ROLES) {
    for (const [req, weight] of r.requires) {
      const ids = typeof req === 'string' ? [req] : req.anyOf
      for (const id of ids) edges.push({ from: id, to: r.id, kind: 'role', weight })
    }
  }
  return edges
}

export { NODES, ROLES }
