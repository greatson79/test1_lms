import { failure, success, type HandlerResult } from '@/backend/http/response';
import type { AppSupabaseClient } from '@/backend/supabase/client';
import type { Tables } from '@/types/database.types';
import { assignmentErrorCodes, type AssignmentServiceError } from './error';
import type {
  AssignmentDto,
  MySubmissionDto,
  AssignmentListResponse,
  AssignmentDetailResponse,
} from './schema';

type AssignmentRow = Pick<
  Tables<'assignments'>,
  'id' | 'course_id' | 'title' | 'description' | 'due_at' | 'weight' | 'allow_late' | 'allow_resubmit' | 'status'
>;

type SubmissionRow = Pick<
  Tables<'submissions'>,
  'id' | 'assignment_id' | 'status' | 'content_text' | 'content_link' | 'is_late' | 'score' | 'feedback' | 'submitted_at' | 'graded_at'
>;

const mapSubmissionRow = (row: SubmissionRow): MySubmissionDto => ({
  id: row.id,
  status: row.status,
  contentText: row.content_text,
  contentLink: row.content_link,
  isLate: row.is_late,
  score: row.score,
  feedback: row.feedback,
  submittedAt: row.submitted_at,
  gradedAt: row.graded_at,
});

const mapAssignmentRow = (
  row: AssignmentRow,
  submission: SubmissionRow | null,
): AssignmentDto => ({
  id: row.id,
  courseId: row.course_id,
  title: row.title,
  description: row.description,
  dueAt: row.due_at,
  weight: row.weight,
  allowLate: row.allow_late,
  allowResubmit: row.allow_resubmit,
  status: row.status as AssignmentDto['status'],
  mySubmission: submission ? mapSubmissionRow(submission) : null,
});

export const verifyEnrollment = async (
  supabase: AppSupabaseClient,
  courseId: string,
  learnerId: string,
): Promise<HandlerResult<null, AssignmentServiceError>> => {
  const { data, error } = await (supabase as AppSupabaseClient)
    .from('enrollments')
    .select('id')
    .eq('course_id', courseId)
    .eq('learner_id', learnerId)
    .is('cancelled_at', null)
    .maybeSingle();

  if (error) {
    return failure(500, assignmentErrorCodes.fetchError, error.message);
  }

  if (!data) {
    return failure(403, assignmentErrorCodes.enrollmentRequired, '수강 중인 코스가 아닙니다.');
  }

  return success(null);
};

export const listAssignments = async (
  supabase: AppSupabaseClient,
  courseId: string,
  learnerId: string,
): Promise<HandlerResult<AssignmentListResponse, AssignmentServiceError>> => {
  const enrollmentCheck = await verifyEnrollment(supabase, courseId, learnerId);
  if (!enrollmentCheck.ok) return enrollmentCheck;

  const { data: assignmentsRaw, error: assignmentsError } = await supabase
    .from('assignments')
    .select('id, course_id, title, description, due_at, weight, allow_late, allow_resubmit, status')
    .eq('course_id', courseId)
    .eq('status', 'published')
    .order('due_at', { ascending: true });

  if (assignmentsError) {
    return failure(500, assignmentErrorCodes.fetchError, assignmentsError.message);
  }

  const assignmentIds = (assignmentsRaw ?? []).map((a) => a.id as string);

  let submissions: SubmissionRow[] = [];
  if (assignmentIds.length > 0) {
    const { data: submissionsRaw, error: submissionsError } = await supabase
      .from('submissions')
      .select(
        'id, assignment_id, status, content_text, content_link, is_late, score, feedback, submitted_at, graded_at',
      )
      .eq('learner_id', learnerId)
      .in('assignment_id', assignmentIds);

    if (submissionsError) {
      return failure(500, assignmentErrorCodes.fetchError, submissionsError.message);
    }

    submissions = (submissionsRaw ?? []) as SubmissionRow[];
  }

  const submissionMap = new Map(submissions.map((s) => [s.assignment_id, s]));

  const assignments: AssignmentDto[] = (assignmentsRaw ?? []).map((a) => {
    const sub = submissionMap.get(a.id as string) ?? null;
    return mapAssignmentRow(a as AssignmentRow, sub);
  });

  return success({ assignments });
};

export const getAssignmentDetail = async (
  supabase: AppSupabaseClient,
  courseId: string,
  assignmentId: string,
  learnerId: string,
): Promise<HandlerResult<AssignmentDetailResponse, AssignmentServiceError>> => {
  const enrollmentCheck = await verifyEnrollment(supabase, courseId, learnerId);
  if (!enrollmentCheck.ok) return enrollmentCheck;

  const { data: assignmentRaw, error: assignmentError } = await supabase
    .from('assignments')
    .select('id, course_id, title, description, due_at, weight, allow_late, allow_resubmit, status')
    .eq('id', assignmentId)
    .eq('course_id', courseId)
    .neq('status', 'draft')
    .maybeSingle();

  if (assignmentError) {
    return failure(500, assignmentErrorCodes.fetchError, assignmentError.message);
  }

  if (!assignmentRaw) {
    return failure(404, assignmentErrorCodes.assignmentNotFound, '과제를 찾을 수 없습니다.');
  }

  const { data: submissionRaw, error: submissionError } = await supabase
    .from('submissions')
    .select(
      'id, assignment_id, status, content_text, content_link, is_late, score, feedback, submitted_at, graded_at',
    )
    .eq('assignment_id', assignmentId)
    .eq('learner_id', learnerId)
    .maybeSingle();

  if (submissionError) {
    return failure(500, assignmentErrorCodes.fetchError, submissionError.message);
  }

  const assignment = mapAssignmentRow(
    assignmentRaw as AssignmentRow,
    (submissionRaw as SubmissionRow) ?? null,
  );

  return success({ assignment });
};
