// Page reader. `extractPage` is injected into the page by chrome.scripting.executeScript, so it must be fully
// self-contained (no imports, no outside variables): Chrome serialises just its source.
// It works on any page: job boards, careers sites, Google Forms, referral pages, and web-mail messages.

export function extractPage() {
  const clean = (s) =>
    String(s || '')
      .replace(/[ \t ]+/g, ' ')
      .replace(/ *\n */g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  const MAX = 14000

  // 1. Text the user selected wins: they told us exactly what to read.
  const selection = clean(String(window.getSelection ? window.getSelection() : ''))

  // 2. Structured data many careers pages publish (schema.org JobPosting): the most reliable source when present.
  const structured = {}
  let structuredDescription = ''
  const stripHtml = (html) => {
    const d = document.createElement('div')
    d.innerHTML = String(html || '')
    return clean(d.textContent)
  }
  try {
    for (const node of document.querySelectorAll('script[type="application/ld+json"]')) {
      let data
      try { data = JSON.parse(node.textContent) } catch { continue }
      const items = Array.isArray(data) ? data : data && data['@graph'] ? data['@graph'] : [data]
      for (const it of items) {
        const t = it && it['@type']
        if (!(t === 'JobPosting' || (Array.isArray(t) && t.includes('JobPosting')))) continue
        const loc = Array.isArray(it.jobLocation) ? it.jobLocation[0] : it.jobLocation
        const addr = (loc && loc.address) || {}
        const pay = it.baseSalary && it.baseSalary.value
        structured.title = it.title || structured.title
        structured.company = (it.hiringOrganization && it.hiringOrganization.name) || structured.company
        structured.location = [addr.addressLocality, addr.addressRegion, addr.addressCountry].filter((x) => typeof x === 'string').join(', ') || structured.location
        structured.employmentType = [].concat(it.employmentType || []).join(', ') || structured.employmentType
        structured.validThrough = it.validThrough || structured.validThrough
        if (pay && (pay.minValue || pay.value)) structured.salary = `${pay.minValue || pay.value}${pay.maxValue ? ` - ${pay.maxValue}` : ''} ${(it.baseSalary && it.baseSalary.currency) || ''} ${pay.unitText || ''}`.trim()
        structuredDescription = structuredDescription || stripHtml(it.description)
      }
    }
  } catch { /* structured data is a bonus; never fail on it */ }

  // 3. Find the main content. Known sites first (their layouts bury the job in a lot of navigation), then generic.
  const host = location.hostname
  const bySite = [
    [/linkedin\.com$/, ['.jobs-search__job-details--container', '.job-view-layout', '.jobs-description', '.scaffold-layout__detail', '.show-more-less-html']],
    [/indeed\.[a-z.]+$/, ['#jobsearch-ViewjobPaneWrapper', '.jobsearch-ViewJobLayout-jobDisplay', '#jobDescriptionText']],
    [/naukri\.com$/, ['.job-desc-container', '.jd-container', '[class*="job-desc"]']],
    [/google\.com$/, ['form', '[role="main"]']],
  ]
  const generic = ['[itemtype*="JobPosting" i]', 'main', 'article', '[role="main"]', '#content', '.content']
  const selectors = [...bySite.filter(([re]) => re.test(host)).flatMap(([, s]) => s), ...generic]
  let body = ''
  for (const sel of selectors) {
    let el
    try { el = document.querySelector(sel) } catch { continue }
    const text = el ? clean(el.innerText) : ''
    if (text.length >= 200) { body = text; break }
  }
  if (!body) body = clean(document.body ? document.body.innerText : '')
  // A careers page whose visible text is thin but which publishes a full structured description
  if (body.length < 300 && structuredDescription.length > body.length) body = structuredDescription

  const useSelection = selection.length >= 40
  return {
    url: location.href,
    title: document.title || '',
    text: (useSelection ? selection : body).slice(0, MAX),
    usedSelection: useSelection,
    structured,
    isTop: window === window.top,
  }
}

/**
 * Combine the results from every frame of a page (Google Forms and many careers sites embed the real content in an iframe).
 * @param {Array<{frameId:number, result:object}>} frames
 */
export function mergeFrames(frames) {
  const results = (frames || []).map((f) => f && f.result).filter(Boolean)
  if (!results.length) return null
  const top = results.find((r) => r.isTop) || results[0]
  const selected = results.find((r) => r.usedSelection)
  if (selected) return { ...selected, title: top.title, url: top.url, structured: Object.keys(selected.structured || {}).length ? selected.structured : top.structured }

  let text = top.text || ''
  const seen = new Set([text.slice(0, 120)])
  for (const r of results) {
    if (r === top || !r.text || r.text.length < 200) continue
    const key = r.text.slice(0, 120)
    if (seen.has(key) || text.includes(key)) continue
    seen.add(key)
    text += `\n\n[Embedded content]\n${r.text}`
  }
  const structured = results.map((r) => r.structured).find((s) => s && Object.keys(s).length) || {}
  return { url: top.url, title: top.title, text: text.slice(0, 14000), usedSelection: false, structured }
}
