import type { SupabaseClient } from '@supabase/supabase-js';
import { failure, success, type HandlerResult } from '@/backend/http/response';
import { assignmentErrorCodes, type AssignmentServiceError } from './error';
import type {
  AssignmentDto,
  MySubmissionDto,
  AssignmentListResponse,
  AssignmentDetailResponse,
} from './schema';

type AssignmentRow = {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  due_at: string;
  weight: string;
  allow_late: boolean;
  allow_resubmit: boolean;
  status: 'published' | 'closed';
};

type SubmissionRow = {
  id: string;
  assignment_id: string;
  status: 'submitted' | 'graded' | 'resubmission_required';
  content_text: string | null;
  content_link: string | null;
  is_late: boolean;
  score: number | null;
  feedback: string | null;
  submitted_at: string;
  graded_at: string | null;
};

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
  weight: Number(row.weight),
  allowLate: row.allow_late,
  allowResubmit: row.allow_resubmit,
  status: row.status,
  mySubmission: submission ? mapSubmissionRow(submission) : null,
});

export const verifyEnrollment = async (
  supabase: SupabaseClient,
  courseId: string,
  learnerId: string,
): Promise<HandlerResult<null, AssignmentServiceError>> => {
  const { data, error } = await supabase
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
  supabase: SupabaseClient,
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

    submissions = (submissionsRaw ?? []) as unknown as SubmissionRow[];
  }

  const submissionMap = new Map(submissions.map((s) => [s.assignment_id, s]));

  const assignments: AssignmentDto[] = (assignmentsRaw ?? []).map((a) => {
    const sub = submissionMap.get(a.id as string) ?? null;
    return mapAssignmentRow(a as unknown as AssignmentRow, sub);
  });

  return success({ assignments });
};

export const getAssignmentDetail = async (
  supabase: SupabaseClient,
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
    assignmentRaw as unknown as AssignmentRow,
    (submissionRaw as unknown as SubmissionRow) ?? null,
  );

  return success({ assignment });
};
