'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export function SettingsBackButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className="mb-4 flex items-center gap-1.5 text-[13px] text-[#999] transition-colors hover:text-[#555]"
    >
      <ArrowLeft size={14} />
      Back
    </button>
  );
}
