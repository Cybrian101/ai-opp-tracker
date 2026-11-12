import { motion } from 'framer-motion'
import { CheckCircle2, AlertTriangle, Brain } from 'lucide-react'

function AnimatedRing({ score = 0, size = 120, label, sublabel }) {
  const radius = (size - 14) / 2
  const circumference = 2 * Math.PI * radius
  const clampedScore = Math.max(0, Math.min(100, score))
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference

  const color =
    clampedScore >= 70 ? 'rgb(var(--c-success))' :
    clampedScore >= 40 ? 'rgb(var(--c-warning))' :
    'rgb(var(--c-error))'

  const trackColor =
    clampedScore >= 70 ? 'rgb(var(--c-success) / calc(0.12 * var(--a-boost)))' :
    clampedScore >= 40 ? 'rgb(var(--c-warning) / calc(0.12 * var(--a-boost)))' :
    'rgb(var(--c-error) / calc(0.12 * var(--a-boost)))'

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={trackColor}
            strokeWidth={12}
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={12}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.4, ease: 'easeOut', delay: 0.2 }}
            style={{ filter: `drop-shadow(0 0 6px ${color}80)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 }}
            className="text-2xl font-bold"
            style={{ color }}
          >
            {clampedScore}
          </motion.span>
          <span className="text-xs text-text-muted">/ 100</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-text-primary">{label}</p>
        {sublabel && <p className="text-xs text-text-muted">{sublabel}</p>}
      </div>
    </div>
  )
}

function SkeletonCareerIntelligence() {
  return (
    <div className="glass-card rounded-2xl p-6 space-y-6 animate-pulse">
      <div className="h-6 w-48 skeleton rounded mb-2" />
      <div className="flex gap-8 justify-center">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div className="w-28 h-28 skeleton rounded-full" />
            <div className="h-4 w-24 skeleton rounded" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="h-32 skeleton rounded-xl" />
        <div className="h-32 skeleton rounded-xl" />
      </div>
    </div>
  )
}

export default function CareerIntelligence({ analysis }) {
  if (!analysis) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="glass-card rounded-2xl p-6 space-y-4"
      >
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-accent-cyan" />
          <h3 className="text-lg font-semibold text-text-primary">Career Intelligence</h3>
        </div>
        <p className="text-sm text-text-muted">
          Career AI insights are not available yet. Upload your resume or refresh once analysis is complete.
        </p>
      </motion.div>
    )
  }

  const {
    employabilityScore = 0,
    careerReadinessScore = 0,
    domainFit = 'N/A',
    strengths = [],
    improvementAreas = [],
  } = analysis

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="glass-card rounded-2xl p-6 space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <Brain className="w-5 h-5 text-accent-cyan" />
        <h3 className="text-lg font-semibold text-text-primary">Career Intelligence</h3>
      </div>

      {/* Score Rings Row */}
      <div className="flex flex-wrap gap-6 justify-center sm:justify-start">
        <AnimatedRing
          score={employabilityScore}
          size={120}
          label="Employability"
          sublabel="Market readiness"
        />
        <AnimatedRing
          score={careerReadinessScore}
          size={120}
          label="Career Readiness"
          sublabel="Preparedness score"
        />
        {/* Domain Fit — text badge */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-[120px] h-[120px] rounded-full flex items-center justify-center"
            style={{
              background: 'radial-gradient(circle, rgb(var(--c-accent2) / calc(0.15 * var(--a-boost))) 0%, rgb(var(--c-accent) / calc(0.08 * var(--a-boost))) 100%)',
              border: '6px solid rgb(var(--c-accent2) / calc(0.25 * var(--a-boost)))',
            }}
          >
            <span className="text-center text-sm font-bold text-accent-purple px-2 leading-tight">
              {domainFit}
            </span>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-text-primary">Domain Fit</p>
            <p className="text-xs text-text-muted">Field alignment</p>
          </div>
        </div>
      </div>

      {/* Strengths & Improvements */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Strengths */}
        <div className="bg-success-green/5 border border-success-green/15 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-1.5 mb-3">
            <CheckCircle2 className="w-4 h-4 text-success-green" />
            <span className="text-sm font-semibold text-success-green">Top Strengths</span>
          </div>
          {strengths.length === 0 ? (
            <p className="text-xs text-text-muted">No strengths data</p>
          ) : (
            <ul className="space-y-2">
              {strengths.slice(0, 5).map((strength, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.08 }}
                  className="flex items-start gap-2 text-sm text-text-primary"
                >
                  <span className="text-success-green mt-0.5 flex-shrink-0">✓</span>
                  <span>{strength}</span>
                </motion.li>
              ))}
            </ul>
          )}
        </div>

        {/* Improvement Areas */}
        <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-1.5 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-semibold text-amber-400">Areas to Improve</span>
          </div>
          {improvementAreas.length === 0 ? (
            <p className="text-xs text-text-muted">No improvement data</p>
          ) : (
            <ul className="space-y-2">
              {improvementAreas.slice(0, 5).map((area, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.08 }}
                  className="flex items-start gap-2 text-sm text-text-primary"
                >
                  <span className="text-amber-400 mt-0.5 flex-shrink-0">⚠</span>
                  <span>{area}</span>
                </motion.li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </motion.div>
  )
}
