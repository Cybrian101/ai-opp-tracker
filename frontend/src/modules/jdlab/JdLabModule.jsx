import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Crosshair,
  Clock,
  CheckCircle2,
  CircleDashed,
  XCircle,
  ShieldAlert,
  Briefcase,
  MessageSquare,
  Hammer,
  Send,
  Wand2,
} from 'lucide-react'
import useModule from '../../lib/useModule'
import useOpportunityStore from '../../stores/opportunityStore'
import { Card, CopyButton, ErrorPanel, LoadingPanel, ModuleHeader, ScoreRing } from '../ui'

const SAMPLE_JD = `Junior Data Engineer, Acme Analytics (Bengaluru, hybrid).
You will build and maintain ETL pipelines in Python and SQL, orchestrate them with Airflow, load data into a cloud warehouse (BigQuery or Redshift), and containerise services with Docker.
Requirements: 0-2 years of experience, strong Python and SQL, familiarity with Git and CI, exposure to AWS or GCP, good communication.
Nice to have: Spark, dbt, unit testing.`

const VERDICT = {
  ready: { label: 'Ready to apply', badge: 'badge-green', color: 'rgb(var(--c-success))' },
  stretch: { label: 'Stretch, close the gaps first', badge: 'badge-amber', color: 'rgb(var(--c-warning))' },
  not_yet: { label: 'Not yet, but here is the path', badge: 'badge-red', color: 'rgb(var(--c-error))' },
}

const STATUS_ICON = {
  met: <CheckCircle2 className="w-4 h-4 text-success-green flex-shrink-0" />,
  partial: <CircleDashed className="w-4 h-4 text-warning-amber flex-shrink-0" />,
  missing: <XCircle className="w-4 h-4 text-error-red flex-shrink-0" />,
}

const SEVERITY_BADGE = { high: 'badge-red', medium: 'badge-amber', low: 'badge-cyan' }

function TimeMachine({ now, milestones }) {
  const [step, setStep] = useState(0)
  const points = [{ label: 'Today', eligibilityAfter: now, weeks: 0 }, ...milestones]
  const current = points[step]
  const totalWeeks = points.slice(0, step + 1).reduce((sum, p) => sum + p.weeks, 0)
  const color = current.eligibilityAfter >= 70 ? 'rgb(var(--c-success))' : current.eligibilityAfter >= 45 ? 'rgb(var(--c-warning))' : 'rgb(var(--c-error))'

  return (
    <Card title="Job qualification time machine" icon={Clock}>
      <div className="flex items-center gap-5">
        <ScoreRing value={current.eligibilityAfter} size={96} label="eligible" color={color} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text-primary">{step === 0 ? 'Where you are today' : current.label}</p>
          <p className="text-xs text-text-muted mt-1">
            {step === 0
              ? 'Drag the slider to see your eligibility after each milestone.'
              : `After about ${totalWeeks} week${totalWeeks === 1 ? '' : 's'} of work. Estimated, not guaranteed.`}
          </p>
        </div>
      </div>
      <input
        type="range"
        min={0}
        max={points.length - 1}
        step={1}
        value={step}
        onChange={(e) => setStep(Number(e.target.value))}
        aria-label="Milestones completed"
        className="w-full mt-4 accent-cyan-400"
      />
      <ol className="mt-3 space-y-1.5">
        {milestones.map((m, i) => {
          const done = i < step
          return (
            <li key={m.label} className={`flex items-center gap-2 text-xs ${done ? 'text-success-green' : 'text-text-muted'}`}>
              {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : <CircleDashed className="w-3.5 h-3.5" />}
              <span className="flex-1">{m.label}</span>
              <span className="badge badge-cyan !normal-case">{m.type}</span>
              <span>{m.weeks}w</span>
              <span className="w-10 text-right font-semibold">{m.eligibilityAfter}%</span>
            </li>
          )
        })}
      </ol>
    </Card>
  )
}

function AnswerCoach({ question, role }) {
  const [answer, setAnswer] = useState('')
  const { data, loading, error, run } = useModule('evaluate')

  return (
    <div className="mt-3 space-y-2">
      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        rows={4}
        placeholder="Practice your answer here, then get scored..."
        className="w-full bg-navy-900/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-cyan/50"
      />
      <button
        onClick={() => run({ question, answer, role })}
        disabled={loading || answer.trim().length < 10}
        className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg text-onaccent disabled:opacity-50"
        style={{ background: 'var(--grad-brand)' }}
      >
        <Send className="w-3.5 h-3.5" /> {loading ? 'Scoring...' : 'Score my answer'}
      </button>
      {error && <p className="text-xs text-error-red">{error}</p>}
      {data && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 rounded-xl bg-white/4 border border-white/10 space-y-3">
          <div className="flex items-center gap-4">
            <ScoreRing value={data.overall * 10} size={64} label="/10" />
            <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-1">
              {Object.entries(data.scores).map(([k, v]) => (
                <div key={k} className="text-[11px] text-text-muted flex justify-between capitalize">
                  <span>{k}</span>
                  <span className="text-text-primary font-semibold">{v}/10</span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-sm text-text-primary">{data.verdict}</p>
          {data.strengths.length > 0 && (
            <ul className="text-xs text-success-green space-y-0.5">
              {data.strengths.map((s) => (
                <li key={s}>+ {s}</li>
              ))}
            </ul>
          )}
          {data.improvements.length > 0 && (
            <ul className="text-xs text-warning-amber space-y-0.5">
              {data.improvements.map((s) => (
                <li key={s}>→ {s}</li>
              ))}
            </ul>
          )}
          {data.improvedAnswer && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-[11px] uppercase tracking-wide text-text-muted">A stronger version</p>
                <CopyButton text={data.improvedAnswer} />
              </div>
              <p className="text-xs text-text-primary leading-relaxed">{data.improvedAnswer}</p>
            </div>
          )}
          {data.followUp && (
            <p className="text-xs text-text-muted">
              <span className="text-accent-cyan">Likely follow-up: </span>
              {data.followUp}
            </p>
          )}
        </motion.div>
      )}
    </div>
  )
}

export default function JdLabModule({ onBuildSkill }) {
  const [jd, setJd] = useState('')
  const hasBreak = useOpportunityStore((s) => Boolean(s.comeback))
  const { data, loading, error, run } = useModule('jdlab')
  const [openQ, setOpenQ] = useState(null)

  const verdict = data ? VERDICT[data.eligibility.verdict] : null

  return (
    <div className="space-y-5">
      <ModuleHeader
        icon={Crosshair}
        title="JD Lab"
        subtitle="Paste a real job description. Get your honest odds, what blocks you, how to close the gap, and the interview you are about to have."
      />

      <Card>
        <textarea
          value={jd}
          onChange={(e) => setJd(e.target.value)}
          rows={7}
          maxLength={6000}
          placeholder="Paste the full job description here..."
          aria-label="Job description"
          className="w-full bg-navy-900/60 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-cyan/50"
        />
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <button
            onClick={() => run({ jobDescription: jd, careerBreak: hasBreak })}
            disabled={loading || jd.trim().length < 40}
            className="flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl font-semibold text-onaccent disabled:opacity-50"
            style={{ background: 'var(--grad-brand)' }}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Analysing...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" /> Analyse this job
              </>
            )}
          </button>
          <button onClick={() => setJd(SAMPLE_JD)} className="text-xs px-3 py-2 rounded-lg border border-white/10 text-text-muted hover:text-text-primary hover:bg-white/5">
            Use a sample job
          </button>
          <span className="ml-auto text-[11px] text-text-muted">{jd.length}/6000</span>
        </div>
      </Card>

      {loading && !data && <LoadingPanel message="Comparing you against the job (this one is thorough, ~30s)..." />}
      {error && <ErrorPanel message={error} onRetry={() => run()} />}

      {data && verdict && (
        <>
          <Card>
            <div className="flex items-center gap-5">
              <ScoreRing value={data.eligibility.now} size={96} label="eligible" color={verdict.color} />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-text-muted">
                  {data.roleTitle}
                  {data.company && ` · ${data.company}`}
                </p>
                <span className={`badge ${verdict.badge} mt-1`}>{verdict.label}</span>
                <p className="text-sm text-text-primary mt-2 leading-relaxed">{data.eligibility.summary}</p>
              </div>
            </div>
          </Card>

          {data.milestones.length > 0 && <TimeMachine now={data.eligibility.now} milestones={data.milestones} />}

          <Card title="Requirement check">
            <ul className="space-y-2">
              {data.requirements.map((q) => (
                <li key={q.requirement} className="flex gap-2.5">
                  {STATUS_ICON[q.status]}
                  <div className="min-w-0">
                    <p className="text-sm text-text-primary">{q.requirement}</p>
                    <p className="text-xs text-text-muted">{q.evidence}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          {data.blockers.length > 0 && (
            <Card title="What is stopping you, and how to fix it" icon={ShieldAlert}>
              <div className="space-y-2">
                {data.blockers.map((b) => (
                  <div key={b.blocker} className="p-3 rounded-xl bg-white/4 border border-white/8">
                    <div className="flex items-center gap-2">
                      <span className={`badge ${SEVERITY_BADGE[b.severity]}`}>{b.severity}</span>
                      <p className="text-sm font-semibold text-text-primary flex-1">{b.blocker}</p>
                      <span className="text-[11px] text-text-muted">~{b.weeks}w</span>
                    </div>
                    <p className="text-xs text-text-muted mt-1.5 leading-relaxed">{b.howToClose}</p>
                    {onBuildSkill && (
                      <button
                        onClick={() => onBuildSkill(b.skill || b.blocker, data.roleTitle)}
                        className="mt-2 flex items-center gap-1 text-[11px] text-accent-cyan hover:underline"
                      >
                        <Hammer className="w-3 h-3" /> Generate a project to close this
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            {data.alternativeRoles.length > 0 && (
              <Card title="Roles you are more ready for" icon={Briefcase}>
                <ul className="space-y-2">
                  {data.alternativeRoles.map((a) => (
                    <li key={a.title} className="text-xs">
                      <span className="text-sm font-semibold text-text-primary">{a.title}</span>
                      <span className="badge badge-green ml-2">{a.fit}%</span>
                      <p className="text-text-muted mt-0.5">{a.why}</p>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
            <Card title="ATS keywords">
              {data.keywords.present.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {data.keywords.present.map((k) => (
                    <span key={k} className="badge badge-green !normal-case">
                      {k}
                    </span>
                  ))}
                </div>
              )}
              {data.keywords.missing.length > 0 && (
                <>
                  <p className="text-[11px] text-text-muted mb-1.5">Missing from your resume:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {data.keywords.missing.map((k) => (
                      <span key={k} className="badge badge-red !normal-case">
                        {k}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </Card>
          </div>

          {data.tailoredSummary && (
            <Card title="Resume summary tailored to this job" right={<CopyButton text={data.tailoredSummary} />}>
              <p className="text-sm text-text-primary leading-relaxed">{data.tailoredSummary}</p>
            </Card>
          )}

          <Card title="Your interview: questions built from this job and your resume" icon={MessageSquare}>
            <ul className="space-y-2">
              {data.interviewQuestions.map((q, i) => (
                <li key={q.question} className="rounded-xl bg-white/4 border border-white/8">
                  <button
                    onClick={() => setOpenQ(openQ === i ? null : i)}
                    className="w-full text-left p-3 flex items-start gap-2"
                    aria-expanded={openQ === i}
                  >
                    <span className={`badge flex-shrink-0 ${q.type === 'gap' ? 'badge-red' : q.type === 'technical' ? 'badge-cyan' : 'badge-purple'}`}>
                      {q.type === 'gap' ? 'your gap' : q.type}
                    </span>
                    <span className="text-sm text-text-primary">{q.question}</span>
                  </button>
                  {openQ === i && (
                    <div className="px-3 pb-3">
                      <p className="text-xs text-text-muted">
                        <span className="text-accent-cyan">Why they ask: </span>
                        {q.whyAsked}
                      </p>
                      <p className="text-xs text-text-muted mt-1">
                        <span className="text-success-green">Tip: </span>
                        {q.tip}
                      </p>
                      <AnswerCoach question={q.question} role={data.roleTitle} />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}
    </div>
  )
}
