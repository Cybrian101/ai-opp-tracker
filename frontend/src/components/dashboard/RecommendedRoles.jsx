import { motion } from 'framer-motion'
import { Target } from 'lucide-react'

function MatchRing({ percent = 0, size = 72 }) {
  const radius = (size - 8) / 2
  const circumference = 2 * Math.PI * radius
  const clamped = Math.max(0, Math.min(100, percent))
  const offset = circumference - (clamped / 100) * circumference

  const color =
    clamped >= 75 ? 'rgb(var(--c-success))' :
    clamped >= 50 ? 'rgb(var(--c-warning))' :
    'rgb(var(--c-muted))'

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgb(var(--c-fg) / calc(0.07 * var(--fg-boost)))"
          strokeWidth={7}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={7}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold" style={{ color }}>{clamped}%</span>
      </div>
    </div>
  )
}

function SkeletonRoles() {
  return (
    <div className="glass-card rounded-2xl p-6 space-y-4 animate-pulse">
      <div className="h-6 w-44 skeleton rounded" />
      <div className="flex gap-4 overflow-hidden">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="w-52 h-36 skeleton rounded-xl flex-shrink-0" />
        ))}
      </div>
    </div>
  )
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}
const cardVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4 } },
}

export default function RecommendedRoles({ roles }) {
  if (!roles) return <SkeletonRoles />
  if (!roles.length) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className="glass-card rounded-2xl p-6 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <Target className="w-5 h-5 text-accent-purple" />
        <h3 className="text-lg font-semibold text-text-primary">Recommended Roles</h3>
        <span className="badge badge-purple ml-auto">{roles.length} roles</span>
      </div>

      {/* Horizontal scrollable row */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin"
        style={{ scrollbarWidth: 'thin' }}
      >
        {roles.map((item, i) => {
          const pct = item.matchPercent ?? item.match_percent ?? 0
          const matchColor =
            pct >= 75 ? 'border-success-green/30 bg-success-green/5' :
            pct >= 50 ? 'border-amber-500/30 bg-amber-500/5' :
            'border-white/10 bg-white/5'

          return (
            <motion.div
              key={i}
              variants={cardVariants}
              className={`flex-shrink-0 w-56 rounded-xl border p-4 flex flex-col gap-3 cursor-default ${matchColor}`}
            >
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-bold text-text-primary text-sm leading-tight flex-1">
                  {item.role}
                </h4>
                <MatchRing percent={pct} size={56} />
              </div>
              {item.reason && (
                <p className="text-xs text-text-muted leading-relaxed line-clamp-3">
                  {item.reason}
                </p>
              )}
            </motion.div>
          )
        })}
      </motion.div>
    </motion.div>
  )
}
