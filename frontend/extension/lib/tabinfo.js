// Pure URL logic for the side panel (no browser APIs, so it is unit-tested in Node).
// It only looks at a URL string. It never reads page content.

const BLOCKED = /^(chrome|edge|brave|about|chrome-extension|devtools|view-source|chrome-untrusted):|^https:\/\/chromewebstore\.google\.com|^https:\/\/chrome\.google\.com\/webstore/i

/**
 * @returns {{ state: 'unknown'|'blocked'|'pdf'|'file'|'ok', message?: string }}
 * 'unknown' means Chrome did not tell us the URL (no permission on that tab yet). That is NOT the same as unreadable.
 */
export function classifyUrl(url) {
  if (!url) return { state: 'unknown' }
  if (BLOCKED.test(url)) return { state: 'blocked', message: "Chrome doesn't let extensions read this kind of page. Open the job page itself, or paste the job text below." }
  if (/^file:/i.test(url)) return { state: 'file', message: 'Local files are only readable if you turn on "Allow access to file URLs" for this extension in chrome://extensions. Or paste the text below.' }
  if (/\.pdf($|[?#])/i.test(url)) return { state: 'pdf', message: "PDF job posts can't be read here. Copy the text and paste it below." }
  if (!/^https?:/i.test(url)) return { state: 'blocked', message: "This kind of page can't be read. Open the job page itself, or paste the job text below." }
  return { state: 'ok' }
}

const JOB_HOSTS = /(^|\.)(linkedin\.com|indeed\.[a-z.]+|naukri\.com|glassdoor\.[a-z.]+|greenhouse\.io|lever\.co|myworkdayjobs\.com|workable\.com|ashbyhq\.com|smartrecruiters\.com|icims\.com|monster\.[a-z.]+|foundit\.in|wellfound\.com)$/i
const JOB_PATH = /\/(jobs?|careers?|vacanc(y|ies)|openings?|positions?|apply|job-listing|viewjob|recruit(ment)?)(\/|$|\?)|job-?id=|jk=|currentJobId=/i

/** URL-only guess: could this be a job page? Used for a hint line, never to read or send anything. */
export function looksLikeJobUrl(url) {
  let u
  try { u = new URL(url) } catch { return false }
  if (!/^https?:$/.test(u.protocol)) return false
  return JOB_HOSTS.test(u.hostname) || JOB_PATH.test(u.pathname + u.search)
}

/** Short label for the panel from what Chrome exposes about the tab. Missing fields are fine. */
export function describeTab(tab) {
  const url = tab && tab.url
  const c = classifyUrl(url)
  let host = ''
  try { host = new URL(url).host } catch { /* unknown */ }
  return { state: c.state, message: c.message || '', host, title: (tab && tab.title) || '', url: url || '', jobLike: c.state === 'ok' && looksLikeJobUrl(url) }
}
