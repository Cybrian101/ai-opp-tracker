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

/** @param {'en'|'ta'|'hi'|'kn'} code  @returns {Promise<boolean>} false if the translator could not load */
export async function setPageLanguage(code) {
  if (code === 'en' && !document.querySelector('select.goog-te-combo')) return true // nothing was translated yet
  if (!(await loadWidget())) return false
  const combo = await waitForCombo()
  if (!combo) return false
  combo.value = code === 'en' ? '' : code
  combo.dispatchEvent(new Event('change'))
  return true
}
