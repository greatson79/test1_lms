import { createMiddleware } from 'hono/factory';
import { contextKeys, type AppEnv, type CurrentUser, type UserRole } from '@/backend/hono/context';
import { getSupabase } from '@/backend/hono/context';

export const withAuth = () =>
  createMiddleware<AppEnv>(async (c, next) => {
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return c.json(
        { error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다.' } },
        401,
      );
    }

    const supabase = getSupabase(c);
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return c.json(
        { error: { code: 'UNAUTHORIZED', message: '유효하지 않은 토큰입니다.' } },
        401,
      );
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', user.id)
      .maybeSingle<{ id: string; role: UserRole }>();

    const currentUser: CurrentUser = {
      id: user.id,
      role: profile?.role ?? null,
    };

    c.set(contextKeys.currentUser, currentUser);

    await next();
  });
