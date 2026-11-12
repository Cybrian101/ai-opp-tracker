import { useState } from 'react'
import { Sunrise, MessageCircle, Briefcase, RefreshCw, Heart, ArrowRight, Lock } from 'lucide-react'
import useModule from '../../lib/useModule'
import useOpportunityStore from '../../stores/opportunityStore'
import { Card, CopyButton, ErrorPanel, LoadingPanel, ModuleHeader } from '../ui'

const BREAKS = [
  { label: 'Under a year', months: 9 },
  { label: '1 to 2 years', months: 18 },
  { label: '2 to 4 years', months: 36 },
  { label: '4 to 7 years', months: 66 },
  { label: 'More than 7 years', months: 96 },
]

const FLEX = [
  { id: 'remote', label: 'Remote' },
  { id: 'part-time', label: 'Part-time' },
  { id: 'school-hours', label: 'School-hours friendly' },
  { id: 'flexible-start', label: 'Flexible start date' },
]

const FIELDS = [
  { id: 'engineering', label: 'Engineering / tech' },
  { id: 'teaching', label: 'Teaching / education' },
  { id: 'other', label: 'Something else' },
]

const CONFIDENCE_BADGE = { low: 'badge-amber', medium: 'badge-cyan', high: 'badge-green' }

export default function ComebackModule({ onOpenPlan }) {
  const { data, loading, error, run } = useModule('comeback')
  const setComeback = useOpportunityStore((s) => s.setComeback)
  // A demo persona arrives with the form answered; real users start with an empty form.
  const saved = useOpportunityStore.getState().comeback
  const nearest = (m) => BREAKS.reduce((best, b) => (Math.abs(b.months - m) < Math.abs(best.months - m) ? b : best), BREAKS[0]).months
  const [months, setMonths] = useState(saved ? nearest(saved.breakMonths) : BREAKS[1].months)
  const [hours, setHours] = useState(saved?.hoursPerWeek ?? 10)
  const [flex, setFlex] = useState(saved?.flexibility ?? [])
  const [field, setField] = useState(saved?.field ?? 'engineering')
  const [activities, setActivities] = useState(saved?.activities ?? '')

  function toggleFlex(id) {
    setFlex((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]))
  }

  function submit(e) {
    e.preventDefault()
    const input = { breakMonths: months, hoursPerWeek: hours, flexibility: flex, field, activities }
    setComeback(input) // other tools (JD Lab, 90-Day Plan) now know about the break
    run(input)
  }

  return (
    <div className="space-y-5">
      <ModuleHeader
        icon={Sunrise}
        title="Returning to work"
        subtitle="Taking time away is not a gap in your ability. Tell us a little, and get honest ways to explain it, experience you may be undervaluing, and a plan that fits your hours."
      />

      <Card>
        <form onSubmit={submit} className="space-y-4">
          <p className="flex items-center gap-1.5 text-[11px] text-text-muted">
            <Lock className="w-3 h-3" /> Everything here is optional, stays in this browser tab, and is only used to personalise your results.
          </p>

          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs text-text-muted">How long was your break?</span>
              <select
                value={months}
                onChange={(e) => setMonths(Number(e.target.value))}
                className="mt-1 w-full bg-navy-800 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent-cyan/50"
              >
                {BREAKS.map((b) => (
                  <option key={b.months} value={b.months}>
                    {b.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-xs text-text-muted">
                Hours per week you can give: <span className="text-text-primary font-semibold">{hours}</span>
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
          </div>

          <div>
            <span className="text-xs text-text-muted">Field you are returning to</span>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {FIELDS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setField(f.id)}
                  aria-pressed={field === f.id}
                  className={`text-xs px-3 py-2 rounded-lg border transition-all ${
                    field === f.id ? 'border-accent-cyan/50 bg-accent-cyan/10 text-accent-cyan' : 'border-white/10 text-text-muted hover:bg-white/5'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="text-xs text-text-muted">What kind of work arrangement do you need?</span>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {FLEX.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => toggleFlex(f.id)}
                  aria-pressed={flex.includes(f.id)}
                  className={`text-xs px-3 py-2 rounded-lg border transition-all ${
                    flex.includes(f.id) ? 'border-accent-purple/50 bg-accent-purple/10 text-accent-purple' : 'border-white/10 text-text-muted hover:bg-white/5'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <label className="block">
            <span className="text-xs text-text-muted">
              What did you do during your break? Caregiving, household, community, volunteering, learning, anything. (optional)
            </span>
            <textarea
              value={activities}
              onChange={(e) => setActivities(e.target.value)}
              rows={4}
              maxLength={1500}
              placeholder="For example: managed the household budget, organised the school fundraiser, tutored neighbours' kids, finished an online Python course..."
              className="mt-1 w-full bg-navy-900/60 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-cyan/50"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-onaccent disabled:opacity-50"
            style={{ background: 'var(--grad-brand)' }}
          >
            {loading ? 'Preparing...' : data ? 'Update my results' : 'Show me my path back'}
          </button>
        </form>
      </Card>

      {loading && !data && <LoadingPanel message="Reading your background and preparing your path back..." />}
      {error && <ErrorPanel message={error} onRetry={() => run()} />}

      {data && (
        <>
          {data.confidenceNote && (
            <Card title="Before anything else" icon={Heart}>
              <p className="text-sm text-text-primary leading-relaxed">{data.confidenceNote}</p>
            </Card>
          )}

          <Card title="Explaining your break" icon={MessageCircle}>
            <ul className="space-y-1.5">
              {data.gapFraming.lines.map((l) => (
                <li key={l} className="text-sm text-text-primary flex gap-2">
                  <span className="text-accent-cyan">•</span>
                  {l}
                </li>
              ))}
            </ul>
            {data.gapFraming.interviewAnswer && (
              <div className="mt-4 p-3 rounded-xl bg-white/4 border border-white/8">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[11px] uppercase tracking-wide text-text-muted">If they ask "tell me about your break"</p>
                  <CopyButton text={data.gapFraming.interviewAnswer} />
                </div>
                <p className="text-sm text-text-primary leading-relaxed">{data.gapFraming.interviewAnswer}</p>
              </div>
            )}
          </Card>

          {data.transferable.length > 0 && (
            <Card title="Experience you may be undervaluing" icon={Briefcase}>
              <div className="space-y-3">
                {data.transferable.map((t) => (
                  <div key={t.activity} className="p-3 rounded-xl bg-white/4 border border-white/8">
                    <p className="text-xs text-text-muted">{t.activity}</p>
                    <p className="text-sm font-semibold text-text-primary mt-0.5">{t.competency}</p>
                    <div className="flex items-start gap-2 mt-2">
                      <p className="flex-1 text-xs text-success-green leading-relaxed">“{t.resumeBullet}”</p>
                      <CopyButton text={t.resumeBullet} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {data.refresh.length > 0 && (
            <Card title="What may have changed, and small ways to catch up" icon={RefreshCw}>
              <p className="text-[11px] text-text-muted mb-3">
                These are estimates from general knowledge, not market data. Check them against current job postings.
              </p>
              <div className="space-y-2">
                {data.refresh.map((r) => (
                  <div key={r.area} className="p-3 rounded-xl bg-white/4 border border-white/8">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-text-primary flex-1">{r.area}</p>
                      <span className={`badge ${CONFIDENCE_BADGE[r.confidence]}`}>{r.confidence} confidence</span>
                      <span className="text-[11px] text-text-muted">~{r.hours}h</span>
                    </div>
                    <p className="text-xs text-text-muted mt-1 leading-relaxed">{r.whatMayHaveChanged}</p>
                    <p className="text-xs text-accent-cyan mt-1 leading-relaxed">Try: {r.refresher}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {onOpenPlan && (
            <Card>
              <div className="flex flex-wrap items-center gap-3">
                <p className="flex-1 min-w-[200px] text-sm text-text-primary">
                  Ready for a plan that fits {hours} hours a week? We will build 13 weeks around your time.
                </p>
                <button
                  onClick={() => onOpenPlan({ hoursPerWeek: hours, field })}
                  className="flex items-center gap-1.5 text-sm px-4 py-2.5 rounded-xl font-semibold text-onaccent"
                  style={{ background: 'var(--grad-brand)' }}
                >
                  Build my 13-week plan <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
