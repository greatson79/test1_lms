import { failure, success, type HandlerResult } from '@/backend/http/response';
import type { AppSupabaseClient } from '@/backend/supabase/client';
import type { Tables } from '@/types/database.types';
import { submissionErrorCodes, type SubmissionServiceError } from './error';
import type { SubmitRequest, SubmitResponse, SubmissionResponse } from './schema';

type AssignmentRow = Pick<
  Tables<'assignments'>,
  'id' | 'status' | 'due_at' | 'allow_late' | 'allow_resubmit'
>;

type SubmissionRow = Pick<
  Tables<'submissions'>,
  | 'id'
  | 'assignment_id'
  | 'learner_id'
  | 'content_text'
  | 'content_link'
  | 'is_late'
  | 'status'
  | 'score'
  | 'feedback'
  | 'submitted_at'
  | 'graded_at'
>;

const SUBMISSION_SELECT =
  'id, assignment_id, learner_id, content_text, content_link, is_late, status, score, feedback, submitted_at, graded_at' as const;

const mapSubmissionRow = (row: SubmissionRow): SubmissionResponse => ({
  id: row.id,
  assignmentId: row.assignment_id,
  learnerId: row.learner_id,
  contentText: row.content_text,
  contentLink: row.content_link,
  isLate: row.is_late,
  status: row.status,
  score: row.score,
  feedback: row.feedback,
  submittedAt: row.submitted_at,
  gradedAt: row.graded_at,
});

const verifyEnrollmentForSubmission = async (
  supabase: AppSupabaseClient,
  courseId: string,
  learnerId: string,
): Promise<HandlerResult<null, SubmissionServiceError>> => {
  const { data, error } = await supabase
    .from('enrollments')
    .select('id')
    .eq('course_id', courseId)
    .eq('learner_id', learnerId)
    .is('cancelled_at', null)
    .maybeSingle();

  if (error) {
    return failure(500, submissionErrorCodes.fetchError, error.message);
  }

  if (!data) {
    return failure(403, submissionErrorCodes.enrollmentRequired, '수강 중인 코스가 아닙니다.');
  }

  return success(null);
};

type DeadlineCheck =
  | { blocked: true; reason: 'closed' | 'late_not_allowed' }
  | { blocked: false; isLate: boolean };

const checkDeadline = (assignment: AssignmentRow): DeadlineCheck => {
  if (assignment.status === 'closed') {
    return { blocked: true, reason: 'closed' };
  }

  const isPastDue = new Date() > new Date(assignment.due_at);

  if (isPastDue && !assignment.allow_late) {
    return { blocked: true, reason: 'late_not_allowed' };
  }

  return { blocked: false, isLate: isPastDue };
};

export const submitAssignment = async (
  supabase: AppSupabaseClient,
  courseId: string,
  assignmentId: string,
  learnerId: string,
  payload: SubmitRequest,
): Promise<HandlerResult<SubmitResponse, SubmissionServiceError>> => {
  const enrollmentCheck = await verifyEnrollmentForSubmission(supabase, courseId, learnerId);
  if (!enrollmentCheck.ok) return enrollmentCheck;

  const { data: assignment, error: assignmentError } = await supabase
    .from('assignments')
    .select('id, status, due_at, allow_late, allow_resubmit')
    .eq('id', assignmentId)
    .eq('course_id', courseId)
    .neq('status', 'draft')
    .maybeSingle();

  if (assignmentError) {
    return failure(500, submissionErrorCodes.fetchError, assignmentError.message);
  }

  if (!assignment) {
    return failure(404, submissionErrorCodes.assignmentNotFound, '과제를 찾을 수 없습니다.');
  }

  const deadlineCheckResult = checkDeadline(assignment as AssignmentRow);
  if (deadlineCheckResult.blocked) {
    if (deadlineCheckResult.reason === 'closed') {
      return failure(409, submissionErrorCodes.assignmentClosed, '강사에 의해 마감된 과제입니다.');
    }
    return failure(409, submissionErrorCodes.lateSubmissionBlocked, '제출 마감 시간이 지났습니다.');
  }

  const isLate = (deadlineCheckResult as { blocked: false; isLate: boolean }).isLate;

  const { data: existingSubmission, error: existingError } = await supabase
    .from('submissions')
    .select('id')
    .eq('assignment_id', assignmentId)
    .eq('learner_id', learnerId)
    .maybeSingle();

  if (existingError) {
    return failure(500, submissionErrorCodes.fetchError, existingError.message);
  }

  if (existingSubmission) {
    return failure(409, submissionErrorCodes.alreadySubmitted, '이미 제출한 과제입니다.');
  }

  const { data: inserted, error: insertError } = await supabase
    .from('submissions')
    .insert({
      assignment_id: assignmentId,
      learner_id: learnerId,
      content_text: payload.contentText,
      content_link: payload.contentLink ?? null,
      is_late: isLate,
      status: 'submitted',
      submitted_at: new Date().toISOString(),
    })
    .select(SUBMISSION_SELECT)
    .single();

  if (insertError) {
    return failure(500, submissionErrorCodes.fetchError, insertError.message);
  }

  return success({ submission: mapSubmissionRow(inserted as SubmissionRow) }, 201);
};

export const resubmitAssignment = async (
  supabase: AppSupabaseClient,
  courseId: string,
  assignmentId: string,
  learnerId: string,
  payload: SubmitRequest,
): Promise<HandlerResult<SubmitResponse, SubmissionServiceError>> => {
  const enrollmentCheck = await verifyEnrollmentForSubmission(supabase, courseId, learnerId);
  if (!enrollmentCheck.ok) return enrollmentCheck;

  const { data: assignment, error: assignmentError } = await supabase
    .from('assignments')
    .select('id, status, due_at, allow_late, allow_resubmit')
    .eq('id', assignmentId)
    .eq('course_id', courseId)
    .neq('status', 'draft')
    .maybeSingle();

  if (assignmentError) {
    return failure(500, submissionErrorCodes.fetchError, assignmentError.message);
  }

  if (!assignment) {
    return failure(404, submissionErrorCodes.assignmentNotFound, '과제를 찾을 수 없습니다.');
  }

  const { data: existing, error: existingError } = await supabase
    .from('submissions')
    .select(SUBMISSION_SELECT)
    .eq('assignment_id', assignmentId)
    .eq('learner_id', learnerId)
    .maybeSingle();

  if (existingError) {
    return failure(500, submissionErrorCodes.fetchError, existingError.message);
  }

  if (!existing) {
    return failure(404, submissionErrorCodes.submissionNotFound, '기존 제출 내역이 없습니다.');
  }

  if (existing.status !== 'resubmission_required') {
    return failure(409, submissionErrorCodes.resubmitNotRequested, '재제출 요청 상태가 아닙니다.');
  }

  if (!assignment.allow_resubmit) {
    return failure(403, submissionErrorCodes.resubmitNotAllowed, '재제출이 허용되지 않는 과제입니다.');
  }

  const resubmitDeadlineCheck = checkDeadline(assignment as AssignmentRow);
  if (resubmitDeadlineCheck.blocked) {
    if (resubmitDeadlineCheck.reason === 'closed') {
      return failure(409, submissionErrorCodes.assignmentClosed, '강사에 의해 마감된 과제입니다.');
    }
    return failure(409, submissionErrorCodes.lateSubmissionBlocked, '제출 마감 시간이 지났습니다.');
  }

  const isLate = (resubmitDeadlineCheck as { blocked: false; isLate: boolean }).isLate;

  const { data: updated, error: updateError } = await supabase
    .from('submissions')
    .update({
      content_text: payload.contentText,
      content_link: payload.contentLink ?? null,
      is_late: isLate,
      status: 'submitted',
      score: null,
      feedback: null,
      graded_at: null,
      submitted_at: new Date().toISOString(),
    })
    .eq('assignment_id', assignmentId)
    .eq('learner_id', learnerId)
    .select(SUBMISSION_SELECT)
    .single();

  if (updateError) {
    return failure(500, submissionErrorCodes.fetchError, updateError.message);
  }

  return success({ submission: mapSubmissionRow(updated as SubmissionRow) });
};
