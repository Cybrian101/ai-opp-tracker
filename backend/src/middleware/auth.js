'use strict';

function requireAuth(req, res, next) {
  const userId = req.headers['x-user-id'] || req.body?.userId;

  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    return res.status(401).json({ error: 'Authentication required' });
  }

  req.userId = userId.trim();
  next();
}

module.exports = { requireAuth };
