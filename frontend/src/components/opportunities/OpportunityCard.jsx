import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { MapPin, Clock, Bookmark, BookmarkCheck, ArrowRight, Building, Tag, Zap } from 'lucide-react'
import { differenceInDays } from 'date-fns'
import useOpportunityStore from '../../stores/opportunityStore'

export const CATEGORY_COLORS = {
  job: { bg: 'rgba(59,130,246,0.15)', color: '#3b82f6', border: 'rgba(59,130,246,0.3)' },
  internship: { bg: 'rgba(0,212,255,0.15)', color: '#00d4ff', border: 'rgba(0,212,255,0.3)' },
  hackathon: { bg: 'rgba(124,58,237,0.15)', color: '#a78bfa', border: 'rgba(124,58,237,0.3)' },
  scholarship: { bg: 'rgba(16,185,129,0.15)', color: '#10b981', border: 'rgba(16,185,129,0.3)' },
  fellowship: { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: 'rgba(245,158,11,0.3)' },
  conference: { bg: 'rgba(236,72,153,0.15)', color: '#ec4899', border: 'rgba(236,72,153,0.3)' },
  research: { bg: 'rgba(99,102,241,0.15)', color: '#818cf8', border: 'rgba(99,102,241,0.3)' },
  open_source: { bg: 'rgba(249,115,22,0.15)', color: '#fb923c', border: 'rgba(249,115,22,0.3)' },
  default: { bg: 'rgba(148,163,184,0.15)', color: '#94a3b8', border: 'rgba(148,163,184,0.3)' },
}

function MatchScoreCircle({ score }) {
  const radius = 18
  const circumference = 2 * Math.PI * radius
  const pct = Math.min(Math.max(score || 0, 0), 100)
  const strokeDashoffset = circumference - (pct / 100) * circumference

  const color =
    pct >= 70 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#ef4444'

  return (
    <div className="relative w-12 h-12 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" width="48" height="48">
        <circle cx="24" cy="24" r={radius} stroke="rgba(255,255,255,0.06)" strokeWidth="3" fill="none" />
        <motion.circle
          cx="24"
          cy="24"
          r={radius}
          stroke={color}
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
        />
      </svg>
      <span className="text-xs font-bold" style={{ color }}>{pct}%</span>
    </div>
  )
}

export default function OpportunityCard({ opportunity, index = 0 }) {
  const navigate = useNavigate()
  const { toggleSaved } = useOpportunityStore()

  const {
    id,
    title,
    organization,
    category,
    location,
    isRemote,
    deadline,
    tags = [],
    matchScore,
    priority,
    explanation,
    isSaved,
  } = opportunity

  const catStyle = CATEGORY_COLORS[category] || CATEGORY_COLORS.default
  const deadlineDays = deadline ? differenceInDays(new Date(deadline), new Date()) : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07 }}
      className="glass-card-hover rounded-2xl p-5 flex flex-col gap-3 cursor-pointer"
      onClick={() => navigate(`/opportunity/${id}`)}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {/* Category chip */}
          <span
            className="badge text-xs"
            style={{ backgroundColor: catStyle.bg, color: catStyle.color, border: `1px solid ${catStyle.border}` }}
          >
            {category?.replace('_', ' ').toUpperCase() || 'OPPORTUNITY'}
          </span>
          {/* Priority */}
          {priority && (
            <span className={`badge ${
              priority === 'high' ? 'badge-red' : priority === 'medium' ? 'badge-amber' : 'badge-green'
            }`}>
              {priority}
            </span>
          )}
          {isRemote && <span className="badge badge-cyan">Remote</span>}
        </div>
        {/* Match score */}
        {matchScore !== undefined && <MatchScoreCircle score={matchScore} />}
      </div>

      {/* Title */}
      <h3 className="text-base font-semibold text-text-primary line-clamp-2 leading-snug">
        {title}
      </h3>

      {/* Organization */}
      {organization && (
        <div className="flex items-center gap-1.5 text-text-muted text-sm">
          <Building className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{organization}</span>
        </div>
      )}

      {/* Location + Deadline */}
      <div className="flex flex-wrap gap-3 text-xs">
        {location && (
          <span className="flex items-center gap-1 text-text-muted">
            <MapPin className="w-3 h-3" />
            {location}
          </span>
        )}
        {deadlineDays !== null && (
          <span className={`flex items-center gap-1 ${deadlineDays < 30 ? 'text-warning-amber' : 'text-text-muted'}`}>
            <Clock className="w-3 h-3" />
            {deadlineDays < 0
              ? 'Deadline passed'
              : deadlineDays === 0
              ? 'Due today!'
              : `${deadlineDays} days left`}
          </span>
        )}
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.slice(0, 3).map((tag) => (
            <span key={tag} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 border border-white/8 text-xs text-text-muted">
              <Tag className="w-2.5 h-2.5" />
              {tag}
            </span>
          ))}
          {tags.length > 3 && (
            <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/8 text-xs text-text-muted">
              +{tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Why it matches */}
      {explanation && (
        <div className="p-2.5 rounded-lg bg-accent-cyan/5 border border-accent-cyan/10">
          <div className="flex items-start gap-1.5">
            <Zap className="w-3 h-3 text-accent-cyan flex-shrink-0 mt-0.5" />
            <p className="text-xs text-text-muted line-clamp-2">{explanation}</p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div
        className="flex items-center justify-between pt-2 mt-auto border-t border-white/5"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={(e) => {
            e.stopPropagation()
            toggleSaved(id)
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
            isSaved
              ? 'bg-warning-amber/10 border-warning-amber/25 text-warning-amber'
              : 'bg-white/5 border-white/10 text-text-muted hover:border-white/20'
          }`}
        >
          {isSaved ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
          {isSaved ? 'Saved' : 'Save'}
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation()
            navigate(`/opportunity/${id}`)
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-accent-cyan hover:bg-accent-cyan/10 border border-transparent hover:border-accent-cyan/25 transition-all"
        >
          View Details
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  )
}
