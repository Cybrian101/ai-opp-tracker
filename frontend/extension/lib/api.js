// Calls the PathFound server. Only the page text (capped), the page address without its query string, and the
// trimmed profile are sent. Nothing is stored on the server.

export async function analysePage({ apiBase, apiKey, bundle, page, signal }) {
  const base = String(apiBase || '').replace(/\/+$/, '')
  if (!/^https?:\/\//.test(base)) throw new Error('Set the PathFound server address in Settings.')

  let response
  try {
    response = await fetch(`${base}/api/module`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal,
      body: JSON.stringify({
        module: 'verdict',
        profile: bundle.profile,
        analysis: bundle.analysis,
        language: bundle.language || 'en',
        apiKey: apiKey || undefined,
        input: { pageText: page.text, pageTitle: page.title, pageUrl: page.url, structured: page.structured || {} },
      }),
    })
  } catch (err) {
    if (err && err.name === 'AbortError') throw new Error('That took too long. Try again.')
    throw new Error(`Could not reach the PathFound server at ${base}. Check the address in Settings and that the server is running.`)
  }

  let payload = null
  try { payload = await response.json() } catch { /* non-JSON error body */ }
  if (!response.ok) throw new Error((payload && payload.error) || `The server returned an error (${response.status}).`)
  return payload.data
}
