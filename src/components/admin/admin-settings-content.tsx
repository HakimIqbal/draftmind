'use client';

import { useState } from 'react';
import { Settings, Shield, Mail, HardDrive } from 'lucide-react';

interface SettingsItem {
  label: string;
  value: string;
  accent?: boolean;
}

interface SettingsData {
  ai: SettingsItem[];
  security: SettingsItem[];
  email: SettingsItem[];
  storage: SettingsItem[];
}

const TABS = [
  { key: 'ai', label: 'AI Configuration', icon: Settings },
  { key: 'security', label: 'Security', icon: Shield },
  { key: 'email', label: 'Email', icon: Mail },
  { key: 'storage', label: 'Storage', icon: HardDrive },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export function AdminSettingsContent({ data }: { data: SettingsData }) {
  const [activeTab, setActiveTab] = useState<TabKey>('ai');

  const currentItems = data[activeTab] ?? [];

  return (
    <div className="flex gap-6">
      {/* Sidebar tabs */}
      <div className="w-full shrink-0 sm:w-[200px]">
        <nav className="space-y-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-white text-[#1a1a1a] shadow-sm'
                  : 'text-[#666] hover:bg-white/60 hover:text-[#1a1a1a]'
              }`}
            >
              <tab.icon
                size={15}
                className={activeTab === tab.key ? 'text-accent' : 'text-[#999]'}
              />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content area */}
      <div className="flex-1">
        <div className="rounded-xl border border-[#eee] bg-white">
          <div className="border-b border-[#f0f0f0] px-6 py-4">
            <h2 className="text-[14px] font-semibold text-[#1a1a1a]">
              {TABS.find((t) => t.key === activeTab)?.label}
            </h2>
          </div>
          <div className="divide-y divide-[#f5f5f5]">
            {currentItems.map((item) => (
              <div
                key={item.label}
                className="flex items-start justify-between gap-3 px-4 py-3.5 sm:items-center sm:px-6"
              >
                <span className="text-[13px] text-[#666]">{item.label}</span>
                <span
                  className={`text-right text-[13px] font-medium ${item.accent ? 'text-accent' : 'text-[#1a1a1a]'}`}
                >
                  {item.value}
                </span>
              </div>
            ))}
            {currentItems.length === 0 && (
              <div className="px-6 py-8 text-center text-[13px] text-[#aaa]">
                No settings configured
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
