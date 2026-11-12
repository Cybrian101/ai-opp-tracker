import { useEffect, useState } from 'react'
import { Hammer, Layers, ListChecks, Trophy, FileText } from 'lucide-react'
import useModule from '../../lib/useModule'
import useOpportunityStore from '../../stores/opportunityStore'
import { Card, CopyButton, ErrorPanel, LoadingPanel, ModuleHeader } from '../ui'

export default function BuilderModule({ initialSkill = '', initialRole = '' }) {
  const gaps = useOpportunityStore((s) => s.careerAnalysis?.skillGaps || [])
  const [skill, setSkill] = useState(initialSkill)
  const { data, loading, error, run } = useModule('builder')

  // Arriving from another module (e.g. a blocker in JD Lab) starts the build straight away.
  useEffect(() => {
    if (initialSkill) {
      setSkill(initialSkill)
      run({ skill: initialSkill, targetRole: initialRole })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSkill, initialRole])

  return (
    <div className="space-y-5">
      <ModuleHeader
        icon={Hammer}
        title="Experience Builder"
        subtitle="No experience with a skill? Get a project designed to prove it, with milestones and a resume bullet ready for when you finish."
      />

      <Card>
        {gaps.length > 0 && (
          <div className="mb-3">
            <p className="text-[11px] text-text-muted mb-1.5">Your skill gaps</p>
            <div className="flex flex-wrap gap-1.5">
              {gaps.map((g) => (
                <button
                  key={g.skill}
                  onClick={() => {
                    setSkill(g.skill)
                    run({ skill: g.skill })
                  }}
                  className="badge badge-cyan !normal-case hover:bg-accent-cyan/25 transition-colors"
                >
                  {g.skill}
                </button>
              ))}
            </div>
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            run({ skill, targetRole: initialRole })
          }}
          className="flex gap-2"
        >
          <input
            value={skill}
            onChange={(e) => setSkill(e.target.value)}
            maxLength={120}
            placeholder="Type any skill, e.g. Docker, Airflow, Figma..."
            aria-label="Skill to build a project for"
            className="flex-1 bg-navy-900/60 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-cyan/50"
          />
          <button
            type="submit"
            disabled={loading || !skill.trim()}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-onaccent disabled:opacity-50"
            style={{ background: 'var(--grad-brand)' }}
          >
            {loading ? 'Designing...' : 'Design project'}
          </button>
        </form>
      </Card>

      {loading && !data && <LoadingPanel message="Designing your portfolio project..." />}
      {error && <ErrorPanel message={error} onRetry={() => run()} />}

      {data && (
        <>
          <Card>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-bold text-text-primary">{data.title}</h3>
              <span className="badge badge-purple">{data.difficulty}</span>
              <span className="badge badge-cyan">~{data.estimatedHours}h</span>
            </div>
            <p className="text-sm text-text-muted mt-2 leading-relaxed">{data.pitch}</p>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {data.techStack.map((t) => (
                <span key={t} className="badge badge-green !normal-case">
                  {t}
                </span>
              ))}
            </div>
            {data.skillsProven.length > 0 && (
              <p className="text-xs text-text-muted mt-3">
                <span className="text-accent-cyan">Proves: </span>
                {data.skillsProven.join(', ')}
              </p>
            )}
          </Card>

          {data.architecture.length > 0 && (
            <Card title="How it fits together" icon={Layers}>
              <ol className="space-y-1.5 list-decimal list-inside">
                {data.architecture.map((a) => (
                  <li key={a} className="text-sm text-text-primary leading-relaxed">
                    {a}
                  </li>
                ))}
              </ol>
            </Card>
          )}

          <Card title="Milestones" icon={ListChecks}>
            <div className="space-y-3">
              {data.milestones.map((m) => (
                <div key={m.title} className="p-3 rounded-xl bg-white/4 border border-white/8">
                  <p className="text-sm font-semibold text-text-primary">
                    <span className="text-accent-cyan">Week {m.week}</span> · {m.title}
                  </p>
                  <ul className="mt-1.5 space-y-0.5">
                    {m.tasks.map((t) => (
                      <li key={t} className="text-xs text-text-muted">
                        ☐ {t}
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-success-green mt-1.5">Deliverable: {m.deliverable}</p>
                </div>
              ))}
            </div>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            {data.evaluationCriteria.length > 0 && (
              <Card title="How it will be judged" icon={Trophy}>
                <ul className="space-y-1">
                  {data.evaluationCriteria.map((c) => (
                    <li key={c} className="text-xs text-text-muted">
                      ✓ {c}
                    </li>
                  ))}
                </ul>
                {data.stretchGoals.length > 0 && (
                  <>
                    <p className="text-[11px] text-text-muted mt-3 mb-1">Stretch goals</p>
                    <ul className="space-y-1">
                      {data.stretchGoals.map((c) => (
                        <li key={c} className="text-xs text-text-muted">
                          ★ {c}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </Card>
            )}
            <Card title="When you finish" icon={FileText} right={data.resumeBullet && <CopyButton text={data.resumeBullet} />}>
              <p className="text-xs text-text-muted mb-1">Resume bullet (fill in your real numbers):</p>
              <p className="text-sm text-text-primary leading-relaxed">{data.resumeBullet}</p>
              {data.readmeOutline.length > 0 && (
                <p className="text-xs text-text-muted mt-3">
                  <span className="text-accent-cyan">README sections: </span>
                  {data.readmeOutline.join(' · ')}
                </p>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
