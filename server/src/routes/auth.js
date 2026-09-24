import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Joi from 'joi';
import { Manager } from '../models/index.js';

const SECRET = process.env.JWT_SECRET || 'dev-only-change-me';
const COOKIE = 'am_token';

export const authRouter = Router();

const loginSchema = Joi.object({ email: Joi.string().email().required(), password: Joi.string().min(1).required() });

authRouter.post('/login', async (req, res, next) => {
  try {
    const { email, password } = await loginSchema.validateAsync(req.body);
    const m = await Manager.findOne({ email: email.toLowerCase() });
    if (!m || !(await bcrypt.compare(password, m.passwordHash))) return res.status(401).json({ error: "Email yoki parol noto'g'ri" });
    const token = jwt.sign({ sub: String(m._id) }, SECRET, { expiresIn: '7d' });
    res.cookie(COOKIE, token, { httpOnly: true, sameSite: 'lax', maxAge: 7 * 864e5 });
    res.json({ id: m._id, name: m.name, email: m.email });
  } catch (e) {
    next(e);
  }
});

authRouter.post('/logout', (_req, res) => {
  res.clearCookie(COOKIE);
  res.json({ ok: true });
});

export async function requireAuth(req, res, next) {
  try {
    const { sub } = jwt.verify(req.cookies[COOKIE] || '', SECRET);
    req.manager = await Manager.findById(sub).select('-passwordHash');
    if (!req.manager) throw new Error();
    next();
  } catch {
    res.status(401).json({ error: 'Avval tizimga kiring' });
  }
}

authRouter.get('/me', requireAuth, (req, res) => res.json(req.manager));
