import type { Hono } from 'hono';
import { respond, failure } from '@/backend/http/response';
import { withAuth } from '@/backend/middleware/auth';
import { getCurrentUser, getSupabase, type AppEnv } from '@/backend/hono/context';
import { UUID_REGEX } from '@/constants/validation';
import { assignmentErrorCodes } from './error';
import { listAssignments, getAssignmentDetail } from './service';

export const registerAssignmentRoutes = (app: Hono<AppEnv>) => {
  app.get('/api/my/courses/:courseId/assignments', withAuth(), async (c) => {
    const currentUser = getCurrentUser(c);

    if (!currentUser) {
      return respond(c, failure(401, assignmentErrorCodes.forbidden, '인증이 필요합니다.'));
    }

    if (currentUser.role !== 'learner') {
      return respond(c, failure(403, assignmentErrorCodes.forbidden, '학습자만 접근할 수 있습니다.'));
    }

    const courseId = c.req.param('courseId');

    if (!UUID_REGEX.test(courseId)) {
      return respond(c, failure(400, assignmentErrorCodes.fetchError, '올바르지 않은 코스 ID입니다.'));
    }

    const supabase = getSupabase(c);
    const result = await listAssignments(supabase, courseId, currentUser.id);
    return respond(c, result);
  });

  app.get('/api/my/courses/:courseId/assignments/:assignmentId', withAuth(), async (c) => {
    const currentUser = getCurrentUser(c);

    if (!currentUser) {
      return respond(c, failure(401, assignmentErrorCodes.forbidden, '인증이 필요합니다.'));
    }

    if (currentUser.role !== 'learner') {
      return respond(c, failure(403, assignmentErrorCodes.forbidden, '학습자만 접근할 수 있습니다.'));
    }

    const courseId = c.req.param('courseId');
    const assignmentId = c.req.param('assignmentId');

    if (!UUID_REGEX.test(courseId) || !UUID_REGEX.test(assignmentId)) {
      return respond(c, failure(400, assignmentErrorCodes.fetchError, '올바르지 않은 ID입니다.'));
    }

    const supabase = getSupabase(c);
    const result = await getAssignmentDetail(supabase, courseId, assignmentId, currentUser.id);
    return respond(c, result);
  });
};
