import { motion } from 'framer-motion'
import { MapPin, Calendar, ExternalLink, Bookmark, BookmarkCheck, Wifi, Filter, Briefcase, GraduationCap, Code, Heart, Award, Users, Search, GitBranch } from 'lucide-react'
import { useState, useMemo } from 'react'
import { formatDistanceToNow, parseISO, differenceInDays } from 'date-fns'
import useOpportunityStore from '../../stores/opportunityStore'
import useUserStore from '../../stores/userStore'
import api from '../../lib/axios'

const CATEGORY_CONFIG = {
  job: { icon: Briefcase, title: 'Recommended Jobs', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  internship: { icon: GraduationCap, title: 'Recommended Internships', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
  hackathon: { icon: Code, title: 'Recommended Hackathons', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  scholarship: { icon: Heart, title: 'Recommended Scholarships', color: 'text-green-400 bg-green-500/10 border-green-500/20' },
  fellowship: { icon: Award, title: 'Recommended Fellowships', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  conference: { icon: Users, title: 'Recommended Conferences', color: 'text-pink-400 bg-pink-500/10 border-pink-500/20' },
  research: { icon: Search, title: 'Recommended Research Programs', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
  open_source: { icon: GitBranch, title: 'Recommended Open Source Programs', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' }
}

function ScoreBadge({ score }) {
  const color = score >= 80 ? 'text-green-400 bg-green-500/15 border-green-500/30'
    : score >= 60 ? 'text-amber-400 bg-amber-500/15 border-amber-500/30'
    : 'text-slate-400 bg-slate-500/15 border-slate-500/30'
  return (
    <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-sm font-bold ${color}`}>
      {score}%
    </div>
  )
}

function OpportunityCard({ opp, isSaved, onSave }) {
  const score = opp.matchScore ?? opp.match_score ?? 0
  const deadline = opp.deadline ? parseISO(opp.deadline) : null
  const daysLeft = deadline ? differenceInDays(deadline, new Date()) : null
  const skillGap = opp.skillGap || opp.skill_gap || []

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="min-w-[300px] w-[300px] flex-shrink-0 rounded-xl p-4 relative overflow-hidden group hover:border-cyan-500/25 transition-all duration-300 flex flex-col"
      style={{ background: 'rgba(15,32,64,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex flex-wrap gap-1.5">
          {opp.remote && (
            <span className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 px-2 py-0.5 rounded-full">
              <Wifi size={9} /> Remote
            </span>
          )}
        </div>
        <ScoreBadge score={score} />
      </div>

      <h3 className="font-semibold text-text-primary text-sm leading-snug mb-1 line-clamp-2">
        {opp.title}
      </h3>
      <p className="text-xs text-text-muted mb-2 font-medium">{opp.organization}</p>

      {/* Match explanation */}
      {(opp.matchExplanation || opp.match_explanation) && (
        <p className="text-xs text-text-muted italic border-l-2 border-cyan-500/30 pl-2 mb-3 line-clamp-2 flex-1">
          {opp.matchExplanation || opp.match_explanation}
        </p>
      )}

      {/* Meta */}
      <div className="flex items-center gap-3 flex-wrap mb-4 mt-auto">
        {(opp.city || opp.country) && (
          <span className="flex items-center gap-1 text-xs text-text-muted">
            <MapPin size={10} />
            {[opp.city, opp.country].filter(Boolean).join(', ')}
          </span>
        )}
        {daysLeft !== null && (
          <span className={`flex items-center gap-1 text-xs ${daysLeft < 30 ? 'text-green-400' : 'text-text-muted'}`}>
            <Calendar size={10} />
            {daysLeft > 0 ? `${daysLeft}d left` : 'Ongoing'}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-3 border-t border-white/5">
        <button
          onClick={() => onSave(opp)}
          className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border transition-all ${
            isSaved ? 'bg-cyan-500/20 border-cyan-500/30 text-cyan-300' : 'bg-white/5 border-white/10 text-text-muted hover:bg-white/10'
          }`}
        >
          {isSaved ? <BookmarkCheck size={12} /> : <Bookmark size={12} />}
          {isSaved ? 'Saved' : 'Save'}
        </button>
        {(opp.application_url || opp.applyLink) && (
          <a
            href={opp.application_url || opp.applyLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-cyan-500/15 border border-cyan-500/25 text-cyan-300 hover:bg-cyan-500/25 transition-all ml-auto"
          >
            Apply <ExternalLink size={11} />
          </a>
        )}
      </div>
    </motion.div>
  )
}

const FILTERS = [
  { label: 'All', min: 0 },
  { label: '60%+', min: 60 },
  { label: '80%+', min: 80 },
]

export default function OpportunityMatches({ matches = [] }) {
  const [localMinScore, setLocalMinScore] = useState(0)
  const { savedOpportunities, toggleSaved, dashboardFilterQuery, dashboardFilterMinScore, setDashboardFilter } = useOpportunityStore()
  const { user } = useUserStore()

  // Clear filters if user clicks "All"
  const handleClearFilters = () => {
    setLocalMinScore(0)
    setDashboardFilter('', 0)
  }

  const effectiveMinScore = Math.max(localMinScore, dashboardFilterMinScore)

  // Filter & Categorize
  const categorized = useMemo(() => {
    const cats = {
      job: [], internship: [], hackathon: [], scholarship: [],
      fellowship: [], conference: [], research: [], open_source: []
    }
    
    matches.forEach(m => {
      const score = m.matchScore ?? m.match_score ?? 0
      if (score < effectiveMinScore) return
      
      if (dashboardFilterQuery) {
         const q = dashboardFilterQuery.toLowerCase()
         const text = `${m.title} ${m.organization} ${m.category} ${m.description} ${m.summary}`.toLowerCase()
         if (!text.includes(q)) return
      }

      const categoryArray = Array.isArray(m.category) ? m.category : [m.category].filter(Boolean)
      const rawCat = categoryArray[0]?.toLowerCase().replace(/\s+/g, '_') || 'job'
      
      // Default fallback
      if (cats[rawCat]) {
        cats[rawCat].push(m)
      } else {
        cats.job.push(m)
      }
    })

    // Sort each array by score
    Object.keys(cats).forEach(k => {
      cats[k].sort((a,b) => (b.matchScore ?? b.match_score ?? 0) - (a.matchScore ?? a.match_score ?? 0))
    })

    return cats
  }, [matches, effectiveMinScore, dashboardFilterQuery])

  async function handleSave(opp) {
    if (!user) return
    const id = opp.id
    const isSaved = savedOpportunities.some(s => s.id === id)
    try {
      if (isSaved) {
        await api.delete(`/api/opportunities/${id}/save`, { data: { userId: user.id } })
      } else {
        await api.post(`/api/opportunities/${id}/save`, { userId: user.id })
      }
      toggleSaved(id)
    } catch {}
  }

  const activeCategories = Object.entries(categorized).filter(([_, items]) => items.length > 0)

  if (matches.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center space-y-3" style={{ border: '1px solid rgba(0,212,255,0.1)' }}>
        <div className="w-12 h-12 mx-auto rounded-xl bg-accent-cyan/10 border border-accent-cyan/20 flex items-center justify-center">
          <Briefcase className="w-6 h-6 text-accent-cyan" />
        </div>
        <h3 className="text-base font-semibold text-text-primary">Discovering Opportunities</h3>
        <p className="text-sm text-text-muted">
          AI is matching opportunities to your profile. Upload your resume to start or wait for analysis to complete.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-xl font-bold text-text-primary">Discovered Opportunities</h2>
        <div className="flex items-center gap-1.5">
          <Filter size={13} className="text-text-muted" />
          <div className="flex gap-1">
            {FILTERS.map(f => {
              const isActive = f.min === effectiveMinScore && (f.min > 0 || (!dashboardFilterMinScore && !localMinScore))
              return (
                <button
                  key={f.label}
                  onClick={() => {
                    if (f.min === 0) handleClearFilters()
                    else setLocalMinScore(f.min)
                  }}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                    isActive
                      ? 'bg-cyan-500/20 border-cyan-500/30 text-cyan-300'
                      : 'bg-white/5 border-white/10 text-text-muted hover:bg-white/10'
                  }`}
                >
                  {f.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {activeCategories.length === 0 ? (
        <div className="text-center py-12 text-text-muted text-sm glass-card rounded-2xl">
          No opportunities match your current filter.
        </div>
      ) : (
        <div className="space-y-8">
          {activeCategories.map(([catKey, items]) => {
            const config = CATEGORY_CONFIG[catKey]
            const Icon = config.icon

            return (
              <motion.div
                key={catKey}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="glass-card rounded-2xl p-5"
                style={{ border: '1px solid rgba(0,212,255,0.1)' }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${config.color}`}>
                    <Icon size={14} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-text-primary">{config.title}</h3>
                    <p className="text-xs text-text-muted">{items.length} matches found</p>
                  </div>
                </div>

                {/* Horizontal scroll container */}
                <div className="flex gap-4 overflow-x-auto pb-4 snap-x hide-scrollbar">
                  {items.map(opp => (
                    <div key={opp.id} className="snap-start">
                      <OpportunityCard
                        opp={opp}
                        isSaved={savedOpportunities.some(s => s.id === opp.id)}
                        onSave={handleSave}
                      />
                    </div>
                  ))}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
