import { storage, isExtension, readActivePage, highlight, clearMarks, openUrl, requestAllSites, hasAllSites, onTabChange } from './lib/platform.js'
import { analysePage } from './lib/api.js'
import { parseBundle } from './lib/profile.js'
import { buildCsv, makeEntry } from './lib/tracker.js'
import { THEME_KEY, resolveTheme, nextTheme } from './lib/theme.js'

// Side panel UI. All page-derived text is inserted with textContent only, never as HTML.

// HOSTING: these two addresses are the only defaults to change when the app is deployed. Set DEFAULT_API_BASE to the
// deployed Vercel URL (for example 'https://your-app.vercel.app') and DEFAULT_APP_URL to the same URL, then reload the
// extension. Users can also override both in Settings. Also update host_permissions in manifest.json if you want the
// server pre-authorised (not required: the API sends Access-Control-Allow-Origin: *).
const DEFAULT_API_BASE = 'http://localhost:3001'
const DEFAULT_APP_URL = 'http://localhost:5173'
const DEFAULTS = { apiBase: DEFAULT_API_BASE, appUrl: DEFAULT_APP_URL }
const DECISION = {
  apply: { label: 'Good fit: worth applying', cls: 'apply' },
  stretch: { label: 'Possible: close the gaps first', cls: 'stretch' },
  skip: { label: 'Probably skip', cls: 'skip' },
  avoid: { label: 'Avoid: looks like a scam', cls: 'avoid' },
  unclear: { label: 'Not a job, or too little to judge', cls: 'unclear' },
}
const STATUS_ICON = { met: '✓', partial: '~', missing: '✗' }

const state = { tab: 'analyse', bundle: null, settings: { ...DEFAULTS }, log: [], page: null, result: null, loading: false, error: '', pasted: '', logged: false, marks: '' }
const app = document.getElementById('app')

const systemPrefersLight = () => Boolean(window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches)
let theme = resolveTheme(undefined, systemPrefersLight())
const applyTheme = (t) => { theme = t; document.documentElement.dataset.theme = t }
applyTheme(theme)
async function toggleTheme() {
  applyTheme(nextTheme(theme))
  try { await storage.set({ [THEME_KEY]: theme }) } catch { /* the choice still applies for this session */ }
  render()
}

function h(tag, props, ...kids) {
  const node = document.createElement(tag)
  for (const [k, v] of Object.entries(props || {})) {
    if (v === undefined || v === null || v === false) continue
    if (k === 'class') node.className = v
    else if (k.startsWith('on')) node.addEventListener(k.slice(2).toLowerCase(), v)
    else if (k === 'text') node.textContent = v
    else if (k === 'value') node.value = v // a value attribute does not set a textarea's content, so use the property
    else node.setAttribute(k, v === true ? '' : v)
  }
  for (const kid of kids.flat()) {
    if (kid === null || kid === undefined || kid === false) continue
    node.append(kid.nodeType ? kid : document.createTextNode(String(kid)))
  }
  return node
}

const host = (url) => { try { return new URL(url).host } catch { return '' } }
const meaningful = (v) => v && v !== 'not stated' && v !== 'unspecified'

async function load() {
  const saved = await storage.get(['bundle', 'settings', 'log', THEME_KEY])
  applyTheme(resolveTheme(saved[THEME_KEY], systemPrefersLight()))
  state.bundle = saved.bundle || null
  state.settings = { ...DEFAULTS, ...(saved.settings || {}) }
  state.log = saved.log || []
  render()
  if (state.bundle) analyse()
}

async function analyse() {
  state.error = ''
  state.result = null
  state.logged = false
  state.marks = ''
  state.loading = true
  render()
  try {
    let page
    if (isExtension && !state.pasted.trim()) {
      const read = await readActivePage()
      if (read.error) throw new Error(read.error)
      page = read.page
    } else {
      const text = state.pasted.trim()
      page = { text, title: 'Pasted text', url: '', structured: {}, usedSelection: false }
      if (!text) throw new Error('Paste the job text below to analyse it.')
    }
    state.page = page
    state.result = await analysePage({ apiBase: state.settings.apiBase, apiKey: state.settings.apiKey, bundle: state.bundle, page })
  } catch (err) {
    state.error = err.message || 'Something went wrong.'
  }
  state.loading = false
  render()
}

function scoreRing(score, cls) {
  const r = 24
  const c = 2 * Math.PI * r
  const color = { apply: '#10b981', stretch: '#f59e0b', skip: '#ef4444', avoid: '#ef4444', unclear: '#94a3b8' }[cls]
  const ns = 'http://www.w3.org/2000/svg'
  const svg = document.createElementNS(ns, 'svg')
  svg.setAttribute('width', '60'); svg.setAttribute('height', '60'); svg.setAttribute('viewBox', '0 0 60 60')
  const mk = (tag, attrs) => { const e = document.createElementNS(ns, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); return e }
  svg.append(mk('circle', { cx: 30, cy: 30, r, fill: 'none', stroke: 'rgba(255,255,255,.1)', 'stroke-width': 6 }))
  svg.append(mk('circle', { cx: 30, cy: 30, r, fill: 'none', stroke: color, 'stroke-width': 6, 'stroke-linecap': 'round', 'stroke-dasharray': c, 'stroke-dashoffset': c * (1 - score / 100), transform: 'rotate(-90 30 30)' }))
  const t = mk('text', { x: 30, y: 31, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: '#fff', 'font-size': 15, 'font-weight': 800 })
  t.textContent = String(score)
  svg.append(t)
  return svg
}

function section(title, ...body) {
  const kids = body.flat().filter(Boolean)
  return kids.length ? h('div', { class: 'card' }, h('h3', { text: title }), kids) : null
}
const bullets = (items) => (items && items.length ? h('ul', { class: 'list' }, items.map((t) => h('li', null, h('span', { class: 'ic muted', text: '•' }), h('span', { class: 'grow', text: t })))) : null)

function summaryText(r) {
  const lines = [`${r.role} at ${r.company}`, `${DECISION[r.decision].label} (fit ${r.score}/100)`, r.headline, '']
  if (r.gaps.length) lines.push('Gaps: ' + r.gaps.map((g) => g.skill).join(', '))
  if (r.redFlags.length) lines.push('Red flags: ' + r.redFlags.map((f) => f.flag).join('; '))
  if (r.nextStep) lines.push('Next: ' + r.nextStep)
  return lines.filter((l) => l !== undefined).join('\n')
}

function renderResult() {
  const r = state.result
  const d = DECISION[r.decision]
  const out = []

  if (r.safety.risk !== 'low') {
    out.push(h('div', { class: `banner ${r.safety.risk}` }, h('strong', { text: r.safety.risk === 'high' ? 'Do not share personal or payment details' : 'Some warning signs on this page' }), h('span', { class: 'small muted', text: 'Based only on what is written on the page.' }), bullets(r.safety.signals)))
  }

  const facts = [['Role', r.role], ['Company', r.company], ['Location', r.location], ['Work mode', r.workMode], ['Type', r.employmentType], ['Pay', r.pay], ['Deadline', r.deadline]]
  out.push(h('div', { class: 'card' },
    h('div', { class: 'verdict' }, r.decision === 'unclear' ? null : scoreRing(r.score, d.cls), h('div', { class: 'grow' }, h('span', { class: `chip ${d.cls}`, text: d.label }), h('p', { class: 'headline', text: r.headline }))),
    h('div', { class: 'facts' }, facts.map(([k, v]) => h('div', { class: 'fact' }, h('div', { class: 'k', text: k }), h('div', { class: 'v', text: meaningful(v) ? v : 'not stated' })))),
  ))

  const marked = r.requirements.filter((q) => q.quote)
  out.push(h('div', { class: 'actions' },
    marked.length && isExtension ? h('button', { class: 'btn small', text: 'Highlight on page', onClick: async () => { const res = await highlight(marked.map((q) => ({ quote: q.quote, status: q.status }))); state.marks = `Marked ${res.found} of ${res.total} on the page.`; render() } }) : null,
    h('button', { class: 'btn small', text: state.logged ? 'Logged ✓' : 'Log as applied', disabled: state.logged, onClick: logApplied }),
    h('button', { class: 'btn small', text: 'Copy summary', onClick: (e) => { navigator.clipboard.writeText(summaryText(r)); e.target.textContent = 'Copied ✓' } }),
    h('button', { class: 'btn small', text: 'Open PathFound', onClick: () => openUrl(state.settings.appUrl) }),
    state.marks ? h('span', { class: 'small muted', text: state.marks }) : null,
  ))

  if (r.decision !== 'unclear') {
    out.push(section('How it fits you',
      h('div', { class: 'row' }, h('span', { class: `tag ${r.interestMatch}`, text: `Interests: ${r.interestMatch}` })),
      r.interestNote ? h('p', { class: 'small', text: r.interestNote }) : null,
      bullets(r.strengths),
    ))
    out.push(section('Requirements on this page', r.requirements.length ? h('ul', { class: 'list' }, r.requirements.map((q) => h('li', null, h('span', { class: `ic ${q.status}`, text: STATUS_ICON[q.status] }), h('span', { class: 'grow', text: q.text })))) : null))
    out.push(section('Gaps to close', r.gaps.length ? h('ul', { class: 'list' }, r.gaps.map((g) => h('li', null, h('span', { class: `tag ${g.severity}`, text: g.severity }), h('span', { class: 'grow' }, h('strong', { text: g.skill }), g.howToClose ? h('div', { class: 'small muted', text: g.howToClose }) : null)))) : null))
  }

  out.push(section('Red flags', r.redFlags.length ? h('ul', { class: 'list' }, r.redFlags.map((f) => h('li', null, h('span', { class: 'ic missing', text: '!' }), h('span', { class: 'grow' }, h('strong', { text: f.flag }), f.evidence ? h('div', { class: 'small muted', text: f.evidence }) : null)))) : null))

  const flexSignals = [r.flexibility.remote !== 'unstated' ? `Remote: ${r.flexibility.remote}` : null, r.flexibility.partTime !== 'unstated' ? `Part-time: ${r.flexibility.partTime}` : null, ...r.flexibility.signals].filter(Boolean)
  out.push(section('Flexibility', bullets(flexSignals)))

  out.push(section('Before you apply', bullets(r.beforeYouApply)))
  out.push(section('What the page asks you to prepare',
    r.prepare.documents.length ? h('div', null, h('div', { class: 'small muted', text: 'Documents' }), bullets(r.prepare.documents)) : null,
    r.prepare.steps.length ? h('div', null, h('div', { class: 'small muted', text: 'Steps' }), bullets(r.prepare.steps)) : null,
    r.prepare.deadlineNote ? h('p', { class: 'small', text: r.prepare.deadlineNote }) : null,
  ))
  out.push(section('Questions worth asking', bullets(r.questionsToAsk)))
  out.push(section('About the market', bullets(r.marketContext), r.marketContext.length ? h('p', { class: 'note', text: 'General context about this kind of role. It is not live market data, so check current postings and salary sites.' }) : null))
  out.push(section('Your next step', r.nextStep ? h('p', { text: r.nextStep }) : null))
  return out
}

async function logApplied() {
  state.log = [makeEntry(state.result, state.page || {}), ...state.log].slice(0, 200)
  await storage.set({ log: state.log })
  state.logged = true
  render()
}

function viewAnalyse() {
  if (!state.bundle) return setupCard()
  const el = []
  if (!isExtension) el.push(h('div', { class: 'preview', text: 'Preview mode: running as a normal page, so paste the job text below. In Chrome, the extension reads the page you are on.' }))
  el.push(h('div', { class: 'card' },
    h('div', { class: 'page-line' }, h('div', { class: 'grow' }, h('div', { class: 'host', text: state.page ? host(state.page.url) || 'Pasted text' : isExtension ? 'Current page' : 'Pasted text' }), state.page ? h('div', { class: 'title-line', text: state.page.title }) : null),
      h('button', { class: 'btn primary', disabled: state.loading, onClick: analyse }, state.loading ? [h('span', { class: 'spinner' }), 'Reading…'] : state.result || state.error ? 'Analyse again' : 'Analyse this page')),
    state.page && state.page.usedSelection ? h('p', { class: 'note', text: 'Analysing the text you selected.' }) : null,
    h('details', isExtension ? {} : { open: true }, h('summary', { text: 'Or paste the job text instead' }), h('textarea', { placeholder: 'Paste the job description, form text or message here…', value: state.pasted, onInput: (e) => { state.pasted = e.target.value } })),
  ))
  if (state.error) el.push(h('div', { class: 'error', text: state.error }))
  if (state.result) el.push(...renderResult())
  return el
}

function setupCard() {
  return h('div', { class: 'card' },
    h('h3', { text: 'Set up in a minute' }),
    h('ol', { class: 'small', style: 'padding-left:18px;margin:0 0 10px' },
      h('li', { text: 'Open PathFound and analyse your resume.' }),
      h('li', { text: 'Click “Export for extension” on the Overview page.' }),
      h('li', { text: 'Choose that file below.' })),
    importControls(),
    h('p', { class: 'note', text: 'Your profile stays in this browser. Only the text of the page you analyse and a trimmed copy of your profile are sent for the analysis.' }),
  )
}

function importControls() {
  const msg = h('p', { class: 'small', style: 'color:#fca5a5;margin-top:6px' })
  const take = async (text) => {
    const r = parseBundle(text)
    if (!r.ok) { msg.textContent = r.error; return }
    state.bundle = r.bundle
    await storage.set({ bundle: r.bundle })
    render()
    analyse()
  }
  const paste = h('textarea', { placeholder: 'Or paste the exported JSON here…' })
  return h('div', null,
    h('input', { type: 'file', accept: 'application/json,.json', onChange: async (e) => { const f = e.target.files[0]; if (f) take(await f.text()) } }),
    paste,
    h('div', { class: 'actions', style: 'margin-top:6px' }, h('button', { class: 'btn small', text: 'Import pasted profile', onClick: () => take(paste.value) })),
    msg,
  )
}

function viewApplied() {
  const csv = () => {
    const blob = new Blob([buildCsv(state.log)], { type: 'text/csv;charset=utf-8' })
    const a = h('a', { href: URL.createObjectURL(blob), download: 'applications.csv' })
    document.body.append(a); a.click(); a.remove()
  }
  if (!state.log.length) return h('div', { class: 'card' }, h('p', { class: 'muted', text: 'Nothing logged yet. After you apply, use “Log as applied” on a result to keep track here.' }))
  return h('div', { class: 'card' },
    h('div', { class: 'row', style: 'margin-bottom:8px' }, h('h3', { class: 'grow', style: 'margin:0', text: `${state.log.length} logged` }), h('button', { class: 'btn small', text: 'Export CSV', onClick: csv })),
    h('table', null, h('tr', null, h('th', { text: 'Date' }), h('th', { text: 'Role' }), h('th', { text: 'Fit' }), h('th', { text: '' })),
      state.log.map((e) => h('tr', null, h('td', { text: new Date(e.ts).toISOString().slice(0, 10) }), h('td', null, h('div', { text: e.role }), h('div', { class: 'small muted', text: e.company })), h('td', { text: `${e.score}` }),
        h('td', null, h('button', { class: 'btn small danger', text: '✕', 'aria-label': 'Remove', onClick: async () => { state.log = state.log.filter((x) => x.id !== e.id); await storage.set({ log: state.log }); render() } }))))),
  )
}

function viewSettings() {
  const field = (label, key, type = 'text', placeholder = '') => h('div', null, h('label', { text: label }), h('input', { type, placeholder, value: state.settings[key] || '', onChange: async (e) => { state.settings[key] = e.target.value.trim(); await storage.set({ settings: state.settings }) } }))
  const langs = [['en', 'English'], ['ta', 'தமிழ்'], ['hi', 'हिन्दी'], ['kn', 'ಕನ್ನಡ']]
  const perm = h('p', { class: 'small muted' })
  hasAllSites().then((ok) => { perm.textContent = ok ? 'Allowed on all sites.' : 'Currently the extension can read only the page you open it on.' })
  return [
    h('div', { class: 'card' }, h('h3', { text: 'Your profile' }),
      state.bundle ? h('p', { class: 'small', text: `${state.bundle.profile.name || 'Imported profile'} · ${state.bundle.profile.skills.length} skills` }) : h('p', { class: 'small muted', text: 'No profile imported yet.' }),
      importControls(),
      h('label', { text: 'Language of results' }),
      h('select', { onChange: async (e) => { if (state.bundle) { state.bundle.language = e.target.value; await storage.set({ bundle: state.bundle }) } } }, langs.map(([v, l]) => h('option', { value: v, selected: state.bundle && state.bundle.language === v }, l)))),
    h('div', { class: 'card' }, h('h3', { text: 'Server' }), field('PathFound server address', 'apiBase', 'text', 'https://your-app.vercel.app'), field('PathFound web app address', 'appUrl', 'text', 'https://your-app.vercel.app'),
      field('Your own Gemini API key (optional)', 'apiKey', 'password', 'Used only if the shared quota runs out'),
      h('p', { class: 'note', text: 'If you add a key it is stored on this device, in this browser profile.' })),
    h('div', { class: 'card' }, h('h3', { text: 'Pages it can read' }), perm,
      isExtension ? h('div', { class: 'actions', style: 'margin-top:6px' }, h('button', { class: 'btn small', text: 'Allow on all sites', onClick: async () => { await requestAllSites(); render() } })) : null,
      h('p', { class: 'note', text: 'By default it reads a page only when you click the icon on it. Allowing all sites lets the panel analyse whichever tab you are on, but it still never reads a page until you press Analyse.' })),
    h('div', { class: 'card' }, h('h3', { text: 'Your data' }), h('p', { class: 'small muted', text: 'Everything above is stored only in this browser.' }),
      h('div', { class: 'actions', style: 'margin-top:6px' }, h('button', { class: 'btn small danger', text: 'Delete all my data', onClick: async () => { await storage.clear(); Object.assign(state, { bundle: null, settings: { ...DEFAULTS }, log: [], result: null, page: null, error: '' }); render() } }))),
  ]
}

function render() {
  const tabs = [['analyse', 'Analyse'], ['applied', `Applied${state.log.length ? ` (${state.log.length})` : ''}`], ['settings', 'Settings']]
  const body = state.tab === 'analyse' ? viewAnalyse() : state.tab === 'applied' ? viewApplied() : viewSettings()
  const scroll = window.scrollY
  app.replaceChildren(
    h('div', { class: 'top' }, h('div', { class: 'logo', text: 'P' }), h('span', { class: 'brand', text: 'Job Copilot' }),
      h('button', { class: 'theme-btn', type: 'button', text: theme === 'dark' ? '☀' : '☾', title: theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode', 'aria-label': theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode', onClick: toggleTheme })),
    h('div', { class: 'tabs', role: 'tablist' }, tabs.map(([id, label]) => h('button', { class: 'tab', role: 'tab', 'aria-selected': String(state.tab === id), text: label, onClick: () => { state.tab = id; render() } }))),
    ...[].concat(body).filter(Boolean),
  )
  window.scrollTo(0, scroll)
}

// A new tab or page load means the old result no longer applies.
onTabChange(() => { if (!state.loading) { state.result = null; state.error = ''; state.page = null; state.logged = false; if (state.tab === 'analyse') render() } })
load()
