'use strict';

// The orchestrator's registry. Each feature is a module file exporting:
//   id, label
//   validateInput?(input) -> cleaned input   (throw an Error with .status = 400 to reject)
//   buildPrompt({ profile, analysis, input, language }) -> string
//   normalize(rawModelJson) -> safe JSON for the UI
// To add a feature: create server/modules/<name>.js and add it to the list below.
// See CONTRIBUTING.md.

const modules = [
  require('./dna'),
  require('./multiverse'),
  require('./jdlab'),
  require('./evaluate'),
  require('./builder'),
  require('./comeback'),
  require('./simulator'),
  require('./verdict'),
  require('./tldr'),
];

// Cost controls per module: which model tier, and a generous output cap (about 2x the typical response)
// that only exists to stop a runaway answer from burning tokens. Too low a cap would truncate the JSON.
const LIMITS = {
  // quality: the few outputs where reasoning depth matters most
  multiverse: { tier: 'quality', maxOutputTokens: 6500 },
  jdlab: { tier: 'quality', maxOutputTokens: 7000 },
  // fast: structured, evidence-bound outputs where the lite model is accurate and far cheaper
  dna: { tier: 'fast', maxOutputTokens: 4500 },
  evaluate: { tier: 'fast', maxOutputTokens: 2000 },
  builder: { tier: 'fast', maxOutputTokens: 4500 },
  comeback: { tier: 'fast', maxOutputTokens: 4500 },
  simulator: { tier: 'fast', maxOutputTokens: 7000 },
  verdict: { tier: 'fast', maxOutputTokens: 4500 },
  tldr: { tier: 'fast', maxOutputTokens: 900 }, // a few short lines: the cap keeps it cheap
};
for (const m of modules) Object.assign(m, LIMITS[m.id] || { tier: 'quality', maxOutputTokens: 6000 });

const registry = Object.fromEntries(modules.map((m) => [m.id, m]));

module.exports = { registry, moduleIds: Object.keys(registry) };
