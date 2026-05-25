import { spawn } from 'node:child_process';

import { logError } from '../src/lib/logging/system-log';

const child = spawn('supabase', ['migration', 'up'], {
  stdio: 'inherit',
  shell: false,
});

child.on('error', async (error) => {
  await logError('migration.failed', error.message, { command: 'supabase migration up' });
  process.exit(1);
});

child.on('exit', async (code, signal) => {
  if (code && code !== 0) {
    await logError('migration.failed', `Migration command failed with exit code ${code}`, {
      command: 'supabase migration up',
      exit_code: code,
      signal,
    });
  }
  process.exit(code ?? (signal ? 1 : 0));
});
