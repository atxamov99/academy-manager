export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

const OFFLINE = "Server ishlamayapti. Terminalda loyiha papkasida `npm run dev` ni ishga tushiring.";

export async function api(path, { method = 'GET', body } = {}) {
  let res;
  try {
    res = await fetch(`/api${path}`, {
      method,
      credentials: 'include',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(OFFLINE, 0);
  }
  const data = await res.json().catch(() => null);
  if (data === null) throw new ApiError(OFFLINE, res.status); // Vite proxy: backend o'chiq
  if (!res.ok) {
    if (res.status === 401 && !path.startsWith('/auth')) window.dispatchEvent(new Event('am:logout'));
    throw new ApiError(data.error || 'Xatolik yuz berdi', res.status);
  }
  return data;
}

export const DAYS = ['', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba', 'Yakshanba'];
export const DAYS_SHORT = ['', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'];
export const DIRECTIONS = { frontend: 'Frontend', backend: 'Backend', python: 'Python', scratch: 'Scratch', robotics: 'Robototexnika', design: 'Dizayn' };
export const LEVELS = { beginner: "Boshlang'ich", intermediate: "O'rta", advanced: 'Yuqori' };
export const MENTOR_LEVELS = { junior: 'Junior', middle: 'Middle', senior: 'Senior' };
export const LANGS = { uz: "O'zbek", ru: 'Rus', en: 'Ingliz' };
export const REASONS = { kasal: 'Kasal', tatil: "Ta'til", 'ishdan ketdi': 'Ishdan ketdi', jadval: "Jadval o'zgardi", yuklama: 'Yuklama', boshqa: 'Boshqa' };

export const todayStr = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};
export const weekdayOf = (date) => {
  const d = new Date(`${date}T00:00:00Z`).getUTCDay();
  return d === 0 ? 7 : d;
};
export const addDays = (date, n) => {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const MONTHS = ['yan', 'fev', 'mar', 'apr', 'may', 'iyun', 'iyul', 'avg', 'sen', 'okt', 'noy', 'dek'];
export const fmtDate = (date) => {
  if (!date) return '—';
  const [, m, d] = date.split('-').map(Number);
  return `${d}-${MONTHS[m - 1]}`;
};
export const fmtDay = (date) => `${DAYS_SHORT[weekdayOf(date)]}, ${fmtDate(date)}`;
export const initials = (name = '') => name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
