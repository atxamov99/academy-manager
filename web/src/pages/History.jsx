import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeftRight, History as HistoryIcon } from 'lucide-react';
import { api, REASONS, fmtDay } from '../lib/api';
import { PageHeader, Spinner, Badge, Empty, Stat, Chips, Avatar, QueryGate } from '../components/ui';

function TopList({ title, hint, rows }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <section className="card p-5">
      <h3 className="font-semibold text-sm">{title}</h3>
      <p className="text-xs text-zinc-400 mb-3">{hint}</p>
      {rows.length === 0 ? <div className="text-sm text-zinc-400">—</div> : rows.map((r) => (
        <div key={r.id} className="flex items-center gap-3 py-1.5">
          <span className="text-sm w-32 truncate">{r.name}</span>
          <div className="flex-1 h-1.5 rounded-full bg-zinc-100 overflow-hidden"><div className="h-full bg-zinc-900 rounded-full" style={{ width: `${(r.count / max) * 100}%` }} /></div>
          <span className="text-xs tnum text-zinc-500 w-5 text-right">{r.count}</span>
        </div>
      ))}
    </section>
  );
}

export default function History() {
  const report = useQuery({ queryKey: ['reports'], queryFn: () => api('/reports') });
  const [type, setType] = useState('all');
  const reps = useQuery({ queryKey: ['replacements', { type }], queryFn: () => api(`/replacements${type === 'all' ? '' : `?type=${type}`}`) });

  if (report.isLoading || report.isError || !report.data) return <QueryGate query={report}>{() => null}</QueryGate>;
  const r = report.data;
  const reasons = Object.entries(r.byReason).sort((a, b) => b[1] - a[1]);

  return (
    <>
      <PageHeader title="Tarix va hisobot" subtitle="Mentor almashtirishlar qayerda va nega ko'p bo'layapti" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Jami almashtirish" value={r.total} />
        <Stat label="Bir darslik" value={r.temporary} />
        <Stat label="Doimiy" value={r.permanent} />
        <Stat label="Eng ko'p sabab" value={reasons[0] ? REASONS[reasons[0][0]] : '—'} hint={reasons[0] ? `${reasons[0][1]} marta` : ''} />
      </div>

      <div className="grid md:grid-cols-3 gap-3 mt-3">
        <TopList title="Beqaror guruhlar" hint="Mentori eng ko'p almashgan" rows={r.unstableGroups} />
        <TopList title="Ko'p kelmagan mentorlar" hint="O'rniga boshqasi qo'yilgan" rows={r.mostAbsentMentors} />
        <TopList title="Eng ko'p yordam berganlar" hint="Zamena bo'lib kirgan" rows={r.topSubstitutes} />
      </div>

      <section className="card mt-6">
        <div className="px-5 py-4 border-b border-zinc-100 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold text-sm">Barcha almashtirishlar</h2>
          <Chips options={{ all: 'Hammasi', temporary: 'Bir dars', permanent: 'Doimiy' }} value={type} onChange={setType} />
        </div>
        {reps.isLoading || reps.isError ? <QueryGate query={reps}>{() => null}</QueryGate> : !reps.data?.length ? <Empty icon={HistoryIcon} title="Hali almashtirish yo'q" /> : (
          <div className="divide-y divide-zinc-100">
            {reps.data.map((x) => (
              <div key={x._id} className={`px-5 py-3 ${x.cancelled ? 'opacity-40' : ''}`}>
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="w-24 text-zinc-500">{fmtDay(x.date)}</span>
                  <Link to={`/groups/${x.group?._id}`} className="font-semibold w-20 hover:underline">{x.group?.name}</Link>
                  <span className="text-zinc-400">{x.fromMentor?.name || '—'}</span>
                  <ArrowLeftRight className="size-3.5 text-zinc-300" />
                  <span className="flex items-center gap-2"><Avatar name={x.toMentor?.name} size={22} />{x.toMentor?.name}</span>
                  <span className="ml-auto flex gap-1.5">
                    <Badge tone={x.type === 'permanent' ? 'dark' : 'outline'}>{x.type === 'permanent' ? 'doimiy' : 'bir dars'}</Badge>
                    <Badge>{REASONS[x.reason]}</Badge>
                    {x.cancelled && <Badge>bekor qilingan</Badge>}
                  </span>
                </div>
                {x.note && <div className="mt-1 text-xs text-zinc-500 pl-[108px]">{x.note}</div>}
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
