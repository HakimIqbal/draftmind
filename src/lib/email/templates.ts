const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export function invitationEmail(params: {
  workspaceName: string;
  inviterName: string;
  role: string;
  token: string;
}): { subject: string; html: string } {
  const acceptUrl = `${BASE_URL}/invite/${params.token}`;

  return {
    subject: `You've been invited to ${params.workspaceName} on DraftMind`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 16px;">
        <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 16px;">Workspace Invitation</h2>
        <p style="font-size: 14px; color: #374151; line-height: 1.6;">
          <strong>${params.inviterName}</strong> invited you to join
          <strong>${params.workspaceName}</strong> as <strong>${params.role}</strong>.
        </p>
        <a href="${acceptUrl}"
           style="display: inline-block; margin-top: 20px; padding: 10px 24px; background: #111; color: #fff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500;">
          Accept Invitation
        </a>
        <p style="margin-top: 24px; font-size: 12px; color: #9CA3AF;">
          This invitation expires in 7 days. If you didn't expect this, you can ignore this email.
        </p>
      </div>
    `,
  };
}
