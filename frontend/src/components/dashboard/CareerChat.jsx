import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Mic, MessageCircle, Bot, User } from 'lucide-react'
import useOpportunityStore from '../../stores/opportunityStore'
import useChat from '../../hooks/useChat'

const EXAMPLE_PROMPTS = [
  "What skills am I missing for Google SWE?",
  "How do I become an AI Engineer?",
  "Find remote AI jobs",
  "Show opportunities above 80% match",
]

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl rounded-bl-none bg-white/8 border border-white/10 w-fit">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-accent-cyan animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  )
}

function ChatMessage({ message }) {
  const isUser = message.role === 'user'
  const isError = message.error

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25 }}
      className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div
        className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-white ${
          isUser
            ? 'bg-gradient-to-br from-accent-cyan to-accent-purple'
            : 'bg-white/10 border border-white/15'
        }`}
      >
        {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5 text-accent-cyan" />}
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? 'rounded-tr-none text-white'
            : isError
            ? 'rounded-tl-none bg-error-red/10 border border-error-red/20 text-error-red'
            : 'rounded-tl-none bg-white/8 border border-white/10 text-text-primary'
        }`}
        style={isUser ? { background: 'linear-gradient(135deg, #00d4ff, #7c3aed)' } : {}}
      >
        {message.content || (
          <span className="text-text-muted italic text-xs">...</span>
        )}
      </div>
    </motion.div>
  )
}

export default function CareerChat({ userId }) {
  const chatMessages = useOpportunityStore((s) => s.chatMessages)
  const isChatLoading = useOpportunityStore((s) => s.isChatLoading)
  const { sendMessage } = useChat()
  const [input, setInput] = useState('')
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, isChatLoading])

  async function handleSend() {
    const q = input.trim()
    if (!q || isChatLoading) return
    setInput('')
    await sendMessage(q, userId)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleExampleClick(prompt) {
    setInput(prompt)
    inputRef.current?.focus()
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-white/8">
        <div className="relative">
          <MessageCircle className="w-5 h-5 text-accent-cyan" />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-success-green animate-pulse" />
        </div>
        <h3 className="font-semibold text-text-primary text-sm">Career AI</h3>
        <span className="ml-auto text-xs text-text-muted">Ask anything</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {chatMessages.length === 0 ? (
          <div className="space-y-4">
            {/* Welcome message */}
            <div className="flex gap-2.5">
              <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center bg-white/10 border border-white/15">
                <Bot className="w-3.5 h-3.5 text-accent-cyan" />
              </div>
              <div className="max-w-[80%] px-3 py-2 rounded-2xl rounded-tl-none bg-white/8 border border-white/10 text-text-primary text-sm leading-relaxed">
                Hi! I'm your Career AI assistant. Ask me about your profile, target roles, skills to learn, or find opportunities. 🚀
              </div>
            </div>

            {/* Example prompts */}
            <div className="space-y-1.5">
              <p className="text-xs text-text-muted px-1">Try asking:</p>
              {EXAMPLE_PROMPTS.map((prompt, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  onClick={() => handleExampleClick(prompt)}
                  className="w-full text-left px-3 py-2 rounded-lg border border-white/10 bg-white/4 text-text-muted hover:text-accent-cyan hover:border-accent-cyan/30 hover:bg-accent-cyan/5 transition-all text-xs leading-relaxed"
                >
                  "{prompt}"
                </motion.button>
              ))}
            </div>
          </div>
        ) : (
          <>
            <AnimatePresence initial={false}>
              {chatMessages.map((msg, i) => (
                <ChatMessage key={msg.id || i} message={msg} />
              ))}
            </AnimatePresence>
            {isChatLoading && (
              <div className="flex gap-2.5">
                <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center bg-white/10 border border-white/15">
                  <Bot className="w-3.5 h-3.5 text-accent-cyan" />
                </div>
                <TypingIndicator />
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-white/8">
        <div className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your career..."
              rows={1}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 pr-10 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-cyan/50 resize-none transition-colors leading-relaxed"
              style={{ minHeight: '40px', maxHeight: '120px' }}
            />
          </div>
          <button
            onClick={() => {/* mic placeholder */}}
            className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-xl border border-white/10 bg-white/5 text-text-muted hover:text-accent-cyan hover:border-accent-cyan/30 transition-all"
          >
            <Mic className="w-4 h-4" />
          </button>
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={handleSend}
            disabled={!input.trim() || isChatLoading}
            className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-xl text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg, #00d4ff, #7c3aed)' }}
          >
            {isChatLoading ? (
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </motion.button>
        </div>
        <p className="text-[10px] text-text-muted mt-1.5 text-center">
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}
