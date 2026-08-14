import { useState } from 'react'
import { motion } from 'framer-motion'
import { Map } from 'lucide-react'

const PHASES = [
  {
    key: 'plan30Days',
    label: '30 Days',
    color: '#00d4ff',
    bgColor: 'rgba(0,212,255,0.08)',
    borderColor: 'rgba(0,212,255,0.25)',
    numberColor: 'text-accent-cyan',
  },
  {
    key: 'plan90Days',
    label: '90 Days',
    color: '#7c3aed',
    bgColor: 'rgba(124,58,237,0.08)',
    borderColor: 'rgba(124,58,237,0.25)',
    numberColor: 'text-accent-purple',
  },
  {
    key: 'plan180Days',
    label: '180 Days',
    color: '#10b981',
    bgColor: 'rgba(16,185,129,0.08)',
    borderColor: 'rgba(16,185,129,0.25)',
    numberColor: 'text-success-green',
  },
]

function PhaseColumn({ phase, items = [] }) {
  const [expanded, setExpanded] = useState(true)

  return (
    <div
      className="flex-1 min-w-0 rounded-xl border p-4 space-y-3"
      style={{ background: phase.bgColor, borderColor: phase.borderColor }}
    >
      {/* Phase header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ background: phase.color, boxShadow: `0 0 8px ${phase.color}80` }}
          />
          <span className="font-bold text-text-primary text-sm">{phase.label}</span>
          <span className="text-xs text-text-muted">({items.length} actions)</span>
        </div>
        <span className="text-text-muted text-xs">{expanded ? '▲' : '▼'}</span>
      </button>

      {/* Action items */}
      {expanded && (
        <motion.ol
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-2 list-none"
        >
          {items.length === 0 ? (
            <li className="text-xs text-text-muted italic">No actions planned.</li>
          ) : (
            items.map((action, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex items-start gap-2.5 text-sm"
              >
                <span
                  className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5 ${phase.numberColor}`}
                  style={{ background: `${phase.color}20`, border: `1px solid ${phase.color}40` }}
                >
                  {i + 1}
                </span>
                <span className="text-text-primary leading-relaxed">{action}</span>
              </motion.li>
            ))
          )}
        </motion.ol>
      )}
    </div>
  )
}

function SkeletonRoadmap() {
  return (
    <div className="glass-card rounded-2xl p-6 space-y-4 animate-pulse">
      <div className="h-6 w-40 skeleton rounded" />
      <div className="flex gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex-1 h-52 skeleton rounded-xl" />
        ))}
      </div>
    </div>
  )
}

export default function CareerRoadmap({ plan30Days, plan90Days, plan180Days }) {
  const hasData = plan30Days || plan90Days || plan180Days
  if (!hasData) return <SkeletonRoadmap />

  const phases = [
    { ...PHASES[0], items: (plan30Days || []) },
    { ...PHASES[1], items: (plan90Days || []) },
    { ...PHASES[2], items: (plan180Days || []) },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="glass-card rounded-2xl p-6 space-y-5"
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <Map className="w-5 h-5 text-accent-purple" />
        <h3 className="text-lg font-semibold text-text-primary">Career Roadmap</h3>
      </div>

      {/* 3 phase columns — horizontal on desktop, stacked on mobile */}
      <div className="flex flex-col sm:flex-row gap-4">
        {phases.map((phase) => (
          <PhaseColumn key={phase.key} phase={phase} items={phase.items} />
        ))}
      </div>
    </motion.div>
  )
}
