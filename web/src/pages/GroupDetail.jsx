import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowLeftRight, Pencil, History, Trash2 } from 'lucide-react';
import { api, DAYS, DIRECTIONS, LEVELS, LANGS, REASONS, MENTOR_LEVELS, fmtDay, fmtDate, todayStr } from '../lib/api';
import { Button, Spinner, Badge, Avatar, Empty, QueryGate } from '../components/ui';
import ReplaceFlow from '../components/ReplaceFlow';
import { GroupForm } from '../components/Forms';

export default function GroupDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const group = useQuery({ queryKey: ['group', id], queryFn: () => api(`/groups/${id}`) });
  const reps = useQuery({ queryKey: ['replacements', { group: id }], queryFn: () => api(`/replacements?group=${id}`) });
  const [replace, setReplace] = useState(false);
  const [edit, setEdit] = useState(false);
  const cancel = useMutation({ mutationFn: (rid) => api(`/replacements/${rid}/cancel`, { method: 'POST' }), onSuccess: () => qc.invalidateQueries() });
  const archive = useMutation({ mutationFn: () => api(`/groups/${id}`, { method: 'DELETE' }), onSuccess: () => { qc.invalidateQueries(); nav('/groups'); } });

  if (group.isLoading || group.isError || !group.data) return <QueryGate query={group}>{() => null}</QueryGate>;
  const g = group.data;
  const today = todayStr();

  return (
    <>
      <Link to="/groups" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 mb-4"><ArrowLeft className="size-4" />Guruhlar</Link>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{g.name}</h1>
          <div className="flex flex-wrap gap-1.5 mt-2">
            <Badge tone="dark">{DIRECTIONS[g.direction]}</Badge>
            <Badge tone="outline">{LEVELS[g.level]}</Badge>
            <Badge tone="outline">{LANGS[g.language]}</Badge>
            {g.room && <Badge tone="outline">{g.room}-xona</Badge>}
            <Badge tone="outline">{g.students} o'quvchi</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEdit(true)}><Pencil className="size-4" />Tahrirlash</Button>
          <Button variant="accent" onClick={() => setReplace(true)}><ArrowLeftRight className="size-4" />Mentorni almashtirish</Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <section className="card p-5">
            <div className="label">Mentor</div>
            {g.mentor ? (
              <Link to={`/mentors/${g.mentor._id}`} className="flex items-center gap-3 mt-2 group">
                <Avatar name={g.mentor.name} size={44} dark />
                <div>
                  <div className="font-semibold group-hover:underline">{g.mentor.name}</div>
                  <div className="text-xs text-zinc-400">{MENTOR_LEVELS[g.mentor.level]} · {g.mentor.phone}</div>
                </div>
              </Link>
            ) : <div className="mt-2 text-sm text-accent-ink">Mentor biriktirilmagan</div>}
          </section>

          <section className="card p-5">
            <div className="label">Dars jadvali</div>
            <div className="mt-2 space-y-1.5">
              {g.schedule.map((s, i) => (
                <div key={i} className="flex justify-between text-sm"><span>{DAYS[s.day]}</span><span className="tnum text-zinc-500">{s.start}–{s.end}</span></div>
              ))}
            </div>
            {g.startDate && <div className="mt-3 pt-3 border-t border-zinc-100 text-xs text-zinc-400">Ochilgan: {fmtDate(g.startDate)}</div>}
          </section>

          <section className="card p-5">
            <div className="label">Guruh qayerga keldi</div>
            <p className="mt-1 text-sm text-zinc-700">{g.progressNote || '—'}</p>
            <p className="mt-2 text-xs text-zinc-400">Mentor almashtirilganda bu izoh yangi mentorga topshiriladi.</p>
          </section>

          <Button variant="danger" size="sm" onClick={() => archive.mutate()}><Trash2 className="size-3.5" />Guruhni arxivlash</Button>
        </div>

        <section className="card lg:col-span-2 self-start">
          <div className="px-5 py-4 border-b border-zinc-100 flex items-center gap-2">
            <History className="size-4 text-zinc-400" />
            <h2 className="font-semibold text-sm">Mentor almashtirish tarixi</h2>
            <span className="text-xs text-zinc-400">({reps.data?.length ?? 0})</span>
          </div>
          {!reps.data?.length ? <Empty title="Bu guruhda almashtirish bo'lmagan" /> : (
            <div className="divide-y divide-zinc-100">
              {reps.data.map((r) => (
                <div key={r._id} className={`px-5 py-3.5 ${r.cancelled ? 'opacity-40' : ''}`}>
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-medium w-24">{fmtDay(r.date)}</span>
                    <span className="text-zinc-400">{r.fromMentor?.name || '—'}</span>
                    <ArrowLeftRight className="size-3.5 text-zinc-300" />
                    <span className="font-semibold">{r.toMentor?.name}</span>
                    <span className="ml-auto flex gap-1.5 items-center">
                      <Badge tone={r.type === 'permanent' ? 'dark' : 'outline'}>{r.type === 'permanent' ? 'doimiy' : 'bir dars'}</Badge>
                      <Badge>{REASONS[r.reason]}</Badge>
                      {r.cancelled && <Badge>bekor qilingan</Badge>}
                      {!r.cancelled && r.type === 'temporary' && r.date >= today && (
                        <button onClick={() => cancel.mutate(r._id)} className="text-xs text-zinc-400 hover:text-red-600 cursor-pointer">bekor qilish</button>
                      )}
                    </span>
                  </div>
                  {r.note && <div className="mt-1.5 text-xs text-zinc-500 pl-[104px]">{r.note}</div>}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {replace && <ReplaceFlow open group={g} onClose={() => setReplace(false)} />}
      {edit && <GroupForm open initial={g} onClose={() => setEdit(false)} />}
    </>
  );
}
