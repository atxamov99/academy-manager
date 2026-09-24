import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rankCandidates, lessonsNeedingMentor, weekdayOf, effectiveMentorId } from '../src/lib/schedule.js';

// 2026-09-28 — Dushanba
const MON = '2026-09-28';
const m = (id, extra = {}) => ({ _id: id, name: id, directions: ['frontend'], languages: ['uz'], level: 'middle', availability: [], ...extra });
const g = (id, mentor, schedule, extra = {}) => ({ _id: id, name: id, direction: 'frontend', level: 'beginner', language: 'uz', mentor, schedule, ...extra });
const slot = (day, start, end) => ({ day, start, end });

test('weekdayOf: 2026-09-28 Dushanba', () => assert.equal(weekdayOf(MON), 1));

test('band mentor tavsiyadan chiqadi, bo\'shi eligible', () => {
  const groups = [g('G1', 'A', [slot(1, '14:00', '16:00')]), g('G2', 'B', [slot(1, '15:00', '17:00')])];
  const mentors = [m('A'), m('B'), m('C')];
  const r = rankCandidates({ group: groups[0], type: 'temporary', date: MON, mentors, groups, absences: [], replacements: [] });
  assert.equal(r.find((x) => x.mentor._id === 'A'), undefined, 'joriy mentor ro\'yxatda bo\'lmaydi');
  assert.equal(r.find((x) => x.mentor._id === 'B').eligible, false);
  assert.match(r.find((x) => x.mentor._id === 'B').blockers[0], /G2/);
  assert.equal(r.find((x) => x.mentor._id === 'C').eligible, true);
  assert.equal(r[0].mentor._id, 'C', 'eligible birinchi');
});

test('yo\'nalish va til mos kelmasa blok', () => {
  const groups = [g('G1', 'A', [slot(1, '14:00', '16:00')], { language: 'ru' })];
  const mentors = [m('A'), m('P', { directions: ['python'], languages: ['ru'] }), m('U', { languages: ['uz'] })];
  const r = rankCandidates({ group: groups[0], type: 'temporary', date: MON, mentors, groups, absences: [], replacements: [] });
  assert.equal(r.find((x) => x.mentor._id === 'P').eligible, false);
  assert.equal(r.find((x) => x.mentor._id === 'U').eligible, false);
});

test('absence: kela olmaydigan mentor blok va dars "mentor kerak" ga tushadi', () => {
  const groups = [g('G1', 'A', [slot(1, '14:00', '16:00')])];
  const absences = [{ mentor: 'A', from: MON, to: MON, reason: 'kasal' }];
  const need = lessonsNeedingMentor({ groups, absences, replacements: [], from: MON, days: 1 });
  assert.equal(need.length, 1);
  // vaqtinchalik almashtirishdan keyin ro'yxatdan chiqadi
  const repl = [{ type: 'temporary', group: 'G1', toMentor: 'C', date: MON }];
  assert.equal(lessonsNeedingMentor({ groups, absences, replacements: repl, from: MON, days: 1 }).length, 0);
  assert.equal(effectiveMentorId(groups[0], MON, repl), 'C');
});

test('vaqtinchalik almashtirilgan mentor o\'z guruhi vaqtida bo\'sh hisoblanadi', () => {
  // B ning G2 darsi shu kuni C ga berilgan -> B bo'sh, G1 ga olsa bo'ladi
  const groups = [g('G1', 'A', [slot(1, '14:00', '16:00')]), g('G2', 'B', [slot(1, '14:00', '16:00')])];
  const repl = [{ type: 'temporary', group: 'G2', toMentor: 'C', date: MON }];
  const r = rankCandidates({ group: groups[0], type: 'temporary', date: MON, mentors: [m('A'), m('B'), m('C')], groups, absences: [], replacements: repl });
  assert.equal(r.find((x) => x.mentor._id === 'B').eligible, true);
  assert.equal(r.find((x) => x.mentor._id === 'C').eligible, false, 'C endi G2 da band');
});

test('doimiy: haftalik to\'qnashuv va ish vaqtiga sig\'maslik', () => {
  const groups = [g('G1', 'A', [slot(3, '10:00', '12:00')]), g('G2', 'B', [slot(3, '11:00', '13:00')])];
  const mentors = [m('A'), m('B'), m('C', { availability: [slot(3, '14:00', '20:00')] }), m('D')];
  const r = rankCandidates({ group: groups[0], type: 'permanent', date: MON, mentors, groups, absences: [], replacements: [] });
  assert.equal(r.find((x) => x.mentor._id === 'B').eligible, false);
  assert.equal(r.find((x) => x.mentor._id === 'C').eligible, false);
  assert.equal(r.find((x) => x.mentor._id === 'D').eligible, true);
});

test('ball: yuklamasi kam va guruhni taniydigan mentor yuqorida', () => {
  const groups = [
    g('G1', 'A', [slot(2, '10:00', '12:00')]),
    g('H1', 'BUSY', [slot(4, '10:00', '18:00')]),
    g('H2', 'BUSY', [slot(5, '10:00', '18:00')]),
  ];
  const repl = [{ type: 'temporary', group: 'G1', toMentor: 'FAM', date: '2026-09-01' }];
  const r = rankCandidates({ group: groups[0], type: 'permanent', date: MON, mentors: [m('A'), m('BUSY'), m('FAM'), m('NEW')], groups, absences: [], replacements: repl });
  assert.deepEqual(r.map((x) => x.mentor._id), ['FAM', 'NEW', 'BUSY']);
});

test('shu kuni darsi yo\'q guruhga vaqtinchalik almashtirish xato beradi', () => {
  const groups = [g('G1', 'A', [slot(2, '10:00', '12:00')])];
  assert.throws(() => rankCandidates({ group: groups[0], type: 'temporary', date: MON, mentors: [m('A')], groups, absences: [], replacements: [] }), /darsi yo'q/);
});
