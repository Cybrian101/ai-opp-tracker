import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, X, Loader } from 'lucide-react'
import { useVoice } from '../../hooks/useVoice'
import { useAgent } from '../../hooks/useAgent'

export default function VoiceAssistant() {
  const { isListening, transcript, isSupported, startListening, stopListening, speak, clearTranscript } = useVoice()
  const { runQuery } = useAgent()
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [lastTranscript, setLastTranscript] = useState('')

  useEffect(() => {
    if (!isListening && transcript && transcript !== lastTranscript) {
      setLastTranscript(transcript)
      handleSubmitTranscript(transcript)
    }
  }, [isListening, transcript])

  async function handleSubmitTranscript(text) {
    if (!text?.trim()) return
    setIsSubmitting(true)
    await runQuery(text)
    setIsSubmitting(false)
    setTimeout(() => {
      setIsOpen(false)
      clearTranscript()
      setLastTranscript('')
    }, 800)
  }

  function handleMicToggle() {
    if (!isSupported) return
    if (isListening) {
      stopListening()
    } else {
      clearTranscript()
      setLastTranscript('')
      startListening()
      setIsOpen(true)
    }
  }

  function handleClose() {
    if (isListening) stopListening()
    clearTranscript()
    setLastTranscript('')
    setIsOpen(false)
  }

  if (!isSupported) return null

  return (
    <>
      {/* Transcript overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 w-80 glass-card rounded-2xl p-4 border border-accent-cyan/20"
            style={{ boxShadow: '0 0 30px rgba(0, 212, 255, 0.15)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {isListening ? (
                  <div className="w-2 h-2 rounded-full bg-error-red animate-ping" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-success-green" />
                )}
                <span className="text-xs font-medium text-text-primary">
                  {isListening ? 'Listening...' : isSubmitting ? 'Processing...' : 'Tap mic to speak'}
                </span>
              </div>
              <button
                onClick={handleClose}
                className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
              >
                <X className="w-3.5 h-3.5 text-text-muted" />
              </button>
            </div>

            {/* Wave bars when listening */}
            {isListening && (
              <div className="animate-wave mb-3 flex justify-center">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="wave-bar"
                    style={{ animationDelay: `${i * 0.08}s` }}
                  />
                ))}
              </div>
            )}

            {/* Transcript */}
            <div className="min-h-[48px] p-3 rounded-xl bg-white/5 border border-white/8">
              {transcript ? (
                <p className="text-sm text-text-primary">{transcript}</p>
              ) : (
                <p className="text-sm text-text-muted italic">
                  {isListening ? 'Say your question...' : 'No speech detected'}
                </p>
              )}
            </div>

            {/* Submit manually */}
            {transcript && !isListening && !isSubmitting && (
              <motion.button
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => handleSubmitTranscript(transcript)}
                className="w-full mt-3 py-2 rounded-xl text-sm font-medium text-white transition-all"
                style={{ background: 'linear-gradient(135deg, #00d4ff, #7c3aed)' }}
              >
                Search with this query
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating mic button */}
      <motion.div
        className="fixed bottom-6 right-6 z-50 group"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-2 px-2.5 py-1 rounded-lg bg-navy-700 border border-white/10 text-xs text-text-muted whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Push to talk
        </div>

        {/* Listening rings */}
        {isListening && (
          <>
            <span className="absolute inset-0 rounded-full bg-error-red/30 animate-ping" />
            <span className="absolute -inset-2 rounded-full border-2 border-error-red/20 animate-pulse" />
          </>
        )}

        {/* Button */}
        <button
          onClick={isListening ? stopListening : handleMicToggle}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 relative ${
            isListening
              ? 'bg-error-red shadow-lg'
              : 'bg-gradient-to-br from-accent-cyan to-accent-purple animate-pulse-glow'
          }`}
        >
          {isSubmitting ? (
            <Loader className="w-6 h-6 text-white animate-spin" />
          ) : isListening ? (
            <MicOff className="w-6 h-6 text-white" />
          ) : (
            <Mic className="w-6 h-6 text-white" />
          )}
        </button>
      </motion.div>
    </>
  )
}
