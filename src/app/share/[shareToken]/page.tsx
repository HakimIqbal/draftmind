import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { PublicShareView } from '@/components/share/public-share-view';
import type { PRDDocument } from '@/lib/prd/schema';

interface SharePageProps {
  params: Promise<{ shareToken: string }>;
}

export async function generateMetadata({ params }: SharePageProps) {
  const { shareToken } = await params;
  const supabase = createAdminClient();

  const { data: share } = await supabase
    .from('prd_shares')
    .select('prd_id')
    .eq('share_token', shareToken)
    .eq('is_active', true)
    .single();

  if (!share) {
    return { title: 'DraftMind' };
  }

  const { data: prd } = await supabase
    .from('prds')
    .select('content')
    .eq('id', share.prd_id)
    .single();

  const _doc = prd?.content as PRDDocument | undefined;

  return {
    title: 'DraftMind',
  };
}

export default async function PublicSharePage({ params }: SharePageProps) {
  const { shareToken } = await params;
  const supabase = createAdminClient();

  // Validate share token
  const { data: share, error: shareError } = await supabase
    .from('prd_shares')
    .select('id, prd_id, is_active, expires_at')
    .eq('share_token', shareToken)
    .single();

  if (shareError || !share || !share.is_active) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="max-w-md px-6 text-center">
          <h1 className="mb-2 text-2xl font-semibold text-gray-900">Link not found</h1>
          <p className="text-gray-500">
            This share link is invalid, has expired, or has been revoked.
          </p>
        </div>
      </div>
    );
  }

  // Check expiry
  if (share.expires_at && new Date(share.expires_at) < new Date()) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="max-w-md px-6 text-center">
          <h1 className="mb-2 text-2xl font-semibold text-gray-900">Link expired</h1>
          <p className="text-gray-500">
            This share link has expired. Please ask the owner for a new link.
          </p>
        </div>
      </div>
    );
  }

  // Fetch the PRD
  const { data: prd, error: prdError } = await supabase
    .from('prds')
    .select('content')
    .eq('id', share.prd_id)
    .single();

  if (prdError || !prd) {
    notFound();
  }

  // Increment view count (fire-and-forget)
  void supabase.rpc('increment_share_view_count', { share_id: share.id });

  const doc = prd.content as PRDDocument;

  return <PublicShareView prd={doc} />;
}
