import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { authRouter, requireAuth } from './routes/auth.js';
import { crudRouter } from './routes/crud.js';
import { replaceRouter } from './routes/replace.js';
import { dashboardRouter } from './routes/dashboard.js';

const PORT = process.env.PORT || 4000;
const MONGO_URL = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/academy_manager';

const app = express();
app.use(cors({ origin: process.env.WEB_ORIGIN || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

app.get('/api/health', (_req, res) => res.json({ ok: true, db: mongoose.connection.readyState === 1 }));
app.use('/api/auth', authRouter);
app.use('/api', requireAuth, crudRouter, replaceRouter, dashboardRouter);

app.use((err, _req, res, _next) => {
  if (err.isJoi) return res.status(400).json({ error: err.details.map((d) => d.message).join('; ') });
  if (err.name === 'ValidationError' || err.name === 'CastError') return res.status(400).json({ error: err.message });
  if (err.status) return res.status(err.status).json({ error: err.message });
  console.error(err);
  res.status(500).json({ error: 'Server xatosi' });
});

await mongoose.connect(MONGO_URL);
app.listen(PORT, () => console.log(`API: http://localhost:${PORT}`));
