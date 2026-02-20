import type { Hono } from 'hono';
import { respond, failure } from '@/backend/http/response';
import { withAuth } from '@/backend/middleware/auth';
import { getCurrentUser, getSupabase, type AppEnv } from '@/backend/hono/context';
import { instructorDashboardErrorCodes } from './error';
import { getInstructorDashboard } from './service';

export const registerInstructorDashboardRoutes = (app: Hono<AppEnv>) => {
  app.get('/api/instructor/dashboard', withAuth(), async (c) => {
    const currentUser = getCurrentUser(c);

    if (!currentUser) {
      return respond(
        c,
        failure(401, instructorDashboardErrorCodes.forbidden, '인증이 필요합니다.'),
      );
    }

    if (currentUser.role !== 'instructor') {
      return respond(
        c,
        failure(403, instructorDashboardErrorCodes.forbidden, '강사만 접근할 수 있습니다.'),
      );
    }

    const supabase = getSupabase(c);
    const result = await getInstructorDashboard(supabase, currentUser.id);
    return respond(c, result);
  });
};
