import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Key, Save, ArrowLeft, Loader } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import useUserStore from '../stores/userStore'
import api from '../lib/axios'

export default function SettingsPage() {
  const navigate = useNavigate()
  const { user } = useUserStore()
  
  const [openaiKey, setOpenaiKey] = useState('')
  const [geminiKey, setGeminiKey] = useState('')
  const [status, setStatus] = useState({ openai: false, gemini: false })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    if (!user?.id) return
    api.get(`/api/settings/${user.id}`)
      .then(res => {
        setStatus({
          openai: res.data.hasOpenAIKey,
          gemini: res.data.hasGeminiKey
        })
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [user])

  async function handleSave(e) {
    e.preventDefault()
    setIsSaving(true)
    setMessage(null)

    try {
      // Send keys (empty string means delete/clear if they want to, but we only send if they typed something new)
      const payload = {}
      if (openaiKey !== '') payload.openaiKey = openaiKey
      if (geminiKey !== '') payload.geminiKey = geminiKey

      if (Object.keys(payload).length === 0) {
        setMessage({ type: 'info', text: 'No changes to save.' })
        setIsSaving(false)
        return
      }

      await api.post(`/api/settings/${user.id}`, payload)
      setMessage({ type: 'success', text: 'API keys saved securely.' })
      
      if (openaiKey) setStatus(s => ({ ...s, openai: true }))
      if (geminiKey) setStatus(s => ({ ...s, gemini: true }))
      
      setOpenaiKey('')
      setGeminiKey('')
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to save API keys. Please try again.' })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader className="w-8 h-8 text-accent-cyan animate-spin" />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background p-6"
    >
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-text-muted hover:text-text-primary transition-colors mb-8"
        >
          <ArrowLeft size={16} /> Back
        </button>

        <div className="glass-card rounded-2xl p-8 border border-white/5">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-cyan to-accent-purple flex items-center justify-center">
              <Key className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">API Key Settings</h1>
              <p className="text-sm text-text-muted">Configure your own API keys for fallback if the default system limits are reached. Keys are encrypted before storage.</p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Gemini API Key</label>
              <div className="relative">
                <input
                  type="password"
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder={status.gemini ? "•••••••••••••••••••• (Key saved)" : "AIzaSy..."}
                  className="w-full bg-navy-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-accent-cyan transition-colors"
                />
              </div>
              <p className="text-xs text-text-muted mt-2">Used for Resume Parsing, Career Strategy, and Opportunity Matching.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">OpenAI API Key (Optional)</label>
              <div className="relative">
                <input
                  type="password"
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  placeholder={status.openai ? "•••••••••••••••••••• (Key saved)" : "sk-..."}
                  className="w-full bg-navy-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-accent-purple transition-colors"
                />
              </div>
              <p className="text-xs text-text-muted mt-2">Used for advanced reasoning tasks if configured.</p>
            </div>

            {message && (
              <div className={`p-3 rounded-lg text-sm border ${message.type === 'success' ? 'bg-success-green/10 border-success-green/20 text-success-green' : message.type === 'error' ? 'bg-error-red/10 border-error-red/20 text-error-red' : 'bg-white/5 border-white/10 text-text-primary'}`}>
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={isSaving || (!openaiKey && !geminiKey)}
              className="w-full btn-primary py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSaving ? <Loader className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Save Keys Securely
            </button>
          </form>
        </div>
      </div>
    </motion.div>
  )
}
