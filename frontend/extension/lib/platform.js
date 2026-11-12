// Everything that touches the browser lives here, so the side panel can also run as a normal web page (preview mode)
// for design work and tests.

import { extractPage, mergeFrames } from './extract.js'
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

const BLOCKED = /^(chrome|edge|brave|about|chrome-extension|devtools|view-source):|^https:\/\/chromewebstore\.google\.com|^https:\/\/chrome\.google\.com\/webstore/i

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
  if (!tab.url || BLOCKED.test(tab.url)) return { error: "Chrome doesn't let extensions read this kind of page. Open the job page itself." }
  if (/\.pdf($|\?)/i.test(tab.url)) return { error: "PDF job posts can't be read here. Copy the text and paste it below." }
  try {
    const frames = await chrome.scripting.executeScript({ target: { tabId: tab.id, allFrames: true }, func: extractPage })
    const page = mergeFrames(frames)
    if (!page || !page.text) return { error: 'Nothing readable was found on this page. Select the job text and try again, or paste it below.' }
    return { page }
  } catch {
    return { error: 'Click the PathFound icon on the page you want analysed. Chrome only lets it read the page you opened it on. To analyse any page, allow all sites in Settings.' }
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

export function onTabChange(callback) {
  if (!isExtension) return
  chrome.tabs.onActivated.addListener(callback)
  chrome.tabs.onUpdated.addListener((id, info) => { if (info.status === 'complete') callback() })
}
