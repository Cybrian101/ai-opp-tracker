# PathFound

An open-source AI career copilot. Upload a resume and get an honest analysis, then go deeper with
modules that show who you could become and exactly how to get a specific job. Works in English,
Tamil, Hindi and Kannada (more planned). No accounts, no database: nothing about you is stored.

## What it does

| Tab | What you get |
|---|---|
| **Overview** | Resume score, strengths, honest weaknesses, skill gaps, 30/90/180-day roadmap, matched opportunities |
| **Career DNA** | Your archetype, a radar of working strengths, hidden potential, informal experience translated into resume bullets, blind spots |
| **Multiverse** | Four parallel career paths (including a wildcard) with year-by-year timelines, trade-offs and a first step |
| **Skill Map** | A knowledge graph of skills and roles. Pick a role and see only its skills and prerequisites, with what you already have in green and your exact learning route, in order, with hour estimates. Built from a hand-curated graph (`src/data/skillGraph.js`) and your resume, by code only: no model call, no tokens |
| **JD Lab** | Paste a job description: eligibility score, requirement check, blockers, a "time machine" slider showing eligibility after each milestone, ATS keywords, a tailored summary, and the interview you are about to have with a built-in answer coach |
| **Builder** | A portfolio project designed to prove any missing skill, with milestones and a resume bullet |
| **Returning to work** | Optional, user-initiated: honest ways to explain a career break, caregiving/household experience translated into resume bullets, a refresh list, and a hand-off to the 90-Day Plan. Once submitted, JD Lab also prepares the "tell me about your break" question |
| **90-Day Plan** | A 13-week plan sized to the hours you really have (3-40 per week), a readiness curve, risks, and a calendar (.ics) export |

**Job Copilot (browser extension):** open any job page, application form, careers site or invitation and get a side-panel
verdict: fit, requirements, scam signals, what to prepare, and general market context. See [frontend/extension](frontend/extension/README.md).

**Try it without a key:** the upload screen has a "try the demo" button that loads a fictional
candidate and pre-written results into every tab (`frontend/src/demo/demoData.js`). No resume, API
key or network needed, which also makes it a safe fallback for live demos.

## Architecture

There is **no traditional backend and no database**.

```
frontend/                 React (Vite) static site
frontend/api/analyze.js   resume parse -> analysis -> opportunity matching (streams progress)
frontend/api/module.js    the orchestrator: runs any registered module
frontend/server/modules/  one file per feature (prompt + schema + normalizer) and registry.js
frontend/src/modules/     one folder per feature screen, registered in index.js
frontend/api/data/        bundled JSON list of evergreen opportunities
```

- `api/module.js` receives `{ module, profile, analysis, input, language }`, looks the module up in
  `server/modules/registry.js`, builds its prompt, calls Gemini, and returns normalized JSON.
  The browser passes the profile it already holds, so the server keeps no state.
- Every module normalizer clamps scores, drops malformed items and guarantees the shape the UI
  expects, so a bad model response can never crash a screen. See `server/modules/modules.test.js`.
- Prompts instruct the model to ground every claim in the resume and never invent employers,
  salaries or statistics.
- Nothing is written to a database. Refresh the page and it is gone, unless you download the report.
- A per-IP limit protects the shared Gemini quota (Upstash Redis if configured, otherwise in-memory).
  Anyone who hits it can paste their **own** Gemini key, which stays in the browser tab's memory and
  is sent only with that user's requests.

## Setup

1. `cd frontend && npm install`
2. Copy `.env.example` to `.env` and set `GEMINI_API_KEY` (free at https://aistudio.google.com/apikey).
3. Run locally, in two terminals:
   ```
   npm run dev:api     # serves /api/analyze and /api/module on :3001
   npm run dev         # Vite on :5173, proxies /api to :3001
   ```
   (`vercel dev` also works.)
4. `npm test` runs the module tests (no API key needed).

## Deploy

Deploy `frontend/` as a Vercel project (Root Directory = `frontend`) and set the variables from
`.env.example`. One project, one domain, no server to keep running.

## Add a feature

See [CONTRIBUTING.md](CONTRIBUTING.md). A feature is a server module plus a screen, typically a few
hundred lines, with no changes to the core.

## Bring your own instance

This project is meant to be forked: each deployer supplies their own `GEMINI_API_KEY` rather than
everyone sharing one host's quota. No secrets are committed anywhere in this repo.

## License

MIT, see [LICENSE](LICENSE). The "PathFound" name and logo are not covered by the licence.
