import { motion } from 'framer-motion'
import { Sparkles, Code2, Briefcase, GraduationCap, Award } from 'lucide-react'

function ScoreGauge({ score = 0, size = 100, label }) {
  const radius = (size - 12) / 2
  const circumference = 2 * Math.PI * radius
  const clampedScore = Math.max(0, Math.min(100, score))
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference

  const color =
    clampedScore >= 70 ? '#10b981' :
    clampedScore >= 40 ? '#f59e0b' :
    '#ef4444'

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Background ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={10}
          />
          {/* Animated score ring */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={10}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-lg font-bold text-text-primary"
          >
            {clampedScore}
          </motion.span>
        </div>
      </div>
      {label && <span className="text-xs text-text-muted text-center">{label}</span>}
    </div>
  )
}

function SkeletonCandidateOverview() {
  return (
    <div className="glass-card rounded-2xl p-6 space-y-4 animate-pulse">
      <div className="flex items-start gap-5">
        <div className="w-16 h-16 rounded-2xl skeleton" />
        <div className="flex-1 space-y-2">
          <div className="h-6 w-48 skeleton rounded" />
          <div className="h-4 w-64 skeleton rounded" />
          <div className="h-5 w-24 skeleton rounded-full" />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 skeleton rounded-xl" />
        ))}
      </div>
    </div>
  )
}

export default function CandidateOverview({ profile, analysis }) {
  if (!profile && !analysis) return <SkeletonCandidateOverview />

  const name = profile?.name || 'Your Profile'
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const degree = profile?.degree || null
  const institution = profile?.institution || null
  const experienceLevel = profile?.experienceLevel || profile?.experience_level || 'Entry Level'
  const domains = profile?.preferredDomains || profile?.preferred_domains || profile?.domains || []
  const skillsCount = (profile?.skills || []).length
  const projectsCount = (profile?.projects || []).length
  const resumeScore = analysis?.resumeScore ?? null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-card rounded-2xl p-6 space-y-5"
    >
      {/* Header row */}
      <div className="flex flex-col sm:flex-row items-start gap-5">
        {/* Avatar */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
          className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-cyan to-accent-purple flex items-center justify-center text-white text-xl font-bold flex-shrink-0"
        >
          {initials}
        </motion.div>

        {/* Name & details */}
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold text-text-primary truncate">{name}</h2>
          {(degree || institution) && (
            <div className="flex items-center gap-1.5 mt-1 text-text-muted text-sm">
              <GraduationCap className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">
                {[degree, institution].filter(Boolean).join(' · ')}
              </span>
            </div>
          )}
          <div className="mt-2">
            <span className="badge badge-cyan">{experienceLevel}</span>
          </div>
        </div>

        {/* Resume Score (large, top right) */}
        {resumeScore !== null && (
          <div className="flex-shrink-0">
            <ScoreGauge score={resumeScore} size={88} label="Resume Score" />
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white/5 rounded-xl p-4 flex flex-col gap-1.5 border border-white/8">
          <Sparkles className="w-4 h-4 text-accent-cyan" />
          <span className="text-2xl font-bold text-text-primary">{skillsCount}</span>
          <span className="text-xs text-text-muted">Skills Detected</span>
        </div>
        <div className="bg-white/5 rounded-xl p-4 flex flex-col gap-1.5 border border-white/8">
          <Code2 className="w-4 h-4 text-accent-purple" />
          <span className="text-2xl font-bold text-text-primary">{projectsCount}</span>
          <span className="text-xs text-text-muted">Projects Found</span>
        </div>
        <div className="bg-white/5 rounded-xl p-4 flex flex-col gap-1.5 border border-white/8 col-span-2 sm:col-span-1">
          <Briefcase className="w-4 h-4 text-success-green" />
          <span className="text-sm font-semibold text-text-primary leading-tight">{experienceLevel}</span>
          <span className="text-xs text-text-muted">Experience Level</span>
        </div>
      </div>

      {/* Domain pills */}
      {domains.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <Award className="w-3.5 h-3.5" />
            <span>Preferred Domains</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {domains.map((domain, i) => (
              <motion.span
                key={domain}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + i * 0.07 }}
                className="px-3 py-1 rounded-full text-xs font-medium"
                style={{
                  background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(124,58,237,0.15))',
                  border: '1px solid rgba(0,212,255,0.25)',
                  color: '#00d4ff',
                }}
              >
                {domain}
              </motion.span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}
