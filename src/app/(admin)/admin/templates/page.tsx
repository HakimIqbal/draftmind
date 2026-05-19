import { createAdminClient } from '@/lib/supabase/admin';
import { LayoutTemplate } from 'lucide-react';
import { AdminTemplatesPoller } from './admin-templates-poller';

export const metadata = { title: 'Admin — DraftMind' };
export const dynamic = 'force-dynamic';

export default async function AdminTemplatesPage() {
  const admin = createAdminClient();

  const { data: templates, error: templatesError } = await admin
    .from('prd_templates')
    .select('id, name, description, category, is_built_in, use_count, created_at')
    .order('use_count', { ascending: false });

  if (templatesError) console.error('[admin/templates] query error:', templatesError);

  const builtIn = (templates ?? []).filter((t) => t.is_built_in);
  const custom = (templates ?? []).filter((t) => !t.is_built_in);

  return (
    <div>
      <AdminTemplatesPoller />
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-[#1a1a1a]">Templates</h1>
          <p className="mt-0.5 text-[13px] text-[#888]">{(templates ?? []).length} templates</p>
        </div>
        <span className="font-mono text-xs text-ink-tertiary">Manage via user settings</span>
      </div>

      {/* Built-in */}
      <div className="mb-8">
        <p className="mb-3 text-[11px] font-medium uppercase tracking-wider text-[#999]">
          Built-in ({builtIn.length})
        </p>
        {builtIn.length === 0 ? (
          <div className="rounded-xl border border-[#eee] bg-white px-5 py-12 text-center text-[13px] text-[#aaa]">
            No templates available yet.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {builtIn.map((t) => (
              <div
                key={t.id}
                className="rounded-xl border border-[#eee] bg-white p-5 transition-all hover:border-[#ddd] hover:shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="bg-accent/10 flex h-9 w-9 items-center justify-center rounded-lg">
                    <LayoutTemplate size={16} className="text-accent" />
                  </div>
                  <span className="bg-accent/10 rounded-md px-1.5 py-0.5 text-[9px] font-semibold uppercase text-accent">
                    built-in
                  </span>
                </div>
                <h3 className="mt-3 text-[13px] font-semibold text-[#1a1a1a]">{t.name}</h3>
                <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-[#888]">
                  {t.description}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="rounded-md bg-[#f5f5f4] px-2 py-0.5 text-[10px] text-[#888]">
                    {t.category}
                  </span>
                  <span className="text-[10px] text-[#bbb]">{t.use_count} uses</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Custom */}
      <div>
        <p className="mb-3 text-[11px] font-medium uppercase tracking-wider text-[#999]">
          Custom ({custom.length})
        </p>
        {custom.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#ddd] bg-white px-5 py-12 text-center">
            <LayoutTemplate size={28} className="mx-auto text-[#ddd]" />
            <p className="mt-3 text-[13px] text-[#999]">No custom templates yet</p>
            <p className="mt-1 text-[11px] text-[#bbb]">
              Custom templates for your organization will appear here
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {custom.map((t) => (
              <div
                key={t.id}
                className="rounded-xl border border-[#eee] bg-white p-5 transition-all hover:border-[#ddd] hover:shadow-sm"
              >
                <h3 className="text-[13px] font-semibold text-[#1a1a1a]">{t.name}</h3>
                <p className="mt-1 line-clamp-2 text-[12px] text-[#888]">{t.description}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="rounded-md bg-[#f5f5f4] px-2 py-0.5 text-[10px] text-[#888]">
                    {t.category}
                  </span>
                  <span className="text-[10px] text-[#bbb]">{t.use_count} uses</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
