'use server';

import { requireUser } from '@/lib/auth/permissions';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

interface UpdateProfileData {
  full_name: string;
  role_self_reported: string;
  experience_level: string;
  default_locale: string;
}

export async function updateProfile(data: UpdateProfileData) {
  const user = await requireUser();
  const supabase = await createClient();

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: data.full_name,
      role_self_reported: data.role_self_reported,
      experience_level: data.experience_level,
      default_locale: data.default_locale,
    })
    .eq('id', user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/settings/profile');
  return { success: true };
}
