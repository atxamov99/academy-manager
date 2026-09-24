// Demo ma'lumot: 1 manager, 10 mentor, 12 guruh, bir nechta "kela olmaydi" va almashtirish tarixi.
// Ishga tushirish: npm run seed  (bazani TOZALAB qayta to'ldiradi)
import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { Manager, Mentor, Group, Absence, Replacement } from './models/index.js';
import { todayStr, addDays, weekdayOf } from './lib/schedule.js';

const MONGO_URL = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/academy_manager';
await mongoose.connect(MONGO_URL);
await Promise.all([Manager, Mentor, Group, Absence, Replacement].map((M) => M.deleteMany({})));

const s = (day, start, end) => ({ day, start, end });
const weekdays = (start, end) => [1, 2, 3, 4, 5, 6].map((d) => s(d, start, end));

await Manager.create({ name: 'Academy Manager', email: 'manager@mars.uz', passwordHash: await bcrypt.hash('mars2026', 10) });

const mentorData = [
  { name: 'Jasur Karimov', directions: ['frontend'], languages: ['uz', 'ru'], level: 'senior', phone: '+998 90 111 22 33' },
  { name: 'Malika Tosheva', directions: ['frontend', 'design'], languages: ['uz'], level: 'middle', phone: '+998 91 222 33 44' },
  { name: 'Sardor Aliyev', directions: ['backend', 'python'], languages: ['uz', 'ru'], level: 'senior', phone: '+998 93 333 44 55' },
  { name: 'Dilnoza Rahimova', directions: ['python', 'scratch'], languages: ['uz'], level: 'junior', phone: '+998 94 444 55 66' },
  { name: 'Aziz Normatov', directions: ['frontend', 'backend'], languages: ['uz', 'ru', 'en'], level: 'middle', phone: '+998 95 555 66 77' },
  { name: 'Kamola Yusupova', directions: ['scratch', 'robotics'], languages: ['uz', 'ru'], level: 'middle', phone: '+998 97 666 77 88' },
  { name: 'Bobur Ergashev', directions: ['python', 'backend'], languages: ['ru'], level: 'middle', phone: '+998 98 777 88 99' },
  { name: 'Nigora Saidova', directions: ['frontend'], languages: ['uz'], level: 'junior', phone: '+998 99 888 99 00', availability: weekdays('14:00', '20:00') },
  { name: 'Otabek Qodirov', directions: ['robotics', 'scratch'], languages: ['uz'], level: 'junior', phone: '+998 90 999 00 11' },
  { name: 'Shahzoda Mirzayeva', directions: ['design', 'frontend'], languages: ['uz', 'ru'], level: 'senior', phone: '+998 91 000 11 22' },
];
const mentors = await Mentor.insertMany(mentorData);
const M = Object.fromEntries(mentors.map((m) => [m.name.split(' ')[0], m._id]));

const groupData = [
  { name: 'FN-101', direction: 'frontend', level: 'beginner', language: 'uz', room: '201', schedule: [s(1, '14:00', '16:00'), s(3, '14:00', '16:00'), s(5, '14:00', '16:00')], mentor: M.Jasur, students: 14, progressNote: 'HTML/CSS tugadi, Flexbox boshlandi' },
  { name: 'FN-102', direction: 'frontend', level: 'intermediate', language: 'ru', room: '202', schedule: [s(2, '10:00', '12:00'), s(4, '10:00', '12:00'), s(6, '10:00', '12:00')], mentor: M.Aziz, students: 12, progressNote: 'JavaScript: DOM, eventlar' },
  { name: 'FN-201', direction: 'frontend', level: 'advanced', language: 'uz', room: '203', schedule: [s(1, '16:00', '18:00'), s(3, '16:00', '18:00'), s(5, '16:00', '18:00')], mentor: M.Shahzoda, students: 10, progressNote: 'React: hooks, React Router' },
  { name: 'FN-103', direction: 'frontend', level: 'beginner', language: 'uz', room: '204', schedule: [s(2, '14:00', '16:00'), s(4, '14:00', '16:00'), s(6, '14:00', '16:00')], mentor: M.Malika, students: 15, progressNote: 'Git va HTML asoslari' },
  { name: 'PY-101', direction: 'python', level: 'beginner', language: 'uz', room: '301', schedule: [s(1, '10:00', '12:00'), s(3, '10:00', '12:00'), s(5, '10:00', '12:00')], mentor: M.Dilnoza, students: 13, progressNote: "Sikllar, ro'yxatlar" },
  { name: 'PY-201', direction: 'python', level: 'intermediate', language: 'ru', room: '302', schedule: [s(2, '16:00', '18:00'), s(4, '16:00', '18:00'), s(6, '16:00', '18:00')], mentor: M.Bobur, students: 11, progressNote: 'OOP, klasslar' },
  { name: 'BE-301', direction: 'backend', level: 'advanced', language: 'uz', room: '303', schedule: [s(2, '18:00', '20:00'), s(4, '18:00', '20:00'), s(6, '18:00', '20:00')], mentor: M.Sardor, students: 9, progressNote: 'Express + MongoDB, auth' },
  { name: 'SC-101', direction: 'scratch', level: 'beginner', language: 'uz', room: '101', schedule: [s(1, '09:00', '10:30'), s(3, '09:00', '10:30'), s(5, '09:00', '10:30')], mentor: M.Kamola, students: 16, progressNote: 'Animatsiya loyihasi' },
  { name: 'SC-102', direction: 'scratch', level: 'beginner', language: 'ru', room: '102', schedule: [s(2, '09:00', '10:30'), s(4, '09:00', '10:30'), s(6, '09:00', '10:30')], mentor: M.Kamola, students: 14, progressNote: "O'yin yasash" },
  { name: 'RB-101', direction: 'robotics', level: 'beginner', language: 'uz', room: 'Lab', schedule: [s(2, '11:00', '13:00'), s(4, '11:00', '13:00'), s(6, '11:00', '13:00')], mentor: M.Otabek, students: 10, progressNote: 'Arduino: sensorlar' },
  { name: 'DS-101', direction: 'design', level: 'beginner', language: 'uz', room: '205', schedule: [s(1, '18:00', '20:00'), s(3, '18:00', '20:00'), s(5, '18:00', '20:00')], mentor: M.Malika, students: 12, progressNote: 'Figma: auto layout' },
  { name: 'FN-104', direction: 'frontend', level: 'beginner', language: 'uz', room: '201', schedule: [s(2, '16:00', '18:00'), s(4, '16:00', '18:00'), s(6, '16:00', '18:00')], mentor: M.Nigora, students: 14, progressNote: 'CSS Grid' },
];
const opened = ['2026-06-01', '2026-06-15', '2026-07-01', '2026-07-15', '2026-08-01', '2026-08-15'];
const groups = await Group.insertMany(groupData.map((g, i) => ({ ...g, startDate: opened[i % opened.length] })));
const G = Object.fromEntries(groups.map((g) => [g.name, g._id]));

// "Kela olmaydi": Jasur bugundan 3 kun kasal, Sardor keyingi hafta tatilda
const today = todayStr();
await Absence.insertMany([
  { mentor: M.Jasur, from: today, to: addDays(today, 2), reason: 'kasal' },
  { mentor: M.Sardor, from: addDays(today, 5), to: addDays(today, 9), reason: 'tatil' },
]);

// Tarix (o'tgan sanalar)
// n kun oldingi sanadan orqaga qarab guruhning eng yaqin dars kunini topadi
const byName = Object.fromEntries(groups.map((g) => [g.name, g]));
const past = (n, groupName) => {
  let d = addDays(today, -n);
  const days = byName[groupName].schedule.map((x) => x.day);
  while (!days.includes(weekdayOf(d))) d = addDays(d, -1);
  return d;
};
await Replacement.insertMany([
  { group: G['FN-101'], fromMentor: M.Jasur, toMentor: M.Aziz, type: 'temporary', date: past(12, 'FN-101'), reason: 'kasal', note: 'Flexbox mavzusi', score: 72 },
  { group: G['PY-201'], fromMentor: M.Bobur, toMentor: M.Sardor, type: 'temporary', date: past(9, 'PY-201'), reason: 'jadval', score: 64 },
  { group: G['FN-101'], fromMentor: M.Jasur, toMentor: M.Nigora, type: 'temporary', date: past(5, 'FN-101'), reason: 'kasal', score: 58 },
  { group: G['SC-102'], fromMentor: M.Otabek, toMentor: M.Kamola, type: 'permanent', date: past(20, 'SC-102'), reason: 'yuklama', note: "Otabekda 3 guruh bo'lib qolgan edi", score: 81 },
  { group: G['DS-101'], fromMentor: M.Shahzoda, toMentor: M.Malika, type: 'permanent', date: past(30, 'DS-101'), reason: 'ishdan ketdi', score: 77 },
  { group: G['FN-101'], fromMentor: M.Jasur, toMentor: M.Aziz, type: 'temporary', date: past(2, 'FN-101'), reason: 'boshqa', score: 70 },
]);

console.log(`Seed tayyor: ${mentors.length} mentor, ${groups.length} guruh. Bugun: ${today} (hafta kuni ${weekdayOf(today)})`);
console.log('Login: manager@mars.uz / mars2026');
await mongoose.disconnect();
