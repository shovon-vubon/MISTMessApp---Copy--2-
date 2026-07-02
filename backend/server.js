require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// Initialize Firebase Admin once on startup.
require('./config/firebase');

const requestRoutes = require('./routes/requests');

const app = express();

app.use(helmet());
app.use(cors({ origin: (process.env.CORS_ORIGIN || '*').split(',').map((s) => s.trim()) }));
app.use(express.json());
app.use(morgan('tiny'));

app.get('/health', (req, res) => res.json({ ok: true, service: 'mist-mess-backend' }));

app.use(
  '/api/requests',
  rateLimit({ windowMs: 60 * 1000, max: 60, standardHeaders: true, legacyHeaders: false }),
  requestRoutes
);

// 404 + error handlers.
app.use((req, res) => res.status(404).json({ error: 'Not found' }));
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[error]', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`MIST Mess backend listening on :${PORT}`));
