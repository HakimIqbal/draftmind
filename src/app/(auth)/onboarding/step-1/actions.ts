'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function updateStep1(role: string, experience: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  await supabase
    .from('profiles')
    .update({
      role_self_reported: role,
      experience_level: experience,
    })
    .eq('id', user.id);

  redirect('/onboarding/step-2');
}
