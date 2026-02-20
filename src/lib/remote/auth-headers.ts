'use client';

import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';

export const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const supabase = getSupabaseBrowserClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session?.access_token
    ? { Authorization: `Bearer ${session.access_token}` }
    : {};
};

export const getAuthHeadersOrThrow = async (): Promise<{ Authorization: string }> => {
  const headers = await getAuthHeaders();

  if (!headers.Authorization) {
    throw new Error('인증이 필요합니다.');
  }

  return headers as { Authorization: string };
};
