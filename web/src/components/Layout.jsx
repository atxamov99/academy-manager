import { NavLink } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { LayoutDashboard, BookOpen, Users, History, LogOut } from 'lucide-react';
import { api } from '../lib/api';
import { Avatar } from './ui';

const NAV = [
  { to: '/', label: 'Bosh sahifa', icon: LayoutDashboard, end: true },
  { to: '/groups', label: 'Guruhlar', icon: BookOpen },
  { to: '/mentors', label: 'Mentorlar', icon: Users },
  { to: '/history', label: 'Tarix va hisobot', icon: History },
];

export function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="size-8 rounded-[10px] bg-zinc-900 grid place-items-center">
        <div className="size-3.5 rounded-full bg-accent" />
      </div>
      <div className="leading-tight">
        <div className="text-sm font-semibold tracking-tight">MARS</div>
        <div className="text-[11px] text-zinc-400">Academy Manager</div>
      </div>
    </div>
  );
}

export default function Layout({ manager, children }) {
  const qc = useQueryClient();
  const logout = async () => {
    await api('/auth/logout', { method: 'POST' });
    qc.clear();
    qc.setQueryData(['me'], null);
  };

  return (
    <div className="min-h-full flex">
      <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-zinc-200/80 bg-white px-4 py-5 sticky top-0 h-screen">
        <div className="px-2"><Logo /></div>
        <nav className="mt-8 space-y-0.5">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                clsx('flex items-center gap-3 h-10 px-3 rounded-xl text-sm font-medium transition',
                  isActive ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100')
              }
            >
              <Icon className="size-[18px]" strokeWidth={1.8} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto flex items-center gap-3 px-2 pt-4 border-t border-zinc-100">
          <Avatar name={manager.name} size={32} dark />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium truncate">{manager.name}</div>
            <div className="text-[11px] text-zinc-400 truncate">{manager.email}</div>
          </div>
          <button onClick={logout} title="Chiqish" className="p-2 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 cursor-pointer">
            <LogOut className="size-4" />
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <header className="md:hidden sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-zinc-200/80 px-4 h-14 flex items-center justify-between">
          <Logo />
          <button onClick={logout} className="p-2 text-zinc-500"><LogOut className="size-4" /></button>
        </header>
        <nav className="md:hidden flex gap-1 overflow-x-auto px-4 py-2 border-b border-zinc-200/80 bg-white">
          {NAV.map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) => clsx('shrink-0 h-8 px-3 rounded-lg text-xs font-medium grid place-items-center', isActive ? 'bg-zinc-900 text-white' : 'text-zinc-500')}>
              {label}
            </NavLink>
          ))}
        </nav>
        <main className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-8 fade-up">{children}</main>
      </div>
    </div>
  );
}
