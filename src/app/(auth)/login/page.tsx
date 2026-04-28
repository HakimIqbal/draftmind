import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { LoginPageClient } from '@/components/auth/login-page-client';

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed_at')
      .eq('id', user.id)
      .single();

    if (profile?.onboarding_completed_at) {
      redirect('/home');
    } else {
      redirect('/onboarding/step-1');
    }
  }

  return <LoginPageClient />;
}
