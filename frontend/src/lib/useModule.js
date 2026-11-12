import { useCallback, useEffect, useState } from 'react'
import useOpportunityStore from '../stores/opportunityStore'
import { DEMOS } from '../demo/demoData'

// In-flight requests, so React strict-mode double effects or fast tab switching never fire a module twice.
const pending = new Map()

// Demo mode never touches the network: it answers from the bundled sample data after a short delay,
// so the loading states look the way they do with the real API.
async function callDemoModule(body) {
  await new Promise((resolve) => setTimeout(resolve, 900))
  const persona = DEMOS[useOpportunityStore.getState().demoPersona] || DEMOS.returner
  if (body.module === 'builder') return persona.builder(body.input?.skill)
  if (body.module === 'simulator') return persona.simulator(body.input?.hoursPerWeek)
  const data = persona.modules[body.module]
  if (!data) {
    throw new Error(`This tool is not part of the "${persona.label}" demo. Try the "Returning engineer" demo, or upload your own resume.`)
  }
  return data
}

async function callModule(body) {
  if (useOpportunityStore.getState().demo) return callDemoModule(body)
  const response = await fetch('/api/module', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  let payload = null
  try {
    payload = await response.json()
  } catch {
    // non-JSON error body
  }
  if (!response.ok) throw new Error(payload?.error || `Request failed (${response.status})`)
  return payload.data
}

/**
 * Runs one server module against the current profile and caches the result for the session.
 *   const { data, loading, error, run } = useModule('dna', { auto: true })
 *   run(input) re-runs with that input (used by modules that take user input, e.g. JD Lab).
 * Results are keyed by module + language + input, so switching language fetches a fresh version.
 */
export default function useModule(moduleId, { auto = false, input = null } = {}) {
  const profile = useOpportunityStore((s) => s.profile)
  const analysis = useOpportunityStore((s) => s.careerAnalysis)
  const language = useOpportunityStore((s) => s.language)
  const comeback = useOpportunityStore((s) => s.comeback)
  const apiKey = useOpportunityStore((s) => s.apiKey)
  const results = useOpportunityStore((s) => s.moduleResults)
  const setModuleResult = useOpportunityStore((s) => s.setModuleResult)

  const [activeInput, setActiveInput] = useState(input)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const inputKey = JSON.stringify(activeInput ?? {})
  const key = `${moduleId}|${language}|${inputKey}`
  const exact = results[key] ?? null
  // After a language switch the new-language answer takes a few seconds. Until it arrives, keep showing the previous
  // language's result (the page translator has already translated it), so the screen changes at once and never blanks.
  const stale = exact ? null : results[Object.keys(results).find((k) => k.startsWith(`${moduleId}|`) && k.endsWith(`|${inputKey}`))] ?? null
  const data = exact ?? stale

  const run = useCallback(
    async (nextInput) => {
      const effectiveInput = nextInput === undefined ? activeInput : nextInput
      const runKey = `${moduleId}|${language}|${JSON.stringify(effectiveInput ?? {})}`
      setActiveInput(effectiveInput)
      setError('')
      if (useOpportunityStore.getState().moduleResults[runKey]) return

      setLoading(true)
      try {
        if (!pending.has(runKey)) {
          const request = callModule({
            module: moduleId,
            // The break context travels with the profile, but only once the user submitted that form.
            profile: comeback && moduleId !== 'comeback' ? { ...profile, comeback } : profile,
            analysis,
            input: effectiveInput || undefined,
            language,
            apiKey: apiKey.trim() || undefined,
          }).finally(() => pending.delete(runKey))
          pending.set(runKey, request)
        }
        setModuleResult(runKey, await pending.get(runKey))
      } catch (err) {
        setError(err.message || 'Something went wrong. Please try again.')
      } finally {
        setLoading(false)
      }
    },
    [activeInput, analysis, apiKey, comeback, language, moduleId, profile, setModuleResult]
  )

  useEffect(() => setError(''), [language])

  // Auto modules fetch when first opened, and again if the language changes.
  useEffect(() => {
    if (auto && profile && !exact && !loading && !error) run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, profile, language, exact])

  return { data, loading, error, run, language }
}
