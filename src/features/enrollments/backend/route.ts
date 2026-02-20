import type { Hono } from 'hono';
import { failure, respond, handleServiceResult } from '@/backend/http/response';
import { getCurrentUser, getSupabase, getValidatedBody, type AppEnv } from '@/backend/hono/context';
import { UUID_REGEX } from '@/constants/validation';
import { withAuth } from '@/backend/middleware/auth';
import { validateBody } from '@/backend/middleware/validate-body';
import { enrollmentErrorCodes } from './error';
import { EnrollRequestSchema } from './schema';
import { enrollCourse, cancelEnrollment } from './service';
import type { EnrollRequest } from './schema';

export const registerEnrollmentRoutes = (app: Hono<AppEnv>) => {
  app.post('/api/enrollments', withAuth(), validateBody(EnrollRequestSchema), async (c) => {
    const currentUser = getCurrentUser(c);

    if (!currentUser) {
      return respond(c, failure(401, enrollmentErrorCodes.forbidden, '인증이 필요합니다.'));
    }

    if (currentUser.role !== 'learner') {
      return respond(c, failure(403, enrollmentErrorCodes.forbidden, '학습자만 수강신청이 가능합니다.'));
    }

    const body = getValidatedBody<EnrollRequest>(c);
    const supabase = getSupabase(c);
    const result = await enrollCourse(supabase, currentUser.id, body);
    return handleServiceResult(c, result, 'Enrollment failed');
  });

  app.delete('/api/enrollments/:courseId', withAuth(), async (c) => {
    const currentUser = getCurrentUser(c);

    if (!currentUser) {
      return respond(c, failure(401, enrollmentErrorCodes.forbidden, '인증이 필요합니다.'));
    }

    if (currentUser.role !== 'learner') {
      return respond(c, failure(403, enrollmentErrorCodes.forbidden, '학습자만 수강취소가 가능합니다.'));
    }

    const courseId = c.req.param('courseId');

    if (!UUID_REGEX.test(courseId)) {
      return respond(c, failure(400, enrollmentErrorCodes.notFound, '올바르지 않은 코스 ID입니다.'));
    }

    const supabase = getSupabase(c);
    const result = await cancelEnrollment(supabase, currentUser.id, courseId);
    return handleServiceResult(c, result, 'Enrollment cancellation failed');
  });
};
