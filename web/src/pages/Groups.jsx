import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, BookOpen } from 'lucide-react';
import { api, DIRECTIONS, LEVELS, DAYS_SHORT } from '../lib/api';
import { PageHeader, Button, Spinner, Badge, Empty, Avatar, Chips, QueryGate } from '../components/ui';
import { GroupForm } from '../components/Forms';

export default function Groups() {
  const groups = useQuery({ queryKey: ['groups'], queryFn: () => api('/groups') });
  const [q, setQ] = useState('');
  const [dir, setDir] = useState('all');
  const [form, setForm] = useState(false);

  const list = (groups.data || [])
    .filter((g) => g.active !== false)
    .filter((g) => dir === 'all' || g.direction === dir)
    .filter((g) => `${g.name} ${g.mentor?.name || ''}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <PageHeader title="Guruhlar" subtitle={`${list.length} ta guruh`} actions={<Button onClick={() => setForm(true)}><Plus className="size-4" />Yangi guruh</Button>} />
      <div className="flex flex-wrap gap-3 items-center mb-4">
        <div className="relative w-full sm:w-64">
          <Search className="size-4 absolute left-3 top-3 text-zinc-400" />
          <input className="input !pl-9" placeholder="Guruh yoki mentor…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Chips options={{ all: 'Hammasi', ...DIRECTIONS }} value={dir} onChange={setDir} />
      </div>

      {groups.isLoading || groups.isError ? <QueryGate query={groups}>{() => null}</QueryGate> : (
        <div className="card overflow-hidden">
          {list.length === 0 ? <Empty icon={BookOpen} title="Guruh topilmadi" /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-zinc-400 border-b border-zinc-100">
                    <th className="font-medium px-5 py-3">Guruh</th>
                    <th className="font-medium px-3 py-3">Jadval</th>
                    <th className="font-medium px-3 py-3">Mentor</th>
                    <th className="font-medium px-3 py-3">O'quvchi</th>
                    <th className="font-medium px-5 py-3">Qayerga keldi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {list.map((g) => (
                    <tr key={g._id} className="hover:bg-zinc-50/80">
                      <td className="px-5 py-3">
                        <Link to={`/groups/${g._id}`} className="font-semibold hover:underline">{g.name}</Link>
                        <div className="flex gap-1 mt-1">
                          <Badge>{DIRECTIONS[g.direction]}</Badge>
                          <Badge tone="outline">{LEVELS[g.level]}</Badge>
                          <Badge tone="outline">{g.language.toUpperCase()}</Badge>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-zinc-600 tnum whitespace-nowrap">
                        {g.schedule.map((s) => DAYS_SHORT[s.day]).join(', ')}
                        <div className="text-xs text-zinc-400">{g.schedule[0]?.start}–{g.schedule[0]?.end}{g.room ? ` · ${g.room}` : ''}</div>
                      </td>
                      <td className="px-3 py-3">
                        {g.mentor ? (
                          <Link to={`/mentors/${g.mentor._id}`} className="flex items-center gap-2 hover:underline whitespace-nowrap"><Avatar name={g.mentor.name} size={26} />{g.mentor.name}</Link>
                        ) : <Badge tone="accent">Mentor yo'q</Badge>}
                      </td>
                      <td className="px-3 py-3 tnum text-zinc-600">{g.students}</td>
                      <td className="px-5 py-3 text-xs text-zinc-500 max-w-56">{g.progressNote}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      {form && <GroupForm open onClose={() => setForm(false)} />}
    </>
  );
}
