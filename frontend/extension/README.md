# PathFound Job Copilot (browser extension)

Open **any** page about a job (a job board, a careers site, a Google Form, a referral link, an invitation in web mail) and
click the extension. It reads that page and tells you, in a side panel:

- **A verdict:** apply, possible (close the gaps first), probably skip, avoid (looks like a scam), or not a job at all.
- **How it fits you:** your interests and strengths against what the page actually asks for.
- **Requirements** checked one by one (met / partly / missing), and which you can **highlight on the page**.
- **Safety:** scam signals found in the text (asks for a fee, bank or ID details, guaranteed pay, WhatsApp-only contact...).
  If a page looks like a scam, it tells you not to share anything and shows no "how to apply" steps.
- **What to prepare and watch for:** deadline, documents, steps, what is not stated (pay, notice period, team), and smart questions to ask.
- **General market context** for that kind of role. This is general knowledge, **not live market data**, and says so.
- A private **application log** you can export as CSV.

## Install (developer mode)

1. Start the PathFound API: in `frontend/`, run `npm run dev:api` (or deploy it and use your deployed address).
2. In Chrome open `chrome://extensions`, turn on **Developer mode**, click **Load unpacked**, and choose this `extension/` folder.
3. In the PathFound web app, analyse your resume, then click **Export for extension** on the Overview page.
4. Open any job page, click the PathFound icon, and import the exported file in the panel (one time).
5. Click **Analyse this page**.

Settings (inside the panel) hold the server address, an optional Gemini key, the language, and a "delete all my data" button.
The sun/moon button in the panel header switches light and dark mode (saved in `chrome.storage.local`; the first run follows the system setting).

## After you deploy

1. In `sidepanel.js` set `DEFAULT_API_BASE` and `DEFAULT_APP_URL` to your deployed Vercel URL (they now default to https://ai-opp-tracker.vercel.app, so change them only if you host elsewhere). Users can also type the address in **Settings**.
2. **Host permission is not required.** The API sends `Access-Control-Allow-Origin: *` and answers the preflight on `/api/module`, so the panel's `fetch` works through CORS alone. The `http://localhost:3001/*` entry in `manifest.json` `host_permissions` is harmless and can stay or be removed.
3. Load it: `chrome://extensions` > Developer mode > **Load unpacked** > choose this `extension/` folder (click Reload after edits).
4. In the deployed web app, analyse your resume, click **Export for extension** on the Overview page, then import that file in the panel (Settings > Your profile).
5. Chrome Web Store: zip the *contents* of `extension/` (manifest.json at the zip root; leave out `fixtures/`, `scripts/`, `package.json`, tests and `README.md`), then upload it in the Developer Dashboard. Icons (16/32/48/128) already exist in `icons/`. You will need store screenshots, a privacy policy and a justification for the `<all_urls>` optional permission.

## What it reads, and what it sends

- It reads a page **only when you press Analyse** on the page you opened it on (`activeTab`). There is no background reading,
  no crawling, and nothing is ever submitted or clicked for you. "Allow on all sites" in Settings is optional and still reads
  nothing until you press Analyse.
- If you select text on the page first, only your selection is analysed.
- Sent to the server: the page text (up to ~12,000 characters), the page address **without** its query string, and a trimmed
  copy of your profile **without** your email or phone. Nothing is stored on the server.
- Kept in this browser (`chrome.storage.local`): your profile, settings, and your application log.

## Good to know

- It works on what is displayed. A page behind a login shows what you can see; PDFs and Chrome's own pages can't be read
  (paste the text instead; there is a paste box in the panel).
- Single-page sites that change without reloading may need **Analyse again** after you open another job.
- LinkedIn's terms restrict automated scraping. This extension only reads the single page you are looking at, when you ask,
  and does not crawl or collect listings.
- The verdict is advice, not a guarantee. Scam detection is based only on the text on the page, so a clean result does not
  prove a job is genuine: verify the company before sharing personal details.

## Develop

`lib/extract.js` is injected into pages, so it must stay self-contained (no imports). Tests: `npm test` in `frontend/`.
`sidepanel.html` also runs as a normal web page ("preview mode"): serve this folder and open it to work on the design.

## Testing job-page reading

`npm test` runs `extension/lib/jd-extract.test.js`, which feeds saved pages from `extension/fixtures/jd/` (LinkedIn, Indeed,
a schema.org careers page, a thin client-rendered page, a generic `<main>` page, a scam post) through the real `extractPage`.

- Check one saved page: `npm run jd:check -- path/to/page.html https://the-page-url`
- A site reads badly? Save its HTML (with personal data removed) into `extension/fixtures/jd/`, add a row to `CASES`, make it
  pass. Or ask Claude Code to use the `jd-tester` agent (`.claude/agents/jd-tester.md`), which does exactly this.
- Limits: jsdom has no layout, so hidden text is not skipped, and fixtures are snapshots, so a site redesign needs a new one.
