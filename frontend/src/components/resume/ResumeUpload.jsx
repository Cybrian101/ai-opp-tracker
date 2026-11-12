import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, FileText, X, AlertCircle, KeyRound, ChevronDown } from 'lucide-react'
import useOpportunityStore from '../../stores/opportunityStore'

const MAX_FILE_BYTES = 3 * 1024 * 1024

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      // strip the "data:<mime>;base64," prefix
      const base64 = String(result).split(',')[1] || ''
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function ResumeUpload({
  onDemo,
  onUploadStart,
  onProgress,
  onProfile,
  onCareerAnalysis,
  onOpportunityMatches,
  onComplete,
  onError,
}) {
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [showKeyField, setShowKeyField] = useState(false)
  // The key lives in memory only (never persisted) so the career tools can reuse it after analysis.
  const apiKey = useOpportunityStore((s) => s.apiKey)
  const setApiKey = useOpportunityStore((s) => s.setApiKey)
  const language = useOpportunityStore((s) => s.language)

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (rejectedFiles.length > 0) {
      setUploadError('Only PDF and DOCX files are accepted, up to 3 MB.')
      return
    }
    setUploadError('')
    setSelectedFile(acceptedFiles[0])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
    maxSize: MAX_FILE_BYTES,
  })

  function formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  async function handleUpload() {
    if (!selectedFile || uploading) return
    setUploading(true)
    setUploadError('')
    onUploadStart?.()

    try {
      const fileBase64 = await fileToBase64(selectedFile)

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileBase64,
          mimeType: selectedFile.type,
          apiKey: apiKey.trim() || undefined,
          language,
        }),
      })

      if (!response.ok) {
        let message = `Upload failed: ${response.statusText}`
        try {
          const body = await response.json()
          if (body?.error) message = body.error
        } catch {
          // ignore
        }
        throw new Error(message)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder('utf-8')
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed.startsWith('data:')) continue
          const raw = trimmed.slice(5).trim()
          if (!raw) continue

          try {
            const event = JSON.parse(raw)
            if (event.type === 'step') {
              onProgress?.({ stepId: event.stepId, message: event.message })
            } else if (event.type === 'profile') {
              onProfile?.(event.data)
            } else if (event.type === 'career_analysis') {
              onCareerAnalysis?.(event.data)
            } else if (event.type === 'opportunity_matches') {
              onOpportunityMatches?.(event.data)
            } else if (event.type === 'complete') {
              onComplete?.()
            } else if (event.type === 'error') {
              throw new Error(event.message)
            }
          } catch (e) {
            if (e.message?.includes('JSON')) continue
            throw e
          }
        }
      }
    } catch (err) {
      setUploadError(err.message || 'Upload failed. Please try again.')
      onError?.(err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="glass-card rounded-2xl p-8 space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-text-primary mb-1">Upload Your Resume</h2>
        <p className="text-text-muted text-sm">PDF or DOCX up to 3 MB</p>
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`relative rounded-xl border-2 border-dashed transition-all duration-300 cursor-pointer p-10 text-center group ${
          isDragActive
            ? 'border-accent-cyan bg-accent-cyan/10 glow-cyan-sm'
            : selectedFile
            ? 'border-success-green/40 bg-success-green/5'
            : 'border-white/15 hover:border-accent-cyan/40 hover:bg-accent-cyan/5'
        }`}
      >
        <input {...getInputProps()} />

        <AnimatePresence mode="wait">
          {selectedFile ? (
            <motion.div
              key="file"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center gap-3"
            >
              <div className="w-14 h-14 rounded-xl bg-success-green/15 border border-success-green/25 flex items-center justify-center">
                <FileText className="w-7 h-7 text-success-green" />
              </div>
              <div>
                <p className="text-text-primary font-medium">{selectedFile.name}</p>
                <p className="text-text-muted text-sm">{formatSize(selectedFile.size)}</p>
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setSelectedFile(null) }}
                className="flex items-center gap-1.5 text-xs text-text-muted hover:text-error-red transition-colors"
              >
                <X className="w-3.5 h-3.5" /> Remove
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4"
            >
              <motion.div
                animate={{ y: isDragActive ? -8 : 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className={`w-16 h-16 rounded-2xl border-2 flex items-center justify-center transition-all ${
                  isDragActive
                    ? 'border-accent-cyan bg-accent-cyan/20'
                    : 'border-white/15 bg-white/5 group-hover:border-accent-cyan/40'
                }`}
              >
                <Upload className={`w-8 h-8 transition-colors ${isDragActive ? 'text-accent-cyan' : 'text-text-muted group-hover:text-accent-cyan'}`} />
              </motion.div>
              <div>
                <p className="text-text-primary font-medium">
                  {isDragActive ? 'Drop your resume here' : 'Drag & drop your resume'}
                </p>
                <p className="text-text-muted text-sm mt-1">or click to browse files</p>
              </div>
              <div className="flex gap-2">
                {['PDF', 'DOCX'].map((fmt) => (
                  <span key={fmt} className="badge badge-cyan text-xs">{fmt}</span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {onDemo && (
        <div className="space-y-2">
          <p className="text-center text-[11px] text-text-muted">No resume handy? Explore a sample candidate. No API key needed.</p>
          <div className="grid sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onDemo('returner')}
              className="py-3 px-3 rounded-xl text-sm font-semibold text-accent-cyan border border-accent-cyan/30 hover:bg-accent-cyan/10 transition-all"
            >
              Demo: returning to work
              <span className="block text-[11px] font-normal text-text-muted mt-0.5">Engineer, five-year career break</span>
            </button>
            <button
              type="button"
              onClick={() => onDemo('graduate')}
              className="py-3 px-3 rounded-xl text-sm font-semibold text-accent-cyan border border-accent-cyan/30 hover:bg-accent-cyan/10 transition-all"
            >
              Demo: recent graduate
              <span className="block text-[11px] font-normal text-text-muted mt-0.5">Fresher with a data project</span>
            </button>
          </div>
        </div>
      )}

      {/* Bring-your-own-key (optional, ephemeral) */}
      <div className="rounded-xl border border-white/10 bg-white/3 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowKeyField((v) => !v)}
          className="w-full flex items-center gap-2 px-4 py-3 text-xs text-text-muted hover:text-text-primary transition-colors"
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span className="flex-1 text-left">Using your own Gemini API key? (optional)</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showKeyField ? 'rotate-180' : ''}`} />
        </button>
        <AnimatePresence>
          {showKeyField && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-4 pb-4"
            >
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy... (only used for this request, never stored)"
                className="w-full bg-navy-900/60 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-cyan/50 transition-colors"
              />
              <p className="text-[11px] text-text-muted mt-2 leading-relaxed">
                We only fall back to this key if the shared quota is exhausted. It stays in your browser tab's memory and is sent only with your requests — never saved anywhere.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Error */}
      {uploadError && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-3 rounded-lg bg-error-red/10 border border-error-red/20 text-error-red text-sm"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {uploadError}
        </motion.div>
      )}

      {/* Upload Button */}
      <AnimatePresence>
        {selectedFile && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            onClick={handleUpload}
            disabled={uploading}
            className="w-full py-3.5 rounded-xl font-semibold text-onaccent flex items-center justify-center gap-2 transition-all disabled:opacity-60"
            style={{ background: 'var(--grad-brand)' }}
          >
            {uploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Analyze Resume
              </>
            )}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
