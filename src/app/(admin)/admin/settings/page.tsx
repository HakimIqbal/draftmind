import { createAdminClient } from '@/lib/supabase/admin';
import { AdminSettingsContent } from '@/components/admin/admin-settings-content';
import { isLangSmithEnabled, getLangSmithProject } from '@/lib/ai/langsmith';

export const metadata = { title: 'Settings — Admin — DraftMind' };
export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  const admin = createAdminClient();

  const [aiRunsR, providersR, tokensR] = await Promise.all([
    admin.from('ai_runs').select('*', { count: 'exact', head: true }),
    admin.from('providers').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    admin.from('ai_runs').select('total_tokens'),
  ]);

  const defaultProviderR = await admin
    .from('providers')
    .select('display_name, default_model')
    .eq('status', 'active')
    .order('priority', { ascending: true })
    .limit(1)
    .single();

  const totalTokens = (tokensR.data ?? []).reduce((sum, r) => sum + (r.total_tokens ?? 0), 0);

  // Email: detect from actual env vars used by the project
  const hasResendKey = !!process.env.RESEND_API_KEY;
  const emailFrom = process.env.EMAIL_FROM ?? 'Not configured';

  // Storage: detect Supabase URL
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const isCloud = supabaseUrl.includes('.supabase.co');

  const data = {
    ai: [
      {
        label: 'Default Provider',
        value: defaultProviderR.data
          ? `${defaultProviderR.data.display_name} (${defaultProviderR.data.default_model})`
          : 'No active provider',
      },
      { label: 'Active Providers', value: String(providersR.count ?? 0) },
      { label: 'Total AI Runs', value: String(aiRunsR.count ?? 0) },
      { label: 'Total Tokens Used', value: totalTokens.toLocaleString() },
      {
        label: 'LangSmith Tracing',
        value: isLangSmithEnabled() ? 'Active' : 'Not configured',
        accent: isLangSmithEnabled(),
      },
      { label: 'LangSmith Project', value: isLangSmithEnabled() ? getLangSmithProject() : '-' },
    ],
    security: [
      { label: 'CSP Headers', value: 'Enabled (next.config.mjs)', accent: true },
      { label: 'Rate Limiting', value: 'Enabled (per-user, per-endpoint)', accent: true },
      { label: 'API Key Encryption', value: 'AES-256-GCM', accent: true },
      { label: 'Auth Provider', value: 'Supabase Auth (JWT + Refresh Token)' },
      { label: 'Row Level Security', value: 'Enabled on all tables', accent: true },
      { label: 'Password Policy', value: 'Min 6 characters, force change on admin reset' },
    ],
    email: [
      { label: 'Email Service', value: 'Resend' },
      {
        label: 'API Key',
        value: hasResendKey ? 'Configured' : 'Not configured',
        accent: hasResendKey,
      },
      { label: 'From Address', value: emailFrom },
      {
        label: 'Status',
        value: hasResendKey ? 'Active - emails will be sent' : 'Inactive - emails skipped silently',
        accent: hasResendKey,
      },
    ],
    storage: [
      { label: 'Database', value: 'Supabase PostgreSQL' },
      { label: 'Hosting', value: isCloud ? 'Supabase Cloud' : 'Self-hosted (local)' },
      {
        label: 'File Storage',
        value: 'Active - avatars bucket (2MB max, JPG/PNG/WebP)',
        accent: true,
      },
      { label: 'Supabase URL', value: supabaseUrl || 'Not set' },
    ],
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-[22px] font-bold text-[#1a1a1a]">Settings</h1>
        <p className="mt-0.5 text-[13px] text-[#888]">System configuration</p>
      </div>
      <AdminSettingsContent data={data} />
    </div>
  );
}
