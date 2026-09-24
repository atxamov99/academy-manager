import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, Users } from 'lucide-react';
import { api, DIRECTIONS, MENTOR_LEVELS, fmtDay } from '../lib/api';
import { PageHeader, Button, Spinner, Badge, Empty, Avatar, Chips, QueryGate } from '../components/ui';
import { MentorForm } from '../components/Forms';

export default function Mentors() {
  const mentors = useQuery({ queryKey: ['mentors-stats'], queryFn: () => api('/mentors-stats') });
  const [q, setQ] = useState('');
  const [dir, setDir] = useState('all');
  const [form, setForm] = useState(false);

  const list = (mentors.data || [])
    .filter((m) => m.active !== false)
    .filter((m) => dir === 'all' || m.directions.includes(dir))
    .filter((m) => m.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <PageHeader title="Mentorlar" subtitle="Necha dars o'tgani, keyingi darsi va yuklamasi" actions={<Button onClick={() => setForm(true)}><Plus className="size-4" />Yangi mentor</Button>} />
      <div className="flex flex-wrap gap-3 items-center mb-4">
        <div className="relative w-full sm:w-64">
          <Search className="size-4 absolute left-3 top-3 text-zinc-400" />
          <input className="input !pl-9" placeholder="Mentor ismi…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Chips options={{ all: 'Hammasi', ...DIRECTIONS }} value={dir} onChange={setDir} />
      </div>

      {mentors.isLoading || mentors.isError ? <QueryGate query={mentors}>{() => null}</QueryGate> : list.length === 0 ? <div className="card"><Empty icon={Users} title="Mentor topilmadi" /></div> : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {list.map((m) => (
            <Link key={m._id} to={`/mentors/${m._id}`} className="card p-5 hover:border-zinc-300 hover:shadow-sm transition">
              <div className="flex items-center gap-3">
                <Avatar name={m.name} size={42} />
                <div className="min-w-0">
                  <div className="font-semibold truncate">{m.name}</div>
                  <div className="text-xs text-zinc-400">{MENTOR_LEVELS[m.level]} · {m.languages.map((l) => l.toUpperCase()).join(', ')}</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mt-3">{m.directions.map((d) => <Badge key={d}>{DIRECTIONS[d]}</Badge>)}</div>
              <div className="grid grid-cols-3 mt-4 pt-4 border-t border-zinc-100 text-center">
                <div><div className="text-xl font-semibold tnum">{m.taughtMonth}</div><div className="text-[11px] text-zinc-400">shu oy</div></div>
                <div><div className="text-xl font-semibold tnum">{m.taughtTotal}</div><div className="text-[11px] text-zinc-400">jami dars</div></div>
                <div><div className="text-xl font-semibold tnum">{m.hours}<span className="text-sm text-zinc-400"> s</span></div><div className="text-[11px] text-zinc-400">haftalik</div></div>
              </div>
              <div className="mt-4 rounded-xl bg-zinc-50 px-3 py-2 text-xs">
                {m.nextLesson ? (
                  <span className="text-zinc-600">Keyingi dars: <b className="font-semibold text-zinc-900">{fmtDay(m.nextLesson.date)}, {m.nextLesson.start}</b> · {m.nextLesson.group}{m.nextLesson.substitute ? ' (zamena)' : ''}</span>
                ) : <span className="text-zinc-400">Yaqin 2 haftada darsi yo'q</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
      {form && <MentorForm open onClose={() => setForm(false)} />}
    </>
  );
}
