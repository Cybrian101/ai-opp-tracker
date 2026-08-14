'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');

const resumeRouter = require('./routes/resume');
const agentRouter = require('./routes/agent');
const opportunitiesRouter = require('./routes/opportunities');
const profileRouter = require('./routes/profile');
const analysisRouter = require('./routes/analysis');
const settingsRouter = require('./routes/settings');

const app = express();
const PORT = process.env.PORT || 3001;

// ─── CORS ─────────────────────────────────────────────────────────────────────

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-user-id',
      'Cache-Control',
    ],
  })
);

// Handle preflight
app.options('*', cors());

// ─── Body Parsers ─────────────────────────────────────────────────────────────

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use('/api/resume', resumeRouter);
app.use('/api/agent', agentRouter);
app.use('/api/opportunities', opportunitiesRouter);
app.use('/api/profile', profileRouter);
app.use('/api/analysis', analysisRouter);
app.use('/api/settings', settingsRouter);

// ─── Health Check ─────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// ─── 404 Handler ─────────────────────────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[GlobalError]', err.message || err);

  const status = err.status || err.statusCode || 500;
  const message =
    process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message || 'Internal server error';

  res.status(status).json({ error: message });
});

// ─── Start Server ─────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`OIA Backend running on port ${PORT}`);
  console.log(`  Health: http://localhost:${PORT}/health`);
  console.log(`  Frontend allowed: ${process.env.FRONTEND_URL}`);
});

module.exports = app;
