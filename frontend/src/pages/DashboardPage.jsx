import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { LogOut, Zap, Upload, MessageCircle, X, RefreshCw, LayoutDashboard, Settings } from 'lucide-react'
import useUserStore from '../stores/userStore'
import useOpportunityStore from '../stores/opportunityStore'
import supabase from '../lib/supabase'
import api from '../lib/axios'

// Dashboard Section Components
import CandidateOverview from '../components/dashboard/CandidateOverview'
import CareerIntelligence from '../components/dashboard/CareerIntelligence'
import RecommendedRoles from '../components/dashboard/RecommendedRoles'
import OpportunityMatches from '../components/dashboard/OpportunityMatches'
import SkillGaps from '../components/dashboard/SkillGaps'
import CareerRoadmap from '../components/dashboard/CareerRoadmap'
import AIRecommendations from '../components/dashboard/AIRecommendations'
import CareerChat from '../components/dashboard/CareerChat'
import VoiceAssistant from '../components/voice/VoiceAssistant'
import ResumeUpload from '../components/resume/ResumeUpload'
import AnalysisProgress from '../components/resume/AnalysisProgress'
import DashboardSkeleton from '../components/dashboard/SkeletonLoader'

const NAV_SECTIONS = [
  { id: 'overview',      label: 'Overview' },
  { id: 'intelligence',  label: 'Career AI' },
  { id: 'roles',         label: 'Roles' },
  { id: 'opportunities', label: 'Opportunities' },
  { id: 'skills',        label: 'Skill Gaps' },
  { id: 'roadmap',       label: 'Roadmap' },
]

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user, profile, logout } = useUserStore()
  const [showChat, setShowChat] = useState(false)
  const [activeSection, setActiveSection] = useState('overview')
  
  // Progressive Workflow State
  const [wizardStep, setWizardStep] = useState(1)
  const [analysisSteps, setAnalysisSteps] = useState([])
  const [uploadError, setUploadError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Load profile on mount
  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false)
      return
    }

    api
      .get(`/api/resume/profile/${user.id}`)
      .then((res) => {
        if (res.data?.profile) {
          useUserStore.getState().setProfile(res.data.profile)
          // Load analysis if available
          if (res.data.analysis) {
            useOpportunityStore.getState().setCareerAnalysis(res.data.analysis)
            if (res.data.analysis.opportunity_matches?.length > 0) {
              useOpportunityStore.getState().setOpportunityMatches(res.data.analysis.opportunity_matches)
            }
          }
          setWizardStep(3)
        } else if (!profile) {
          setWizardStep(1)
        } else {
          setWizardStep(3)
        }
      })
      .catch((err) => {
        console.error('Profile load error:', err.message)
        if (profile) {
          // We have a cached profile — don't error, just show it
          setWizardStep(3)
        } else {
          setError(err.message)
          setWizardStep(1)
        }
      })
      .finally(() => setIsLoading(false))
  }, [user?.id])

  const refetch = () => {
    if (user?.id) {
      setIsLoading(true)
      api
        .get(`/api/resume/profile/${user.id}`)
        .then((res) => {
          if (res.data?.profile) {
            useUserStore.getState().setProfile(res.data.profile)
            // Load analysis if available
            if (res.data.analysis) {
              useOpportunityStore.getState().setCareerAnalysis(res.data.analysis)
              if (res.data.analysis.opportunity_matches?.length > 0) {
                useOpportunityStore.getState().setOpportunityMatches(res.data.analysis.opportunity_matches)
              }
            }
          }
        })
        .catch((err) => {
          console.error('Refetch error:', err.message)
          setError(err.message)
        })
        .finally(() => setIsLoading(false))
    }
  }

  const { careerAnalysis: analysis, opportunityMatches } = useOpportunityStore()

  // ── Progressive Upload Handlers ──
  const PIPELINE_ORDER = [
    'upload', 'parsing', 'analyzing', 'build', 'career_analysis',
    'opportunity_search', 'opportunity_matching', 'saving', 'complete_intelligence'
  ]

  const initPipelineSteps = () => PIPELINE_ORDER.map((key, i) => ({
    id: key, label: key, status: i === 0 ? 'running' : 'pending'
  }))

  const progressToStep = (stepId) => {
    setAnalysisSteps((prev) => {
      const idx = PIPELINE_ORDER.indexOf(stepId)
      return prev.map((s) => {
        const sIdx = PIPELINE_ORDER.indexOf(s.id)
        if (sIdx < idx) return { ...s, status: 'done' }
        if (s.id === stepId) return { ...s, status: 'running' }
        return { ...s, status: 'pending' }
      })
    })
  }

  const handleUploadStart = () => {
    setUploadError('')
    setWizardStep(2)
    setAnalysisSteps(initPipelineSteps())
  }

  const handleProgress = (event) => {
    if (event.type === 'step' && event.stepId) progressToStep(event.stepId)
  }

  const handleComplete = (profileData) => {
    setAnalysisSteps((prev) => prev.map((s) => ({ ...s, status: 'done' })))
    useUserStore.getState().setProfile(profileData)
    setTimeout(() => setWizardStep(3), 1000)
    refetch() // Refresh analysis to populate dashboard
  }

  const handleError = (msg) => {
    setUploadError(msg)
    setAnalysisSteps((prev) => prev.map((s) => s.status === 'running' ? { ...s, status: 'error' } : s))
    setTimeout(() => setWizardStep(1), 2000)
  }

  const handleReupload = () => {
    setWizardStep(1)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    logout()
    navigate('/')
  }

  function scrollTo(id) {
    setActiveSection(id)
    document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const avatarInitials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  // Placeholder for future analysis feature
  const hasProfile = !!profile

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-background flex flex-col"
    >
      {/* Ambient glow */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-accent-cyan/4 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-accent-purple/4 rounded-full blur-3xl pointer-events-none" />

      {/* ── Top Nav ── */}
      <nav
        className="sticky top-0 z-40 border-b border-white/5 px-4 py-3"
        style={{ background: 'rgba(5,13,26,0.92)', backdropFilter: 'blur(20px)' }}
      >
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-cyan to-accent-purple flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold gradient-text hidden sm:block text-sm">Career Intelligence</span>
          </div>

          {/* Section nav pills */}
          <div className="hidden lg:flex items-center gap-1 flex-1 overflow-x-auto">
            {NAV_SECTIONS.map(s => (
              <button
                key={s.id}
                onClick={() => scrollTo(s.id)}
                className={`text-xs px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                  activeSection === s.id
                    ? 'bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/20'
                    : 'text-text-muted hover:text-text-primary hover:bg-white/5'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Refresh */}
            <button
              onClick={refetch}
              title="Refresh analysis"
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-text-muted hover:text-accent-cyan transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-accent-cyan' : ''}`} />
            </button>

            <button
              onClick={() => navigate('/settings')}
              className="flex items-center justify-center w-8 h-8 rounded-lg border border-white/10 text-text-muted hover:text-text-primary hover:bg-white/5 transition-all"
              title="Settings"
            >
              <Settings size={14} />
            </button>

            {/* Re-upload */}
            <button
              onClick={handleReupload}
              className="hidden sm:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-accent-cyan/20 text-accent-cyan hover:bg-accent-cyan/10 transition-all"
            >
              <Upload className="w-3.5 h-3.5" /> Re-upload
            </button>

            {/* Chat toggle */}
            <button
              onClick={() => setShowChat(c => !c)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all ${
                showChat
                  ? 'bg-accent-purple/20 border-accent-purple/30 text-accent-purple'
                  : 'border-white/10 text-text-muted hover:bg-white/5'
              }`}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Career AI</span>
            </button>

            {/* User avatar */}
            <div className="flex items-center gap-2 pl-2 border-l border-white/10">
              {user?.avatarUrl ? (
               <img src={user.avatarUrl} alt="avatar" className="w-7 h-7 rounded-full" />
              ) : (
               <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent-cyan to-accent-purple flex items-center justify-center text-[10px] font-bold text-white">
                 {avatarInitials}
               </div>
              )}
              <span className="text-sm text-text-primary hidden md:block">{user?.name}</span>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-text-muted hover:text-error-red hover:bg-error-red/10 transition-all text-xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:block">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      {/* ── Main Layout ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* Main scrollable content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">

            {/* Loading state */}
            {isLoading && (
              <DashboardSkeleton />
            )}

            {/* Error state */}
            {error && (
              <div className="glass-card rounded-2xl p-8 text-center space-y-3 border border-error-red/20">
                <p className="text-error-red text-sm">Failed to load profile: {error}</p>
                <button onClick={refetch} className="btn-secondary text-sm">Retry</button>
              </div>
            )}

            {/* Progressive Upload Flow */}
            <AnimatePresence mode="wait">
              {wizardStep === 1 && !isLoading && !profile && (
                <motion.div
                  key="upload"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="max-w-2xl mx-auto"
                >
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold gradient-text mb-2">Build Your AI Career Profile</h2>
                    <p className="text-text-muted text-sm">Upload your resume to instantly discover tailored opportunities, skill gaps, and career recommendations.</p>
                  </div>
                  <ResumeUpload
                    userId={user?.id}
                    onUploadStart={handleUploadStart}
                    onProgress={handleProgress}
                    onComplete={handleComplete}
                    onError={handleError}
                    onCareerAnalysis={(data) => {
                      useOpportunityStore.getState().setCareerAnalysis(data)
                      progressToStep('career_analysis')
                    }}
                    onOpportunityMatches={(data) => {
                      useOpportunityStore.getState().setOpportunityMatches(data)
                      progressToStep('opportunity_matching')
                    }}
                  />
                  {uploadError && <p className="text-error-red text-sm text-center mt-4">{uploadError}</p>}
                </motion.div>
              )}

              {wizardStep === 2 && (
                <motion.div
                  key="progress"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="max-w-2xl mx-auto"
                >
                  <AnalysisProgress steps={analysisSteps} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Dashboard Content - show whenever profile exists */}
            {(wizardStep === 3 || hasProfile) && !isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Section 1: Candidate Overview */}
                <div id="section-overview">
                  <CandidateOverview profile={profile} analysis={analysis} />
                </div>

            {/* Section 2: Career Intelligence */}
            {hasProfile && (
              <div id="section-intelligence">
                <CareerIntelligence analysis={analysis} />
              </div>
            )}

            {/* Section 3: Recommended Roles */}
            {hasProfile && analysis?.recommended_roles?.length > 0 && (
              <div id="section-roles">
                <RecommendedRoles roles={analysis.recommended_roles} />
              </div>
            )}

            {/* Section 4: Opportunity Matches */}
            {hasProfile && (
              <div id="section-opportunities">
                <OpportunityMatches matches={opportunityMatches || []} />
              </div>
            )}

            {/* Section 5: Skill Gaps */}
            {hasProfile && analysis?.skill_gaps?.length > 0 && (
              <div id="section-skills">
                <SkillGaps skillGaps={analysis.skill_gaps} />
              </div>
            )}

            {/* Section 6: Career Roadmap */}
            {hasProfile && (analysis?.plan_30_days || analysis?.plan_90_days || analysis?.plan_180_days) && (
              <div id="section-roadmap">
                <CareerRoadmap
                  plan30Days={analysis.plan_30_days || []}
                  plan90Days={analysis.plan_90_days || []}
                  plan180Days={analysis.plan_180_days || []}
                />
              </div>
            )}

            {/* Section 7: AI Recommendations */}
            {hasProfile && analysis?.ai_narrative && (
              <div id="section-ai">
                <AIRecommendations
                  narrative={analysis.ai_narrative}
                  strengths={analysis.strengths || []}
                  improvementAreas={analysis.improvement_areas || []}
                />
              </div>
            )}

              </motion.div>
            )}

            {/* Bottom padding */}
            <div className="h-20" />
          </div>
        </main>

        {/* ── Career Chat Sidebar (desktop, slide-in panel) ── */}
        <AnimatePresence>
          {showChat && (
            <motion.aside
              initial={{ opacity: 0, x: 40, width: 0 }}
              animate={{ opacity: 1, x: 0, width: 320 }}
              exit={{ opacity: 0, x: 40, width: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="hidden lg:flex flex-col flex-shrink-0 border-l border-white/8 overflow-hidden"
              style={{ width: 320 }}
            >
              {/* Chat header with close */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/8 flex-shrink-0">
                <span className="text-xs font-semibold text-text-primary">Career AI Assistant</span>
                <button
                  onClick={() => setShowChat(false)}
                  className="p-1.5 rounded-lg hover:bg-white/8 text-text-muted hover:text-text-primary transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <CareerChat userId={user?.id} />
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* ── Mobile Chat Overlay ── */}
      <AnimatePresence>
        {showChat && (
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 32 }}
            className="lg:hidden fixed inset-0 z-50 flex flex-col"
            style={{ background: 'rgba(5,13,26,0.97)' }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
              <span className="font-semibold text-text-primary">Career AI</span>
              <button
                onClick={() => setShowChat(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/8 text-text-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <CareerChat userId={user?.id} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Voice Button */}
      <VoiceAssistant />
    </motion.div>
  )
}
