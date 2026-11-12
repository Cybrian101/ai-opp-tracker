// Translates the whole page (buttons, headings, everything) with Google's website translator widget.
// No translation text is stored in this project. The AI-written content is already generated in the chosen language
// by the server prompts, so only the fixed interface text depends on this.
//
// Privacy: Google Translate receives the text shown on the page, which includes details from the resume analysis.

const ELEMENT_ID = 'google_translate_element'
let loading

function loadWidget() {
  if (loading) return loading
  loading = new Promise((resolve) => {
    if (!document.getElementById(ELEMENT_ID)) {
      const holder = document.createElement('div')
      holder.id = ELEMENT_ID
      holder.style.display = 'none'
      document.body.appendChild(holder)
    }
    window.googleTranslateElementInit = () => {
      // eslint-disable-next-line no-new
      new window.google.translate.TranslateElement({ pageLanguage: 'en', includedLanguages: 'ta,hi,kn', autoDisplay: false }, ELEMENT_ID)
      resolve(true)
    }
    const script = document.createElement('script')
    script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'
    script.async = true
    script.onerror = () => resolve(false) // offline or blocked: the app keeps working in English
    document.head.appendChild(script)
  })
  return loading
}

function waitForCombo(timeoutMs = 6000) {
  return new Promise((resolve) => {
    const started = Date.now()
    const tick = () => {
      const combo = document.querySelector('select.goog-te-combo')
      if (combo) resolve(combo)
      else if (Date.now() - started > timeoutMs) resolve(null)
      else setTimeout(tick, 150)
    }
    tick()
  })
}

/** Starts loading the translator without changing anything. Called when the user reaches for the language picker, so
 * the script is ready by the time a language is chosen. English-only visitors never load it. */
export function preloadPageTranslator() {
  loadWidget()
}

/** Resolves true once the widget has actually rewritten some text on the page, false if that does not happen in time. */
function waitForTranslation(timeoutMs = 5000) {
  return new Promise((resolve) => {
    const started = Date.now()
    const tick = () => {
      if (document.querySelector('#root font')) resolve(true)
      else if (Date.now() - started > timeoutMs) resolve(false)
      else setTimeout(tick, 150)
    }
    tick()
  })
}

/**
 * @param {'en'|'ta'|'hi'|'kn'} code
 * @param {(status: 'working' | 'done' | 'failed') => void} [onStatus] lets the interface show progress or a failure
 * @returns {Promise<boolean>} false if the translator could not load or did not translate
 */
export async function setPageLanguage(code, onStatus = () => {}) {
  if (code === 'en' && !document.querySelector('select.goog-te-combo')) return true // nothing was translated yet
  onStatus('working')
  if (!(await loadWidget())) { onStatus('failed'); return false }
  const combo = await waitForCombo()
  if (!combo) { onStatus('failed'); return false }
  const value = code === 'en' ? '' : code
  const apply = () => {
    combo.value = value
    combo.dispatchEvent(new Event('change'))
  }
  apply()
  // The widget sometimes ignores the first change event, so apply it once more a moment later.
  setTimeout(() => {
    if (!document.documentElement.classList.contains('translated-ltr') === (code !== 'en')) apply()
  }, 400)
  if (code === 'en') { onStatus('done'); return true }
  const translated = await waitForTranslation()
  onStatus(translated ? 'done' : 'failed')
  return translated
}
