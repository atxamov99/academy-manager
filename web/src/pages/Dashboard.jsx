import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { TriangleAlert, ArrowLeftRight, Clock, CalendarOff, ChevronRight } from 'lucide-react';
import { api, fmtDay, fmtDate, DIRECTIONS, REASONS, DAYS } from '../lib/api';
import { PageHeader, Stat, Spinner, Empty, Badge, Button, Avatar } from '../components/ui';
import ReplaceFlow from '../components/ReplaceFlow';

export default function Dashboard() {
  const dash = useQuery({ queryKey: ['dashboard'], queryFn: () => api('/dashboard') });
  const groups = useQuery({ queryKey: ['groups'], queryFn: () => api('/groups') });
  const [replace, setReplace] = useState(null);

  if (dash.isLoading) return <Spinner />;
  const d = dash.data;
  const maxHours = Math.max(1, ...d.loads.map((l) => l.hours));
  const openReplace = (n) => {
    const g = groups.data?.find((x) => x._id === n.groupId);
    if (g) setReplace({ group: g, date: n.date });
  };
  const today = new Date(`${d.today}T00:00:00Z`);

  return (
    <>
      <PageHeader title="Bosh sahifa" subtitle={`${DAYS[today.getUTCDay() || 7]}, ${fmtDate(d.today)} · bugungi holat`} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Mentor kerak (7 kun)" value={d.stats.needs} hint="almashtirilmagan darslar" accent={d.stats.needs > 0} />
        <Stat label="Bugun kela olmaydi" value={d.stats.absentToday} hint="mentor" />
        <Stat label="Almashtirishlar (30 kun)" value={d.stats.replacements30} />
        <Stat label="Faol guruhlar" value={d.stats.groups} hint={`${d.stats.mentors} mentor`} />
      </div>

      <section className={clsx('card mt-6 overflow-hidden', d.needs.length && 'border-accent/40')}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
          <div className="flex items-center gap-2.5">
            <div className={clsx('size-8 rounded-xl grid place-items-center', d.needs.length ? 'bg-accent-soft text-accent' : 'bg-zinc-100 text-zinc-400')}>
              <TriangleAlert className="size-4" />
            </div>
            <div>
              <h2 className="font-semibold text-sm">Mentor kerak</h2>
              <p className="text-xs text-zinc-400">Keyingi 7 kunda mentori kelmaydigan darslar</p>
            </div>
          </div>
        </div>
        {d.needs.length === 0 ? (
          <Empty icon={CalendarOff} title="Hammasi joyida" text="Keyingi 7 kunda barcha darslarga mentor bor" />
        ) : (
          <div className="divide-y divide-zinc-100">
            {d.needs.map((n) => (
              <div key={n.groupId + n.date} className="flex flex-wrap items-center gap-4 px-5 py-3.5">
                <div className="w-28 shrink-0">
                  <div className="text-sm font-semibold">{fmtDay(n.date)}</div>
                  <div className="text-xs text-zinc-400 tnum">{n.start}–{n.end}</div>
                </div>
                <div className="min-w-[180px] flex-1">
                  <Link to={`/groups/${n.groupId}`} className="text-sm font-semibold hover:underline">{n.group}</Link>
                  <div className="text-xs text-zinc-500">{DIRECTIONS[n.direction]} · {n.mentor} · <span className="text-accent-ink">{n.reason}</span></div>
                </div>
                <Button variant="accent" size="sm" onClick={() => openReplace(n)}>
                  <ArrowLeftRight className="size-3.5" />Mentor topish
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="grid lg:grid-cols-5 gap-6 mt-6">
        <section className="card lg:col-span-3">
          <div className="px-5 py-4 border-b border-zinc-100 flex items-center gap-2">
            <Clock className="size-4 text-zinc-400" />
            <h2 className="font-semibold text-sm">Bugungi darslar</h2>
            <span className="text-xs text-zinc-400">({d.todayLessons.length})</span>
          </div>
          {d.todayLessons.length === 0 ? <Empty title="Bugun dars yo'q" /> : (
            <div className="divide-y divide-zinc-100">
              {d.todayLessons.map((l) => (
                <Link key={l.groupId} to={`/groups/${l.groupId}`} className="flex items-center gap-4 px-5 py-3 hover:bg-zinc-50/80">
                  <div className="text-sm font-medium tnum w-20 sm:w-24 shrink-0 text-zinc-500">{l.start}–{l.end}</div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold">{l.group}</div>
                    <div className="text-xs text-zinc-400">{DIRECTIONS[l.direction]}{l.room ? ` · ${l.room}-xona` : ''}</div>
                  </div>
                  <div className="text-sm text-zinc-700 text-right">{l.mentor}</div>
                  {l.replaced && <Badge tone="accent">zamena</Badge>}
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="card lg:col-span-2">
          <div className="px-5 py-4 border-b border-zinc-100">
            <h2 className="font-semibold text-sm">Mentorlar yuklamasi</h2>
            <p className="text-xs text-zinc-400">haftalik dars soati</p>
          </div>
          <div className="px-5 py-3 space-y-2.5">
            {d.loads.map((l) => (
              <Link key={l._id} to={`/mentors/${l._id}`} className="flex items-center gap-3 group">
                <span className="text-sm w-36 truncate group-hover:underline">{l.name}</span>
                <div className="flex-1 h-2 rounded-full bg-zinc-100 overflow-hidden">
                  <div className="h-full rounded-full bg-zinc-900" style={{ width: `${(l.hours / maxHours) * 100}%` }} />
                </div>
                <span className="text-xs tnum text-zinc-500 w-10 text-right">{l.hours} s</span>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <section className="card mt-6">
        <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
          <h2 className="font-semibold text-sm">Oxirgi almashtirishlar</h2>
          <Link to="/history" className="text-xs font-medium text-zinc-500 hover:text-zinc-900 flex items-center gap-0.5">Hammasi <ChevronRight className="size-3.5" /></Link>
        </div>
        <div className="divide-y divide-zinc-100">
          {d.recent.map((r) => (
            <div key={r._id} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm">
              <span className="w-24 text-zinc-500">{fmtDay(r.date)}</span>
              <span className="font-semibold w-20">{r.group?.name}</span>
              <span className="text-zinc-400 line-through">{r.fromMentor?.name || '—'}</span>
              <ArrowLeftRight className="size-3.5 text-zinc-300" />
              <span className="flex items-center gap-2"><Avatar name={r.toMentor?.name} size={22} />{r.toMentor?.name}</span>
              <span className="ml-auto flex gap-1.5">
                <Badge tone={r.type === 'permanent' ? 'dark' : 'outline'}>{r.type === 'permanent' ? 'doimiy' : 'bir dars'}</Badge>
                <Badge>{REASONS[r.reason]}</Badge>
              </span>
            </div>
          ))}
        </div>
      </section>

      {replace && <ReplaceFlow open group={replace.group} initialDate={replace.date} onClose={() => setReplace(null)} />}
    </>
  );
}
