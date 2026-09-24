import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { Check, ChevronRight, Sparkles, CircleCheck, CircleMinus, Ban, Phone } from 'lucide-react';
import { api, addDays, todayStr, weekdayOf, fmtDay, fmtDate, REASONS, MENTOR_LEVELS } from '../lib/api';
import { Modal, Button, Avatar, Chips, Field, ErrorNote, Spinner, Badge } from './ui';

/** Guruhning keyingi `n` ta dars sanasi */
function nextLessonDates(group, n = 8) {
  const days = group.schedule.map((s) => s.day);
  const out = [];
  for (let d = todayStr(); out.length < n; d = addDays(d, 1)) if (days.includes(weekdayOf(d))) out.push(d);
  return out;
}

function ScoreBar({ score, muted }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 rounded-full bg-zinc-100 overflow-hidden">
        <div className={clsx('h-full rounded-full', muted ? 'bg-zinc-300' : 'bg-accent')} style={{ width: `${score}%` }} />
      </div>
      <span className={clsx('text-sm font-semibold tnum', muted ? 'text-zinc-400' : 'text-zinc-900')}>{score}</span>
    </div>
  );
}

function CandidateCard({ c, best, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={clsx(
        'w-full text-left rounded-2xl border p-4 transition cursor-pointer',
        selected ? 'border-zinc-900 ring-4 ring-zinc-900/5 bg-white' : 'border-zinc-200 bg-white hover:border-zinc-300'
      )}
    >
      <div className="flex items-center gap-3">
        <Avatar name={c.mentor.name} size={40} dark={selected} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm">{c.mentor.name}</span>
            <Badge>{MENTOR_LEVELS[c.mentor.level]}</Badge>
            {best && <Badge tone="accent"><Sparkles className="size-3" />Eng mos</Badge>}
          </div>
          {c.mentor.phone && <div className="mt-0.5 text-xs text-zinc-400 flex items-center gap-1"><Phone className="size-3" />{c.mentor.phone}</div>}
        </div>
        <ScoreBar score={c.score} />
        <div className={clsx('size-5 rounded-full border-2 grid place-items-center shrink-0', selected ? 'bg-zinc-900 border-zinc-900' : 'border-zinc-300')}>
          {selected && <Check className="size-3 text-white" strokeWidth={3} />}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 pl-[52px]">
        {c.reasons.map((r, i) => (
          <span key={i} className={clsx('text-xs flex items-center gap-1', r.good ? 'text-zinc-700' : 'text-zinc-400')}>
            {r.good ? <CircleCheck className="size-3.5 text-accent" /> : <CircleMinus className="size-3.5" />}
            {r.text}
          </span>
        ))}
      </div>
    </button>
  );
}

export default function ReplaceFlow({ group, open, onClose, initialDate, initialType = 'temporary' }) {
  const qc = useQueryClient();
  const dates = useMemo(() => nextLessonDates(group), [group]);
  const [type, setType] = useState(initialType);
  const [date, setDate] = useState(initialDate || dates[0]);
  const [permDate, setPermDate] = useState(todayStr());
  const [reason, setReason] = useState('kasal');
  const [note, setNote] = useState(group.progressNote || '');
  const [pick, setPick] = useState(null);
  const [showBlocked, setShowBlocked] = useState(false);
  const [done, setDone] = useState(null);

  const effDate = type === 'temporary' ? date : permDate;
  const cands = useQuery({
    queryKey: ['candidates', group._id, type, effDate],
    queryFn: () => api(`/groups/${group._id}/candidates?type=${type}&date=${effDate}`),
    enabled: open && !!effDate,
  });
  const eligible = (cands.data || []).filter((c) => c.eligible);
  const blocked = (cands.data || []).filter((c) => !c.eligible);
  const chosen = eligible.find((c) => c.mentor._id === pick);

  const save = useMutation({
    mutationFn: () => api('/replacements', { method: 'POST', body: { groupId: group._id, toMentorId: pick, type, date: effDate, reason, note } }),
    onSuccess: () => {
      setDone(chosen);
      qc.invalidateQueries();
    },
  });

  const reset = (fn) => (v) => { fn(v); setPick(null); };

  if (done)
    return (
      <Modal open={open} onClose={onClose} title="Tayyor" width={460}>
        <div className="text-center py-4">
          <div className="mx-auto size-14 rounded-full bg-accent-soft grid place-items-center"><Check className="size-7 text-accent" strokeWidth={2.5} /></div>
          <div className="mt-4 text-lg font-semibold">{done.mentor.name}</div>
          <p className="text-sm text-zinc-500 mt-1">
            {type === 'temporary' ? `${group.name} guruhining ${fmtDay(effDate)} darsini o'tadi` : `${fmtDate(effDate)} dan boshlab ${group.name} guruhining doimiy mentori`}
          </p>
          {note && <div className="mt-4 text-left text-xs rounded-xl bg-zinc-50 p-3 text-zinc-600"><span className="font-medium text-zinc-800">Mentorga topshiriladigan izoh:</span> {note}</div>}
          <Button className="mt-6 w-full" onClick={onClose}>Yopish</Button>
        </div>
      </Modal>
    );

  return (
    <Modal open={open} onClose={onClose} title="Mentorni almashtirish" subtitle={`${group.name} · hozirgi mentor: ${group.mentor?.name || '—'}`} width={720}>
      <div className="space-y-5">
        <div className="grid sm:grid-cols-2 gap-2 p-1 rounded-2xl bg-zinc-100">
          {[['temporary', 'Bir dars uchun', 'Kasal, ta\'til, bir martalik'], ['permanent', 'Doimiy', 'Guruh butunlay yangi mentorga']].map(([k, t, s]) => (
            <button key={k} type="button" onClick={() => reset(setType)(k)}
              className={clsx('rounded-xl px-4 py-2.5 text-left transition cursor-pointer', type === k ? 'bg-white shadow-sm' : 'text-zinc-500 hover:text-zinc-800')}>
              <div className="text-sm font-semibold">{t}</div>
              <div className="text-xs text-zinc-400">{s}</div>
            </button>
          ))}
        </div>

        {type === 'temporary' ? (
          <Field label="Qaysi dars?">
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {dates.map((d) => {
                const slot = group.schedule.find((s) => s.day === weekdayOf(d));
                return (
                  <button key={d} type="button" onClick={() => reset(setDate)(d)}
                    className={clsx('shrink-0 rounded-xl border px-3 py-2 text-left transition cursor-pointer',
                      d === date ? 'bg-zinc-900 border-zinc-900 text-white' : 'bg-white border-zinc-200 hover:border-zinc-300')}>
                    <div className="text-xs font-semibold">{fmtDay(d)}</div>
                    <div className={clsx('text-[11px] tnum', d === date ? 'text-zinc-400' : 'text-zinc-400')}>{slot?.start}–{slot?.end}</div>
                  </button>
                );
              })}
            </div>
          </Field>
        ) : (
          <Field label="Qaysi sanadan kuchga kiradi?" className="max-w-xs">
            <input type="date" className="input" min={todayStr()} value={permDate} onChange={(e) => reset(setPermDate)(e.target.value)} />
          </Field>
        )}

        <Field label="Sabab"><Chips options={REASONS} value={reason} onChange={setReason} /></Field>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="label !mb-0">Tavsiya etilgan mentorlar</span>
            {cands.data && <span className="text-xs text-zinc-400">{eligible.length} ta mos · {blocked.length} ta mos emas</span>}
          </div>
          {cands.isLoading ? <Spinner /> : cands.error ? <ErrorNote error={cands.error} /> : (
            <div className="space-y-2">
              {eligible.length === 0 && (
                <div className="rounded-2xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500">
                  Bu vaqtga mos bo'sh mentor yo'q. Pastdagi sabablarni ko'ring yoki boshqa sanani tanlang.
                </div>
              )}
              {eligible.map((c, i) => (
                <CandidateCard key={c.mentor._id} c={c} best={i === 0} selected={pick === c.mentor._id} onSelect={() => setPick(c.mentor._id)} />
              ))}
              {blocked.length > 0 && (
                <div className="pt-1">
                  <button type="button" onClick={() => setShowBlocked((v) => !v)} className="flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-900 cursor-pointer">
                    <ChevronRight className={clsx('size-3.5 transition', showBlocked && 'rotate-90')} />
                    Nega boshqalar mos emas ({blocked.length})
                  </button>
                  {showBlocked && (
                    <div className="mt-2 divide-y divide-zinc-100 rounded-2xl border border-zinc-200 bg-zinc-50/50">
                      {blocked.map((c) => (
                        <div key={c.mentor._id} className="flex items-center gap-3 px-4 py-2.5">
                          <Avatar name={c.mentor.name} size={28} />
                          <span className="text-sm text-zinc-500 w-40 shrink-0 truncate">{c.mentor.name}</span>
                          <span className="text-xs text-zinc-400 flex items-start gap-1.5"><Ban className="size-3.5 shrink-0 mt-px" />{c.blockers.join(' · ')}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <Field label="Yangi mentorga izoh (guruh qayerga kelgani, nimaga e'tibor berish kerak)">
          <textarea rows={2} className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Masalan: Flexbox mavzusi, 3 o'quvchi uyga vazifani qilmagan" />
        </Field>

        <ErrorNote error={save.error} />
        <div className="flex items-center justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={onClose}>Bekor qilish</Button>
          <Button variant="accent" disabled={!chosen || save.isPending} onClick={() => save.mutate()}>
            {chosen ? `${chosen.mentor.name.split(' ')[0]}ni qo'yish` : 'Mentorni tanlang'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
