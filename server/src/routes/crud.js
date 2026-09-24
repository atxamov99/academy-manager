import { Router } from 'express';
import Joi from 'joi';
import { Mentor, Group, Absence, DIRECTIONS } from '../models/index.js';
import { weeklyConflict } from '../lib/schedule.js';

export const crudRouter = Router();

const time = Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d$/);
const date = Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/);
const slot = Joi.object({ day: Joi.number().integer().min(1).max(7).required(), start: time.required(), end: time.required() }).custom((v, h) =>
  v.start < v.end ? v : h.message('Boshlanish vaqti tugashdan oldin bo\'lishi kerak')
);

const mentorSchema = Joi.object({
  name: Joi.string().trim().min(2).required(),
  phone: Joi.string().allow(''),
  directions: Joi.array().items(Joi.string().valid(...DIRECTIONS)).min(1).required(),
  languages: Joi.array().items(Joi.string().valid('uz', 'ru', 'en')).min(1).required(),
  level: Joi.string().valid('junior', 'middle', 'senior'),
  availability: Joi.array().items(slot),
  active: Joi.boolean(),
});

const groupSchema = Joi.object({
  name: Joi.string().trim().min(1).required(),
  direction: Joi.string().valid(...DIRECTIONS).required(),
  level: Joi.string().valid('beginner', 'intermediate', 'advanced'),
  language: Joi.string().valid('uz', 'ru', 'en'),
  room: Joi.string().allow(''),
  schedule: Joi.array().items(slot).min(1).required(),
  mentor: Joi.string().hex().length(24).allow(null),
  students: Joi.number().integer().min(0),
  progressNote: Joi.string().allow(''),
  startDate: date.allow(null, ''),
  active: Joi.boolean(),
});

const absenceSchema = Joi.object({
  mentor: Joi.string().hex().length(24).required(),
  from: date.required(),
  to: date.required(),
  reason: Joi.string().allow(''),
}).custom((v, h) => (v.from <= v.to ? v : h.message("'Dan' sanasi 'gacha' dan keyin bo'lmasin")));

const wrap = (fn) => (req, res, next) => fn(req, res).catch(next);
const notFound = () => Object.assign(new Error('Topilmadi'), { status: 404 });

// Guruhga mentor biriktirilganda haftalik to'qnashuvni server tomonda tekshirish
async function assertNoConflict(body, groupId) {
  if (!body.mentor) return;
  const groups = await Group.find({ active: { $ne: false } }).lean();
  const conflict = weeklyConflict(String(body.mentor), { _id: groupId || 'new', schedule: body.schedule }, groups);
  if (conflict) throw Object.assign(new Error(`Mentor band: ${conflict}`), { status: 409 });
}

// Mentors
crudRouter.get('/mentors', wrap(async (_req, res) => res.json(await Mentor.find().sort({ name: 1 }).lean())));
crudRouter.get('/mentors/:id', wrap(async (req, res) => {
  const m = await Mentor.findById(req.params.id).lean();
  if (!m) throw notFound();
  const [groups, absences] = await Promise.all([Group.find({ mentor: m._id }).lean(), Absence.find({ mentor: m._id }).sort({ from: -1 }).lean()]);
  res.json({ ...m, groups, absences });
}));
crudRouter.post('/mentors', wrap(async (req, res) => res.status(201).json(await Mentor.create(await mentorSchema.validateAsync(req.body)))));
crudRouter.put('/mentors/:id', wrap(async (req, res) => {
  const m = await Mentor.findByIdAndUpdate(req.params.id, await mentorSchema.validateAsync(req.body), { new: true, runValidators: true });
  if (!m) throw notFound();
  res.json(m);
}));
crudRouter.delete('/mentors/:id', wrap(async (req, res) => {
  // O'chirish o'rniga nofaol qilamiz — tarix buzilmasin
  const m = await Mentor.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
  if (!m) throw notFound();
  res.json(m);
}));

// Groups
crudRouter.get('/groups', wrap(async (_req, res) => res.json(await Group.find().populate('mentor', 'name level').sort({ name: 1 }).lean())));
crudRouter.get('/groups/:id', wrap(async (req, res) => {
  const g = await Group.findById(req.params.id).populate('mentor').lean();
  if (!g) throw notFound();
  res.json(g);
}));
crudRouter.post('/groups', wrap(async (req, res) => {
  const body = await groupSchema.validateAsync(req.body);
  await assertNoConflict(body);
  res.status(201).json(await Group.create(body));
}));
crudRouter.put('/groups/:id', wrap(async (req, res) => {
  const body = await groupSchema.validateAsync(req.body);
  await assertNoConflict(body, req.params.id);
  const g = await Group.findByIdAndUpdate(req.params.id, body, { new: true, runValidators: true });
  if (!g) throw notFound();
  res.json(g);
}));
crudRouter.delete('/groups/:id', wrap(async (req, res) => {
  const g = await Group.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
  if (!g) throw notFound();
  res.json(g);
}));

// Absences ("kela olmaydi")
crudRouter.get('/absences', wrap(async (_req, res) => res.json(await Absence.find().populate('mentor', 'name').sort({ from: -1 }).lean())));
crudRouter.post('/absences', wrap(async (req, res) => {
  const body = await absenceSchema.validateAsync(req.body);
  if (!(await Mentor.exists({ _id: body.mentor }))) throw notFound();
  res.status(201).json(await Absence.create(body));
}));
crudRouter.delete('/absences/:id', wrap(async (req, res) => {
  const a = await Absence.findByIdAndDelete(req.params.id);
  if (!a) throw notFound();
  res.json({ ok: true });
}));
