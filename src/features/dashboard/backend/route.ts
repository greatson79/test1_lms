import type { Hono } from 'hono';
import { respond, failure } from '@/backend/http/response';
import { withAuth } from '@/backend/middleware/auth';
import { getSupabase, getCurrentUser, type AppEnv } from '@/backend/hono/context';
import { dashboardErrorCodes } from './error';
import { getLearnerDashboard } from './service';

export const registerDashboardRoutes = (app: Hono<AppEnv>) => {
  app.get('/api/dashboard/learner', withAuth(), async (c) => {
    const currentUser = getCurrentUser(c);

    if (!currentUser) {
      return respond(
        c,
        failure(401, dashboardErrorCodes.fetchError, '인증이 필요합니다.'),
      );
    }

    if (currentUser.role !== 'learner') {
      return respond(
        c,
        failure(403, dashboardErrorCodes.fetchError, '학습자만 접근할 수 있습니다.'),
      );
    }

    const supabase = getSupabase(c);
    const result = await getLearnerDashboard(supabase, currentUser.id);
    return respond(c, result);
  });
};
