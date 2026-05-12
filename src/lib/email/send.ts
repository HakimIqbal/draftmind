import { Resend } from 'resend';
import { logError, logWarn } from '@/lib/logging/system-log';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM_EMAIL = process.env.EMAIL_FROM ?? 'DraftMind <noreply@draftmind.app>';

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(
  params: SendEmailParams,
): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    logWarn('email', 'RESEND_API_KEY not configured — email skipped', { to: params.to });
    return { success: true };
  }

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: params.to,
    subject: params.subject,
    html: params.html,
  });

  if (error) {
    logError('email', `Failed to send email: ${error.message}`, {
      to: params.to,
      subject: params.subject,
    });
    return { success: false, error: 'Failed to send email' };
  }

  return { success: true };
}
