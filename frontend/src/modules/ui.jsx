import { useState } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, KeyRound, RefreshCw, Copy, Check } from 'lucide-react'
import useOpportunityStore from '../stores/opportunityStore'

// Small building blocks shared by every module screen.

export function ModuleHeader({ icon: Icon, title, subtitle, children }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-cyan/20 to-accent-purple/20 border border-white/10 flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-accent-cyan" />
      </div>
      <div className="flex-1 min-w-0">
        <h2 className="text-xl font-bold text-text-primary">{title}</h2>
        <p className="text-sm text-text-muted mt-0.5">{subtitle}</p>
      </div>
      {children}
    </div>
  )
}

export function Card({ title, icon: Icon, children, className = '', right }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={`glass-card rounded-2xl p-5 ${className}`}
    >
      {title && (
        <div className="flex items-center gap-2 mb-3">
          {Icon && <Icon className="w-4 h-4 text-accent-cyan" />}
          <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
          {right && <div className="ml-auto">{right}</div>}
        </div>
      )}
      {children}
    </motion.section>
  )
}

export function LoadingPanel({ message }) {
  return (
    <div className="glass-card rounded-2xl p-6 space-y-4" role="status" aria-live="polite">
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 border-2 border-accent-cyan/30 border-t-accent-cyan rounded-full animate-spin" />
        <p className="text-sm text-text-primary">{message}</p>
      </div>
      <div className="space-y-2 animate-pulse">
        <div className="h-4 skeleton rounded w-3/4" />
        <div className="h-4 skeleton rounded w-1/2" />
        <div className="h-24 skeleton rounded-xl" />
      </div>
    </div>
  )
}

export function ErrorPanel({ message, onRetry }) {
  const apiKey = useOpportunityStore((s) => s.apiKey)
  const setApiKey = useOpportunityStore((s) => s.setApiKey)
  const needsKey = /api key|quota|limit/i.test(message || '')

  return (
    <div className="glass-card rounded-2xl p-5 space-y-3 border-error-red/30">
      <div className="flex items-start gap-2 text-error-red text-sm">
        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <p>{message}</p>
      </div>
      {needsKey && (
        <div className="flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-text-muted flex-shrink-0" />
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Your free Gemini API key (kept in this tab only)"
            className="flex-1 bg-navy-900/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-cyan/50"
          />
        </div>
      )}
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-white/10 text-text-primary hover:bg-white/5 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Try again
        </button>
      )}
    </div>
  )
}

export function CopyButton({ text, label = 'Copy' }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard blocked; nothing useful to do
    }
  }
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-md border border-white/10 text-text-muted hover:text-text-primary hover:bg-white/5 transition-all"
    >
      {copied ? <Check className="w-3 h-3 text-success-green" /> : <Copy className="w-3 h-3" />}
      {copied ? 'Copied' : label}
    </button>
  )
}

/** Circular score ring used by several modules. */
export function ScoreRing({ value, size = 84, label, color = 'rgb(var(--c-accent))' }) {
  const r = (size - 10) / 2
  const c = 2 * Math.PI * r
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(var(--c-fg) / calc(0.08 * var(--fg-boost)))" strokeWidth="7" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - Math.min(100, Math.max(0, value)) / 100) }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-text-primary leading-none">{Math.round(value)}</span>
        {label && <span className="text-[9px] text-text-muted uppercase tracking-wide mt-0.5">{label}</span>}
      </div>
    </div>
  )
}
