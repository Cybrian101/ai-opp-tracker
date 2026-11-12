// Runs the Kokoro voice model off the main thread, so the page never freezes while speech is generated.
// Messages in:  { type: 'speak', id, sentences, voice, speed } | { type: 'cancel', id }
// Messages out: { type: 'progress', percent } | { type: 'chunk', id, index, samples, sampleRate, seconds } | { type: 'done', id } | { type: 'error', message }
import { KokoroTTS } from 'kokoro-js'

const MODEL = 'onnx-community/Kokoro-82M-v1.0-ONNX'
let loading
const cancelled = new Set()

function load() {
  if (loading) return loading
  const progress_callback = (p) => {
    if (p && p.status === 'progress' && Number.isFinite(p.progress)) self.postMessage({ type: 'progress', percent: Math.round(p.progress) })
  }
  loading = (async () => {
    // WebGPU is much faster when the browser has it; otherwise the smaller quantised model on WASM.
    if (self.navigator && self.navigator.gpu) {
      try {
        return await KokoroTTS.from_pretrained(MODEL, { dtype: 'fp32', device: 'webgpu', progress_callback })
      } catch {
        // no usable GPU adapter: fall through to WASM
      }
    }
    return KokoroTTS.from_pretrained(MODEL, { dtype: 'q8', device: 'wasm', progress_callback })
  })()
  loading.catch(() => { loading = undefined }) // allow a retry after a failed download
  return loading
}

self.onmessage = async (event) => {
  const msg = event.data
  if (msg.type === 'cancel') {
    cancelled.add(msg.id)
    return
  }
  if (msg.type !== 'speak') return
  try {
    const tts = await load()
    for (let i = 0; i < msg.sentences.length; i++) {
      if (cancelled.has(msg.id)) break
      const started = performance.now()
      const audio = await tts.generate(msg.sentences[i], { voice: msg.voice, speed: msg.speed })
      if (cancelled.has(msg.id)) break
      const samples = audio.audio.slice()
      self.postMessage({ type: 'chunk', id: msg.id, index: i, samples, sampleRate: audio.sampling_rate, seconds: (performance.now() - started) / 1000 }, [samples.buffer])
    }
    self.postMessage({ type: 'done', id: msg.id })
  } catch (err) {
    self.postMessage({ type: 'error', id: msg.id, message: String((err && err.message) || err) })
  }
}
