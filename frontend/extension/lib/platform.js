// Everything that touches the browser lives here, so the side panel can also run as a normal web page (preview mode)
// for design work and tests.

import { extractPage, mergeFrames } from './extract.js'
import { classifyUrl, describeTab } from './tabinfo.js'
import { highlightRequirements, clearHighlights } from './highlight.js'

export const isExtension = typeof chrome !== 'undefined' && Boolean(chrome.runtime && chrome.runtime.id)

export const storage = isExtension
  ? {
      get: (keys) => chrome.storage.local.get(keys),
      set: (obj) => chrome.storage.local.set(obj),
      clear: () => chrome.storage.local.clear(),
    }
  : {
      async get(keys) {
        const out = {}
        for (const k of [].concat(keys)) {
          try { const v = localStorage.getItem(`pf:${k}`); if (v !== null) out[k] = JSON.parse(v) } catch { /* ignore */ }
        }
        return out
      },
      async set(obj) { for (const [k, v] of Object.entries(obj)) localStorage.setItem(`pf:${k}`, JSON.stringify(v)) },
      async clear() { Object.keys(localStorage).filter((k) => k.startsWith('pf:')).forEach((k) => localStorage.removeItem(k)) },
    }

export async function getActiveTab() {
  if (!isExtension) return null
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true })
  return tab || null
}

/**
 * Reads the page in the active tab (all frames, so embedded forms are included).
 * @returns {{ page?: object, error?: string }}
 */
export async function readActivePage() {
  const tab = await getActiveTab()
  if (!tab || !tab.id) return { error: 'Open the job page in this window, then try again.' }
  // tab.url is undefined until Chrome has granted access to that tab: unknown is not the same as unreadable.
  const c = classifyUrl(tab.url)
  if (c.message) return { error: c.message }
  try {
    const frames = await chrome.scripting.executeScript({ target: { tabId: tab.id, allFrames: true }, func: extractPage })
    const page = mergeFrames(frames)
    if (!page || !page.text) return { error: 'Nothing readable was found on this page. Select the job text and try again, or paste it below.' }
    return { page }
  } catch {
    return { error: 'PathFound can only read a tab after you click its toolbar icon on that tab. Click the icon on this page, or allow all sites in Settings to analyse any tab.', needsAccess: true }
  }
}

export async function highlight(items) {
  const tab = await getActiveTab()
  if (!isExtension || !tab) return { found: 0, total: items.length }
  const [res] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: highlightRequirements, args: [items] })
  return res.result
}

export async function clearMarks() {
  const tab = await getActiveTab()
  if (isExtension && tab) await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: clearHighlights })
}

export function openUrl(url) {
  if (isExtension) chrome.tabs.create({ url })
  else window.open(url, '_blank', 'noopener')
}

export async function requestAllSites() {
  if (!isExtension) return false
  return chrome.permissions.request({ origins: ['<all_urls>'] })
}

export async function hasAllSites() {
  if (!isExtension) return false
  return chrome.permissions.contains({ origins: ['<all_urls>'] })
}

export async function describeActiveTab() {
  return describeTab(await getActiveTab())
}

/**
 * Calls back when the tab the user is looking at changes: tab switch, window focus, load complete, or a URL change
 * on the active tab (single-page sites). Only metadata is observed; nothing is read from any page.
 * Chrome only reports a tab's url here if the extension has access to it (activeTab grant or all-sites).
 */
export function onTabChange(callback) {
  if (!isExtension) return
  chrome.tabs.onActivated.addListener(() => callback({ reason: 'activated' }))
  chrome.windows.onFocusChanged.addListener((id) => { if (id !== chrome.windows.WINDOW_ID_NONE) callback({ reason: 'focus' }) })
  chrome.tabs.onUpdated.addListener((id, info, tab) => {
    if (tab && tab.active && (info.url || info.status === 'complete')) callback({ reason: info.url ? 'url' : 'loaded', url: info.url })
  })
}
