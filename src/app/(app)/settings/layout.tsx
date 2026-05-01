import { SettingsTabs } from '@/components/settings/settings-tabs';
import { SettingsBackButton } from '@/components/settings/settings-back-button';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-8 py-8">
      <SettingsBackButton />
      <h1 className="text-[22px] font-bold text-[#1a1a1a]">Settings</h1>
      <p className="mb-6 mt-0.5 text-[13px] text-[#888]">Manage your account and preferences</p>
      <SettingsTabs />
      <div className="mt-8">{children}</div>
    </div>
  );
}
