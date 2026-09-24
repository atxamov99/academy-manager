// Server (4000) va web (5173) ni bitta buyruq bilan ishga tushiradi: npm run dev
import { spawn } from 'node:child_process';
const run = (name, args) => {
  const p = spawn('npm', args, { stdio: 'inherit', shell: process.platform === 'win32' });
  p.on('exit', (code) => { console.log(`[${name}] to'xtadi (${code})`); process.exit(code ?? 0); });
  return p;
};
const procs = [run('server', ['--prefix', 'server', 'start']), run('web', ['--prefix', 'web', 'run', 'dev'])];
process.on('SIGINT', () => { procs.forEach((p) => p.kill('SIGINT')); process.exit(0); });
