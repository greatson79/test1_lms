import type { Hono } from 'hono';
import { respond, failure } from '@/backend/http/response';
import { withAuth } from '@/backend/middleware/auth';
import { getCurrentUser, getSupabase, type AppEnv } from '@/backend/hono/context';
import { UUID_REGEX } from '@/constants/validation';
import { submissionErrorCodes } from './error';
import { SubmitRequestSchema } from './schema';
import { submitAssignment, resubmitAssignment } from './service';

export const registerSubmissionRoutes = (app: Hono<AppEnv>) => {
  app.post(
    '/api/my/courses/:courseId/assignments/:assignmentId/submissions',
    withAuth(),
    async (c) => {
      const currentUser = getCurrentUser(c);

      if (!currentUser) {
        return respond(c, failure(401, submissionErrorCodes.forbidden, '인증이 필요합니다.'));
      }

      if (currentUser.role !== 'learner') {
        return respond(c, failure(403, submissionErrorCodes.forbidden, '학습자만 접근할 수 있습니다.'));
      }

      const courseId = c.req.param('courseId');
      const assignmentId = c.req.param('assignmentId');

      if (!UUID_REGEX.test(courseId) || !UUID_REGEX.test(assignmentId)) {
        return respond(c, failure(400, submissionErrorCodes.fetchError, '올바르지 않은 ID입니다.'));
      }

      const body = await c.req.json();
      const parsed = SubmitRequestSchema.safeParse(body);

      if (!parsed.success) {
        return respond(
          c,
          failure(
            400,
            submissionErrorCodes.fetchError,
            parsed.error.errors[0]?.message ?? '입력값이 올바르지 않습니다.',
          ),
        );
      }

      const supabase = getSupabase(c);
      const result = await submitAssignment(
        supabase,
        courseId,
        assignmentId,
        currentUser.id,
        parsed.data,
      );
      return respond(c, result);
    },
  );

  app.put(
    '/api/my/courses/:courseId/assignments/:assignmentId/submissions',
    withAuth(),
    async (c) => {
      const currentUser = getCurrentUser(c);

      if (!currentUser) {
        return respond(c, failure(401, submissionErrorCodes.forbidden, '인증이 필요합니다.'));
      }

      if (currentUser.role !== 'learner') {
        return respond(c, failure(403, submissionErrorCodes.forbidden, '학습자만 접근할 수 있습니다.'));
      }

      const courseId = c.req.param('courseId');
      const assignmentId = c.req.param('assignmentId');

      if (!UUID_REGEX.test(courseId) || !UUID_REGEX.test(assignmentId)) {
        return respond(c, failure(400, submissionErrorCodes.fetchError, '올바르지 않은 ID입니다.'));
      }

      const body = await c.req.json();
      const parsed = SubmitRequestSchema.safeParse(body);

      if (!parsed.success) {
        return respond(
          c,
          failure(
            400,
            submissionErrorCodes.fetchError,
            parsed.error.errors[0]?.message ?? '입력값이 올바르지 않습니다.',
          ),
        );
      }

      const supabase = getSupabase(c);
      const result = await resubmitAssignment(
        supabase,
        courseId,
        assignmentId,
        currentUser.id,
        parsed.data,
      );
      return respond(c, result);
    },
  );
};
