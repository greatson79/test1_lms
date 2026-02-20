import type { Hono } from 'hono';
import { failure, respond, type ErrorResult } from '@/backend/http/response';
import { getCurrentUser, getSupabase, getLogger, type AppEnv } from '@/backend/hono/context';
import type { EnrollmentServiceError } from './error';
import { withAuth } from '@/backend/middleware/auth';
import { enrollmentErrorCodes } from './error';
import { EnrollRequestSchema } from './schema';
import { enrollCourse, cancelEnrollment } from './service';

export const registerEnrollmentRoutes = (app: Hono<AppEnv>) => {
  app.post('/api/enrollments', withAuth(), async (c) => {
    const currentUser = getCurrentUser(c);

    if (!currentUser) {
      return respond(c, failure(401, enrollmentErrorCodes.forbidden, '인증이 필요합니다.'));
    }

    if (currentUser.role !== 'learner') {
      return respond(c, failure(403, enrollmentErrorCodes.forbidden, '학습자만 수강신청이 가능합니다.'));
    }

    const body = await c.req.json();
    const parsed = EnrollRequestSchema.safeParse(body);

    if (!parsed.success) {
      return respond(
        c,
        failure(400, enrollmentErrorCodes.upsertFailed, '올바르지 않은 요청입니다.', parsed.error.format()),
      );
    }

    const supabase = getSupabase(c);
    const logger = getLogger(c);

    const result = await enrollCourse(supabase, currentUser.id, parsed.data);

    if (!result.ok) {
      logger.error('Enrollment failed', (result as ErrorResult<EnrollmentServiceError>).error.message);
    }

    return respond(c, result);
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

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(courseId)) {
      return respond(c, failure(400, enrollmentErrorCodes.notFound, '올바르지 않은 코스 ID입니다.'));
    }

    const supabase = getSupabase(c);
    const logger = getLogger(c);

    const result = await cancelEnrollment(supabase, currentUser.id, courseId);

    if (!result.ok) {
      logger.error('Enrollment cancellation failed', (result as ErrorResult<EnrollmentServiceError>).error.message);
    }

    return respond(c, result);
  });
};
