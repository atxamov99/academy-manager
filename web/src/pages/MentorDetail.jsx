import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { ArrowLeft, Pencil, CalendarOff, Phone, Trash2 } from 'lucide-react';
import { api, DAYS_SHORT, DIRECTIONS, MENTOR_LEVELS, LANGS, fmtDay, fmtDate } from '../lib/api';
import { Button, Spinner, Badge, Avatar, Empty, Stat, QueryGate } from '../components/ui';
import { MentorForm, AbsenceForm } from '../components/Forms';

const HOURS = Array.from({ length: 13 }, (_, i) => 8 + i); // 08:00–20:00
const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };

function WeekGrid({ weekly }) {
  const H = 34; // 1 soat balandligi (px)
  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[640px]" style={{ gridTemplateColumns: '44px repeat(6, 1fr)' }}>
        <div />
        {[1, 2, 3, 4, 5, 6].map((d) => <div key={d} className="text-xs font-medium text-zinc-500 text-center pb-2">{DAYS_SHORT[d]}</div>)}
        <div className="relative" style={{ height: H * 12 }}>
          {HOURS.map((h, i) => <div key={h} className="absolute right-2 text-[10px] text-zinc-400 tnum -translate-y-1.5" style={{ top: i * H }}>{h}:00</div>)}
        </div>
        {[1, 2, 3, 4, 5, 6].map((d) => (
          <div key={d} className="relative border-l border-zinc-100" style={{ height: H * 12 }}>
            {HOURS.map((h, i) => <div key={h} className="absolute inset-x-0 border-t border-zinc-100" style={{ top: i * H }} />)}
            {weekly.filter((s) => s.day === d).map((s, i) => {
              const top = ((toMin(s.start) - 480) / 60) * H;
              const height = ((toMin(s.end) - toMin(s.start)) / 60) * H;
              return (
                <Link key={i} to={`/groups/${s.groupId}`} className="absolute inset-x-1 rounded-lg bg-zinc-900 text-white px-2 py-1 overflow-hidden hover:bg-zinc-800" style={{ top, height }}>
                  <div className="text-[11px] font-semibold">{s.group}</div>
                  <div className="text-[10px] text-zinc-400 tnum">{s.start}–{s.end}</div>
                </Link>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

const STATUS = { done: ['o\'tildi', 'zinc'], upcoming: ['kutilmoqda', 'outline'], missed: ['kelmagan', 'accent'] };

export default function MentorDetail() {
  const { id } = useParams();
  const qc = useQueryClient();
  const ov = useQuery({ queryKey: ['mentor-overview', id], queryFn: () => api(`/mentors/${id}/overview`) });
  const [edit, setEdit] = useState(false);
  const [absence, setAbsence] = useState(false);
  const [tab, setTab] = useState('upcoming');
  const delAbs = useMutation({ mutationFn: (aid) => api(`/absences/${aid}`, { method: 'DELETE' }), onSuccess: () => qc.invalidateQueries() });

  if (ov.isLoading || ov.isError || !ov.data) return <QueryGate query={ov}>{() => null}</QueryGate>;
  const d = ov.data;
  const m = d.mentor;
  const rows = tab === 'upcoming' ? d.upcoming : d.history;

  return (
    <>
      <Link to="/mentors" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 mb-4"><ArrowLeft className="size-4" />Mentorlar</Link>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Avatar name={m.name} size={56} dark />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{m.name}</h1>
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              <Badge tone="dark">{MENTOR_LEVELS[m.level]}</Badge>
              {m.directions.map((x) => <Badge key={x}>{DIRECTIONS[x]}</Badge>)}
              <Badge tone="outline">{m.languages.map((l) => LANGS[l]).join(', ')}</Badge>
              {m.phone && <span className="text-xs text-zinc-400 flex items-center gap-1 ml-1"><Phone className="size-3" />{m.phone}</span>}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEdit(true)}><Pencil className="size-4" />Tahrirlash</Button>
          <Button variant="accent" onClick={() => setAbsence(true)}><CalendarOff className="size-4" />Kela olmaydi</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Shu oy o'tgan darslar" value={d.taughtMonth} />
        <Stat label="Jami o'tgan darslar" value={d.taughtTotal} hint={`${d.substituteTotal} tasi zamena`} />
        <Stat label="Haftalik yuklama" value={`${d.hours} s`} hint={`${d.groups.length} ta guruh`} />
        <Stat label="Kelmagan (almashtirilmagan)" value={d.missedTotal} accent={d.missedTotal > 0} />
      </div>

      <section className="card mt-6 p-5">
        <h2 className="font-semibold text-sm mb-4">Haftalik dars jadvali</h2>
        {d.weekly.length ? <WeekGrid weekly={d.weekly} /> : <Empty title="Doimiy guruhi yo'q" />}
      </section>

      <div className="grid lg:grid-cols-3 gap-6 mt-6">
        <section className="card lg:col-span-2 self-start">
          <div className="px-5 pt-4 flex gap-1 border-b border-zinc-100">
            {[['upcoming', `Qachon darsi bor (${d.upcoming.length})`], ['history', 'O\'tgan darslar']].map(([k, t]) => (
              <button key={k} onClick={() => setTab(k)} className={clsx('px-3 pb-3 text-sm font-medium border-b-2 -mb-px cursor-pointer', tab === k ? 'border-zinc-900 text-zinc-900' : 'border-transparent text-zinc-400 hover:text-zinc-700')}>{t}</button>
            ))}
          </div>
          {rows.length === 0 ? <Empty title="Dars yo'q" /> : (
            <div className="divide-y divide-zinc-100 max-h-[420px] overflow-auto">
              {rows.map((l, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-2.5 text-sm">
                  <span className="w-24 font-medium">{fmtDay(l.date)}</span>
                  <span className="w-24 tnum text-zinc-500">{l.start}–{l.end}</span>
                  <Link to={`/groups/${l.groupId}`} className="font-semibold hover:underline">{l.group}</Link>
                  <span className="text-xs text-zinc-400">{DIRECTIONS[l.direction]}</span>
                  <span className="ml-auto flex gap-1.5">
                    {l.substitute && <Badge tone="accent">zamena</Badge>}
                    <Badge tone={STATUS[l.status][1]}>{STATUS[l.status][0]}</Badge>
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="card self-start">
          <div className="px-5 py-4 border-b border-zinc-100"><h2 className="font-semibold text-sm">Kela olmaydigan kunlari</h2></div>
          {d.absences.length === 0 ? <Empty title="Yo'q" /> : (
            <div className="divide-y divide-zinc-100">
              {d.absences.map((a) => (
                <div key={a._id} className="flex items-center gap-3 px-5 py-3 text-sm">
                  <div className="flex-1">
                    <div className="font-medium">{fmtDate(a.from)}{a.to !== a.from ? ` – ${fmtDate(a.to)}` : ''}</div>
                    {a.reason && <div className="text-xs text-zinc-400">{a.reason}</div>}
                  </div>
                  <button onClick={() => delAbs.mutate(a._id)} className="p-1.5 text-zinc-300 hover:text-red-600 cursor-pointer" aria-label="O'chirish"><Trash2 className="size-4" /></button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {edit && <MentorForm open initial={m} onClose={() => setEdit(false)} />}
      {absence && <AbsenceForm open mentor={m} onClose={() => setAbsence(false)} />}
    </>
  );
}
