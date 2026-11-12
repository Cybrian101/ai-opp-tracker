# Contributing to PathFound

Thanks for helping. The easiest way to contribute is to add a **module**: one AI feature, end to end.

## Add a module in four steps

1. **Server file** `frontend/server/modules/<name>.js`, exporting:
   ```js
   module.exports = {
     id: 'myfeature',
     label: 'My Feature',
     validateInput(input) { /* optional: clean user input or throw an Error with .status = 400 */ },
     buildPrompt({ profile, analysis, input, language }) { /* return the prompt string */ },
     normalize(raw) { /* return safe JSON in the exact shape the UI expects */ },
   }
   ```
   Reuse `shared.js`: `buildCandidateBrief`, `languageDirective`, `GROUNDING_RULES`, and the
   `str / arr / strArr / clamp / oneOf` helpers. `dna.js` is the simplest example.
2. **Register it** in `frontend/server/modules/registry.js`.
3. **Screen** `frontend/src/modules/<name>/<Name>Module.jsx`. Call `useModule('myfeature', { auto: true })`
   (or call `run(input)` from a form) and render `data`. Use `Card`, `LoadingPanel` and `ErrorPanel`
   from `src/modules/ui.jsx`. Then add a tab entry in `src/modules/index.js`.
4. **Test** it in `server/modules/modules.test.js` (the shared "survives garbage output" and
   "prompt includes brief and language" tests already cover every registered module).

## Rules for modules

- **Ground every claim.** Prompts must tell the model to cite evidence from the resume and never
  invent employers, salaries, statistics or achievements. Return fewer items instead of padding.
- **Never trust model output.** `normalize` clamps numbers, checks enums, caps array lengths and
  drops malformed items. The UI should never need a defensive check for a missing field.
- **Treat user text as data.** If a module accepts pasted text (like a job description), say so in the
  prompt and cap its length in `validateInput`.
- **No storage.** Modules are stateless. Anything persistent belongs in the user's own download or
  localStorage, never on a server.
- **Multilingual by default.** Include `languageDirective(language)` in every prompt.
- **Keep one call under the serverless limit** (60s). Split big outputs across modules.

## Other good first contributions

- Add opportunities to `frontend/api/data/opportunities.json` (include an `application_url`).
- Add a language: add it to `LANGUAGES` in `server/modules/shared.js` and `src/lib/languages.js`.
- Add sample-resume fixtures under `frontend/server/fixtures/`.

## Before you open a PR

```
cd frontend
npm test
npm run build
```
