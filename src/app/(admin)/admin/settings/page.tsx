import { createAdminClient } from '@/lib/supabase/admin';
import { Globe, Settings, Shield, Database } from 'lucide-react';

export const metadata = { title: 'Admin — DraftMind' };

export default async function AdminSettingsPage() {
  const admin = createAdminClient();

  const { count: totalUsers } = await admin
    .from('profiles')
    .select('*', { count: 'exact', head: true });
  const { count: totalWorkspaces } = await admin
    .from('workspaces')
    .select('*', { count: 'exact', head: true });

  const sections = [
    {
      icon: Globe,
      title: 'General',
      items: [
        { label: 'App Name', value: 'DraftMind' },
        { label: 'Version', value: '1.0.0' },
        { label: 'Total Users', value: String(totalUsers ?? 0) },
        { label: 'Total Workspaces', value: String(totalWorkspaces ?? 0) },
      ],
    },
    {
      icon: Settings,
      title: 'AI Configuration',
      items: [
        { label: 'Default Provider', value: 'Not configured' },
        { label: 'Max Tokens', value: '4,096' },
        { label: 'Auto Quality Review', value: 'Enabled', accent: true },
      ],
    },
    {
      icon: Shield,
      title: 'Security',
      items: [
        { label: 'User Registration', value: 'Open', accent: true },
        { label: 'Email Verification', value: 'Enabled', accent: true },
        { label: 'Session Timeout', value: '7 days' },
      ],
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-[22px] font-bold text-[#1a1a1a]">Settings</h1>
        <p className="mt-0.5 text-[13px] text-[#888]">System configuration</p>
      </div>

      <div className="space-y-6">
        {sections.map((section) => (
          <div key={section.title} className="rounded-xl border border-[#eee] bg-white">
            <div className="flex items-center gap-2.5 border-b border-[#f0f0f0] px-6 py-4">
              <section.icon size={16} className="text-[#999]" />
              <h2 className="text-[14px] font-semibold text-[#1a1a1a]">{section.title}</h2>
            </div>
            <div className="divide-y divide-[#f5f5f5]">
              {section.items.map((item) => (
                <div key={item.label} className="flex items-center justify-between px-6 py-3.5">
                  <span className="text-[13px] text-[#666]">{item.label}</span>
                  <span
                    className={`text-[13px] font-medium ${'accent' in item && item.accent ? 'text-accent' : 'text-[#1a1a1a]'}`}
                  >
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Maintenance */}
        <div className="rounded-xl border border-[#eee] bg-white">
          <div className="flex items-center gap-2.5 border-b border-[#f0f0f0] px-6 py-4">
            <Database size={16} className="text-[#999]" />
            <h2 className="text-[14px] font-semibold text-[#1a1a1a]">Maintenance</h2>
          </div>
          <div className="flex gap-3 px-6 py-5">
            {['Clear activity logs', 'Purge archived PRDs', 'Export all data'].map((label) => (
              <button
                key={label}
                disabled
                className="rounded-lg border border-[#e5e5e3] bg-white px-3.5 py-2 text-[12px] font-medium text-[#888] opacity-50"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
