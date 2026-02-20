import type { Context } from 'hono';
import type { SupabaseClient } from '@supabase/supabase-js';

export type AppLogger = Pick<Console, 'info' | 'error' | 'warn' | 'debug'>;

export type AppConfig = {
  supabase: {
    url: string;
    serviceRoleKey: string;
  };
};

export type UserRole = 'learner' | 'instructor' | 'operator';

export type CurrentUser = {
  id: string;
  role: UserRole | null;
};

export type AppVariables = {
  supabase: SupabaseClient;
  logger: AppLogger;
  config: AppConfig;
  currentUser: CurrentUser | undefined;
  validatedBody: unknown;
};

export type AppEnv = {
  Variables: AppVariables;
};

export type AppContext = Context<AppEnv>;

export const contextKeys = {
  supabase: 'supabase',
  logger: 'logger',
  config: 'config',
  currentUser: 'currentUser',
  validatedBody: 'validatedBody',
} as const satisfies Record<keyof AppVariables, keyof AppVariables>;

export const getSupabase = (c: AppContext) =>
  c.get(contextKeys.supabase) as SupabaseClient;

export const getLogger = (c: AppContext) =>
  c.get(contextKeys.logger) as AppLogger;

export const getConfig = (c: AppContext) =>
  c.get(contextKeys.config) as AppConfig;

export const getCurrentUser = (c: AppContext) =>
  c.get(contextKeys.currentUser) as CurrentUser | undefined;

export const getValidatedBody = <T>(c: AppContext): T =>
  c.get(contextKeys.validatedBody) as T;
