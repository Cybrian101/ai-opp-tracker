import { motion } from 'framer-motion'
import {
  Upload, Brain, TrendingUp, Target, Sparkles, CheckCircle2, Loader2, XCircle,
} from 'lucide-react'

const PIPELINE_STEPS = [
  { key: 'upload',               label: 'Uploading Resume',          icon: Upload },
  { key: 'analyzing',            label: 'AI Resume Analysis',         icon: Brain },
  { key: 'career_analysis',      label: 'Career Intelligence',        icon: TrendingUp },
  { key: 'opportunity_matching', label: 'Matching Opportunities',     icon: Target },
  { key: 'complete_intelligence',label: 'Intelligence Ready',         icon: Sparkles },
]

function getIcon(stepId) {
  const found = PIPELINE_STEPS.find((p) => p.key === stepId)
  return found ? found.icon : CheckCircle2
}

function getLabel(stepId) {
  const found = PIPELINE_STEPS.find((p) => p.key === stepId)
  return found ? found.label : stepId
}

function getProgress(steps) {
  if (!steps.length) return 0
  const done = steps.filter((s) => s.status === 'done').length
  return Math.round((done / steps.length) * 100)
}

const STATUS_COLORS = {
  pending: 'text-text-muted border-white/10 bg-white/5',
  running: 'text-accent-cyan border-accent-cyan/40 bg-accent-cyan/10',
  done: 'text-success-green border-success-green/40 bg-success-green/10',
  error: 'text-error-red border-error-red/40 bg-error-red/10',
  failed: 'text-error-red border-error-red/40 bg-error-red/10',
}

export default function AnalysisProgress({ steps = [] }) {
  const progress = getProgress(steps)
  const runningStep = steps.find((s) => s.status === 'running')

  return (
    <div className="p-8 space-y-6 glass-card rounded-2xl">
      <div className="text-center">
        <h2 className="mb-1 text-xl font-semibold text-text-primary">
          Building Your Career Intelligence
        </h2>
        <p className="text-sm text-text-muted">
          {runningStep
            ? (PIPELINE_STEPS.find((p) => p.key === runningStep.id)?.label || runningStep.label || 'Processing...')
            : progress === 100
            ? '✓ All done!'
            : 'Initializing pipeline...'}
        </p>
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-text-muted">
          <span>Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="relative h-2.5 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{ background: 'var(--grad-brand-h)' }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Pipeline Steps */}
      <div className="space-y-2.5">
        {steps.map((step, idx) => {
          const Icon = getIcon(step.id)
          const label = getLabel(step.id) || step.label
          const statusClass = STATUS_COLORS[step.status] || STATUS_COLORS.pending
          const isRunning = step.status === 'running'
          const isDone = step.status === 'done'
          const isError = step.status === 'error' || step.status === 'failed'

          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.07, duration: 0.35 }}
              className={`pipeline-step flex items-center gap-4 p-3.5 rounded-xl border transition-all duration-500 ${statusClass} ${
                isRunning ? 'running' : isDone ? 'done' : isError ? 'failed' : ''
              }`}
            >
              {/* Icon */}
              <div className="flex items-center justify-center flex-shrink-0 border border-current rounded-lg w-9 h-9 bg-current/10">
                {isRunning ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isDone ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </motion.div>
                ) : isError ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1, x: [0, -4, 4, -4, 4, 0] }}
                    transition={{ duration: 0.4, type: 'spring' }}
                  >
                    <XCircle className="w-4 h-4" />
                  </motion.div>
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>

              {/* Label */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{label}</p>
                {isRunning && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex gap-1 mt-1"
                  >
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="w-1 h-1 bg-current rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </motion.div>
                )}
                {step.message && !isRunning && (
                  <p className="text-xs opacity-70 mt-0.5 truncate">{step.message}</p>
                )}
              </div>

              {/* Status badge */}
              {isDone && (
                <motion.span
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex-shrink-0 text-xs font-semibold"
                >
                  Done
                </motion.span>
              )}
              {isError && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex-shrink-0 text-xs font-semibold"
                >
                  Error
                </motion.span>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="text-center">
        <p className="text-xs text-text-muted">
          ✨ Powered by AI-Ops — building your complete career intelligence profile
        </p>
      </div>
    </div>
  )
}
