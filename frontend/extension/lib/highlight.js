// Page highlighter, injected on demand (self-contained, no imports). Marks requirement phrases on the page:
// green = you meet it, amber = partly, red = you do not. Only exact phrases the analysis quoted are marked.

export function highlightRequirements(items) {
  const COLORS = { met: 'rgba(16,185,129,0.35)', partial: 'rgba(245,158,11,0.40)', missing: 'rgba(239,68,68,0.38)' }
  const LABEL = { met: 'You meet this', partial: 'You partly meet this', missing: 'You appear to be missing this' }

  // Remove marks from an earlier run
  document.querySelectorAll('mark[data-pathfound]').forEach((m) => {
    const parent = m.parentNode
    while (m.firstChild) parent.insertBefore(m.firstChild, m)
    parent.removeChild(m)
    parent.normalize()
  })

  let found = 0
  for (const item of items || []) {
    const quote = String(item.quote || '').trim()
    if (quote.length < 6) continue
    const needle = quote.toLowerCase()
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => {
        const p = node.parentElement
        if (!p || /^(SCRIPT|STYLE|NOSCRIPT|TEXTAREA|INPUT|MARK)$/.test(p.tagName)) return NodeFilter.FILTER_REJECT
        return node.nodeValue.toLowerCase().includes(needle) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
      },
    })
    const node = walker.nextNode()
    if (!node) continue
    const at = node.nodeValue.toLowerCase().indexOf(needle)
    const range = document.createRange()
    range.setStart(node, at)
    range.setEnd(node, at + needle.length)
    const mark = document.createElement('mark')
    mark.setAttribute('data-pathfound', item.status || 'partial')
    mark.title = `PathFound: ${LABEL[item.status] || ''}`
    mark.style.cssText = `background:${COLORS[item.status] || COLORS.partial};color:inherit;border-radius:3px;padding:0 2px;`
    try {
      range.surroundContents(mark)
      found += 1
    } catch { /* a quote that crosses element boundaries is skipped rather than breaking the page */ }
  }
  const first = document.querySelector('mark[data-pathfound]')
  if (first && first.scrollIntoView) first.scrollIntoView({ block: 'center', behavior: 'smooth' })
  return { found, total: (items || []).length }
}

export function clearHighlights() {
  document.querySelectorAll('mark[data-pathfound]').forEach((m) => {
    const parent = m.parentNode
    while (m.firstChild) parent.insertBefore(m.firstChild, m)
    parent.removeChild(m)
    parent.normalize()
  })
}
