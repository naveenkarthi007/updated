require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { testConnection } = require('./config/database');
const routes = require('./routes');
const {
  securityHeaders,
  globalLimiter,
  authLimiter,
  writeLimiter,
  requestSizeGuard,
  suspiciousRequestBlocker,
} = require('./middleware/security');

const app = express();
const PORT = process.env.PORT || 5000;

if (!process.env.JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET is not defined.');
  process.exit(1);
}

// ── Trust proxy (required for rate limiting behind reverse proxies) ──
app.set('trust proxy', 1);

// ── Security Headers (Helmet) ──
app.use(securityHeaders);

// ── Suspicious Request Blocker ──
app.use(suspiciousRequestBlocker);

// ── Request Size Guard (reject payloads > 1MB before parsing) ──
app.use((req, res, next) => {
  if (req.path.startsWith('/api/bulk')) {
    return next();
  }
  return requestSizeGuard(1 * 1024 * 1024)(req, res, next);
});

// ── CORS ──
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ── Global Rate Limiter (200 req / 15 min per IP) ──
app.use(globalLimiter);

// Health check (not rate limited beyond global)
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// ── Auth Routes — Strict brute-force protection (10 req / 15 min) ──
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/google', authLimiter);

// ── Write-Operation Limiter (50 POST/PUT/DELETE per 15 min) ──
app.use('/api', writeLimiter);

// API routes
app.use('/api', routes);

// 404
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found.' }));

// Global error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

testConnection().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Hostel Management Server running on http://localhost:${PORT}`);
  });
});
