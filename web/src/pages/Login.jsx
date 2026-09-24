import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Button, ErrorNote } from '../components/ui';
import { Logo } from '../components/Layout';

export default function Login() {
  const qc = useQueryClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const me = await api('/auth/login', { method: 'POST', body: { email, password } });
      qc.setQueryData(['me'], me);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-full grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between bg-zinc-900 text-white p-12 relative overflow-hidden">
        <div className="absolute -right-32 -top-32 size-[28rem] rounded-full bg-accent/20 blur-3xl" />
        <div className="relative flex items-center gap-2.5">
          <div className="size-8 rounded-[10px] bg-white grid place-items-center"><div className="size-3.5 rounded-full bg-accent" /></div>
          <span className="font-semibold">MARS · Academy Manager</span>
        </div>
        <div className="relative">
          <h1 className="text-4xl font-semibold tracking-tight leading-tight max-w-md">
            Mentor kelmay qoldimi?<br />
            <span className="text-zinc-400">Bir daqiqada almashtiring.</span>
          </h1>
          <p className="mt-4 text-zinc-400 max-w-sm text-sm leading-relaxed">
            Tizim bo'sh, yo'nalishi mos va yuklamasi kam mentorlarni o'zi topib beradi. Qo'ng'iroq qilib chiqish shart emas.
          </p>
        </div>
        <div className="relative text-xs text-zinc-500">© MARS IT School</div>
      </div>

      <div className="grid place-items-center p-6">
        <form onSubmit={submit} className="w-full max-w-sm fade-up">
          <div className="lg:hidden mb-10"><Logo /></div>
          <h2 className="text-2xl font-semibold tracking-tight">Tizimga kirish</h2>
          <p className="text-sm text-zinc-500 mt-1">Faqat Academy Manager uchun</p>
          <div className="mt-8 space-y-4">
            <label className="block">
              <span className="label">Email</span>
              <input className="input" type="email" autoFocus required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="manager@mars.uz" />
            </label>
            <label className="block">
              <span className="label">Parol</span>
              <input className="input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </label>
            <ErrorNote error={error} />
            <Button className="w-full" disabled={busy}>{busy ? 'Kirilmoqda…' : 'Kirish'}</Button>
          </div>
          <p className="mt-6 text-xs text-zinc-400">Demo: manager@mars.uz / mars2026</p>
        </form>
      </div>
    </div>
  );
}
