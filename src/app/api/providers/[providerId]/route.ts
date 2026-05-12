import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/permissions';
import { logError } from '@/lib/logging/system-log';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ providerId: string }> },
) {
  const user = await requireUser();
  const { providerId } = await params;
  const body = await request.json();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('providers')
    .update({
      display_name: body.display_name,
      base_url: body.base_url,
      default_model: body.default_model,
      is_default: body.is_default,
    })
    .eq('id', providerId)
    .select()
    .single();

  if (error) {
    logError('providers.update', error.message, { providerId }, user.id);
    return NextResponse.json({ error: 'Failed to update provider' }, { status: 400 });
  }
  return NextResponse.json({ provider: data });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ providerId: string }> },
) {
  const user = await requireUser();
  const { providerId } = await params;
  const supabase = await createClient();

  const { error } = await supabase.from('providers').delete().eq('id', providerId);
  if (error) {
    logError('providers.delete', error.message, { providerId }, user.id);
    return NextResponse.json({ error: 'Failed to delete provider' }, { status: 400 });
  }
  return NextResponse.json({ deleted: true });
}
