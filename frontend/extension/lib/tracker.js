// The application log: entries the user chose to record, kept only in this browser (chrome.storage.local).

/** Spreadsheet formulas typed into a cell can run when the CSV is opened, so cells that start like one are defused. */
function cell(value) {
  let s = String(value ?? '')
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export const CSV_HEADER = ['Date', 'Role', 'Company', 'Decision', 'Score', 'Status', 'Page']

export function buildCsv(items) {
  const rows = (items || []).map((e) => [new Date(e.ts).toISOString().slice(0, 10), e.role, e.company, e.decision, e.score, e.status, e.url])
  return [CSV_HEADER, ...rows].map((r) => r.map(cell).join(',')).join('\r\n') + '\r\n'
}

/** Only the origin and path of the page are kept: query strings can contain personal tokens. */
export function safeUrl(url) {
  try {
    const u = new URL(url)
    return `${u.origin}${u.pathname}`
  } catch {
    return ''
  }
}

export function makeEntry(result, page, now = Date.now()) {
  return {
    id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
    ts: now,
    role: result.role || 'not stated',
    company: result.company || 'not stated',
    decision: result.decision,
    score: result.score,
    status: 'applied',
    url: safeUrl(page.url),
  }
}
