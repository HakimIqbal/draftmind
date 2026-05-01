import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { LoginPageClient } from '@/components/auth/login-page-client';

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // Auto-detect: admin goes to /admin, user goes to /home
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_super_admin')
      .eq('id', user.id)
      .single();

    redirect(profile?.is_super_admin ? '/admin' : '/dashboard');
  }

  return <LoginPageClient />;
}
