import { useMemo } from 'react'
import { radialLayout, pillW, PILL_H } from '../../lib/radialLayout'
import { DOMAINS } from '../../data/skillGraph'

// GraphRAG-style knowledge graph. The target role sits in the centre; its requirements form the first ring,
// grouped into coloured domain communities; what you still need to learn sits on the outer ring, next to what it feeds.
// Pure rendering: the caller decides which nodes and edges to show.

const WEIGHT_TEXT = { 3: 'must have', 2: 'important', 1: 'nice to have' }
const truncate = (s, n) => (s.length > n ? `${s.slice(0, n - 1)}…` : s)

function sectorPath(cx, cy, rx, ry, a0, a1) {
  const pts = [`M${cx},${cy}`]
  const steps = Math.max(6, Math.ceil(((a1 - a0) / (Math.PI * 2)) * 80))
  for (let i = 0; i <= steps; i++) {
    const a = a0 + ((a1 - a0) * i) / steps
    pts.push(`L${cx + rx * Math.cos(a)},${cy + ry * Math.sin(a)}`)
  }
  return `${pts.join(' ')} Z`
}

export default function SkillGraph({ nodes, edges, centerId, maxRing = 2, status, stepNo, selectedId, onSelect }) {
  const layout = useMemo(() => radialLayout(nodes, edges, centerId, { maxRing }), [nodes, edges, centerId, maxRing])
  const { pos, box, cx, cy, rings, sectors } = layout

  // Selecting a node keeps only it and its direct neighbours bright
  const related = useMemo(() => {
    if (!selectedId) return null
    const ids = new Set([selectedId])
    for (const e of edges) {
      if (e.from === selectedId) ids.add(e.to)
      if (e.to === selectedId) ids.add(e.from)
    }
    return ids
  }, [selectedId, edges])

  const outer = rings[rings.length - 1] || { rx: 0, ry: 0 }
  const ringLabels = ['Needs', 'Learn first', 'Further back']

  return (
    <svg viewBox={`${box.x} ${box.y} ${box.w} ${box.h}`} style={{ width: '100%', height: 'auto', maxHeight: 780 }} role="img" aria-label="Skill knowledge graph centred on the target role. The same information is listed as text beside it.">
      {/* Domain communities as soft wedges, with a label outside the graph */}
      {sectors.map((s) => {
        const color = DOMAINS[s.domain]?.color || 'rgb(var(--c-muted))'
        const mid = (s.a0 + s.a1) / 2
        const lx = cx + (outer.rx + 60) * Math.cos(mid)
        const ly = cy + (outer.ry + 40) * Math.sin(mid)
        return (
          <g key={s.domain + s.a0}>
            <path d={sectorPath(cx, cy, outer.rx + 30, outer.ry + 30, s.a0, s.a1)} fill={color} opacity={0.06} />
            <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', fill: color, opacity: 0.85 }}>
              {DOMAINS[s.domain]?.label}
            </text>
          </g>
        )
      })}

      {rings.map((r, i) => (
        <g key={i}>
          <ellipse cx={cx} cy={cy} rx={r.rx} ry={r.ry} fill="none" stroke="rgb(var(--c-fg) / calc(0.2 * var(--fg-boost)))" strokeDasharray="3 7" opacity={0.7} />
          <text x={cx} y={cy - r.ry - 6} textAnchor="middle" style={{ fontSize: 10.5, fill: 'rgb(var(--c-muted))', letterSpacing: 1.1, textTransform: 'uppercase' }}>{ringLabels[i]}</text>
        </g>
      ))}

      {/* Relationships */}
      {edges.map((e) => {
        const a = pos.get(e.from)
        const b = pos.get(e.to)
        if (!a || !b) return null
        const lit = related && (e.from === selectedId || e.to === selectedId)
        const dim = related && !lit
        const fromHave = status.get(e.from)?.status === 'have'
        const needed = stepNo.has(e.from)
        const color = lit ? 'rgb(var(--c-accent))' : needed ? 'rgb(var(--c-warning))' : fromHave ? 'rgb(var(--c-success))' : 'rgb(var(--c-muted) / 0.6)'
        const mx = (a.x + b.x) / 2
        const my = (a.y + b.y) / 2
        const label = e.kind === 'role' ? WEIGHT_TEXT[e.weight] : 'learn first'
        return (
          <g key={`${e.from}-${e.to}`} opacity={dim ? 0.07 : 1}>
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={color} strokeWidth={lit ? 2.4 : needed ? 1.9 : 1.2} opacity={lit ? 1 : needed ? 0.9 : 0.45} />
            {lit && (
              <g>
                <rect x={mx - 36} y={my - 9} width={72} height={18} rx={9} fill="rgb(var(--c-bg))" stroke="rgb(var(--c-accent))" strokeWidth={1} />
                <text x={mx} y={my} textAnchor="middle" dominantBaseline="central" style={{ fontSize: 10, fill: 'rgb(var(--c-accent))' }}>{label}</text>
              </g>
            )}
          </g>
        )
      })}

      {/* Entities */}
      {nodes.map((n) => {
        const p = pos.get(n.id)
        const isCenter = n.id === centerId
        const w = pillW(n.label, isCenter)
        const st = status.get(n.id)?.status
        const step = stepNo.get(n.id)
        const color = DOMAINS[n.domain]?.color || 'rgb(var(--c-muted))'
        const dim = related && !related.has(n.id)
        const selected = selectedId === n.id
        const stroke = isCenter ? 'rgb(var(--c-accent2))' : step ? 'rgb(var(--c-warning))' : st === 'have' ? 'rgb(var(--c-success))' : st === 'implied' ? 'rgb(var(--c-success) / calc(0.7 * var(--a-boost)))' : color
        const marked = (step || st === 'have') && !isCenter
        return (
          <g
            key={n.id}
            transform={`translate(${p.x - w / 2},${p.y - PILL_H / 2})`}
            opacity={dim ? 0.18 : 1}
            style={{ cursor: 'pointer' }}
            role="button"
            tabIndex={0}
            aria-label={`${n.label}${step ? `, step ${step}` : st === 'have' ? ', you have this' : ''}`}
            onClick={() => onSelect(selected ? null : n.id)}
            onKeyDown={(ev) => (ev.key === 'Enter' || ev.key === ' ') && onSelect(selected ? null : n.id)}
          >
            <title>{n.label}{n.type === 'skill' ? ` · about ${n.hours} hours` : ''}</title>
            <rect
              width={w}
              height={PILL_H}
              rx={PILL_H / 2}
              fill={isCenter ? 'rgb(var(--c-accent2) / calc(0.55 * var(--a-boost)))' : 'rgb(var(--c-navy-800))'}
              stroke={selected ? 'rgb(var(--c-text))' : stroke}
              strokeWidth={selected ? 2.6 : isCenter || marked ? 2 : 1.2}
              strokeDasharray={st === 'implied' && !step ? '4 3' : undefined}
            />
            {!isCenter && <rect width={w} height={PILL_H} rx={PILL_H / 2} fill={color} opacity={step ? 0.12 : 0.18} />}
            <text
              x={marked ? 30 : w / 2}
              y={PILL_H / 2}
              textAnchor={marked ? 'start' : 'middle'}
              dominantBaseline="central"
              style={{ fontSize: isCenter ? 15 : 13.5, fontWeight: isCenter ? 800 : 600, fill: isCenter ? 'rgb(var(--c-text))' : 'rgb(var(--c-text))' }}
            >
              {truncate(n.label, 24)}
            </text>
            {step && (
              <g>
                <circle cx={16} cy={PILL_H / 2} r={10} fill="#fbbf24" />
                <text x={16} y={PILL_H / 2} textAnchor="middle" dominantBaseline="central" style={{ fontSize: 11.5, fontWeight: 800, fill: '#1f1300' }}>{step}</text>
              </g>
            )}
            {!step && marked && (
              <g>
                <circle cx={16} cy={PILL_H / 2} r={9} fill="#10b981" />
                <path d="M11.5,16 L14.8,19.2 L20.6,12.8" fill="none" stroke="#052e1f" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
              </g>
            )}
          </g>
        )
      })}
    </svg>
  )
}
