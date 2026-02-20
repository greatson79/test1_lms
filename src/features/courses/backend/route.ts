import type { Hono } from 'hono';
import { failure, respond, handleServiceResult } from '@/backend/http/response';
import { getSupabase, type AppEnv } from '@/backend/hono/context';
import { extractBearerToken } from '@/backend/middleware/auth';
import { UUID_REGEX } from '@/constants/validation';
import { CourseListQuerySchema } from './schema';
import { courseErrorCodes } from './error';
import { listCourses, getCourseDetail } from './service';

export const registerCourseRoutes = (app: Hono<AppEnv>) => {
  app.get('/api/courses', async (c) => {
    const rawQuery = Object.fromEntries(new URL(c.req.url).searchParams.entries());
    const parsed = CourseListQuerySchema.safeParse(rawQuery);

    if (!parsed.success) {
      return respond(
        c,
        failure(400, courseErrorCodes.fetchError, '올바르지 않은 쿼리 파라미터입니다.', parsed.error.format()),
      );
    }

    const supabase = getSupabase(c);
    const result = await listCourses(supabase, parsed.data);
    return respond(c, result);
  });

  app.get('/api/courses/:courseId', async (c) => {
    const courseId = c.req.param('courseId');

    if (!UUID_REGEX.test(courseId)) {
      return respond(c, failure(400, courseErrorCodes.notFound, '올바르지 않은 코스 ID입니다.'));
    }

    const supabase = getSupabase(c);

    // Optional auth: extract learner ID if Bearer token is present
    let learnerId: string | null = null;
    const token = extractBearerToken(c.req.header('Authorization'));

    if (token) {
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (!authError && user) {
        learnerId = user.id;
      }
    }

    const result = await getCourseDetail(supabase, courseId, learnerId);
    return handleServiceResult(c, result, 'Course detail fetch failed');
  });
};
