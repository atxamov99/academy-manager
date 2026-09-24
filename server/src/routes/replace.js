import { Router } from 'express';
import Joi from 'joi';
import { Mentor, Group, Absence, Replacement } from '../models/index.js';
import { rankCandidates, todayStr, effectiveMentorId } from '../lib/schedule.js';

export const replaceRouter = Router();
const wrap = (fn) => (req, res, next) => fn(req, res).catch(next);
const httpErr = (status, message) => Object.assign(new Error(message), { status });

async function loadContext() {
  const [mentors, groups, absences, replacements] = await Promise.all([
    Mentor.find().lean(),
    Group.find({ active: { $ne: false } }).lean(),
    Absence.find().lean(),
    Replacement.find({ cancelled: { $ne: true } }).lean(),
  ]);
  return { mentors, groups, absences, replacements };
}

const candQuery = Joi.object({
  type: Joi.string().valid('temporary', 'permanent').required(),
  date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
});

async function computeCandidates(groupId, type, date) {
  const ctx = await loadContext();
  const group = ctx.groups.find((g) => String(g._id) === groupId);
  if (!group) throw httpErr(404, 'Guruh topilmadi');
  try {
    return { group, ctx, list: rankCandidates({ group, type, date, ...ctx }) };
  } catch (e) {
    throw httpErr(400, e.message);
  }
}

// Nomzodlar reytingi
replaceRouter.get('/groups/:id/candidates', wrap(async (req, res) => {
  const { type, date } = await candQuery.validateAsync(req.query);
  const { list } = await computeCandidates(req.params.id, type, date);
  res.json(list.map((c) => ({ ...c, mentor: { _id: c.mentor._id, name: c.mentor.name, level: c.mentor.level, phone: c.mentor.phone, directions: c.mentor.directions } })));
}));

const replaceSchema = Joi.object({
  groupId: Joi.string().hex().length(24).required(),
  toMentorId: Joi.string().hex().length(24).required(),
  type: Joi.string().valid('temporary', 'permanent').required(),
  date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
  reason: Joi.string().valid('kasal', 'tatil', 'ishdan ketdi', 'jadval', 'yuklama', 'boshqa').default('boshqa'),
  note: Joi.string().allow('').max(2000),
});

// Almashtirish — server nomzodni qayta tekshiradi (frontga ishonilmaydi)
replaceRouter.post('/replacements', wrap(async (req, res) => {
  const body = await replaceSchema.validateAsync(req.body);
  if (body.date < todayStr()) throw httpErr(400, "O'tgan sana uchun almashtirib bo'lmaydi");
  const { group, list } = await computeCandidates(body.groupId, body.type, body.date);
  const cand = list.find((c) => String(c.mentor._id) === body.toMentorId);
  if (!cand) throw httpErr(400, 'Bu mentor ushbu guruhga nomzod emas');
  if (!cand.eligible) throw httpErr(409, `Mentorni qo'yib bo'lmaydi: ${cand.blockers.join('; ')}`);

  const fromMentor = body.type === 'temporary'
    ? effectiveMentorId(group, body.date, await Replacement.find({ group: group._id, cancelled: { $ne: true } }).lean())
    : group.mentor;

  const r = await Replacement.create({
    group: group._id,
    fromMentor,
    toMentor: body.toMentorId,
    type: body.type,
    date: body.date,
    reason: body.reason,
    note: body.note,
    score: cand.score,
    createdBy: req.manager._id,
  });
  if (body.type === 'permanent') await Group.updateOne({ _id: group._id }, { mentor: body.toMentorId });
  res.status(201).json(r);
}));

replaceRouter.get('/replacements', wrap(async (req, res) => {
  const q = { };
  if (req.query.group) q.group = req.query.group;
  if (req.query.mentor) q.$or = [{ toMentor: req.query.mentor }, { fromMentor: req.query.mentor }];
  if (req.query.type) q.type = req.query.type;
  res.json(
    await Replacement.find(q)
      .populate('group', 'name direction')
      .populate('fromMentor', 'name')
      .populate('toMentor', 'name')
      .sort({ createdAt: -1 })
      .limit(500)
      .lean()
  );
}));

// Vaqtinchalik almashtirishni bekor qilish (doimiyni bekor qilish = yangi doimiy almashtirish)
replaceRouter.post('/replacements/:id/cancel', wrap(async (req, res) => {
  const r = await Replacement.findById(req.params.id);
  if (!r) throw httpErr(404, 'Topilmadi');
  if (r.type !== 'temporary') throw httpErr(400, 'Doimiy almashtirishni bekor qilib bo\'lmaydi — yangi almashtirish qiling');
  r.cancelled = true;
  await r.save();
  res.json(r);
}));
