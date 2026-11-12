// English read-aloud with the Kokoro voice model, running locally in the browser (no text is sent to a server).
// The model files are fetched once from Hugging Face and the runtime from a CDN, then cached by the browser.
// Speech is generated sentence by sentence and played as soon as each one is ready.

const VOICE = 'af_heart' // Kokoro's own top-rated female voice (grade A): warm and expressive

let worker
function getWorker() {
  if (!worker) worker = new Worker(new URL('./kokoro.worker.js', import.meta.url), { type: 'module' })
  return worker
}

let counter = 0

export const splitSentences = (text) => String(text).replace(/\s+/g, ' ').trim().split(/(?<=[.!?])\s+/).filter(Boolean)

/**
 * @returns {{ stop: () => void }}
 * callbacks: onProgress(percent), onPlaying(), onDone(), onSlow(), onError(message)
 */
export function speakWithKokoro(text, { speed = 1 }, cb) {
  const id = ++counter
  const w = getWorker()
  const sentences = splitSentences(text)
  const ctx = new (window.AudioContext || window.webkitAudioContext)()
  const sources = []
  let nextStart = 0
  let received = 0
  let finished = false
  let playingAnnounced = false

  const cleanup = () => {
    w.removeEventListener('message', onMessage)
    w.removeEventListener('error', onFail)
    ctx.close().catch(() => {})
  }

  function onMessage(e) {
    const m = e.data
    if (m.type === 'progress') return cb.onProgress?.(m.percent)
    if (m.id !== undefined && m.id !== id) return
    if (m.type === 'chunk') {
      received += 1
      const buffer = ctx.createBuffer(1, m.samples.length, m.sampleRate)
      buffer.copyToChannel(m.samples, 0)
      const source = ctx.createBufferSource()
      source.buffer = buffer
      source.connect(ctx.destination)
      const startAt = Math.max(ctx.currentTime + 0.05, nextStart)
      source.start(startAt)
      nextStart = startAt + buffer.duration + 0.12 // a short breath between sentences
      sources.push(source)
      if (!playingAnnounced) { playingAnnounced = true; cb.onPlaying?.() }
      // Generating slower than the speech plays means there will be gaps; tell the UI so it can offer the device voice.
      if (m.seconds > buffer.duration * 1.3) cb.onSlow?.()
      if (received === sentences.length) source.onended = () => { if (!finished) { finished = true; cleanup(); cb.onDone?.() } }
    } else if (m.type === 'error') {
      finished = true
      cleanup()
      cb.onError?.(m.message)
    }
  }
  function onFail(err) {
    if (finished) return
    finished = true
    cleanup()
    cb.onError?.(String((err && err.message) || 'The voice could not start.'))
  }

  w.addEventListener('message', onMessage)
  w.addEventListener('error', onFail)
  w.postMessage({ type: 'speak', id, sentences, voice: VOICE, speed })

  return {
    stop() {
      if (finished) return
      finished = true
      w.postMessage({ type: 'cancel', id })
      sources.forEach((s) => { try { s.stop() } catch { /* already ended */ } })
      cleanup()
    },
  }
}
