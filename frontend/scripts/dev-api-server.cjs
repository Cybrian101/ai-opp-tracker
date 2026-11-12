'use strict';

// Local-only dev server that runs api/analyze.js and api/module.js directly via plain Node http,
// so you can test the full pipeline without needing `vercel dev` / a Vercel login.
// Production deploys use Vercel's own request handling, not this file.

const http = require('http');
const path = require('path');
const fs = require('fs');

// Minimal .env loader (this is a plain Node process, not Vite. Vite loading
// .env only affects Vite's own process, not this one). Avoids adding the
// `dotenv` package as a dependency for a two-line need.
function loadEnvFile(envPath) {
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvFile(path.join(__dirname, '..', '.env'));

const handlers = {
  '/api/analyze': require(path.join(__dirname, '..', 'api', 'analyze.js')),
  '/api/module': require(path.join(__dirname, '..', 'api', 'module.js')),
};

const PORT = process.env.DEV_API_PORT || 3001;

const server = http.createServer((req, res) => {
  const handler = handlers[req.url];
  if (!handler) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
    return;
  }

  let body = '';
  req.on('data', (chunk) => (body += chunk));
  req.on('end', async () => {
    try {
      req.body = body ? JSON.parse(body) : {};
    } catch {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid JSON body' }));
      return;
    }

    // Mimic Vercel's res.status(code).json(obj) helper used in analyze.js
    res.status = (code) => ({
      json: (obj) => {
        res.writeHead(code, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(obj));
      },
    });

    try {
      await handler(req, res);
    } catch (err) {
      console.error('[dev-api-server] handler error:', err);
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
      } else {
        res.end();
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`[dev-api-server] /api/analyze and /api/module listening on http://localhost:${PORT}`);
});
