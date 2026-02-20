import { createMiddleware } from 'hono/factory';
import type { AppEnv, UserRole } from '@/backend/hono/context';
import { getCurrentUser } from '@/backend/hono/context';

export const requireRole = (...roles: UserRole[]) =>
  createMiddleware<AppEnv>(async (c, next) => {
    const currentUser = getCurrentUser(c);

    if (!currentUser) {
      return c.json(
        { error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다.' } },
        401,
      );
    }

    if (!currentUser.role || !roles.includes(currentUser.role)) {
      return c.json(
        { error: { code: 'FORBIDDEN', message: '접근 권한이 없습니다.' } },
        403,
      );
    }

    await next();
  });
