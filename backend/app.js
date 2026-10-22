import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import usersRouter from './routes/users.js';
import adminRouter from './routes/admin.js';
import quizzesRouter from './routes/quizzes.js';

const allowedOrigins = (process.env.FRONTEND_ORIGIN || 'http://localhost:8443')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const app = express();

// Security headers
app.use(helmet());
app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: '100kb' }));

// Health check is registered before the rate limiter so monitoring is never blocked
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'edulanka-backend' });
});

// Rate limit: each IP address gets RATE_LIMIT_MAX requests every 15 minutes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.RATE_LIMIT_MAX || 100),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
});
app.use('/api', apiLimiter);

app.use('/api/users', usersRouter);
app.use('/api/admin', adminRouter);
app.use('/api/quizzes', quizzesRouter);

app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

app.use((error, _req, res, _next) => {
  console.error('Unhandled API error:', error);
  res.status(500).json({ error: 'Internal server error.' });
});

export default app;
