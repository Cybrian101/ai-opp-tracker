import { motion } from 'framer-motion'
import { Zap, Code2, Briefcase, Globe, Star } from 'lucide-react'

function ScoreBar({ label, score = 0, icon: Icon, color }) {
  const pct = Math.max(0, Math.min(100, score))
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-text-muted">
          <Icon className="w-3 h-3" />
          {label}
        </span>
        <span className="font-bold" style={{ color }}>{pct}%</span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}

export default function MatchBreakdown({ opportunity }) {
  if (!opportunity?.matchScore && !opportunity?.match_score) return null

  const score     = opportunity.matchScore     ?? opportunity.match_score     ?? 0
  const skillM    = opportunity.skillMatch     ?? opportunity.skill_match     ?? 0
  const expM      = opportunity.experienceMatch?? opportunity.experience_match?? 0
  const domainM   = opportunity.domainMatch    ?? opportunity.domain_match    ?? 0
  const interestM = opportunity.interestMatch  ?? opportunity.interest_match  ?? 0
  const why       = opportunity.matchExplanation ?? opportunity.why_it_matches ?? ''
  const skillGap  = opportunity.skillGap       ?? opportunity.skill_gap       ?? []

  const overallColor = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass-card rounded-2xl p-5 space-y-4"
    >
      {/* Overall score */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-1.5">
          <Zap className="w-4 h-4 text-accent-cyan" />
          Match Score
        </h3>
        <span className="text-2xl font-bold" style={{ color: overallColor }}>{score}%</span>
      </div>

      {/* Sub-scores */}
      {(skillM || expM || domainM || interestM) > 0 && (
        <div className="space-y-3 pt-2 border-t border-white/5">
          <ScoreBar label="Skill Match"      score={skillM}    icon={Code2}    color="#00d4ff" />
          <ScoreBar label="Experience Match" score={expM}      icon={Briefcase} color="#7c3aed" />
          <ScoreBar label="Domain Match"     score={domainM}   icon={Globe}    color="#10b981" />
          <ScoreBar label="Interest Match"   score={interestM} icon={Star}     color="#f59e0b" />
        </div>
      )}

      {/* Why it matches */}
      {why && (
        <div className="p-3 rounded-lg bg-accent-cyan/5 border border-accent-cyan/15 text-xs text-text-muted leading-relaxed">
          {why}
        </div>
      )}

      {/* Skill gaps */}
      {skillGap.length > 0 && (
        <div>
          <p className="text-xs text-text-muted uppercase tracking-wide mb-2">Skills to Develop</p>
          <div className="flex flex-wrap gap-1.5">
            {skillGap.slice(0, 6).map((s) => (
              <span key={s} className="px-2 py-0.5 text-xs rounded-full bg-warning-amber/10 border border-warning-amber/20 text-warning-amber">
                {s}
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}
