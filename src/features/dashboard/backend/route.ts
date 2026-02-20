import type { Hono } from 'hono';
import { respond, failure } from '@/backend/http/response';
import { withAuth } from '@/backend/middleware/auth';
import { getSupabase, getCurrentUser, type AppEnv } from '@/backend/hono/context';
import { dashboardErrorCodes } from './error';
import { getLearnerDashboard, getCourseGrades } from './service';

const requireLearner = (c: Parameters<typeof getCurrentUser>[0]) => {
  const currentUser = getCurrentUser(c);
  if (!currentUser) return failure(401, dashboardErrorCodes.fetchError, '인증이 필요합니다.');
  if (currentUser.role !== 'learner')
    return failure(403, dashboardErrorCodes.fetchError, '학습자만 접근할 수 있습니다.');
  return currentUser;
};

export const registerDashboardRoutes = (app: Hono<AppEnv>) => {
  app.get('/api/dashboard/learner', withAuth(), async (c) => {
    const userOrError = requireLearner(c);
    if ('ok' in userOrError && !userOrError.ok) return respond(c, userOrError);

    const currentUser = userOrError as Exclude<typeof userOrError, { ok: false }>;
    const supabase = getSupabase(c);
    const result = await getLearnerDashboard(supabase, currentUser.id);
    return respond(c, result);
  });

  app.get('/api/dashboard/learner/courses/:courseId/grades', withAuth(), async (c) => {
    const userOrError = requireLearner(c);
    if ('ok' in userOrError && !userOrError.ok) return respond(c, userOrError);

    const currentUser = userOrError as Exclude<typeof userOrError, { ok: false }>;
    const courseId = c.req.param('courseId');
    const supabase = getSupabase(c);
    const result = await getCourseGrades(supabase, currentUser.id, courseId);
    return respond(c, result);
  });
};
