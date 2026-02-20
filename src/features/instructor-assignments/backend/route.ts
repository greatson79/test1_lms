import type { Hono } from 'hono';
import { respond, failure } from '@/backend/http/response';
import { withAuth } from '@/backend/middleware/auth';
import { getCurrentUser, getSupabase, type AppEnv } from '@/backend/hono/context';
import { UUID_REGEX } from '@/constants/validation';
import { instructorAssignmentErrorCodes } from './error';
import {
  CreateAssignmentBodySchema,
  UpdateAssignmentBodySchema,
  UpdateAssignmentStatusBodySchema,
  SubmissionFilterSchema,
} from './schema';
import {
  createAssignment,
  updateAssignment,
  updateAssignmentStatus,
  listAssignmentSubmissions,
  getInstructorAssignment,
  listInstructorCourseAssignments,
  gradeSubmission,
  requestResubmission,
  getSubmissionDetail,
} from './service';
import {
  GradeSubmissionBodySchema,
  RequestResubmissionBodySchema,
} from './schema';

export const registerInstructorAssignmentRoutes = (app: Hono<AppEnv>) => {
  // GET /api/instructor/courses/:courseId/assignments
  app.get('/api/instructor/courses/:courseId/assignments', withAuth(), async (c) => {
    const currentUser = getCurrentUser(c);

    if (!currentUser) {
      return respond(c, failure(401, instructorAssignmentErrorCodes.forbidden, '인증이 필요합니다.'));
    }

    if (currentUser.role !== 'instructor') {
      return respond(c, failure(403, instructorAssignmentErrorCodes.forbidden, '강사만 접근할 수 있습니다.'));
    }

    const courseId = c.req.param('courseId');

    if (!UUID_REGEX.test(courseId)) {
      return respond(c, failure(400, instructorAssignmentErrorCodes.notFound, '올바르지 않은 코스 ID입니다.'));
    }

    const supabase = getSupabase(c);
    const result = await listInstructorCourseAssignments(supabase, courseId, currentUser.id);
    return respond(c, result);
  });

  // POST /api/instructor/courses/:courseId/assignments
  app.post('/api/instructor/courses/:courseId/assignments', withAuth(), async (c) => {
    const currentUser = getCurrentUser(c);

    if (!currentUser) {
      return respond(c, failure(401, instructorAssignmentErrorCodes.forbidden, '인증이 필요합니다.'));
    }

    if (currentUser.role !== 'instructor') {
      return respond(c, failure(403, instructorAssignmentErrorCodes.forbidden, '강사만 접근할 수 있습니다.'));
    }

    const courseId = c.req.param('courseId');

    if (!UUID_REGEX.test(courseId)) {
      return respond(c, failure(400, instructorAssignmentErrorCodes.notFound, '올바르지 않은 코스 ID입니다.'));
    }

    const rawBody = await c.req.json().catch(() => null);
    const parsed = CreateAssignmentBodySchema.safeParse(rawBody);

    if (!parsed.success) {
      return respond(
        c,
        failure(400, instructorAssignmentErrorCodes.fetchError, '올바르지 않은 요청입니다.', parsed.error.format()),
      );
    }

    const supabase = getSupabase(c);
    const result = await createAssignment(supabase, courseId, currentUser.id, parsed.data);
    return respond(c, result);
  });

  // GET /api/instructor/assignments/:assignmentId
  // 반드시 PUT/:assignmentId 및 PATCH/:assignmentId/status보다 먼저 등록
  app.get('/api/instructor/assignments/:assignmentId', withAuth(), async (c) => {
    const currentUser = getCurrentUser(c);

    if (!currentUser) {
      return respond(c, failure(401, instructorAssignmentErrorCodes.forbidden, '인증이 필요합니다.'));
    }

    if (currentUser.role !== 'instructor') {
      return respond(c, failure(403, instructorAssignmentErrorCodes.forbidden, '강사만 접근할 수 있습니다.'));
    }

    const assignmentId = c.req.param('assignmentId');

    if (!UUID_REGEX.test(assignmentId)) {
      return respond(c, failure(400, instructorAssignmentErrorCodes.notFound, '올바르지 않은 과제 ID입니다.'));
    }

    const supabase = getSupabase(c);
    const result = await getInstructorAssignment(supabase, assignmentId, currentUser.id);
    return respond(c, result);
  });

  // PUT /api/instructor/assignments/:assignmentId
  app.put('/api/instructor/assignments/:assignmentId', withAuth(), async (c) => {
    const currentUser = getCurrentUser(c);

    if (!currentUser) {
      return respond(c, failure(401, instructorAssignmentErrorCodes.forbidden, '인증이 필요합니다.'));
    }

    if (currentUser.role !== 'instructor') {
      return respond(c, failure(403, instructorAssignmentErrorCodes.forbidden, '강사만 접근할 수 있습니다.'));
    }

    const assignmentId = c.req.param('assignmentId');

    if (!UUID_REGEX.test(assignmentId)) {
      return respond(c, failure(400, instructorAssignmentErrorCodes.notFound, '올바르지 않은 과제 ID입니다.'));
    }

    const rawBody = await c.req.json().catch(() => null);
    const parsed = UpdateAssignmentBodySchema.safeParse(rawBody);

    if (!parsed.success) {
      return respond(
        c,
        failure(400, instructorAssignmentErrorCodes.fetchError, '올바르지 않은 요청입니다.', parsed.error.format()),
      );
    }

    const supabase = getSupabase(c);
    const result = await updateAssignment(supabase, assignmentId, currentUser.id, parsed.data);
    return respond(c, result);
  });

  // PATCH /api/instructor/assignments/:assignmentId/status
  app.patch('/api/instructor/assignments/:assignmentId/status', withAuth(), async (c) => {
    const currentUser = getCurrentUser(c);

    if (!currentUser) {
      return respond(c, failure(401, instructorAssignmentErrorCodes.forbidden, '인증이 필요합니다.'));
    }

    if (currentUser.role !== 'instructor') {
      return respond(c, failure(403, instructorAssignmentErrorCodes.forbidden, '강사만 접근할 수 있습니다.'));
    }

    const assignmentId = c.req.param('assignmentId');

    if (!UUID_REGEX.test(assignmentId)) {
      return respond(c, failure(400, instructorAssignmentErrorCodes.notFound, '올바르지 않은 과제 ID입니다.'));
    }

    const rawBody = await c.req.json().catch(() => null);
    const parsed = UpdateAssignmentStatusBodySchema.safeParse(rawBody);

    if (!parsed.success) {
      return respond(
        c,
        failure(400, instructorAssignmentErrorCodes.invalidStatus, '올바르지 않은 상태값입니다.', parsed.error.format()),
      );
    }

    const supabase = getSupabase(c);
    const result = await updateAssignmentStatus(supabase, assignmentId, currentUser.id, parsed.data);
    return respond(c, result);
  });

  // GET /api/instructor/assignments/:assignmentId/submissions
  app.get('/api/instructor/assignments/:assignmentId/submissions', withAuth(), async (c) => {
    const currentUser = getCurrentUser(c);

    if (!currentUser) {
      return respond(c, failure(401, instructorAssignmentErrorCodes.forbidden, '인증이 필요합니다.'));
    }

    if (currentUser.role !== 'instructor') {
      return respond(c, failure(403, instructorAssignmentErrorCodes.forbidden, '강사만 접근할 수 있습니다.'));
    }

    const assignmentId = c.req.param('assignmentId');

    if (!UUID_REGEX.test(assignmentId)) {
      return respond(c, failure(400, instructorAssignmentErrorCodes.notFound, '올바르지 않은 과제 ID입니다.'));
    }

    const filterRaw = c.req.query('filter');
    const filterParsed = SubmissionFilterSchema.safeParse(filterRaw);

    if (!filterParsed.success) {
      return respond(
        c,
        failure(
          400,
          instructorAssignmentErrorCodes.invalidFilter,
          '허용된 필터값: pending, late, resubmission',
        ),
      );
    }

    const supabase = getSupabase(c);
    const result = await listAssignmentSubmissions(
      supabase,
      assignmentId,
      currentUser.id,
      filterParsed.data,
    );
    return respond(c, result);
  });

  // GET /api/instructor/submissions/:submissionId
  app.get('/api/instructor/submissions/:submissionId', withAuth(), async (c) => {
    const currentUser = getCurrentUser(c);

    if (!currentUser) {
      return respond(c, failure(401, instructorAssignmentErrorCodes.forbidden, '인증이 필요합니다.'));
    }

    if (currentUser.role !== 'instructor') {
      return respond(c, failure(403, instructorAssignmentErrorCodes.forbidden, '강사만 접근할 수 있습니다.'));
    }

    const submissionId = c.req.param('submissionId');

    if (!UUID_REGEX.test(submissionId)) {
      return respond(c, failure(400, instructorAssignmentErrorCodes.notFound, '올바르지 않은 제출물 ID입니다.'));
    }

    const supabase = getSupabase(c);
    const result = await getSubmissionDetail(supabase, submissionId, currentUser.id);
    return respond(c, result);
  });

  // PATCH /api/instructor/submissions/:submissionId/grade
  app.patch('/api/instructor/submissions/:submissionId/grade', withAuth(), async (c) => {
    const currentUser = getCurrentUser(c);

    if (!currentUser) {
      return respond(c, failure(401, instructorAssignmentErrorCodes.forbidden, '인증이 필요합니다.'));
    }

    if (currentUser.role !== 'instructor') {
      return respond(c, failure(403, instructorAssignmentErrorCodes.forbidden, '강사만 접근할 수 있습니다.'));
    }

    const submissionId = c.req.param('submissionId');

    if (!UUID_REGEX.test(submissionId)) {
      return respond(c, failure(400, instructorAssignmentErrorCodes.notFound, '올바르지 않은 제출물 ID입니다.'));
    }

    const rawBody = await c.req.json().catch(() => null);
    const parsed = GradeSubmissionBodySchema.safeParse(rawBody);

    if (!parsed.success) {
      return respond(
        c,
        failure(400, instructorAssignmentErrorCodes.fetchError, '올바르지 않은 요청입니다.', parsed.error.format()),
      );
    }

    const supabase = getSupabase(c);
    const result = await gradeSubmission(supabase, submissionId, currentUser.id, parsed.data);
    return respond(c, result);
  });

  // PATCH /api/instructor/submissions/:submissionId/request-resubmission
  app.patch('/api/instructor/submissions/:submissionId/request-resubmission', withAuth(), async (c) => {
    const currentUser = getCurrentUser(c);

    if (!currentUser) {
      return respond(c, failure(401, instructorAssignmentErrorCodes.forbidden, '인증이 필요합니다.'));
    }

    if (currentUser.role !== 'instructor') {
      return respond(c, failure(403, instructorAssignmentErrorCodes.forbidden, '강사만 접근할 수 있습니다.'));
    }

    const submissionId = c.req.param('submissionId');

    if (!UUID_REGEX.test(submissionId)) {
      return respond(c, failure(400, instructorAssignmentErrorCodes.notFound, '올바르지 않은 제출물 ID입니다.'));
    }

    const rawBody = await c.req.json().catch(() => null);
    const parsed = RequestResubmissionBodySchema.safeParse(rawBody);

    if (!parsed.success) {
      return respond(
        c,
        failure(400, instructorAssignmentErrorCodes.fetchError, '올바르지 않은 요청입니다.', parsed.error.format()),
      );
    }

    const supabase = getSupabase(c);
    const result = await requestResubmission(supabase, submissionId, currentUser.id, parsed.data);
    return respond(c, result);
  });
};
