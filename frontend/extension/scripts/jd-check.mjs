// Usage: node extension/scripts/jd-check.mjs <saved-page.html> [page-url]
// Prints what the extension would read from a saved page: title, structured data, and the first part of the text.
import { runFixture } from '../lib/jdHarness.js'

const [file, url = 'https://example.com/job'] = process.argv.slice(2)
if (!file) {
  console.error('Usage: node extension/scripts/jd-check.mjs <saved-page.html> [page-url]')
  process.exit(2)
}
const page = runFixture(file, url)
console.log(JSON.stringify({ url: page.url, title: page.title, structured: page.structured, chars: page.text.length, preview: page.text.slice(0, 600) }, null, 2))
if (page.text.length < 300) { console.error('WARNING: very little text was read.'); process.exitCode = 1 }
