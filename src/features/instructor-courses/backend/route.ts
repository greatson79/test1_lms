import type { Hono } from 'hono';
import { respond, failure } from '@/backend/http/response';
import { withAuth } from '@/backend/middleware/auth';
import { getCurrentUser, getSupabase, type AppEnv } from '@/backend/hono/context';
import { UUID_REGEX } from '@/constants/validation';
import { instructorCourseErrorCodes } from './error';
import {
  CreateCourseBodySchema,
  UpdateCourseBodySchema,
  UpdateCourseStatusBodySchema,
} from './schema';
import {
  createCourse,
  updateCourse,
  updateCourseStatus,
  getInstructorCourse,
  getInstructorCourseMeta,
} from './service';

export const registerInstructorCourseRoutes = (app: Hono<AppEnv>) => {
  // GET /api/instructor/courses/meta — 생성 페이지용 메타 전용 조회
  // 반드시 /:courseId 보다 먼저 등록해야 충돌하지 않음
  app.get('/api/instructor/courses/meta', withAuth(), async (c) => {
    const currentUser = getCurrentUser(c);

    if (!currentUser) {
      return respond(c, failure(401, instructorCourseErrorCodes.forbidden, '인증이 필요합니다.'));
    }

    if (currentUser.role !== 'instructor') {
      return respond(c, failure(403, instructorCourseErrorCodes.forbidden, '강사만 접근할 수 있습니다.'));
    }

    const supabase = getSupabase(c);
    const result = await getInstructorCourseMeta(supabase);
    return respond(c, result);
  });

  // GET /api/instructor/courses/:courseId
  app.get('/api/instructor/courses/:courseId', withAuth(), async (c) => {
    const currentUser = getCurrentUser(c);

    if (!currentUser) {
      return respond(c, failure(401, instructorCourseErrorCodes.forbidden, '인증이 필요합니다.'));
    }

    if (currentUser.role !== 'instructor') {
      return respond(c, failure(403, instructorCourseErrorCodes.forbidden, '강사만 접근할 수 있습니다.'));
    }

    const courseId = c.req.param('courseId');

    if (!UUID_REGEX.test(courseId)) {
      return respond(c, failure(400, instructorCourseErrorCodes.notFound, '올바르지 않은 코스 ID입니다.'));
    }

    const supabase = getSupabase(c);
    const result = await getInstructorCourse(supabase, courseId, currentUser.id);
    return respond(c, result);
  });

  // POST /api/instructor/courses
  app.post('/api/instructor/courses', withAuth(), async (c) => {
    const currentUser = getCurrentUser(c);

    if (!currentUser) {
      return respond(c, failure(401, instructorCourseErrorCodes.forbidden, '인증이 필요합니다.'));
    }

    if (currentUser.role !== 'instructor') {
      return respond(c, failure(403, instructorCourseErrorCodes.forbidden, '강사만 접근할 수 있습니다.'));
    }

    const rawBody = await c.req.json().catch(() => null);
    const parsed = CreateCourseBodySchema.safeParse(rawBody);

    if (!parsed.success) {
      return respond(
        c,
        failure(400, instructorCourseErrorCodes.fetchError, '올바르지 않은 요청입니다.', parsed.error.format()),
      );
    }

    const supabase = getSupabase(c);
    const result = await createCourse(supabase, currentUser.id, parsed.data);
    return respond(c, result);
  });

  // PUT /api/instructor/courses/:courseId
  app.put('/api/instructor/courses/:courseId', withAuth(), async (c) => {
    const currentUser = getCurrentUser(c);

    if (!currentUser) {
      return respond(c, failure(401, instructorCourseErrorCodes.forbidden, '인증이 필요합니다.'));
    }

    if (currentUser.role !== 'instructor') {
      return respond(c, failure(403, instructorCourseErrorCodes.forbidden, '강사만 접근할 수 있습니다.'));
    }

    const courseId = c.req.param('courseId');

    if (!UUID_REGEX.test(courseId)) {
      return respond(c, failure(400, instructorCourseErrorCodes.notFound, '올바르지 않은 코스 ID입니다.'));
    }

    const rawBody = await c.req.json().catch(() => null);
    const parsed = UpdateCourseBodySchema.safeParse(rawBody);

    if (!parsed.success) {
      return respond(
        c,
        failure(400, instructorCourseErrorCodes.fetchError, '올바르지 않은 요청입니다.', parsed.error.format()),
      );
    }

    const supabase = getSupabase(c);
    const result = await updateCourse(supabase, courseId, currentUser.id, parsed.data);
    return respond(c, result);
  });

  // PATCH /api/instructor/courses/:courseId/status
  app.patch('/api/instructor/courses/:courseId/status', withAuth(), async (c) => {
    const currentUser = getCurrentUser(c);

    if (!currentUser) {
      return respond(c, failure(401, instructorCourseErrorCodes.forbidden, '인증이 필요합니다.'));
    }

    if (currentUser.role !== 'instructor') {
      return respond(c, failure(403, instructorCourseErrorCodes.forbidden, '강사만 접근할 수 있습니다.'));
    }

    const courseId = c.req.param('courseId');

    if (!UUID_REGEX.test(courseId)) {
      return respond(c, failure(400, instructorCourseErrorCodes.notFound, '올바르지 않은 코스 ID입니다.'));
    }

    const rawBody = await c.req.json().catch(() => null);
    const parsed = UpdateCourseStatusBodySchema.safeParse(rawBody);

    if (!parsed.success) {
      return respond(
        c,
        failure(400, instructorCourseErrorCodes.invalidStatus, '올바르지 않은 상태값입니다.', parsed.error.format()),
      );
    }

    const supabase = getSupabase(c);
    const result = await updateCourseStatus(supabase, courseId, currentUser.id, parsed.data);
    return respond(c, result);
  });
};
