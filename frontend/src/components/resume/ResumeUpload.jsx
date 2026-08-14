import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, FileText, X, AlertCircle } from 'lucide-react'
import { useState } from 'react'

export default function ResumeUpload({
  userId,
  onUploadStart,
  onProgress,
  onComplete,
  onError,
  onCareerAnalysis,
  onOpportunityMatches,
}) {
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (rejectedFiles.length > 0) {
      setUploadError('Only PDF and DOCX files are accepted.')
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
      'application/msword': ['.doc'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
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
      const formData = new FormData()
      formData.append('resume', selectedFile)
      formData.append('userId', userId || localStorage.getItem('oia_user_id') || 'anonymous')

      const response = await fetch('/api/resume/analyze', {
        method: 'POST',
        headers: { 'x-user-id': userId || '' },
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`)
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
          if (!raw || raw === '[DONE]') continue

          try {
            const event = JSON.parse(raw)
            if (event.type === 'step') {
              onProgress?.({ type: 'step', stepId: event.stepId, message: event.message })
            } else if (event.type === 'profile') {
              onComplete?.(event.data)
            } else if (event.type === 'career_analysis') {
              onCareerAnalysis?.(event.data)
            } else if (event.type === 'opportunity_matches') {
              onOpportunityMatches?.(event.data)
            } else if (event.type === 'complete') {
              // handled by parent via onComplete or direct navigate
              if (event.data?.profile) {
                onComplete?.(event.data.profile)
              }
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
        <p className="text-text-muted text-sm">PDF or DOCX up to 10 MB</p>
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
                {['PDF', 'DOCX', 'DOC'].map((fmt) => (
                  <span key={fmt} className="badge badge-cyan text-xs">{fmt}</span>
                ))}
              </div>
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
            className="w-full py-3.5 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #00d4ff, #7c3aed)' }}
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
