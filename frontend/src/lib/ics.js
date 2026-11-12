// Builds an iCalendar (.ics) file from the 13-week plan, one all-day block per week. Client-side only.

function escapeText(s) {
  return String(s ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}

// RFC 5545: lines are limited to 75 octets; continuation lines start with one space.
function fold(line) {
  const out = []
  let rest = line
  while (new TextEncoder().encode(rest).length > 74) {
    let cut = 74
    while (new TextEncoder().encode(rest.slice(0, cut)).length > 74) cut -= 1
    out.push(rest.slice(0, cut))
    rest = ` ${rest.slice(cut)}`
  }
  out.push(rest)
  return out.join('\r\n')
}

function ymd(date) {
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  const d = String(date.getUTCDate()).padStart(2, '0')
  return `${y}${m}${d}`
}

/**
 * @param {Array<{week:number, theme:string, goals:string[], deliverable:string, hours:number, checkpoint:string}>} weeks
 * @param {Date} start first day of week 1 (local date parts are used)
 */
export function buildIcs(weeks, start = new Date()) {
  const base = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '')
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//PathFound//90-Day Plan//EN', 'CALSCALE:GREGORIAN']

  weeks.forEach((w) => {
    const first = new Date(base + (w.week - 1) * 7 * 86400000)
    const after = new Date(base + w.week * 7 * 86400000)
    const description = [
      ...w.goals.map((g) => `- ${g}`),
      w.deliverable && `Deliverable: ${w.deliverable}`,
      w.checkpoint && `Check: ${w.checkpoint}`,
    ]
      .filter(Boolean)
      .join('\n')
    lines.push(
      'BEGIN:VEVENT',
      `UID:pathfound-week-${w.week}-${stamp}@pathfound`,
      `DTSTAMP:${stamp}Z`,
      `DTSTART;VALUE=DATE:${ymd(first)}`,
      `DTEND;VALUE=DATE:${ymd(after)}`,
      `SUMMARY:${escapeText(`Week ${w.week}: ${w.theme} (${w.hours}h)`)}`,
      `DESCRIPTION:${escapeText(description)}`,
      'END:VEVENT'
    )
  })

  lines.push('END:VCALENDAR')
  return lines.map(fold).join('\r\n') + '\r\n'
}

export function downloadIcs(weeks, filename = 'pathfound-90-day-plan.ics') {
  const blob = new Blob([buildIcs(weeks)], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
