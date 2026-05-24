import { NextResponse } from 'next/server';
import { requireWorkspaceRole } from '@/lib/auth/permissions';
import { createAdminClient } from '@/lib/supabase/admin';
import { logError } from '@/lib/logging/system-log';
import { logActivity } from '@/lib/logging/activity-log';

export async function POST(request: Request) {
  const formData = await request.formData();
  const workspaceId = formData.get('workspaceId') as string;
  const file = formData.get('avatar') as File;

  if (!workspaceId || !file) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const { user } = await requireWorkspaceRole(workspaceId, ['admin']);

  if (file.size > 2 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large. Max 2MB.' }, { status: 400 });
  }
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    return NextResponse.json({ error: 'Only JPG, PNG, or WebP allowed' }, { status: 400 });
  }

  const admin = createAdminClient();
  const ext = file.type.split('/')[1] ?? 'png';
  const path = `workspaces/${workspaceId}/avatar.${ext}`;

  // Use admin client to bypass storage RLS (folder policy is user-scoped)
  const { error: uploadError } = await admin.storage
    .from('avatars')
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) {
    logError('workspace.avatar', uploadError.message, { workspaceId }, user.id);
    return NextResponse.json({ error: 'Failed to upload' }, { status: 500 });
  }

  const { data: urlData } = admin.storage.from('avatars').getPublicUrl(path);
  const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

  const { error: updateError } = await admin
    .from('workspaces')
    .update({ icon_custom_url: avatarUrl })
    .eq('id', workspaceId);

  if (updateError) {
    logError('workspace.avatar', updateError.message, { workspaceId }, user.id);
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }

  await logActivity({
    workspaceId,
    actorId: user.id,
    type: 'workspace_settings_changed',
    resourceType: 'workspace',
    resourceId: workspaceId,
    metadata: { action: 'avatar_uploaded' },
  });

  return NextResponse.json({ success: true, avatarUrl });
}
