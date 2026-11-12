import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Orbit, Rocket, Flag, AlertTriangle, ArrowRight, Sun } from 'lucide-react'
import useModule from '../../lib/useModule'
import { Card, ErrorPanel, LoadingPanel, ModuleHeader, ScoreRing } from '../ui'

const KIND_STYLE = {
  realistic: { badge: 'badge-green', label: 'Realistic', color: 'rgb(var(--c-success))' },
  stretch: { badge: 'badge-amber', label: 'Stretch', color: 'rgb(var(--c-warning))' },
  wildcard: { badge: 'badge-purple', label: 'Wildcard', color: 'rgb(var(--c-accent2))' },
}

const DIFFICULTY_STYLE = { easy: 'badge-green', moderate: 'badge-amber', hard: 'badge-red' }

export default function MultiverseModule({ onBuildSkill, active = true }) {
  const { data, loading, error, run } = useModule('multiverse', { auto: active })
  const [selectedId, setSelectedId] = useState(null)

  const universes = data?.universes || []
  const selected = universes.find((u) => u.id === selectedId) || universes[0]

  return (
    <div className="space-y-5">
      <ModuleHeader
        icon={Orbit}
        title="Career Multiverse"
        subtitle="Four parallel futures from the same starting point. Compare them before you commit to one."
      />

      {loading && !data && <LoadingPanel message="Simulating four parallel careers..." />}
      {error && !data && <ErrorPanel message={error} onRetry={() => run()} />}

      {selected && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" role="tablist" aria-label="Career universes">
            {universes.map((u) => {
              const kind = KIND_STYLE[u.kind] || KIND_STYLE.realistic
              const active = u.id === selected.id
              return (
                <button
                  key={u.id}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setSelectedId(u.id)}
                  className={`text-left rounded-2xl p-3.5 border transition-all ${
                    active
                      ? 'border-accent-cyan/50 bg-accent-cyan/8 glow-cyan-sm'
                      : 'border-white/10 bg-white/3 hover:border-white/25'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <ScoreRing value={u.fitScore} size={46} color={kind.color} />
                    <span className={`badge ${kind.badge}`}>{kind.label}</span>
                  </div>
                  <p className="text-sm font-semibold text-text-primary leading-snug">{u.role}</p>
                  <p className="text-[11px] text-text-muted mt-1 leading-snug line-clamp-2">{u.tagline}</p>
                </button>
              )
            })}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <Card>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h3 className="text-lg font-bold text-text-primary">{selected.role}</h3>
                  <span className={`badge ${DIFFICULTY_STYLE[selected.difficulty]}`}>{selected.difficulty}</span>
                  <span className="badge badge-cyan">
                    {selected.monthsToFirstRole === 0 ? 'Already there' : `~${selected.monthsToFirstRole} months to first role`}
                  </span>
                </div>
                <p className="text-sm text-text-muted leading-relaxed">{selected.whyYou}</p>
                {selected.dayInLife && (
                  <p className="text-sm text-text-primary leading-relaxed mt-3 flex gap-2">
                    <Sun className="w-4 h-4 text-warning-amber mt-0.5 flex-shrink-0" />
                    <span>{selected.dayInLife}</span>
                  </p>
                )}
              </Card>

              <Card title="Your timeline" icon={Flag}>
                <ol className="relative border-l border-white/10 ml-2 space-y-4">
                  {selected.timeline.map((t, i) => (
                    <motion.li
                      key={t.year}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="ml-5"
                    >
                      <span className="absolute -left-[7px] mt-1 w-3.5 h-3.5 rounded-full bg-accent-cyan border-2 border-navy-900" />
                      <p className="text-xs text-accent-cyan font-semibold">{t.year}</p>
                      <p className="text-sm font-semibold text-text-primary">{t.title}</p>
                      <p className="text-xs text-text-muted leading-relaxed">{t.milestone}</p>
                      {t.skillsGained.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {t.skillsGained.map((s) => (
                            <span key={s} className="badge badge-purple !normal-case">
                              +{s}
                            </span>
                          ))}
                        </div>
                      )}
                    </motion.li>
                  ))}
                </ol>
                {selected.futureTitle && (
                  <p className="mt-4 text-sm text-text-primary">
                    <span className="text-text-muted">Future you: </span>
                    <span className="font-semibold gradient-text">{selected.futureTitle}</span>
                  </p>
                )}
              </Card>

              <div className="grid md:grid-cols-2 gap-4">
                <Card title="Trade-offs" icon={AlertTriangle}>
                  <p className="text-xs text-text-muted leading-relaxed">
                    <span className="text-success-green font-semibold">Best case: </span>
                    {selected.upside}
                  </p>
                  <p className="text-xs text-text-muted leading-relaxed mt-2">
                    <span className="text-error-red font-semibold">Worst case: </span>
                    {selected.downside}
                  </p>
                  {selected.risks.length > 0 && (
                    <ul className="mt-3 space-y-1">
                      {selected.risks.map((r) => (
                        <li key={r} className="text-xs text-text-muted flex gap-1.5">
                          <span className="text-warning-amber">•</span>
                          {r}
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
                <Card title="Take the first step this week" icon={Rocket}>
                  <p className="text-sm text-text-primary leading-relaxed">{selected.firstStep}</p>
                  {onBuildSkill && selected.timeline[0]?.skillsGained[0] && (
                    <button
                      onClick={() => onBuildSkill(selected.timeline[0].skillsGained[0], selected.role)}
                      className="mt-3 flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg text-onaccent"
                      style={{ background: 'var(--grad-brand)' }}
                    >
                      Build a project for {selected.timeline[0].skillsGained[0]} <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </Card>
              </div>
            </motion.div>
          </AnimatePresence>

          <Card title="Side by side">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-text-muted text-left">
                    <th className="py-2 pr-3 font-medium">Universe</th>
                    <th className="py-2 pr-3 font-medium">Fit</th>
                    <th className="py-2 pr-3 font-medium">Difficulty</th>
                    <th className="py-2 pr-3 font-medium">Months to first role</th>
                    <th className="py-2 font-medium">In {universes[0]?.timeline.at(-1)?.year}</th>
                  </tr>
                </thead>
                <tbody>
                  {universes.map((u) => (
                    <tr key={u.id} className="border-t border-white/8 text-text-primary">
                      <td className="py-2 pr-3 font-semibold">{u.role}</td>
                      <td className="py-2 pr-3">{u.fitScore}%</td>
                      <td className="py-2 pr-3 capitalize">{u.difficulty}</td>
                      <td className="py-2 pr-3">{u.monthsToFirstRole}</td>
                      <td className="py-2">{u.futureTitle}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
