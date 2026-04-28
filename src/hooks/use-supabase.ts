'use client';
import { useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useSupabase() {
  return useMemo(() => createClient(), []);
}
