import { NextResponse } from 'next/server';
import { timingSafeEqual, createHmac } from 'crypto';
import { logError, logWarn } from '@/lib/logging/system-log';

function verifySignature(body: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;
  const expected = createHmac('sha256', secret).update(body).digest('hex');
  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const secret = process.env.SUPABASE_WEBHOOK_SECRET;
  if (!secret) {
    logError('env.config_missing', 'SUPABASE_WEBHOOK_SECRET missing');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  const body = await request.text();
  const signature = request.headers.get('x-supabase-signature');

  if (!verifySignature(body, signature, secret)) {
    logWarn('csrf.signature_failure', 'Webhook signature verification failed', {
      has_signature: !!signature,
    });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payload = JSON.parse(body) as { type?: string };
    const eventType = payload.type;

    switch (eventType) {
      case 'INSERT':
        // New user signup — profile already created via trigger
        break;
      case 'UPDATE':
        break;
      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Supabase Webhook Error]', error);
    logError('webhook.handler_failed', error instanceof Error ? error.message : String(error));
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
