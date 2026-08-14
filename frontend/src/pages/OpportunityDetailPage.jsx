import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft, MapPin, Calendar, ExternalLink, Bookmark, BookmarkCheck,
  Share2, Building, Tag, Globe, Clock, Award, ChevronRight, Zap
} from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import api from '../lib/axios'
import useUserStore from '../stores/userStore'
import useOpportunityStore from '../stores/opportunityStore'
import MatchBreakdown from '../components/opportunities/MatchBreakdown'
import { CATEGORY_COLORS } from '../components/opportunities/OpportunityCard'

function SkeletonDetail() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 skeleton rounded-lg w-3/4" />
      <div className="h-4 skeleton rounded w-1/2" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="lg:col-span-2 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-4 skeleton rounded w-full" />
          ))}
        </div>
        <div className="h-64 skeleton rounded-2xl" />
      </div>
    </div>
  )
}

export default function OpportunityDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useUserStore()
  const { toggleSaved, opportunities } = useOpportunityStore()
  const [opportunity, setOpportunity] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const existingOpp = opportunities.find((o) => o.id === id)

  useEffect(() => {
    async function fetchDetail() {
      setLoading(true)
      try {
        if (existingOpp && existingOpp.description) {
          setOpportunity(existingOpp)
          setLoading(false)
          return
        }
        const res = await api.get(`/api/opportunities/detail/${id}/${user?.id}`)
        setOpportunity(res.data)
      } catch (e) {
        setError(e.message || 'Failed to load opportunity')
      } finally {
        setLoading(false)
      }
    }
    fetchDetail()
  }, [id, user?.id])

  async function handleShare() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-text-muted hover:text-text-primary mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
          <SkeletonDetail />
        </div>
      </div>
    )
  }

  if (error || !opportunity) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-error-red mb-4">{error || 'Opportunity not found'}</p>
          <button onClick={() => navigate('/dashboard')} className="btn-secondary">
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const opp = opportunity
  const categoryStyle = CATEGORY_COLORS[opp.category] || CATEGORY_COLORS.default
  const deadlineDays = opp.deadline ? differenceInDays(new Date(opp.deadline), new Date()) : null
  const isSaved = opp.isSaved

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-background"
    >
      <div className="fixed top-0 left-0 right-0 bottom-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent-cyan/4 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent-purple/4 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 py-8">
        {/* Back */}
        <motion.button
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-text-muted hover:text-text-primary mb-8 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </motion.button>

        {/* Hero */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-2xl p-6 mb-6"
        >
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <div className="flex flex-wrap gap-2">
              <span
                className="badge text-xs font-semibold px-3 py-1 rounded-full"
                style={{ backgroundColor: categoryStyle.bg, color: categoryStyle.color, border: `1px solid ${categoryStyle.border}` }}
              >
                {opp.category?.replace('_', ' ').toUpperCase()}
              </span>
              {opp.priority && (
                <span className={`badge ${
                  opp.priority === 'high' ? 'badge-red' : opp.priority === 'medium' ? 'badge-amber' : 'badge-green'
                }`}>
                  {opp.priority} priority
                </span>
              )}
              {opp.isRemote && <span className="badge badge-cyan">Remote</span>}
            </div>
            {opp.matchScore && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success-green/10 border border-success-green/25">
                <Zap className="w-3.5 h-3.5 text-success-green" />
                <span className="text-success-green text-sm font-bold">{opp.matchScore}% match</span>
              </div>
            )}
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-2">{opp.title}</h1>

          <div className="flex flex-wrap items-center gap-4 text-text-muted text-sm mb-4">
            {opp.organization && (
              <span className="flex items-center gap-1.5">
                <Building className="w-4 h-4" />
                {opp.organization}
              </span>
            )}
            {opp.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                {opp.location}
              </span>
            )}
            {opp.deadline && (
              <span className={`flex items-center gap-1.5 ${deadlineDays !== null && deadlineDays < 30 ? 'text-warning-amber' : ''}`}>
                <Clock className="w-4 h-4" />
                {deadlineDays !== null
                  ? deadlineDays < 0
                    ? 'Deadline passed'
                    : `${deadlineDays} days left`
                  : format(new Date(opp.deadline), 'MMM d, yyyy')}
              </span>
            )}
          </div>

          {/* Tags */}
          {opp.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {opp.tags.map((tag) => (
                <span key={tag} className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-xs text-text-muted">
                  <Tag className="w-2.5 h-2.5" />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </motion.div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Details */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Description */}
            {opp.description && (
              <div className="glass-card rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-text-primary mb-3 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-accent-cyan" />
                  About this Opportunity
                </h2>
                <p className="text-text-muted leading-relaxed whitespace-pre-wrap">{opp.description}</p>
              </div>
            )}

            {/* Eligibility */}
            {opp.eligibility && (
              <div className="glass-card rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-text-primary mb-3 flex items-center gap-2">
                  <Award className="w-5 h-5 text-accent-cyan" />
                  Eligibility
                </h2>
                <p className="text-text-muted leading-relaxed whitespace-pre-wrap">{opp.eligibility}</p>
              </div>
            )}

            {/* Benefits */}
            {opp.benefits && (
              <div className="glass-card rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-text-primary mb-3 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-warning-amber" />
                  Benefits & Compensation
                </h2>
                <p className="text-text-muted leading-relaxed whitespace-pre-wrap">{opp.benefits}</p>
              </div>
            )}

            {/* Why Recommended */}
            {(opp.whyRecommended || opp.explanation) && (
              <div className="rounded-2xl p-6 border border-accent-cyan/20 bg-accent-cyan/5">
                <h2 className="text-lg font-semibold text-text-primary mb-3 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-accent-cyan" />
                  Why AI Recommended This
                </h2>
                <p className="text-text-muted leading-relaxed">{opp.whyRecommended || opp.explanation}</p>
              </div>
            )}

            {/* Suggested Actions */}
            {opp.suggestedActions?.length > 0 && (
              <div className="glass-card rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-text-primary mb-3">Suggested Actions</h2>
                <div className="space-y-2">
                  {opp.suggestedActions.map((action, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-white/3 hover:bg-white/5 transition-colors">
                      <ChevronRight className="w-4 h-4 text-accent-cyan mt-0.5 flex-shrink-0" />
                      <span className="text-text-muted text-sm">{action}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Career Path */}
            {opp.careerPathSuggestion && (
              <div className="rounded-2xl p-6 border border-accent-purple/20 bg-accent-purple/5">
                <h2 className="text-lg font-semibold text-text-primary mb-2">Career Path Impact</h2>
                <p className="text-text-muted">{opp.careerPathSuggestion}</p>
              </div>
            )}
          </motion.div>

          {/* Right: Match + Actions */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            {/* Match Breakdown */}
            <MatchBreakdown opportunity={opp} />

            {/* Actions */}
            <div className="glass-card rounded-2xl p-5 space-y-3">
              {opp.applyLink && (
                <a
                  href={opp.applyLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white transition-all"
                  style={{ background: 'linear-gradient(135deg, #00d4ff, #7c3aed)' }}
                >
                  Apply Now
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
              <button
                onClick={() => toggleSaved(opp.id)}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all border ${
                  isSaved
                    ? 'bg-warning-amber/10 border-warning-amber/30 text-warning-amber'
                    : 'bg-white/5 border-white/10 text-text-muted hover:border-white/20'
                }`}
              >
                {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                {isSaved ? 'Saved' : 'Save Opportunity'}
              </button>
              <button
                onClick={handleShare}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium bg-white/5 border border-white/10 text-text-muted hover:border-white/20 transition-all"
              >
                <Share2 className="w-4 h-4" />
                {copied ? 'Link Copied!' : 'Share'}
              </button>
            </div>

            {/* Quick Details */}
            <div className="glass-card rounded-2xl p-5 space-y-3 text-sm">
              {opp.deadline && (
                <div className="flex justify-between">
                  <span className="text-text-muted">Deadline</span>
                  <span className="text-text-primary font-medium">
                    {format(new Date(opp.deadline), 'MMM d, yyyy')}
                  </span>
                </div>
              )}
              {opp.stipend && (
                <div className="flex justify-between">
                  <span className="text-text-muted">Stipend</span>
                  <span className="text-success-green font-medium">{opp.stipend}</span>
                </div>
              )}
              {opp.duration && (
                <div className="flex justify-between">
                  <span className="text-text-muted">Duration</span>
                  <span className="text-text-primary font-medium">{opp.duration}</span>
                </div>
              )}
              {opp.sourceUrl && (
                <a
                  href={opp.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-accent-cyan hover:underline"
                >
                  <Globe className="w-3.5 h-3.5" />
                  View Source
                </a>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
