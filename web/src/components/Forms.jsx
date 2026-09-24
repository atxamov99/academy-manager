import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { api, DAYS, DIRECTIONS, LEVELS, LANGS, MENTOR_LEVELS, todayStr } from '../lib/api';
import { Modal, Button, Field, Chips, ErrorNote } from './ui';

function SlotsEditor({ value, onChange, addLabel = "Dars kuni qo'shish" }) {
  const set = (i, k, v) => onChange(value.map((s, j) => (j === i ? { ...s, [k]: k === 'day' ? Number(v) : v } : s)));
  return (
    <div className="space-y-2">
      {value.map((s, i) => (
        <div key={i} className="flex gap-2 items-center">
          <select className="input !w-40" value={s.day} onChange={(e) => set(i, 'day', e.target.value)}>
            {DAYS.slice(1).map((d, k) => <option key={d} value={k + 1}>{d}</option>)}
          </select>
          <input type="time" className="input !w-28" value={s.start} onChange={(e) => set(i, 'start', e.target.value)} />
          <span className="text-zinc-400">—</span>
          <input type="time" className="input !w-28" value={s.end} onChange={(e) => set(i, 'end', e.target.value)} />
          <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="p-2 text-zinc-400 hover:text-red-600 cursor-pointer" aria-label="O'chirish">
            <Trash2 className="size-4" />
          </button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => onChange([...value, { day: 1, start: '14:00', end: '16:00' }])}>
        <Plus className="size-3.5" />{addLabel}
      </Button>
    </div>
  );
}

export function GroupForm({ open, onClose, initial }) {
  const qc = useQueryClient();
  const mentors = useQuery({ queryKey: ['mentors'], queryFn: () => api('/mentors') });
  const [f, setF] = useState(() => ({
    name: '', direction: 'frontend', level: 'beginner', language: 'uz', room: '', students: 0, progressNote: '', startDate: todayStr(),
    schedule: [{ day: 1, start: '14:00', end: '16:00' }, { day: 3, start: '14:00', end: '16:00' }, { day: 5, start: '14:00', end: '16:00' }],
    ...initial,
    mentor: initial?.mentor?._id ?? initial?.mentor ?? null,
  }));
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));
  const save = useMutation({
    mutationFn: () => {
      const { _id, __v, createdAt, updatedAt, active, ...body } = f;
      return api(initial?._id ? `/groups/${initial._id}` : '/groups', { method: initial?._id ? 'PUT' : 'POST', body: { ...body, students: Number(body.students) || 0 } });
    },
    onSuccess: () => { qc.invalidateQueries(); onClose(); },
  });
  const fit = (mentors.data || []).filter((m) => m.active !== false && m.directions.includes(f.direction));

  return (
    <Modal open={open} onClose={onClose} title={initial?._id ? 'Guruhni tahrirlash' : 'Yangi guruh'} width={640}>
      <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-4">
        <div className="grid sm:grid-cols-3 gap-3">
          <Field label="Guruh nomi"><input required className="input" value={f.name} onChange={(e) => set('name')(e.target.value)} placeholder="FN-105" /></Field>
          <Field label="Xona"><input className="input" value={f.room} onChange={(e) => set('room')(e.target.value)} placeholder="201" /></Field>
          <Field label="O'quvchilar soni"><input type="number" min="0" className="input" value={f.students} onChange={(e) => set('students')(e.target.value)} /></Field>
        </div>
        <Field label="Yo'nalish"><Chips options={DIRECTIONS} value={f.direction} onChange={set('direction')} /></Field>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Daraja"><Chips options={LEVELS} value={f.level} onChange={set('level')} /></Field>
          <Field label="Til"><Chips options={LANGS} value={f.language} onChange={set('language')} /></Field>
        </div>
        <Field label="Dars jadvali"><SlotsEditor value={f.schedule} onChange={set('schedule')} /></Field>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label={`Mentor (${DIRECTIONS[f.direction]} bo'yicha)`}>
            <select className="input" value={f.mentor || ''} onChange={(e) => set('mentor')(e.target.value || null)}>
              <option value="">— Biriktirilmagan —</option>
              {fit.map((m) => <option key={m._id} value={m._id}>{m.name} ({MENTOR_LEVELS[m.level]})</option>)}
            </select>
          </Field>
          <Field label="Ochilgan sana"><input type="date" className="input" value={f.startDate || ''} onChange={(e) => set('startDate')(e.target.value)} /></Field>
        </div>
        <Field label="Guruh qayerga keldi (yangi mentor uchun izoh)">
          <textarea rows={2} className="input" value={f.progressNote || ''} onChange={(e) => set('progressNote')(e.target.value)} />
        </Field>
        <ErrorNote error={save.error} />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>Bekor qilish</Button>
          <Button disabled={save.isPending}>Saqlash</Button>
        </div>
      </form>
    </Modal>
  );
}

export function MentorForm({ open, onClose, initial }) {
  const qc = useQueryClient();
  const [f, setF] = useState(() => ({ name: '', phone: '', directions: ['frontend'], languages: ['uz'], level: 'junior', availability: [], ...initial }));
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));
  const save = useMutation({
    mutationFn: () => {
      const { name, phone, directions, languages, level, availability } = f;
      return api(initial?._id ? `/mentors/${initial._id}` : '/mentors', { method: initial?._id ? 'PUT' : 'POST', body: { name, phone, directions, languages, level, availability } });
    },
    onSuccess: () => { qc.invalidateQueries(); onClose(); },
  });

  return (
    <Modal open={open} onClose={onClose} title={initial?._id ? 'Mentorni tahrirlash' : 'Yangi mentor'} width={640}>
      <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Ism familiya"><input required className="input" value={f.name} onChange={(e) => set('name')(e.target.value)} /></Field>
          <Field label="Telefon"><input className="input" value={f.phone || ''} onChange={(e) => set('phone')(e.target.value)} placeholder="+998 90 000 00 00" /></Field>
        </div>
        <Field label="Qaysi yo'nalishlarni o'tadi"><Chips multi options={DIRECTIONS} value={f.directions} onChange={set('directions')} /></Field>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Tillar"><Chips multi options={LANGS} value={f.languages} onChange={set('languages')} /></Field>
          <Field label="Daraja"><Chips options={MENTOR_LEVELS} value={f.level} onChange={set('level')} /></Field>
        </div>
        <Field label="Ish vaqti (bo'sh qoldirilsa — istalgan vaqtda ishlay oladi)">
          <SlotsEditor value={f.availability} onChange={set('availability')} addLabel="Ish vaqti qo'shish" />
        </Field>
        <ErrorNote error={save.error} />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>Bekor qilish</Button>
          <Button disabled={save.isPending || !f.directions.length || !f.languages.length}>Saqlash</Button>
        </div>
      </form>
    </Modal>
  );
}

export function AbsenceForm({ open, onClose, mentor }) {
  const qc = useQueryClient();
  const [f, setF] = useState({ from: todayStr(), to: todayStr(), reason: '' });
  const save = useMutation({
    mutationFn: () => api('/absences', { method: 'POST', body: { mentor: mentor._id, ...f } }),
    onSuccess: () => { qc.invalidateQueries(); onClose(); },
  });
  return (
    <Modal open={open} onClose={onClose} title="Kela olmaydi" subtitle={`${mentor.name} — shu kunlardagi darslar "Mentor kerak" ro'yxatiga tushadi`} width={460}>
      <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Dan"><input type="date" className="input" value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })} /></Field>
          <Field label="Gacha"><input type="date" className="input" min={f.from} value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} /></Field>
        </div>
        <Field label="Sabab"><input className="input" value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} placeholder="kasal, ta'til, ..." /></Field>
        <ErrorNote error={save.error} />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>Bekor qilish</Button>
          <Button variant="accent" disabled={save.isPending}>Belgilash</Button>
        </div>
      </form>
    </Modal>
  );
}
