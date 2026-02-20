import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

export type { Database };
export type AppSupabaseClient = SupabaseClient<Database>;

export type ServiceClientConfig = {
  url: string;
  serviceRoleKey: string;
};

export const createServiceClient = ({
  url,
  serviceRoleKey,
}: ServiceClientConfig): AppSupabaseClient =>
  createClient<Database>(url, serviceRoleKey, {
    auth: {
      persistSession: false,
    },
  });
