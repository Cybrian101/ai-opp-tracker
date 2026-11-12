import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, CheckCircle2, AlertTriangle, Zap } from 'lucide-react'

function useTypewriter(text, speed = 18) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)
  const rafRef = useRef(null)
  const idxRef = useRef(0)
  const prevTextRef = useRef(null)

  useEffect(() => {
    if (!text) return
    if (prevTextRef.current !== text) {
      prevTextRef.current = text
      idxRef.current = 0
      setDisplayed('')
      setDone(false)
    }

    let lastTime = null

    function tick(timestamp) {
      if (!lastTime) lastTime = timestamp
      const elapsed = timestamp - lastTime

      if (elapsed >= speed) {
        lastTime = timestamp
        idxRef.current += 1
        const slice = text.slice(0, idxRef.current)
        setDisplayed(slice)
        if (idxRef.current >= text.length) {
          setDone(true)
          return
        }
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [text, speed])

  return { displayed, done }
}

function SkeletonNarrative() {
  return (
    <div className="p-6 space-y-4 glass-card rounded-2xl animate-pulse">
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded skeleton" />
        <div className="w-40 h-5 rounded skeleton" />
      </div>
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-4 rounded skeleton" style={{ width: `${80 + i * 5}%` }} />
      ))}
    </div>
  )
}

export default function AIRecommendations({ narrative, strengths = [], improvementAreas = [] }) {
  if (!narrative) return <SkeletonNarrative />

  const { displayed, done } = useTypewriter(narrative, 12)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.35 }}
      className="p-6 space-y-5 glass-card rounded-2xl"
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-accent-cyan" />
        <h3 className="text-lg font-semibold text-text-primary">AI Career Analysis</h3>
      </div>

      {/* Typewriter narrative */}
      <div className="relative">
        <p className="text-sm leading-relaxed whitespace-pre-wrap text-text-primary">
          {displayed}
          {!done && (
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ repeat: Infinity, duration: 0.6 }}
              className="inline-block w-0.5 h-4 bg-accent-cyan ml-0.5 align-middle"
            />
          )}
        </p>
      </div>

      {/* Opportunities from strengths + risks from improvements */}
      {(strengths.length > 0 || improvementAreas.length > 0) && (
        <div className="grid grid-cols-1 gap-4 pt-2 border-t sm:grid-cols-2 border-white/8">
          {/* Opportunities */}
          {strengths.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-success-green" />
                <span className="text-xs font-semibold tracking-wider uppercase text-success-green">
                  Key Opportunities
                </span>
              </div>
              <ul className="space-y-1.5">
                {strengths.slice(0, 3).map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-text-primary">
                    <span className="text-success-green mt-0.5 flex-shrink-0">→</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Risks from improvement areas */}
          {improvementAreas.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-semibold tracking-wider uppercase text-amber-400">
                  Key Risks
                </span>
              </div>
              <ul className="space-y-1.5">
                {improvementAreas.slice(0, 3).map((a, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-text-primary">
                    <span className="text-amber-400 mt-0.5 flex-shrink-0">!</span>
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Gemini badge */}
      <div className="flex justify-end">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-accent-purple/25 bg-accent-purple/10 text-xs text-accent-purple">
          <Zap className="w-3 h-3" />
          Generated by PathFound
        </div>
      </div>
    </motion.div>
  )
}
