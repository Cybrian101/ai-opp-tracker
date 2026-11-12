import { useEffect, useState } from 'react'
import { CalendarDays, Download, AlertTriangle, ChevronDown, Wand2 } from 'lucide-react'
import useModule from '../../lib/useModule'
import useOpportunityStore from '../../stores/opportunityStore'
import { downloadIcs } from '../../lib/ics'
import { Card, ErrorPanel, LoadingPanel, ModuleHeader } from '../ui'

const FOCUS = [
  { id: 'job', label: 'Get a job soon' },
  { id: 'skills', label: 'Build skills first' },
  { id: 'switch', label: 'Switch roles' },
]

function ReadinessCurve({ weeks }) {
  const w = 560
  const h = 150
  const padX = 28
  const padY = 16
  if (weeks.length < 2) return null
  const x = (i) => padX + (i * (w - padX * 2)) / (weeks.length - 1)
  const y = (v) => h - padY - (v / 100) * (h - padY * 2)
  const line = weeks.map((wk, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(wk.readiness)}`).join(' ')
  const area = `${line} L${x(weeks.length - 1)},${h - padY} L${x(0)},${h - padY} Z`

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" role="img" aria-label="Interview readiness over 13 weeks">
      {[0, 50, 100].map((v) => (
        <g key={v}>
          <line x1={padX} x2={w - padX} y1={y(v)} y2={y(v)} stroke="rgb(var(--c-fg) / calc(0.08 * var(--fg-boost)))" />
          <text x={4} y={y(v) + 3} className="fill-slate-500" style={{ fontSize: 8 }}>
            {v}%
          </text>
        </g>
      ))}
      <path d={area} fill="rgb(var(--c-accent) / calc(0.12 * var(--a-boost)))" />
      <path d={line} fill="none" stroke="rgb(var(--c-accent))" strokeWidth="2.2" strokeLinejoin="round" />
      {weeks.map((wk, i) => (
        <circle key={wk.week} cx={x(i)} cy={y(wk.readiness)} r="2.6" fill="rgb(var(--c-accent))" />
      ))}
      <text x={padX} y={h - 2} className="fill-slate-500" style={{ fontSize: 8 }}>
        Week 1
      </text>
      <text x={w - padX} y={h - 2} textAnchor="end" className="fill-slate-500" style={{ fontSize: 8 }}>
        Week {weeks[weeks.length - 1].week}
      </text>
    </svg>
  )
}

export default function SimulatorModule({ request }) {
  const topRole = useOpportunityStore((s) => s.careerAnalysis?.recommendedRoles?.[0]?.role || '')
  const [hours, setHours] = useState(8)
  const [focus, setFocus] = useState('job')
  const [role, setRole] = useState('')
  const [open, setOpen] = useState(1)
  const { data, loading, error, run } = useModule('simulator')

  // Arriving from "Returning to work" starts the plan with the user's own hours.
  useEffect(() => {
    if (request?.hoursPerWeek) {
      setHours(request.hoursPerWeek)
      run({ hoursPerWeek: request.hoursPerWeek, focus: 'job', targetRole: role || topRole })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request?.nonce])

  function build() {
    run({ hoursPerWeek: hours, focus, targetRole: role || topRole })
  }

  const totalHours = data ? data.weeks.reduce((sum, wk) => sum + wk.hours, 0) : 0

  return (
    <div className="space-y-5">
      <ModuleHeader
        icon={CalendarDays}
        title="90-Day Plan"
        subtitle="A 13-week plan sized to the hours you really have. Change your time or focus and re-plan."
      />

      <Card>
        <div className="grid sm:grid-cols-3 gap-4 items-end">
          <label className="block">
            <span className="text-xs text-text-muted">
              Hours per week: <span className="text-text-primary font-semibold">{hours}</span>
            </span>
            <input
              type="range"
              min={3}
              max={40}
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
              className="mt-3 w-full accent-cyan-400"
            />
          </label>
          <label className="block">
            <span className="text-xs text-text-muted">Your focus</span>
            <select
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              className="mt-1 w-full bg-navy-800 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent-cyan/50"
            >
              {FOCUS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs text-text-muted">Target role</span>
            <input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              maxLength={120}
              placeholder={topRole || 'e.g. Junior Data Analyst'}
              className="mt-1 w-full bg-navy-900/60 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-cyan/50"
            />
          </label>
        </div>
        <button
          onClick={build}
          disabled={loading}
          className="mt-4 flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl font-semibold text-onaccent disabled:opacity-50"
          style={{ background: 'var(--grad-brand)' }}
        >
          <Wand2 className="w-4 h-4" /> {loading ? 'Planning...' : data ? 'Re-plan' : 'Build my plan'}
        </button>
      </Card>

      {loading && !data && <LoadingPanel message="Planning your 13 weeks (this takes about 30 seconds)..." />}
      {error && <ErrorPanel message={error} onRetry={() => run()} />}

      {data && data.weeks.length > 0 && (
        <>
          <Card
            right={
              <button
                onClick={() => downloadIcs(data.weeks)}
                className="flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-lg border border-white/10 text-text-muted hover:text-text-primary hover:bg-white/5"
              >
                <Download className="w-3 h-3" /> Add to calendar (.ics)
              </button>
            }
            title={`${data.hoursPerWeek} hours a week · ${totalHours} hours in total`}
          >
            <p className="text-sm text-text-primary leading-relaxed mb-3">{data.summary}</p>
            <p className="text-[11px] text-text-muted mb-1">Estimated interview readiness (a guide, not a prediction)</p>
            <ReadinessCurve weeks={data.weeks} />
          </Card>

          <div className="space-y-2">
            {data.weeks.map((wk) => {
              const isOpen = open === wk.week
              return (
                <div key={wk.week} className="glass-card rounded-xl overflow-hidden">
                  <button
                    onClick={() => setOpen(isOpen ? null : wk.week)}
                    aria-expanded={isOpen}
                    className="w-full flex items-center gap-3 p-3.5 text-left"
                  >
                    <span className="w-8 h-8 rounded-lg bg-accent-cyan/10 border border-accent-cyan/25 flex items-center justify-center text-xs font-bold text-accent-cyan flex-shrink-0">
                      {wk.week}
                    </span>
                    <span className="flex-1 text-sm font-semibold text-text-primary">{wk.theme}</span>
                    <span className="text-[11px] text-text-muted">{wk.hours}h</span>
                    <span className="badge badge-cyan">{wk.readiness}%</span>
                    <ChevronDown className={`w-4 h-4 text-text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 pl-[3.75rem] space-y-2">
                      <ul className="space-y-1">
                        {wk.goals.map((g) => (
                          <li key={g} className="text-xs text-text-muted">
                            ☐ {g}
                          </li>
                        ))}
                      </ul>
                      {wk.deliverable && (
                        <p className="text-xs text-success-green">
                          <span className="font-semibold">By Sunday: </span>
                          {wk.deliverable}
                        </p>
                      )}
                      {wk.checkpoint && (
                        <p className="text-xs text-text-muted">
                          <span className="text-accent-cyan">Check: </span>
                          {wk.checkpoint}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {data.risks.length > 0 && (
            <Card title="What could derail this, and what to do" icon={AlertTriangle}>
              <div className="space-y-2">
                {data.risks.map((r) => (
                  <div key={r.risk} className="p-3 rounded-xl bg-warning-amber/5 border border-warning-amber/20">
                    <p className="text-sm text-text-primary">{r.risk}</p>
                    <p className="text-xs text-text-muted mt-1">
                      <span className="text-warning-amber">Instead: </span>
                      {r.mitigation}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
