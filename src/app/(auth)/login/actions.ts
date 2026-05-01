'use server';

import { createClient } from '@/lib/supabase/server';

export async function checkUserRole() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { redirect: '/login' };

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('is_super_admin')
    .eq('id', user.id)
    .single();

  if (error || !profile) return { redirect: '/dashboard', error: 'Failed to load profile' };

  return { redirect: profile.is_super_admin ? '/admin' : '/dashboard' };
}
