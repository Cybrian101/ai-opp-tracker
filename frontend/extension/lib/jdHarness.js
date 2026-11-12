// Runs the real extractPage against a saved HTML page, the way Chrome does: the function's source is serialised and
// evaluated inside the page, so anything that is not self-contained fails here exactly as it would in the extension.
// jsdom has no layout, so innerText is approximated with textContent (hidden elements are not skipped).

import { readFileSync } from 'node:fs'
import { JSDOM } from 'jsdom'
import { extractPage } from './extract.js'

export function runExtract(html, url, { selection = '' } = {}) {
  const dom = new JSDOM(html, { url, runScripts: 'outside-only' })
  const { window } = dom
  Object.defineProperty(window.HTMLElement.prototype, 'innerText', {
    get() { return this.textContent },
  })
  if (selection) window.getSelection = () => selection
  return window.eval(`(${extractPage.toString()})()`)
}

export function runFixture(path, url, options) {
  return runExtract(readFileSync(path, 'utf8'), url, options)
}
