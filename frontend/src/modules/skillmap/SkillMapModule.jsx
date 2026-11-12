import { useMemo, useState } from 'react'
import { Network, Route as RouteIcon, CheckCircle2, Circle, CircleDashed, Hammer, Eye } from 'lucide-react'
import useOpportunityStore from '../../stores/opportunityStore'
import { ROLES, nodeById, detectHave, readiness, routeTo, mapRoleTitle, neighbors, resolveRequirements, focusSubgraph } from '../../lib/skillGraph'
import { DOMAINS } from '../../data/skillGraph'
import { Card, ModuleHeader, ScoreRing } from '../ui'
import SkillGraph from './SkillGraph'

const WEIGHT_LABEL = { 3: 'Must have', 2: 'Important', 1: 'Nice to have' }

export default function SkillMapModule({ onBuildSkill }) {
  const profile = useOpportunityStore((s) => s.profile)
  const analysis = useOpportunityStore((s) => s.careerAnalysis)
  const savedHours = useOpportunityStore((s) => s.comeback?.hoursPerWeek)

  const have = useMemo(() => detectHave(profile || {}), [profile])
  const readinessByRole = useMemo(() => Object.fromEntries(ROLES.map((r) => [r.id, readiness(r.id, have)])), [have])

  // Default target: the role the analysis recommends most, else the one the candidate is closest to.
  const defaultRole = useMemo(() => {
    for (const r of analysis?.recommendedRoles || []) {
      const id = mapRoleTitle(r.role)
      if (id) return id
    }
    return [...ROLES].sort((a, b) => readinessByRole[b.id] - readinessByRole[a.id])[0].id
  }, [analysis, readinessByRole])

  const [roleId, setRoleId] = useState(null)
  const targetId = roleId || defaultRole
  const [hours, setHours] = useState(savedHours || 8)
  const [selectedId, setSelectedId] = useState(null)
  const [fullTree, setFullTree] = useState(false)

  const route = useMemo(() => routeTo(targetId, have, hours), [targetId, have, hours])
  const requirements = useMemo(() => resolveRequirements(targetId, have), [targetId, have])
  const targetRole = ROLES.find((r) => r.id === targetId)
  const focus = useMemo(() => focusSubgraph(targetId, have), [targetId, have])
  const stepNo = useMemo(() => new Map(route.steps.map((s, i) => [s.id, i + 1])), [route])
  // Default view: the role, its requirements, and only the skills you are still missing beneath them (what you
  // already know is hidden, which is what keeps the picture readable). "Show all prerequisites" expands the full tree.
  const compact = useMemo(() => {
    const keep = new Set([targetId, ...focus.requirementIds, ...route.steps.map((s) => s.id)])
    return { nodes: focus.nodes.filter((n) => keep.has(n.id)), edges: focus.edges.filter((e) => keep.has(e.from) && keep.has(e.to)) }
  }, [focus, route, targetId])
  const shownNodes = fullTree ? focus.nodes : compact.nodes
  const shownEdges = fullTree ? focus.edges : compact.edges
  const selected = selectedId ? nodeById[selectedId] : null
  const around = selected ? neighbors(selected.id) : null
  const sortedRoles = useMemo(() => [...ROLES].sort((a, b) => readinessByRole[b.id] - readinessByRole[a.id]), [readinessByRole])
  const haveCount = [...have.values()].filter((h) => h.status === 'have').length

  return (
    <div className="space-y-5">
      <ModuleHeader
        icon={Network}
        title="Skill Map"
        subtitle="Pick a role and see only what it takes: skills you already have in green, and the gold numbers are your exact route, in order."
      />

      <Card>
        <p className="text-xs text-text-muted mb-2">Where do you want to go?</p>
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Target role">
          {sortedRoles.map((r) => (
            <button
              key={r.id}
              role="tab"
              aria-selected={r.id === targetId}
              onClick={() => { setRoleId(r.id); setSelectedId(null) }}
              className={`text-xs px-3 py-2 rounded-lg border transition-all ${
                r.id === targetId ? 'border-accent-cyan/60 bg-accent-cyan/10 text-accent-cyan' : 'border-white/10 text-text-muted hover:bg-white/5'
              }`}
            >
              {r.label} <span className="font-semibold ml-1">{readinessByRole[r.id]}%</span>
            </button>
          ))}
        </div>
        <p className="text-[11px] text-text-muted mt-2">
          Percentages show how much of each role you already cover, detected from the {haveCount} skills found in your resume. It is a guide, not a verdict.
        </p>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="glass-card rounded-2xl p-3 min-w-0 lg:col-span-2">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-2 pb-2 text-[11px] text-text-muted">
            {[['rgb(var(--c-success))', 'You have it'], ['rgb(var(--c-success) / calc(0.7 * var(--a-boost)))', 'Likely known (foundation)'], ['rgb(var(--c-warning))', 'Your route, in order'], ['rgb(var(--c-accent2))', 'Target role']].map(([c, l]) => (
              <span key={l} className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm border" style={{ borderColor: c, background: `color-mix(in srgb, ${c} 20%, transparent)` }} />{l}</span>
            ))}
            <button
              onClick={() => setFullTree((v) => !v)}
              aria-pressed={fullTree}
              className="ml-auto flex items-center gap-1 px-2 py-1 rounded-lg border border-white/10 hover:bg-white/5 text-text-muted hover:text-text-primary"
            >
              <Eye className="w-3 h-3" /> {fullTree ? 'Hide skills you have' : 'Show all prerequisites'}
            </button>
          </div>
          <SkillGraph
            nodes={shownNodes}
            edges={shownEdges}
            status={have}
            stepNo={stepNo}
            centerId={targetId}
            maxRing={fullTree ? 3 : 2}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
          <p className="text-[11px] text-text-muted px-2 pt-2">The role is in the middle, its requirements form the first ring (grouped by field), and what you still need to learn sits on the outer ring. Click any skill to see its relationships.</p>
        </div>

        <Card
          title={`Your route to ${targetRole.label}`}
          icon={RouteIcon}
          className="max-h-[560px] overflow-y-auto lg:col-span-2"
        >
          <div className="flex items-center gap-4 mb-3">
            <ScoreRing value={readinessByRole[targetId]} size={64} label="ready" color="rgb(var(--c-warning))" />
            <div className="text-xs text-text-muted leading-relaxed">
              {route.steps.length === 0 ? (
                <span className="text-success-green">You already cover everything this role needs on the map.</span>
              ) : (
                <>
                  <span className="text-text-primary font-semibold">{route.steps.length} steps</span> · about{' '}
                  <span className="text-text-primary font-semibold">{route.totalHours} hours</span> · roughly{' '}
                  <span className="text-text-primary font-semibold">{route.weeks} weeks</span> at {hours} h/week
                </>
              )}
            </div>
          </div>
          <label className="block mb-3">
            <span className="text-[11px] text-text-muted">Hours per week: {hours}</span>
            <input type="range" min={3} max={40} value={hours} onChange={(e) => setHours(Number(e.target.value))} className="w-full accent-amber-400" />
          </label>

          <ol className="space-y-1.5">
            {route.steps.map((s, i) => (
              <li key={s.id}>
                <button
                  onClick={() => setSelectedId(s.id)}
                  className={`w-full text-left flex items-start gap-2.5 p-2.5 rounded-xl border transition-all ${
                    selectedId === s.id ? 'border-amber-400/60 bg-amber-400/10' : 'border-white/8 bg-white/4 hover:border-white/20'
                  }`}
                >
                  <span className="w-6 h-6 rounded-md bg-amber-400/15 border border-amber-400/30 text-amber-300 text-[11px] font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold text-text-primary">{s.label}</span>
                    <span className="block text-[11px] text-text-muted">{s.why}{s.refresher ? ' · quick refresher' : ''}</span>
                  </span>
                  <span className="text-[11px] text-text-muted flex-shrink-0">~{s.hours}h</span>
                </button>
              </li>
            ))}
          </ol>
          <p className="text-[10px] text-text-muted mt-3 leading-relaxed">
            Hours are rough estimates for getting job-ready from a standing start. Real time depends on how you learn.
          </p>
        </Card>
      </div>

      {selected && (
        <Card title={selected.label} right={<span className="badge badge-cyan">{selected.type === 'role' ? 'Role' : DOMAINS[selected.domain].label}</span>}>
          {selected.type === 'skill' && (
            <p className="text-xs text-text-muted mb-3">
              {have.get(selected.id)?.status === 'have' ? <span className="text-success-green">You have this (found: {have.get(selected.id).via}). </span> : have.get(selected.id)?.status === 'implied' ? <span className="text-emerald-300">Likely known, since you use {have.get(selected.id).via}. </span> : <span className="text-amber-300">Not found in your resume. </span>}
              About {selected.hours} hours to learn.
            </p>
          )}
          <div className="grid sm:grid-cols-3 gap-3 text-xs">
            <div>
              <p className="text-text-muted mb-1">{selected.type === 'role' ? 'Needs' : 'Learn first'}</p>
              {selected.type === 'role'
                ? resolveRequirements(selected.id, have).map((r) => <p key={r.id} className="text-text-primary">• {r.label}</p>)
                : around.prereqs.length ? around.prereqs.map((p) => <p key={p.id} className={have.has(p.id) ? 'text-success-green' : 'text-text-primary'}>• {p.label}</p>) : <p className="text-text-muted">Nothing: a starting point</p>}
            </div>
            <div>
              <p className="text-text-muted mb-1">Unlocks</p>
              {around.unlocks.length ? around.unlocks.slice(0, 6).map((u) => <p key={u.id} className="text-text-primary">• {u.label}</p>) : <p className="text-text-muted">None</p>}
            </div>
            <div>
              <p className="text-text-muted mb-1">Roles that need it</p>
              {around.roles.length ? around.roles.slice(0, 6).map((r) => <p key={r.id} className="text-text-primary">• {r.label} <span className="text-text-muted">({WEIGHT_LABEL[r.weight]})</span></p>) : <p className="text-text-muted">None</p>}
            </div>
          </div>
          {selected.type === 'skill' && onBuildSkill && !have.has(selected.id) && (
            <button
              onClick={() => onBuildSkill(selected.label, targetRole.label)}
              className="mt-3 flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-white/10 text-text-primary hover:bg-white/5"
            >
              <Hammer className="w-3.5 h-3.5" /> Build a portfolio project for {selected.label}
            </button>
          )}
        </Card>
      )}

      <Card title={`What ${targetRole.label} roles ask for`}>
        <div className="grid sm:grid-cols-2 gap-1.5">
          {requirements.map((r) => {
            const h = have.get(r.id)
            const Icon = h?.status === 'have' ? CheckCircle2 : h?.status === 'implied' ? CircleDashed : Circle
            const tone = h?.status === 'have' ? 'text-success-green' : h?.status === 'implied' ? 'text-emerald-300' : 'text-text-muted'
            return (
              <button key={`${r.id}-${r.label}`} onClick={() => setSelectedId(r.id)} className="flex items-center gap-2 text-left text-xs p-2 rounded-lg hover:bg-white/5">
                <Icon className={`w-4 h-4 flex-shrink-0 ${tone}`} />
                <span className="flex-1 text-text-primary">{r.label}</span>
                <span className="text-[10px] text-text-muted">{WEIGHT_LABEL[r.weight]}</span>
              </button>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
