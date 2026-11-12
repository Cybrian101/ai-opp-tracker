import { useEffect, useMemo, useState } from 'react'
import { Sparkles, Heart, ThumbsUp, Volume2, VolumeX, ChevronRight, X } from 'lucide-react'
import useSpeech from '../../lib/useSpeech'
import useModule from '../../lib/useModule'
import useOpportunityStore from '../../stores/opportunityStore'
import { ErrorPanel } from '../../modules/ui'

// The short version of the whole report: a warm opener, what is missing, what to improve, what to do next, and what to
// pursue. Generated only when clicked (it costs a small model call), with links to the section that explains each point.

const TONE = {
  celebrate: { Icon: Sparkles, label: 'Great news', cls: 'text-success-green bg-success-green/10 border-success-green/30' },
  steady: { Icon: ThumbsUp, label: 'A solid start', cls: 'text-accent-cyan bg-accent-cyan/10 border-accent-cyan/30' },
  support: { Icon: Heart, label: 'You are not behind', cls: 'text-accent-purple bg-accent-purple/10 border-accent-purple/30' },
}

const SECTION_LABEL = {
  overview: 'Scores', intelligence: 'Strengths and weak spots', roles: 'Recommended roles', opportunities: 'Opportunities', gaps: 'Skill gaps',
  roadmap: 'Roadmap', narrative: 'AI analysis', dna: 'Career DNA', multiverse: 'Multiverse', skillmap: 'Skill Map', jdlab: 'JD Lab',
  plan: '90-Day Plan', builder: 'Builder', comeback: 'Returning to work',
}

const BLOCKS = [
  ['missing', "What's missing"],
  ['improve', 'What to improve'],
  ['next', 'Do this next'],
  ['pursue', 'What you could pursue'],
]

export default function TldrCard({ onGoTo }) {
  const language = useOpportunityStore((s) => s.language)
  const { data, loading, error, run } = useModule('tldr')
  const [open, setOpen] = useState(false)
  const speech = useSpeech(language, data?.tone)

  const spoken = useMemo(() => {
    if (!data) return ''
    return [data.opener, ...BLOCKS.flatMap(([key, title]) => (data[key].length ? [`${title}.`, ...data[key].map((p) => p.point)] : []))].join(' ')
  }, [data])

  function show() {
    setOpen(true)
    run()
  }

  if (!open) {
    return (
      <div className="glass-card rounded-2xl p-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-cyan/25 to-accent-purple/25 border border-white/10 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-4 h-4 text-accent-cyan" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text-primary">TLDR</p>
          <p className="text-xs text-text-muted">The short version of this report: what is missing, what to improve, and what to do next.</p>
        </div>
        <button onClick={show} className="text-xs font-semibold px-3.5 py-2 rounded-lg text-onaccent" style={{ background: 'var(--grad-brand)' }}>
          Show TLDR
        </button>
      </div>
    )
  }

  const tone = data ? TONE[data.tone] || TONE.steady : null

  return (
    <div className="glass-card rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-accent-cyan" />
        <h3 className="text-sm font-semibold text-text-primary flex-1">TLDR</h3>
        {data && speech.canListen && (
          <button onClick={() => speech.listen(spoken)} className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg border border-white/10 text-text-muted hover:text-text-primary hover:bg-white/5">
            {speech.state === 'idle' ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}{' '}
            {speech.state === 'idle' ? 'Listen' : speech.state === 'preparing' ? (speech.percent > 0 && speech.percent < 100 ? `Preparing voice ${speech.percent}%` : 'Preparing voice...') : 'Stop'}
          </button>
        )}
        <button onClick={() => { window.speechSynthesis?.cancel(); setSpeaking(false); setOpen(false) }} aria-label="Hide TLDR" className="text-text-muted hover:text-text-primary">
          <X className="w-4 h-4" />
        </button>
      </div>

      {loading && !data && (
        <div className="flex items-center gap-2.5 text-sm text-text-muted" role="status">
          <div className="w-4 h-4 border-2 border-accent-cyan/30 border-t-accent-cyan rounded-full animate-spin" /> Summarising your report...
        </div>
      )}
      {error && !data && <ErrorPanel message={error} onRetry={() => run()} />}

      {data && (
        <>
          <div className={`flex gap-3 p-3.5 rounded-xl border ${tone.cls}`}>
            <tone.Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide opacity-80">{tone.label}</p>
              <p className="text-sm text-text-primary leading-relaxed mt-0.5">{data.opener}</p>
            </div>
          </div>

          {(speech.notice || (speech.slow && speech.state !== 'idle')) && (
            <p className="text-[11px] text-text-muted">
              {speech.notice || 'This device is slow at making the natural voice, so there may be pauses.'}{' '}
              {speech.slow && !speech.notice && (
                <button onClick={speech.switchToDevice} className="text-accent-cyan hover:underline">Use the built-in voice instead</button>
              )}
            </p>
          )}

          <div className="grid sm:grid-cols-2 gap-3">
            {BLOCKS.filter(([key]) => data[key].length).map(([key, title]) => (
              <div key={key} className="p-3 rounded-xl bg-white/4 border border-white/8">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted mb-1.5">{title}</p>
                <ul className="space-y-2">
                  {data[key].map((p) => (
                    <li key={p.point} className="text-sm text-text-primary leading-snug">
                      {p.point}
                      {p.section && (
                        <button onClick={() => onGoTo?.(p.section)} className="ml-1.5 inline-flex items-center gap-0.5 text-[11px] text-accent-cyan hover:underline align-baseline">
                          {SECTION_LABEL[p.section]} <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
