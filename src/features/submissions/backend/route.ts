import type { Hono } from 'hono';
import { respond, failure, handleServiceResult } from '@/backend/http/response';
import { withAuth } from '@/backend/middleware/auth';
import { validateBody } from '@/backend/middleware/validate-body';
import { getCurrentUser, getSupabase, getValidatedBody, type AppEnv, type AppContext } from '@/backend/hono/context';
import { UUID_REGEX } from '@/constants/validation';
import { submissionErrorCodes } from './error';
import { SubmitRequestSchema, ResubmitRequestSchema } from './schema';
import { submitAssignment, resubmitAssignment } from './service';
import type { SubmitRequest, ResubmitRequest } from './schema';

const validateRouteParams = (c: AppContext) => {
  const courseId = c.req.param('courseId');
  const assignmentId = c.req.param('assignmentId');

  if (!UUID_REGEX.test(courseId) || !UUID_REGEX.test(assignmentId)) {
    return { valid: false as const, courseId: '', assignmentId: '' };
  }

  return { valid: true as const, courseId, assignmentId };
};

export const registerSubmissionRoutes = (app: Hono<AppEnv>) => {
  app.post(
    '/api/my/courses/:courseId/assignments/:assignmentId/submissions',
    withAuth(),
    validateBody(SubmitRequestSchema),
    async (c) => {
      const currentUser = getCurrentUser(c);

      if (!currentUser) {
        return respond(c, failure(401, submissionErrorCodes.forbidden, '인증이 필요합니다.'));
      }

      if (currentUser.role !== 'learner') {
        return respond(c, failure(403, submissionErrorCodes.forbidden, '학습자만 접근할 수 있습니다.'));
      }

      const { valid, courseId, assignmentId } = validateRouteParams(c);

      if (!valid) {
        return respond(c, failure(400, submissionErrorCodes.fetchError, '올바르지 않은 ID입니다.'));
      }

      const body = getValidatedBody<SubmitRequest>(c);
      const supabase = getSupabase(c);
      const result = await submitAssignment(supabase, courseId, assignmentId, currentUser.id, body);
      return handleServiceResult(c, result, 'Submit assignment failed');
    },
  );

  app.put(
    '/api/my/courses/:courseId/assignments/:assignmentId/submissions',
    withAuth(),
    validateBody(ResubmitRequestSchema),
    async (c) => {
      const currentUser = getCurrentUser(c);

      if (!currentUser) {
        return respond(c, failure(401, submissionErrorCodes.forbidden, '인증이 필요합니다.'));
      }

      if (currentUser.role !== 'learner') {
        return respond(c, failure(403, submissionErrorCodes.forbidden, '학습자만 접근할 수 있습니다.'));
      }

      const { valid, courseId, assignmentId } = validateRouteParams(c);

      if (!valid) {
        return respond(c, failure(400, submissionErrorCodes.fetchError, '올바르지 않은 ID입니다.'));
      }

      const body = getValidatedBody<ResubmitRequest>(c);
      const supabase = getSupabase(c);
      const result = await resubmitAssignment(supabase, courseId, assignmentId, currentUser.id, body);
      return handleServiceResult(c, result, 'Resubmit assignment failed');
    },
  );
};
