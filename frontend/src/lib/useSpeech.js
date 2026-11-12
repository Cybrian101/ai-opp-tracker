import { useCallback, useEffect, useRef, useState } from 'react'
import { speakWithKokoro } from './kokoroSpeech'

// Read-aloud. English uses the Kokoro voice (natural, runs in the browser). Tamil, Hindi and Kannada use the device's own voice,
// and only when the device actually has one for that language.

// Kokoro has no emotion control, so mood comes from the voice choice and the pace:
// a little brighter for good news, slower and softer when someone needs support.
const SPEED = { celebrate: 1.06, steady: 1.0, support: 0.92 }
const DEVICE_LANG = { en: 'en-IN', ta: 'ta-IN', hi: 'hi-IN', kn: 'kn-IN' }

export default function useSpeech(language, tone) {
  const [state, setState] = useState('idle') // idle | preparing | playing
  const [percent, setPercent] = useState(0)
  const [slow, setSlow] = useState(false)
  const [notice, setNotice] = useState('')
  const [forceDevice, setForceDevice] = useState(false)
  const [deviceHasVoice, setDeviceHasVoice] = useState(false)
  const controller = useRef(null)

  useEffect(() => {
    if (!('speechSynthesis' in window)) return undefined
    const check = () => setDeviceHasVoice(window.speechSynthesis.getVoices().some((v) => v.lang.toLowerCase().startsWith(language)))
    check()
    window.speechSynthesis.addEventListener('voiceschanged', check)
    return () => window.speechSynthesis.removeEventListener('voiceschanged', check)
  }, [language])

  const useKokoro = language === 'en' && !forceDevice && typeof Worker !== 'undefined' && Boolean(window.AudioContext || window.webkitAudioContext)
  const canListen = useKokoro || deviceHasVoice

  const stop = useCallback(() => {
    controller.current?.stop()
    controller.current = null
    window.speechSynthesis?.cancel()
    setState('idle')
  }, [])
  useEffect(() => stop, [stop])

  const speakOnDevice = useCallback((text) => {
    const u = new SpeechSynthesisUtterance(text)
    u.lang = DEVICE_LANG[language] || 'en-IN'
    u.onend = () => setState('idle')
    u.onerror = () => setState('idle')
    setState('playing')
    window.speechSynthesis.speak(u)
  }, [language])

  const listen = useCallback((text) => {
    if (state !== 'idle') { stop(); return }
    setSlow(false)
    setNotice('')
    if (!useKokoro) { speakOnDevice(text); return }
    setState('preparing')
    setPercent(0)
    controller.current = speakWithKokoro(text, { speed: SPEED[tone] || 1 }, {
      onProgress: setPercent,
      onPlaying: () => setState('playing'),
      onSlow: () => setSlow(true),
      onDone: () => { controller.current = null; setState('idle') },
      onError: () => {
        // The natural voice could not load (offline, blocked, or unsupported): fall back to the device voice.
        controller.current = null
        setState('idle')
        setForceDevice(true)
        setNotice("The natural voice could not load, so your device's own voice will be used.")
      },
    })
  }, [state, stop, tone, useKokoro, speakOnDevice])

  const switchToDevice = useCallback(() => { stop(); setForceDevice(true); setSlow(false) }, [stop])

  return { canListen, state, percent, slow, notice, listen, stop, switchToDevice, naturalVoice: useKokoro }
}
