import { logInfo } from '@/lib/logging/system-log';

export async function register() {
  logInfo('app.boot', 'Application instrumentation register invoked');
}
