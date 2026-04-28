'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function updateStep2(primaryUseCases: string[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  await supabase
    .from('profiles')
    .update({
      primary_use_cases: primaryUseCases,
    })
    .eq('id', user.id);

  redirect('/onboarding/step-3');
}
