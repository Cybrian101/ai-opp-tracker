import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Download, RefreshCw, CheckCircle, Languages } from 'lucide-react'
import useOpportunityStore from './stores/opportunityStore'
import { LANGUAGES } from './lib/languages'
import { setPageLanguage } from './lib/pageTranslate'
import { downloadBundle } from './lib/exportBundle'
import { TABS } from './modules'
import TldrCard from './components/dashboard/TldrCard'
import ResumeUpload from './components/resume/ResumeUpload'
import AnalysisProgress from './components/resume/AnalysisProgress'
import CandidateOverview from './components/dashboard/CandidateOverview'
import CareerIntelligence from './components/dashboard/CareerIntelligence'
import RecommendedRoles from './components/dashboard/RecommendedRoles'
import OpportunityMatches from './components/dashboard/OpportunityMatches'
import SkillGaps from './components/dashboard/SkillGaps'
import CareerRoadmap from './components/dashboard/CareerRoadmap'
import AIRecommendations from './components/dashboard/AIRecommendations'
import ThemeToggle from './components/ThemeToggle'

const PIPELINE_ORDER = ['upload', 'analyzing', 'career_analysis', 'opportunity_matching', 'complete_intelligence']

function initPipelineSteps() {
  return PIPELINE_ORDER.map((key, i) => ({ id: key, label: key, status: i === 0 ? 'running' : 'pending' }))
}

function buildReportText(profile, analysis, matches) {
  const lines = []
  lines.push(`CAREER INTELLIGENCE REPORT — ${profile?.name || 'Candidate'}`)
  lines.push(`Generated ${new Date().toLocaleString()}`)
  lines.push('')
  if (analysis) {
    lines.push(`Resume Score: ${analysis.resumeScore}/100`)
    lines.push(`Employability Score: ${analysis.employabilityScore}/100`)
    lines.push(`Career Readiness Score: ${analysis.careerReadinessScore}/100`)
    lines.push(`Domain Fit: ${analysis.domainFit}`)
    lines.push('')
    lines.push('STRENGTHS')
    analysis.strengths.forEach((s) => lines.push(`  - ${s}`))
    lines.push('')
    lines.push('AREAS TO IMPROVE')
    analysis.improvementAreas.forEach((s) => lines.push(`  - ${s}`))
    lines.push('')
    lines.push('RECOMMENDED ROLES')
    analysis.recommendedRoles.forEach((r) => lines.push(`  - ${r.role} (${r.matchPercent}%) — ${r.reason}`))
    lines.push('')
    lines.push('SKILL GAPS')
    analysis.skillGaps.forEach((g) => lines.push(`  - ${g.skill} [${g.priority}] — ${g.learning}`))
    lines.push('')
    lines.push('30-DAY PLAN')
    analysis.plan30Days.forEach((s) => lines.push(`  - ${s}`))
    lines.push('')
    lines.push('90-DAY PLAN')
    analysis.plan90Days.forEach((s) => lines.push(`  - ${s}`))
    lines.push('')
    lines.push('180-DAY PLAN')
    analysis.plan180Days.forEach((s) => lines.push(`  - ${s}`))
    lines.push('')
    lines.push('AI NARRATIVE')
    lines.push(`  ${analysis.aiNarrative}`)
    lines.push('')
  }
  if (matches?.length) {
    lines.push('MATCHED OPPORTUNITIES')
    matches.forEach((m) => {
      lines.push(`  - [${m.matchScore}%] ${m.title} @ ${m.organization} — ${m.application_url}`)
    })
  }
  return lines.join('\n')
}

function downloadReport(profile, analysis, matches) {
  const text = buildReportText(profile, analysis, matches)
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `career-intelligence-${(profile?.name || 'report').replace(/\s+/g, '_')}.txt`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function LanguageSelect() {
  const language = useOpportunityStore((s) => s.language)
  const setLanguage = useOpportunityStore((s) => s.setLanguage)
  return (
    <label className="flex items-center gap-1.5 text-xs text-text-muted">
      <Languages className="w-3.5 h-3.5" aria-hidden="true" />
      <span className="sr-only">Language</span>
      {/* translate="no": the language names must stay in their own script, not be translated */}
      <select
        translate="no"
        value={language}
        onChange={(e) => {
          setLanguage(e.target.value) // language of the AI-written content
          setPageLanguage(e.target.value) // language of the buttons and headings (Google page translator)
        }}
        className="bg-navy-800 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent-cyan/50"
      >
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.label}
          </option>
        ))}
      </select>
    </label>
  )
}

export default function App() {
  const pageLanguage = useOpportunityStore((s) => s.language)
  // A language chosen earlier is applied again when the app opens.
  useEffect(() => {
    if (pageLanguage !== 'en') setPageLanguage(pageLanguage)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { profile, careerAnalysis, opportunityMatches, setProfile, setCareerAnalysis, setOpportunityMatches, reset, demo, loadDemo } =
    useOpportunityStore()

  const [stage, setStage] = useState('upload') // 'upload' | 'analyzing' | 'done'
  const [analysisSteps, setAnalysisSteps] = useState([])
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('overview')
  // Tabs stay mounted once opened so typed input and results survive switching tabs.
  const [visited, setVisited] = useState(() => new Set(['overview']))
  const [builderRequest, setBuilderRequest] = useState({ skill: '', role: '' })
  const [planRequest, setPlanRequest] = useState(null)

  const openTab = useCallback((id) => {
    setActiveTab(id)
    setVisited((prev) => (prev.has(id) ? prev : new Set(prev).add(id)))
  }, [])

  const openPlan = useCallback(
    ({ hoursPerWeek, field }) => {
      setPlanRequest({ hoursPerWeek, field, nonce: Date.now() })
      openTab('simulator')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    [openTab]
  )

  // TLDR points link to the section that explains them: Overview sections scroll, tools open their tab.
  const goTo = useCallback(
    (section) => {
      const tab = { dna: 'dna', multiverse: 'multiverse', skillmap: 'skillmap', jdlab: 'jdlab', plan: 'simulator', builder: 'builder', comeback: 'comeback' }[section]
      if (tab) {
        openTab(tab)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        setActiveTab('overview')
        setTimeout(() => document.getElementById(`sec-${section}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
      }
    },
    [openTab]
  )

  const buildSkill = useCallback(
    (skill, role = '') => {
      setBuilderRequest({ skill, role })
      openTab('builder')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    [openTab]
  )

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
    setStage('analyzing')
    setAnalysisSteps(initPipelineSteps())
  }, [])

  const handleProgress = useCallback(
    (event) => {
      if (event.stepId) progressToStep(event.stepId)
    },
    [progressToStep]
  )

  const handleComplete = useCallback(() => {
    setAnalysisSteps((prev) => prev.map((s) => ({ ...s, status: 'done' })))
    setTimeout(() => setStage('done'), 600)
  }, [])

  const handleError = useCallback((msg) => {
    setError(msg)
    setAnalysisSteps((prev) => prev.map((s) => (s.status === 'running' ? { ...s, status: 'error' } : s)))
    setStage('upload')
  }, [])

  const handleDemo = useCallback((personaId) => {
    loadDemo(personaId)
    setError('')
    setActiveTab('overview')
    setVisited(new Set(['overview']))
    setStage('done')
  }, [loadDemo])

  const handleReset = useCallback(() => {
    reset()
    setStage('upload')
    setAnalysisSteps([])
    setError('')
    setActiveTab('overview')
    setVisited(new Set(['overview']))
    setBuilderRequest({ skill: '', role: '' })
    setPlanRequest(null)
  }, [reset])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-background">
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-accent-cyan/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-accent-purple/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top bar */}
      <div className="sticky top-0 z-40 border-b border-white/5 px-4 py-3" style={{ background: 'rgb(var(--c-bg) / 0.92)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-4xl mx-auto flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center">
            <Zap className="w-4 h-4 text-onaccent" />
          </div>
          <span translate="no" className="font-bold gradient-text text-sm">PathFound</span>
          <div className="ml-auto flex items-center gap-2">
            <LanguageSelect />
            <ThemeToggle />
            {stage === 'done' && (
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-white/10 text-text-muted hover:text-text-primary hover:bg-white/5 transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Analyze another resume</span>
                <span className="sm:hidden">New</span>
              </button>
            )}
          </div>
        </div>
        {stage === 'done' && (
          <nav className="max-w-4xl mx-auto mt-3 -mb-1 flex gap-1 overflow-x-auto" role="tablist" aria-label="Career tools">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                role="tab"
                aria-selected={activeTab === id}
                onClick={() => openTab(id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  activeTab === id
                    ? 'bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/30'
                    : 'text-text-muted hover:text-text-primary hover:bg-white/5 border border-transparent'
                }`}
              >
                <Icon className="w-3.5 h-3.5" /> {label}
              </button>
            ))}
          </nav>
        )}
      </div>

      {pageLanguage !== 'en' && (
        <p className="max-w-4xl mx-auto px-4 pt-3 text-[11px] text-text-muted">
          The buttons and headings are translated by Google Translate, which means the text shown on this page is sent to Google. The AI results are written in your language by PathFound.
        </p>
      )}

      <div className={`${stage === 'done' ? 'max-w-4xl' : 'max-w-3xl'} mx-auto px-4 py-10`}>
        {stage === 'upload' && (
          <>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-text-primary mb-2">Build Your AI Career Profile</h1>
              <p className="text-text-muted">
                Upload your resume to get instant AI analysis, honest improvement feedback, and matched opportunities — nothing is stored, everything runs in this one request.
              </p>
            </div>
            <ResumeUpload
              onDemo={handleDemo}
              onUploadStart={handleUploadStart}
              onProgress={handleProgress}
              onProfile={setProfile}
              onCareerAnalysis={setCareerAnalysis}
              onOpportunityMatches={setOpportunityMatches}
              onComplete={handleComplete}
              onError={handleError}
            />
          </>
        )}

        {stage === 'analyzing' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto">
            <AnalysisProgress steps={analysisSteps} />
          </motion.div>
        )}

        {error && stage === 'upload' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 rounded-lg bg-error-red/10 border border-error-red/20 text-error-red text-sm text-center"
          >
            {error}
          </motion.div>
        )}

        {stage === 'done' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {demo && (
              <div className="rounded-xl border border-accent-purple/30 bg-accent-purple/10 px-4 py-2.5 text-xs text-text-primary">
                <span className="font-semibold text-accent-purple">Demo mode.</span> You are looking at a fictional candidate and pre-written results. No AI calls are made. Choose "Analyze another resume" to use your own.
              </div>
            )}
            {/* Conditional render, not `hidden`: the flex utility class would override the hidden attribute. */}
            {activeTab === 'overview' && (
              <div className="glass-card rounded-2xl p-5 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-success-green flex-shrink-0" />
                <p className="text-sm text-text-primary flex-1">
                  Your career intelligence report is ready. Download it now — nothing is saved on our end.
                </p>
                <button
                  onClick={() => downloadReport(profile, careerAnalysis, opportunityMatches)}
                  className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg text-onaccent transition-all"
                  style={{ background: 'var(--grad-brand)' }}
                >
                  <Download className="w-3.5 h-3.5" /> Download Report
                </button>
                <button
                  onClick={() => downloadBundle({ profile, careerAnalysis, comeback: useOpportunityStore.getState().comeback, language: useOpportunityStore.getState().language })}
                  title="A small file for the PathFound Job Copilot browser extension. It leaves out your email and phone."
                  className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-accent-cyan/40 text-accent-cyan hover:bg-accent-cyan/10 transition-all"
                >
                  <Download className="w-3.5 h-3.5" /> Export for extension
                </button>
              </div>
            )}

            <div hidden={activeTab !== 'overview'} className="space-y-6">
              <TldrCard onGoTo={goTo} />
              <div id="sec-overview"><CandidateOverview profile={profile} analysis={careerAnalysis} /></div>
              <div id="sec-intelligence"><CareerIntelligence analysis={careerAnalysis} /></div>
              {careerAnalysis?.recommendedRoles?.length > 0 && <div id="sec-roles"><RecommendedRoles roles={careerAnalysis.recommendedRoles} /></div>}
              <div id="sec-opportunities"><OpportunityMatches matches={opportunityMatches || []} /></div>
              {careerAnalysis?.skillGaps?.length > 0 && <div id="sec-gaps"><SkillGaps skillGaps={careerAnalysis.skillGaps} /></div>}
              {(careerAnalysis?.plan30Days?.length || careerAnalysis?.plan90Days?.length || careerAnalysis?.plan180Days?.length) && (
                <div id="sec-roadmap"><CareerRoadmap
                  plan30Days={careerAnalysis.plan30Days}
                  plan90Days={careerAnalysis.plan90Days}
                  plan180Days={careerAnalysis.plan180Days}
                /></div>
              )}
              {careerAnalysis?.aiNarrative && (
                <div id="sec-narrative"><AIRecommendations
                  narrative={careerAnalysis.aiNarrative}
                  strengths={careerAnalysis.strengths}
                  improvementAreas={careerAnalysis.improvementAreas}
                /></div>
              )}
              <div className="glass-card rounded-2xl p-5 text-center">
                <p className="text-sm text-text-primary">Go deeper with the tools above.</p>
                <p className="text-xs text-text-muted mt-1">
                  Discover your Career DNA, explore four possible futures, or paste a job and see your real odds.
                </p>
                <div className="flex flex-wrap justify-center gap-2 mt-3">
                  {TABS.filter((t) => t.Component && t.id !== 'builder').map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => openTab(id)}
                      className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-accent-cyan/30 text-accent-cyan hover:bg-accent-cyan/10 transition-all"
                    >
                      <Icon className="w-3.5 h-3.5" /> {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {TABS.filter((t) => t.Component && visited.has(t.id)).map(({ id, Component }) => (
              <div key={id} hidden={activeTab !== id}>
                <Component
                  active={activeTab === id}
                  onBuildSkill={buildSkill}
                  onOpenPlan={openPlan}
                  {...(id === 'builder' ? { initialSkill: builderRequest.skill, initialRole: builderRequest.role } : {})}
                  {...(id === 'simulator' ? { request: planRequest } : {})}
                />
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
