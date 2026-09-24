import { Router } from 'express';
import { Mentor, Group, Absence, Replacement } from '../models/index.js';
import { lessonOn, effectiveMentorId, lessonsNeedingMentor, weeklyLoadHours, todayStr, addDays, mentorLessons, nowInfo } from '../lib/schedule.js';

export const dashboardRouter = Router();
const wrap = (fn) => (req, res, next) => fn(req, res).catch(next);

dashboardRouter.get('/dashboard', wrap(async (req, res) => {
  const today = /^\d{4}-\d{2}-\d{2}$/.test(req.query.date || '') ? req.query.date : todayStr();
  const [mentors, groups, absences, replacements] = await Promise.all([
    Mentor.find({ active: { $ne: false } }).lean(),
    Group.find({ active: { $ne: false } }).lean(),
    Absence.find({ to: { $gte: today } }).lean(),
    Replacement.find({ cancelled: { $ne: true } }).lean(),
  ]);
  const byId = Object.fromEntries(mentors.map((m) => [String(m._id), m]));
  const nameOf = (id) => (id ? byId[id]?.name ?? '—' : null);

  const todayLessons = groups
    .map((g) => ({ g, l: lessonOn(g, today) }))
    .filter((x) => x.l)
    .map(({ g, l }) => {
      const eff = effectiveMentorId(g, today, replacements);
      return {
        groupId: g._id, group: g.name, direction: g.direction, room: g.room, start: l.start, end: l.end,
        mentor: nameOf(eff), replaced: eff !== (g.mentor ? String(g.mentor) : null),
      };
    })
    .sort((a, b) => a.start.localeCompare(b.start));

  const needs = lessonsNeedingMentor({ groups, absences, replacements, from: today, days: 7 }).map((n) => ({
    groupId: n.group._id, group: n.group.name, direction: n.group.direction, date: n.date, start: n.slot.start, end: n.slot.end,
    reason: n.reason, mentor: nameOf(n.group.mentor ? String(n.group.mentor) : null),
  }));

  const loads = mentors
    .map((m) => ({ _id: m._id, name: m.name, hours: weeklyLoadHours(String(m._id), groups), groups: groups.filter((g) => String(g.mentor) === String(m._id)).length }))
    .sort((a, b) => b.hours - a.hours);

  const monthAgo = addDays(today, -30);
  const recent = await Replacement.find({ cancelled: { $ne: true } })
    .populate('group', 'name').populate('fromMentor', 'name').populate('toMentor', 'name')
    .sort({ createdAt: -1 }).limit(6).lean();

  res.json({
    today,
    stats: {
      mentors: mentors.length,
      groups: groups.length,
      needs: needs.length,
      replacements30: replacements.filter((r) => r.date >= monthAgo).length,
      absentToday: absences.filter((a) => a.from <= today && today <= a.to).length,
    },
    todayLessons, needs, loads, recent,
  });
}));

dashboardRouter.get('/reports', wrap(async (_req, res) => {
  const [groups, mentors, reps, absences] = await Promise.all([
    Group.find().lean(), Mentor.find().lean(), Replacement.find({ cancelled: { $ne: true } }).lean(), Absence.find().lean(),
  ]);
  const count = (arr, key) => arr.reduce((acc, x) => ((acc[String(x[key])] = (acc[String(x[key])] || 0) + 1), acc), {});
  const gName = Object.fromEntries(groups.map((g) => [String(g._id), g.name]));
  const mName = Object.fromEntries(mentors.map((m) => [String(m._id), m.name]));
  const top = (obj, names) => Object.entries(obj).map(([id, n]) => ({ id, name: names[id] ?? '—', count: n })).sort((a, b) => b.count - a.count).slice(0, 5);

  res.json({
    total: reps.length,
    temporary: reps.filter((r) => r.type === 'temporary').length,
    permanent: reps.filter((r) => r.type === 'permanent').length,
    byReason: count(reps, 'reason'),
    unstableGroups: top(count(reps, 'group'), gName),
    mostAbsentMentors: top(count(reps.filter((r) => r.fromMentor), 'fromMentor'), mName),
    topSubstitutes: top(count(reps, 'toMentor'), mName),
    absences: absences.length,
  });
}));

// Mentorlar: o'tgan darslar soni (shu oy / jami) va keyingi darsi
async function lessonCtx() {
  const [groups, absences, replacements] = await Promise.all([
    Group.find({ active: { $ne: false } }).lean(),
    Absence.find().lean(),
    Replacement.find({ cancelled: { $ne: true } }).lean(),
  ]);
  const earliest = groups.reduce((min, g) => (g.startDate && g.startDate < min ? g.startDate : min), addDays(todayStr(), -90));
  return { groups, absences, replacements, earliest, now: nowInfo() };
}

const summarize = (lessons, now) => {
  const month = now.date.slice(0, 7);
  const done = lessons.filter((l) => l.status === 'done');
  return {
    taughtTotal: done.length,
    taughtMonth: done.filter((l) => l.date.startsWith(month)).length,
    substituteTotal: done.filter((l) => l.substitute).length,
    missedTotal: lessons.filter((l) => l.status === 'missed' && l.date <= now.date).length,
    nextLesson: lessons.find((l) => l.status === 'upcoming') || null,
  };
};

dashboardRouter.get('/mentors-stats', wrap(async (_req, res) => {
  const ctx = await lessonCtx();
  const mentors = await Mentor.find().sort({ name: 1 }).lean();
  const to = addDays(ctx.now.date, 14);
  res.json(mentors.map((m) => {
    const lessons = mentorLessons(String(m._id), { ...ctx, from: ctx.earliest, to });
    return { ...m, hours: weeklyLoadHours(String(m._id), ctx.groups), groupCount: ctx.groups.filter((g) => String(g.mentor) === String(m._id)).length, ...summarize(lessons, ctx.now) };
  }));
}));

dashboardRouter.get('/mentors/:id/overview', wrap(async (req, res) => {
  const m = await Mentor.findById(req.params.id).lean();
  if (!m) return res.status(404).json({ error: 'Topilmadi' });
  const ctx = await lessonCtx();
  const mid = String(m._id);
  const lessons = mentorLessons(mid, { ...ctx, from: ctx.earliest, to: addDays(ctx.now.date, 14) });
  const groups = ctx.groups.filter((g) => String(g.mentor) === mid);
  res.json({
    mentor: m,
    groups,
    hours: weeklyLoadHours(mid, ctx.groups),
    absences: ctx.absences.filter((a) => String(a.mentor) === mid).sort((a, b) => b.from.localeCompare(a.from)),
    weekly: groups.flatMap((g) => g.schedule.map((s) => ({ ...s, groupId: g._id, group: g.name, room: g.room, direction: g.direction }))),
    upcoming: lessons.filter((l) => l.date >= ctx.now.date && l.status !== 'done'),
    history: lessons.filter((l) => l.status !== 'upcoming' && l.date <= ctx.now.date).reverse().slice(0, 40),
    ...summarize(lessons, ctx.now),
  });
}));
