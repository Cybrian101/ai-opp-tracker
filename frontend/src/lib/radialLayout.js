// GraphRAG-style radial layout: the target entity in the centre, its direct requirements on the first ring grouped
// into domain "communities" (angular sectors), and what feeds them on outer rings, placed near the nodes they feed.
// Deterministic, and spaced so no two labels overlap.

export const PILL_H = 32
export const pillW = (label, isCenter = false) => Math.min(196, Math.max(isCenter ? 156 : 108, Math.min(label.length, 24) * 7.4 + 32))

const DOMAIN_ORDER = ['core', 'web', 'backend', 'data', 'ml', 'devops', 'quality']
const TAU = Math.PI * 2
const GROUP_GAP = 0.16
const RING_STEP = 215 // wider than the longest label, so labels on neighbouring rings can never touch
const Y_RATIO = 0.7
const PAD = 40

const circMean = (angles) => Math.atan2(angles.reduce((s, a) => s + Math.sin(a), 0), angles.reduce((s, a) => s + Math.cos(a), 0))
const norm = (a) => ((a % TAU) + TAU) % TAU

/**
 * @param nodes   [{ id, label, domain }]  (must include the centre)
 * @param edges   [{ from, to }]  `to` is the entity nearer the centre (a skill points to what it feeds)
 * @returns { pos: Map<id,{x,y,ring,angle}>, width, height, cx, cy, rings: [{rx,ry}], sectors: [{domain,a0,a1}] }
 */
export function radialLayout(nodes, edges, centerId, { maxRing: ringCap = 3 } = {}) {
  const byId = new Map(nodes.map((n) => [n.id, n]))
  const feeders = {}
  const dependents = {}
  for (const e of edges) {
    if (!byId.has(e.from) || !byId.has(e.to)) continue
    ;(feeders[e.to] ||= []).push(e.from)
    ;(dependents[e.from] ||= []).push(e.to)
  }

  // Ring = hops from the centre along "feeds" edges (capped so very deep graphs stay readable)
  const ring = new Map([[centerId, 0]])
  let frontier = [centerId]
  while (frontier.length) {
    const next = []
    for (const id of frontier) {
      for (const f of feeders[id] || []) {
        if (!ring.has(f)) {
          ring.set(f, Math.min(ring.get(id) + 1, ringCap))
          next.push(f)
        }
      }
    }
    frontier = next
  }
  for (const n of nodes) if (!ring.has(n.id)) ring.set(n.id, 1)

  const maxRing = Math.max(...ring.values())
  const members = (r) => nodes.filter((n) => ring.get(n.id) === r)

  // Ring 1: group by domain into sectors
  const first = members(1).sort((a, b) => DOMAIN_ORDER.indexOf(a.domain) - DOMAIN_ORDER.indexOf(b.domain) || a.label.localeCompare(b.label))
  const groups = []
  for (const n of first) {
    const g = groups[groups.length - 1]
    if (g && g.domain === n.domain) g.items.push(n)
    else groups.push({ domain: n.domain, items: [n] })
  }
  const slot = first.length ? (TAU - GROUP_GAP * groups.length) / first.length : 0
  const angle = new Map()
  const sectors = []
  let cursor = -Math.PI / 2 + GROUP_GAP / 2
  for (const g of groups) {
    const a0 = cursor
    g.items.forEach((n, i) => angle.set(n.id, cursor + slot * (i + 0.5)))
    cursor += slot * g.items.length
    sectors.push({ domain: g.domain, a0: a0 - GROUP_GAP / 2, a1: cursor + GROUP_GAP / 2 })
    cursor += GROUP_GAP
  }

  // Radii: each ring is as wide as its crowdedness requires, and always clear of the previous ring
  const radii = [{ rx: 0, ry: 0 }]
  for (let r = 1; r <= maxRing; r++) {
    const list = members(r)
    const widest = list.reduce((s, n) => s + pillW(n.label) + 14, 0)
    const needed = widest / (TAU * 0.81)
    const base = r === 1 ? 300 : radii[r - 1].rx + RING_STEP
    const rx = Math.max(base, needed, r === 1 ? 0 : radii[r - 1].rx + RING_STEP)
    radii.push({ rx, ry: rx * Y_RATIO })
  }

  // Outer rings: sit at the mean angle of what they feed, then spread apart so labels never collide
  for (let r = 2; r <= maxRing; r++) {
    const list = members(r)
    for (const n of list) {
      const parents = (dependents[n.id] || []).filter((p) => angle.has(p))
      angle.set(n.id, parents.length ? circMean(parents.map((p) => angle.get(p))) : -Math.PI / 2)
    }
    const { rx, ry } = radii[r]
    const sorted = [...list].sort((a, b) => norm(angle.get(a.id)) - norm(angle.get(b.id)) || a.id.localeCompare(b.id))
    const widthAt = (n) => pillW(n.label) + 14
    for (let pass = 0; pass < 120; pass++) {
      let moved = false
      for (let i = 0; i < sorted.length; i++) {
        const a = sorted[i]
        const b = sorted[(i + 1) % sorted.length]
        if (a === b) continue
        const gap = i === sorted.length - 1 ? norm(angle.get(b.id)) + TAU - norm(angle.get(a.id)) : norm(angle.get(b.id)) - norm(angle.get(a.id))
        const need = Math.max((widthAt(a) / 2 + widthAt(b) / 2) / rx, (PILL_H + 14) / ry)
        if (gap < need) {
          const push = (need - gap) / 2 + 1e-4
          angle.set(a.id, angle.get(a.id) - push)
          angle.set(b.id, angle.get(b.id) + push)
          moved = true
        }
      }
      if (!moved) break
    }
  }

  const outer = radii[maxRing] || { rx: 0, ry: 0 }
  const widest = Math.max(...nodes.map((n) => pillW(n.label, n.id === centerId)))
  const width = Math.ceil(2 * (outer.rx + widest / 2 + PAD))
  const height = Math.ceil(2 * (outer.ry + PILL_H / 2 + PAD + 14))
  const cx = width / 2
  const cy = height / 2

  const pos = new Map()
  for (const n of nodes) {
    const r = ring.get(n.id)
    if (n.id === centerId) {
      pos.set(n.id, { x: cx, y: cy, ring: 0, angle: 0 })
      continue
    }
    const a = angle.get(n.id) ?? -Math.PI / 2
    pos.set(n.id, { x: cx + radii[r].rx * Math.cos(a), y: cy + radii[r].ry * Math.sin(a), ring: r, angle: a })
  }
  // Crop the canvas to what is actually drawn (pills plus the cluster labels), so it renders as large as possible.
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  const grow = (x, y, hw, hh) => { x0 = Math.min(x0, x - hw); x1 = Math.max(x1, x + hw); y0 = Math.min(y0, y - hh); y1 = Math.max(y1, y + hh) }
  for (const n of nodes) {
    const p = pos.get(n.id)
    grow(p.x, p.y, pillW(n.label, n.id === centerId) / 2, PILL_H / 2)
  }
  for (const sec of sectors) {
    const mid = (sec.a0 + sec.a1) / 2
    grow(cx + (outer.rx + 60) * Math.cos(mid), cy + (outer.ry + 40) * Math.sin(mid), 62, 10)
  }
  const box = { x: Math.floor(x0 - PAD / 2), y: Math.floor(y0 - PAD / 2), w: Math.ceil(x1 - x0 + PAD), h: Math.ceil(y1 - y0 + PAD) }
  return { pos, width, height, box, cx, cy, rings: radii.slice(1), sectors }
}
