import { motion } from 'framer-motion'
import { BookOpen, ExternalLink, Layers } from 'lucide-react'

const PRIORITY_CONFIG = {
  high: {
    label: 'High',
    badgeClass: 'badge-red',
    order: 0,
  },
  medium: {
    label: 'Medium',
    badgeClass: 'badge-amber',
    order: 1,
  },
  low: {
    label: 'Low',
    badgeClass: 'badge-cyan',
    order: 2,
  },
}

function groupByPriority(skillGaps) {
  const grouped = { high: [], medium: [], low: [] }
  for (const gap of skillGaps) {
    const p = (gap.priority || 'medium').toLowerCase()
    if (grouped[p]) grouped[p].push(gap)
    else grouped.medium.push(gap)
  }
  return grouped
}

function SkeletonSkillGaps() {
  return (
    <div className="glass-card rounded-2xl p-6 space-y-4 animate-pulse">
      <div className="h-6 w-36 skeleton rounded" />
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-16 skeleton rounded-xl" />
      ))}
    </div>
  )
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}
const itemVariants = {
  hidden: { opacity: 0, x: -15 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.35 } },
}

export default function SkillGaps({ skillGaps }) {
  if (!skillGaps) return <SkeletonSkillGaps />

  if (skillGaps.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Layers className="w-5 h-5 text-accent-cyan" />
          <h3 className="text-lg font-semibold text-text-primary">Skill Gaps</h3>
        </div>
        <div className="py-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-success-green/10 border border-success-green/20 flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">🎯</span>
          </div>
          <p className="text-success-green font-semibold">Great! No critical skill gaps identified.</p>
          <p className="text-text-muted text-sm mt-1">Your profile aligns well with the target roles.</p>
        </div>
      </motion.div>
    )
  }

  const grouped = groupByPriority(skillGaps)
  const priorities = ['high', 'medium', 'low']

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.25 }}
      className="glass-card rounded-2xl p-6 space-y-5"
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <Layers className="w-5 h-5 text-accent-cyan" />
        <h3 className="text-lg font-semibold text-text-primary">Skill Gaps</h3>
        <span className="badge badge-red ml-auto">{skillGaps.length} gaps</span>
      </div>

      {/* Grouped by priority */}
      {priorities.map((priority) => {
        const items = grouped[priority]
        if (!items.length) return null
        const config = PRIORITY_CONFIG[priority]

        return (
          <div key={priority} className="space-y-2">
            <div className="flex items-center gap-2">
              <span className={`badge ${config.badgeClass}`}>{config.label} Priority</span>
              <span className="text-xs text-text-muted">({items.length})</span>
            </div>
            <motion.ul
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-2"
            >
              {items.map((gap, i) => (
                <motion.li
                  key={i}
                  variants={itemVariants}
                  className="flex items-start gap-3 p-3 rounded-xl bg-white/4 border border-white/8 hover:border-white/15 transition-colors"
                >
                  <BookOpen className="w-4 h-4 text-text-muted mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-text-primary">{gap.skill || gap.name}</p>
                    {(gap.learning || gap.recommendation || gap.resource) && (
                      <p className="text-xs text-text-muted mt-0.5 leading-relaxed">
                        {gap.learning || gap.recommendation || gap.resource}
                      </p>
                    )}
                  </div>
                  {(gap.url || gap.link) && (
                    <a
                      href={gap.url || gap.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent-cyan flex-shrink-0 hover:text-accent-purple transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </motion.li>
              ))}
            </motion.ul>
          </div>
        )
      })}
    </motion.div>
  )
}
