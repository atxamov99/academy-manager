import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import { X, ServerCrash, RotateCw } from 'lucide-react';
import { initials } from '../lib/api';

export function Button({ variant = 'primary', size = 'md', className, ...p }) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition active:scale-[.98] disabled:opacity-40 disabled:pointer-events-none cursor-pointer',
        size === 'sm' ? 'h-8 px-3 text-xs' : 'h-10 px-4 text-sm',
        variant === 'primary' && 'bg-zinc-900 text-white hover:bg-zinc-800',
        variant === 'accent' && 'bg-accent text-white hover:brightness-95 shadow-sm shadow-accent/30',
        variant === 'ghost' && 'text-zinc-600 hover:bg-zinc-100',
        variant === 'outline' && 'border border-zinc-200 bg-white text-zinc-800 hover:border-zinc-300 hover:bg-zinc-50',
        variant === 'danger' && 'text-red-600 hover:bg-red-50',
        className
      )}
      {...p}
    />
  );
}

export function Badge({ tone = 'zinc', className, children }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 h-6 px-2 rounded-lg text-xs font-medium whitespace-nowrap',
        tone === 'zinc' && 'bg-zinc-100 text-zinc-600',
        tone === 'dark' && 'bg-zinc-900 text-white',
        tone === 'accent' && 'bg-accent-soft text-accent-ink',
        tone === 'outline' && 'border border-zinc-200 text-zinc-600',
        className
      )}
    >
      {children}
    </span>
  );
}

export function Avatar({ name, size = 36, dark }) {
  return (
    <div
      className={clsx('shrink-0 grid place-items-center rounded-full font-semibold', dark ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-700')}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials(name)}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-zinc-500 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}

export function Stat({ label, value, hint, accent }) {
  return (
    <div className="card p-5">
      <div className="text-xs font-medium text-zinc-500">{label}</div>
      <div className={clsx('mt-2 text-3xl font-semibold tracking-tight tnum', accent && 'text-accent')}>{value}</div>
      {hint && <div className="mt-1 text-xs text-zinc-400">{hint}</div>}
    </div>
  );
}

export function Empty({ icon: Icon, title, text }) {
  return (
    <div className="py-10 text-center">
      {Icon && <Icon className="mx-auto size-8 text-zinc-300" strokeWidth={1.5} />}
      <div className="mt-3 text-sm font-medium text-zinc-700">{title}</div>
      {text && <div className="mt-1 text-xs text-zinc-400">{text}</div>}
    </div>
  );
}

export function Modal({ open, onClose, title, subtitle, children, width = 560 }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  // Portal: <main>dagi animatsiya (transform) fixed modalni o'z ichiga qamab qo'ymasligi uchun
  return createPortal(
    <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-zinc-900/30 backdrop-blur-[2px]" onMouseDown={onClose}>
      <div className="card fade-up w-full max-h-[90vh] overflow-auto shadow-2xl shadow-zinc-900/10" style={{ maxWidth: width }} onMouseDown={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 bg-white flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-zinc-100">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
            {subtitle && <p className="text-sm text-zinc-500 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="p-1.5 -m-1 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 cursor-pointer" aria-label="Yopish">
            <X className="size-5" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>,
    document.body
  );
}

export function Field({ label, children, className }) {
  return (
    <label className={clsx('block', className)}>
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

export function Chips({ options, value, onChange, multi }) {
  const selected = multi ? value : [value];
  return (
    <div className="flex flex-wrap gap-1.5">
      {Object.entries(options).map(([k, v]) => {
        const on = selected.includes(k);
        return (
          <button
            type="button"
            key={k}
            onClick={() => onChange(multi ? (on ? value.filter((x) => x !== k) : [...value, k]) : k)}
            className={clsx(
              'h-8 px-3 rounded-lg text-xs font-medium border transition cursor-pointer',
              on ? 'bg-zinc-900 border-zinc-900 text-white' : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300'
            )}
          >
            {v}
          </button>
        );
      })}
    </div>
  );
}

export function ErrorNote({ error }) {
  if (!error) return null;
  return <div className="rounded-xl bg-red-50 text-red-700 text-sm px-3 py-2">{error.message || String(error)}</div>;
}

export function Spinner() {
  return <div className="py-16 grid place-items-center"><div className="size-6 rounded-full border-2 border-zinc-200 border-t-zinc-900 animate-spin" /></div>;
}

/** So'rov holati: yuklanmoqda / xato (server o'chiq bo'lsa ham sahifa yiqilmaydi) */
export function QueryGate({ query, children }) {
  if (query.isLoading) return <Spinner />;
  if (query.isError || !query.data)
    return (
      <div className="card py-14 text-center">
        <ServerCrash className="mx-auto size-9 text-zinc-300" strokeWidth={1.5} />
        <div className="mt-3 text-sm font-semibold">Ma'lumotni yuklab bo'lmadi</div>
        <div className="mt-1 text-xs text-zinc-500 max-w-sm mx-auto">{query.error?.message || 'Server javob bermadi'}</div>
        <Button variant="outline" size="sm" className="mt-5" onClick={() => query.refetch()}><RotateCw className="size-3.5" />Qayta urinish</Button>
      </div>
    );
  return children(query.data);
}
