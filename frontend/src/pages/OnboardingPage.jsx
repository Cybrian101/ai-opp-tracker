import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, Loader, Zap, LayoutDashboard } from 'lucide-react'
import useUserStore from '../stores/userStore'
import useOpportunityStore from '../stores/opportunityStore'
import ResumeUpload from '../components/resume/ResumeUpload'
import AnalysisProgress from '../components/resume/AnalysisProgress'

// 3-step wizard indicator
const WIZARD_STEPS = [
  { id: 1, label: 'Upload' },
  { id: 2, label: 'Analyze' },
  { id: 3, label: 'Dashboard' },
]

// Full pipeline step keys (ordered)
const PIPELINE_ORDER = [
  'upload',
  'parsing',
  'analyzing',
  'build',
  'career_analysis',
  'opportunity_search',
  'opportunity_matching',
  'saving',
  'complete_intelligence',
]

function initPipelineSteps() {
  return PIPELINE_ORDER.map((key, i) => ({
    id: key,
    label: key,
    status: i === 0 ? 'running' : 'pending',
  }))
}

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { user, setProfile } = useUserStore()
  const { setCareerAnalysis, setOpportunityMatches } = useOpportunityStore()

  const [wizardStep, setWizardStep] = useState(1)   // 1=upload, 2=analyzing, 3=done
  const [analysisSteps, setAnalysisSteps] = useState([])
  const [profile, setLocalProfile] = useState(null)
  const [error, setError] = useState('')
  const [toast, setToast] = useState(null)

  const showToast = useCallback((message, variant = 'info') => {
    setToast({ message, variant })
    window.setTimeout(() => setToast(null), 3200)
  }, [])

  // Mark all steps up to (not including) stepId as done, stepId as running
  const progressToStep = useCallback((stepId) => {
    setAnalysisSteps((prev) => {
      const idx = PIPELINE_ORDER.indexOf(stepId)
      return prev.map((s) => {
        const sIdx = PIPELINE_ORDER.indexOf(s.id)
        if (sIdx < idx) return { ...s, status: 'done' }
        if (s.id === stepId) return { ...s, status: 'running' }
        return { ...s, status: 'pending' }
      })
    })
  }, [])

  const handleUploadStart = useCallback(() => {
    setError('')
    setWizardStep(2)
    setAnalysisSteps(initPipelineSteps())
    showToast('Resume upload started', 'info')
  }, [showToast])

  const handleProgress = useCallback((event) => {
    if (event.type === 'step' && event.stepId) {
      progressToStep(event.stepId)
    }
  }, [progressToStep])

  const handleComplete = useCallback((profileData) => {
    // Mark all as done
    setAnalysisSteps((prev) => prev.map((s) => ({ ...s, status: 'done' })))
    setLocalProfile(profileData)
    setProfile(profileData)
    setWizardStep(3)
    showToast('Career intelligence ready!', 'success')
    window.setTimeout(() => navigate('/dashboard'), 2000)
  }, [navigate, setProfile, showToast])

  const handleCareerAnalysis = useCallback((data) => {
    setCareerAnalysis(data)
    progressToStep('career_analysis')
  }, [setCareerAnalysis, progressToStep])

  const handleOpportunityMatches = useCallback((data) => {
    setOpportunityMatches(data)
    progressToStep('opportunity_matching')
  }, [setOpportunityMatches, progressToStep])

  const handleError = useCallback((msg) => {
    setError(msg)
    setAnalysisSteps((prev) => prev.map((s) =>
      s.status === 'running' ? { ...s, status: 'error' } : s
    ))
    setWizardStep(1)
    showToast(msg || 'Upload failed', 'error')
  }, [showToast])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-background"
    >
      {/* Ambient Blobs */}
      <div className="fixed top-0 left-1/3 w-96 h-96 bg-accent-cyan/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-1/3 w-96 h-96 bg-accent-purple/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-cyan to-accent-purple flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg gradient-text">Career Intelligence</span>
          </div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">Build Your AI Career Profile</h1>
          <p className="text-text-muted">
            Upload your resume and get instant career analysis, role recommendations, and matched opportunities
          </p>
        </div>

        {/* 3-Step Wizard Indicator */}
        <div className="flex items-center justify-center gap-0 mb-10">
          {WIZARD_STEPS.map((step, idx) => (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <motion.div
                  animate={{
                    backgroundColor:
                      wizardStep > step.id
                        ? '#10b981'
                        : wizardStep === step.id
                        ? '#00d4ff'
                        : 'rgba(15,32,64,0.7)',
                    borderColor:
                      wizardStep >= step.id
                        ? wizardStep > step.id
                          ? '#10b981'
                          : '#00d4ff'
                        : 'rgba(0,212,255,0.2)',
                  }}
                  className="w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all duration-500"
                >
                  {wizardStep > step.id ? (
                    <CheckCircle className="w-4 h-4 text-white" />
                  ) : wizardStep === step.id ? (
                    step.id === 3
                      ? <LayoutDashboard className="w-4 h-4 text-navy-900" />
                      : <Loader className="w-4 h-4 text-navy-900 animate-spin" />
                  ) : (
                    <span className="text-text-muted text-xs font-bold">{step.id}</span>
                  )}
                </motion.div>
                <span
                  className={`mt-1.5 text-xs font-medium ${
                    wizardStep >= step.id ? 'text-text-primary' : 'text-text-muted'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {idx < WIZARD_STEPS.length - 1 && (
                <motion.div
                  animate={{
                    backgroundColor: wizardStep > step.id ? '#10b981' : 'rgba(0,212,255,0.15)',
                  }}
                  className="h-0.5 w-20 mx-2 mt-[-14px] transition-all duration-500"
                />
              )}
            </div>
          ))}
        </div>

        {/* Content Panels */}
        <AnimatePresence mode="wait">
          {wizardStep === 1 && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ duration: 0.4 }}
            >
              <ResumeUpload
                userId={user?.id}
                onUploadStart={handleUploadStart}
                onProgress={handleProgress}
                onComplete={handleComplete}
                onError={handleError}
                onCareerAnalysis={handleCareerAnalysis}
                onOpportunityMatches={handleOpportunityMatches}
              />
            </motion.div>
          )}

          {wizardStep === 2 && (
            <motion.div
              key="analysis"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ duration: 0.4 }}
            >
              <AnalysisProgress steps={analysisSteps} />
            </motion.div>
          )}

          {wizardStep === 3 && (
            <motion.div
              key="done"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ duration: 0.4 }}
              className="space-y-6"
            >
              {/* Success state */}
              <div className="glass-card rounded-2xl p-10 text-center space-y-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className="w-20 h-20 rounded-full bg-success-green/20 border border-success-green/30 flex items-center justify-center mx-auto"
                >
                  <CheckCircle className="w-10 h-10 text-success-green" />
                </motion.div>
                <h2 className="text-2xl font-bold gradient-text">Intelligence Ready!</h2>
                <p className="text-text-muted">
                  Your career profile, analysis, and opportunity matches are ready.
                  Redirecting to dashboard…
                </p>
                <div className="flex justify-center">
                  <div className="w-6 h-6 border-2 border-accent-cyan border-t-transparent rounded-full animate-spin" />
                </div>
              </div>


              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex justify-center"
              >
                <button
                  onClick={() => navigate('/dashboard')}
                  className="btn-primary px-8 py-3 text-base flex items-center gap-2"
                >
                  <LayoutDashboard className="w-5 h-5" />
                  Go to Dashboard
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Inline Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 rounded-lg bg-error-red/10 border border-error-red/20 text-error-red text-sm text-center"
          >
            {error}
          </motion.div>
        )}
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className={`fixed left-1/2 bottom-8 z-50 w-[min(90vw,420px)] -translate-x-1/2 rounded-2xl p-4 text-sm shadow-2xl ${
              toast.variant === 'success'
                ? 'bg-emerald-500/95 text-white'
                : toast.variant === 'error'
                ? 'bg-rose-500/95 text-white'
                : 'bg-slate-900/95 text-white border border-white/10'
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
