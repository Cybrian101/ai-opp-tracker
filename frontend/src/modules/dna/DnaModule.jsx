import { motion } from 'framer-motion'
import { Dna, Zap, Eye, Repeat, Briefcase, ShieldAlert } from 'lucide-react'
import useModule from '../../lib/useModule'
import { Card, CopyButton, ErrorPanel, LoadingPanel, ModuleHeader } from '../ui'

function RadarChart({ data }) {
  const size = 260
  const c = size / 2
  const radius = 90
  const n = data.length
  const point = (i, scale) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2
    return [c + Math.cos(angle) * radius * scale, c + Math.sin(angle) * radius * scale]
  }
  const poly = data.map((d, i) => point(i, d.score / 100).join(',')).join(' ')

  return (
    <svg viewBox={`-50 0 ${size + 100} ${size}`} className="w-full max-w-[340px] mx-auto" role="img" aria-label="Career DNA radar chart">
      {[0.25, 0.5, 0.75, 1].map((s) => (
        <polygon
          key={s}
          points={data.map((_, i) => point(i, s).join(',')).join(' ')}
          fill="none"
          stroke="rgb(var(--c-fg) / calc(0.08 * var(--fg-boost)))"
        />
      ))}
      {data.map((_, i) => {
        const [x, y] = point(i, 1)
        return <line key={i} x1={c} y1={c} x2={x} y2={y} stroke="rgb(var(--c-fg) / calc(0.08 * var(--fg-boost)))" />
      })}
      <motion.polygon
        points={poly}
        fill="rgb(var(--c-accent) / calc(0.18 * var(--a-boost)))"
        stroke="rgb(var(--c-accent))"
        strokeWidth="2"
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ transformOrigin: `${c}px ${c}px` }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      />
      {data.map((d, i) => {
        const [x, y] = point(i, 1.22)
        return (
          <text
            key={d.axis}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-slate-300"
            style={{ fontSize: 9 }}
          >
            {d.axis} · {d.score}
          </text>
        )
      })}
    </svg>
  )
}

export default function DnaModule({ active = true }) {
  // Only fetch while this tab is open: hidden tabs stay mounted and would otherwise refetch on language change.
  const { data, loading, error, run } = useModule('dna', { auto: active })

  return (
    <div className="space-y-5">
      <ModuleHeader
        icon={Dna}
        title="Career DNA"
        subtitle="Your professional identity: strengths, hidden potential, and experience you forgot to count."
      />

      {loading && !data && <LoadingPanel message="Sequencing your Career DNA..." />}
      {error && !data && <ErrorPanel message={error} onRetry={() => run()} />}

      {data && (
        <>
          <Card className="relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-accent-purple/10 blur-3xl pointer-events-none" />
            <div className="grid md:grid-cols-2 gap-6 items-center relative">
              <div>
                <span className="badge badge-purple">Your archetype</span>
                <h3 className="text-2xl font-bold gradient-text mt-2">{data.archetype.title}</h3>
                <p className="text-text-primary text-sm mt-1 italic">{data.archetype.tagline}</p>
                <p className="text-text-muted text-sm mt-3 leading-relaxed">{data.archetype.description}</p>
                {data.superpower && (
                  <div className="mt-4 p-3 rounded-xl bg-accent-cyan/5 border border-accent-cyan/20 flex gap-2">
                    <Zap className="w-4 h-4 text-accent-cyan mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-text-primary">
                      <span className="font-semibold">Superpower: </span>
                      {data.superpower}
                    </p>
                  </div>
                )}
              </div>
              <RadarChart data={data.radar} />
            </div>
          </Card>

          {data.workingStyle.length > 0 && (
            <div className="grid sm:grid-cols-3 gap-3">
              {data.workingStyle.map((w) => (
                <Card key={w.trait} className="!p-4">
                  <p className="text-sm font-semibold text-text-primary">{w.trait}</p>
                  <p className="text-xs text-text-muted mt-1 leading-relaxed">{w.evidence}</p>
                </Card>
              ))}
            </div>
          )}

          {data.hiddenPotentials.length > 0 && (
            <Card title="Hidden potential you may not see in yourself" icon={Eye}>
              <div className="space-y-3">
                {data.hiddenPotentials.map((h) => (
                  <div key={h.title} className="p-3 rounded-xl bg-white/4 border border-white/8">
                    <p className="text-sm font-semibold text-text-primary">{h.title}</p>
                    <p className="text-xs text-text-muted mt-1 leading-relaxed">
                      <span className="text-accent-cyan">Evidence: </span>
                      {h.evidence}
                    </p>
                    <p className="text-xs text-text-muted mt-1 leading-relaxed">{h.whyItMatters}</p>
                    {h.roles.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {h.roles.map((r) => (
                          <span key={r} className="badge badge-cyan !normal-case">
                            {r}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {data.informalExperience.length > 0 && (
            <Card title="Experience translator: say it the way recruiters hear it" icon={Briefcase}>
              <div className="space-y-3">
                {data.informalExperience.map((i) => (
                  <div key={i.activity} className="p-3 rounded-xl bg-white/4 border border-white/8">
                    <p className="text-xs text-text-muted">{i.activity}</p>
                    <p className="text-sm font-semibold text-text-primary mt-1">{i.professionalTranslation}</p>
                    <div className="flex items-start gap-2 mt-2">
                      <p className="flex-1 text-xs text-success-green leading-relaxed">“{i.resumeBullet}”</p>
                      <CopyButton text={i.resumeBullet} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {data.transferableSkills.length > 0 && (
            <Card title="Transferable skills" icon={Repeat}>
              <div className="grid sm:grid-cols-2 gap-2">
                {data.transferableSkills.map((t) => (
                  <div key={t.skill} className="p-3 rounded-xl bg-white/4 border border-white/8">
                    <p className="text-sm font-semibold text-text-primary">{t.skill}</p>
                    <p className="text-xs text-text-muted mt-0.5">Built in: {t.from}</p>
                    <p className="text-xs text-accent-cyan mt-0.5">Also useful for: {t.appliesTo}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {data.blindSpots.length > 0 && (
            <Card title="Blind spots (honest feedback)" icon={ShieldAlert}>
              <div className="space-y-2">
                {data.blindSpots.map((b) => (
                  <div key={b.risk} className="p-3 rounded-xl bg-warning-amber/5 border border-warning-amber/20">
                    <p className="text-sm text-text-primary">{b.risk}</p>
                    <p className="text-xs text-text-muted mt-1">
                      <span className="text-warning-amber">Fix: </span>
                      {b.fix}
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
