import type { Hono } from 'hono';
import { respond, failure } from '@/backend/http/response';
import { withAuth } from '@/backend/middleware/auth';
import { getCurrentUser, getSupabase, type AppEnv } from '@/backend/hono/context';
import { UUID_REGEX } from '@/constants/validation';
import { gradeErrorCodes } from './error';
import { getGrades } from './service';

export const registerGradeRoutes = (app: Hono<AppEnv>) => {
  app.get('/api/my/courses/:courseId/grades', withAuth(), async (c) => {
    const currentUser = getCurrentUser(c);

    if (!currentUser) {
      return respond(c, failure(401, gradeErrorCodes.forbidden, '인증이 필요합니다.'));
    }

    if (currentUser.role !== 'learner') {
      return respond(c, failure(403, gradeErrorCodes.forbidden, '학습자만 접근할 수 있습니다.'));
    }

    const courseId = c.req.param('courseId');

    if (!UUID_REGEX.test(courseId)) {
      return respond(c, failure(400, gradeErrorCodes.fetchError, '올바르지 않은 코스 ID입니다.'));
    }

    const supabase = getSupabase(c);
    const result = await getGrades(supabase, courseId, currentUser.id);
    return respond(c, result);
  });
};
