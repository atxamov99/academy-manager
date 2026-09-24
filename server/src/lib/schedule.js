// Jadval va mentor tavsiyasi mantig'i — sof funksiyalar (DB'ga bog'liq emas, test qilinadi).
// Sana formati: 'YYYY-MM-DD' (string) — timezone xatolaridan qochish uchun.
// Kun: 1=Dushanba ... 7=Yakshanba. Vaqt: 'HH:MM'.

export const DAY_NAMES = ['', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'];
const LEVEL_RANK = { junior: 1, middle: 2, senior: 3 };
const GROUP_LEVEL_NEED = { beginner: 1, intermediate: 2, advanced: 3 };

export const toMin = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

export const overlaps = (a, b) => toMin(a.start) < toMin(b.end) && toMin(b.start) < toMin(a.end);

export const weekdayOf = (date) => {
  const d = new Date(`${date}T00:00:00Z`).getUTCDay(); // 0=Ya
  return d === 0 ? 7 : d;
};

export const addDays = (date, n) => {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

export const todayStr = () => {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
};

export const nowInfo = () => {
  const d = new Date();
  return { date: todayStr(), minutes: d.getHours() * 60 + d.getMinutes() };
};

const id = (x) => (x == null ? null : String(x._id ?? x));

/** Guruhning shu sanadagi darsi (slot) — bo'lmasa null */
export const lessonOn = (group, date) => group.schedule.find((s) => s.day === weekdayOf(date)) || null;

/** Mentorning haftalik dars soati (asosiy mentor bo'lgan faol guruhlar bo'yicha) */
export const weeklyLoadHours = (mentorId, groups) =>
  groups
    .filter((g) => g.active !== false && id(g.mentor) === mentorId)
    .reduce((sum, g) => sum + g.schedule.reduce((s, sl) => s + (toMin(sl.end) - toMin(sl.start)) / 60, 0), 0);

const isAbsent = (mentorId, date, absences) =>
  absences.find((a) => id(a.mentor) === mentorId && a.from <= date && date <= a.to) || null;

/**
 * Shu sanada guruhning ASOSIY mentori kim edi (doimiy almashtirishlar tarixiga qarab).
 * Sanadan oldingi oxirgi doimiy almashtirish -> uning toMentor'i;
 * bo'lmasa, sanadan keyingi birinchisining fromMentor'i; bo'lmasa group.mentor.
 */
export const mainMentorOn = (group, date, replacements) => {
  const perms = replacements
    .filter((r) => r.type === 'permanent' && id(r.group) === id(group) && !r.cancelled)
    .sort((a, b) => a.date.localeCompare(b.date));
  if (!perms.length) return id(group.mentor);
  const before = perms.filter((r) => r.date <= date).pop();
  if (before) return id(before.toMentor);
  return id(perms[0].fromMentor);
};

/** Shu sanadagi guruh darsini amalda kim o'tadi (doimiy + vaqtinchalik almashtirishni hisobga olib) */
export const effectiveMentorId = (group, date, replacements) => {
  const temp = replacements.find(
    (r) => r.type === 'temporary' && id(r.group) === id(group) && r.date === date && !r.cancelled
  );
  return temp ? id(temp.toMentor) : mainMentorOn(group, date, replacements);
};

/**
 * Mentorning [from, to] oralig'idagi darslari (o'tgan va kelgusi).
 * status: 'done' (o'tildi) | 'upcoming' | 'missed' (mentor kelmagan, almashtirilmagan)
 * now: { date, minutes } — bugungi dars tugagan bo'lsa 'done' hisoblanadi.
 */
export function mentorLessons(mentorId, { groups, absences, replacements, from, to, now }) {
  const out = [];
  for (let date = from; date <= to; date = addDays(date, 1)) {
    for (const g of groups) {
      if (g.startDate && date < g.startDate) continue;
      const l = lessonOn(g, date);
      if (!l || effectiveMentorId(g, date, replacements) !== mentorId) continue;
      const main = mainMentorOn(g, date, replacements);
      const past = date < now.date || (date === now.date && toMin(l.end) <= now.minutes);
      const absent = isAbsent(mentorId, date, absences);
      out.push({
        date, day: weekdayOf(date), start: l.start, end: l.end,
        groupId: id(g), group: g.name, direction: g.direction, room: g.room,
        substitute: main !== mentorId,
        status: absent ? 'missed' : past ? 'done' : 'upcoming',
      });
    }
  }
  return out.sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
}

/**
 * Mentor shu sana va vaqt oynasida bandmi? Band bo'lsa sabab qaytaradi.
 * Hisobga olinadi: o'z guruhlari (agar o'sha kuni boshqa mentorga berilmagan bo'lsa),
 * boshqa guruhlarga qilingan vaqtinchalik almashtirishlar, "kela olmaydi" (absence).
 */
export const busyReason = (mentorId, date, slot, ctx, excludeGroupId) => {
  const abs = isAbsent(mentorId, date, ctx.absences);
  if (abs) return `Kela olmaydi (${abs.from} – ${abs.to}${abs.reason ? `, ${abs.reason}` : ''})`;
  for (const g of ctx.groups) {
    if (g.active === false || id(g) === excludeGroupId) continue;
    const l = lessonOn(g, date);
    if (!l || !overlaps(l, slot)) continue;
    if (effectiveMentorId(g, date, ctx.replacements) === mentorId) return `${g.name} guruhida darsi bor (${l.start}–${l.end})`;
  }
  return null;
};

/** Doimiy almashtirish uchun: haftalik jadvalda to'qnashuv bormi */
export const weeklyConflict = (mentorId, group, groups) => {
  for (const g of groups) {
    if (g.active === false || id(g) === id(group) || id(g.mentor) !== mentorId) continue;
    for (const a of g.schedule)
      for (const b of group.schedule)
        if (a.day === b.day && overlaps(a, b)) return `${g.name} bilan to'qnashadi (${DAY_NAMES[a.day]} ${a.start}–${a.end})`;
  }
  return null;
};

const fitsAvailability = (mentor, slots) =>
  !mentor.availability?.length ||
  slots.every((s) => mentor.availability.some((w) => w.day === s.day && toMin(w.start) <= toMin(s.start) && toMin(s.end) <= toMin(w.end)));

/**
 * Asosiy funksiya: guruh uchun mentor nomzodlarini reyting bilan qaytaradi.
 * type: 'temporary' (bitta dars, date shart) | 'permanent' (doimiy, date = kuchga kirish sanasi)
 * Natija: [{ mentor, eligible, score, reasons: [+/- izohlar], blockers: [nega mos emas] }]
 */
export function rankCandidates({ group, type, date, mentors, groups, absences, replacements, maxLoad = 30 }) {
  const ctx = { groups, absences, replacements };
  const slot = type === 'temporary' ? lessonOn(group, date) : null;
  if (type === 'temporary' && !slot) throw new Error(`Bu guruhning ${date} kuni darsi yo'q`);
  const currentId = type === 'temporary' ? effectiveMentorId(group, date, replacements) : id(group.mentor);
  const since = addDays(date, -60);

  return mentors
    .filter((m) => id(m) !== currentId)
    .map((m) => {
      const mid = id(m);
      const blockers = [];
      const reasons = [];
      let score = 0;

      if (m.active === false) blockers.push('Nofaol mentor');
      if (!m.directions.includes(group.direction)) blockers.push(`${group.direction} yo'nalishini o'tmaydi`);
      if (!m.languages.includes(group.language)) blockers.push(`${group.language.toUpperCase()} tilida dars o'tmaydi`);

      if (type === 'temporary') {
        const busy = busyReason(mid, date, slot, ctx, id(group));
        if (busy) blockers.push(busy);
        if (!fitsAvailability(m, [{ ...slot, day: weekdayOf(date) }])) blockers.push(`Bu vaqtda ishlamaydi (${slot.start}–${slot.end})`);
      } else {
        const c = weeklyConflict(mid, group, groups);
        if (c) blockers.push(c);
        if (!fitsAvailability(m, group.schedule)) blockers.push("Guruh jadvali mentorning ish vaqtiga sig'maydi");
        const abs = isAbsent(mid, date, absences);
        if (abs) blockers.push(`Kela olmaydi (${abs.from} – ${abs.to})`);
      }

      // Ball (0–100): yuklama, tanishlik, daraja, adolatli taqsimot
      const load = weeklyLoadHours(mid, groups);
      const loadPts = Math.round(40 * Math.max(0, 1 - load / maxLoad));
      score += loadPts;
      reasons.push({ good: load < maxLoad * 0.5, text: `Haftalik yuklama: ${load} soat` });

      const familiar =
        replacements.some((r) => id(r.group) === id(group) && id(r.toMentor) === mid && !r.cancelled) ||
        replacements.some((r) => id(r.group) === id(group) && id(r.fromMentor) === mid && !r.cancelled);
      if (familiar) {
        score += 25;
        reasons.push({ good: true, text: 'Guruhni taniydi (oldin dars o\'tgan)' });
      }

      const need = GROUP_LEVEL_NEED[group.level] ?? 1;
      const rank = LEVEL_RANK[m.level] ?? 1;
      if (rank >= need) {
        score += 20;
        reasons.push({ good: true, text: `Daraja mos (${m.level})` });
      } else {
        reasons.push({ good: false, text: `Daraja pastroq (${m.level}, guruh: ${group.level})` });
      }

      const recent = replacements.filter((r) => id(r.toMentor) === mid && r.date >= since && !r.cancelled).length;
      const fairPts = Math.max(0, 15 - recent * 5);
      score += fairPts;
      if (recent) reasons.push({ good: false, text: `So'nggi 60 kunda ${recent} marta zamena qilgan` });

      return { mentor: m, eligible: blockers.length === 0, score: Math.min(100, score), reasons, blockers };
    })
    .sort((a, b) => Number(b.eligible) - Number(a.eligible) || b.score - a.score);
}

/**
 * Keyingi `days` kun ichida mentori kelmaydigan va hali almashtirilmagan darslar.
 */
export function lessonsNeedingMentor({ groups, absences, replacements, from, days = 7 }) {
  const out = [];
  for (let i = 0; i < days; i++) {
    const date = addDays(from, i);
    for (const g of groups) {
      if (g.active === false) continue;
      const l = lessonOn(g, date);
      if (!l) continue;
      const eff = effectiveMentorId(g, date, replacements);
      if (!eff) {
        out.push({ group: g, date, slot: l, reason: 'Mentor biriktirilmagan' });
        continue;
      }
      const abs = isAbsent(eff, date, absences);
      if (abs) out.push({ group: g, date, slot: l, reason: `Mentor kela olmaydi${abs.reason ? `: ${abs.reason}` : ''}` });
    }
  }
  return out;
}
