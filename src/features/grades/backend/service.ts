import type { AppSupabaseClient } from '@/backend/supabase/client';
import type { Tables } from '@/types/database.types';

import { failure, success, type HandlerResult } from '@/backend/http/response';
import { gradeErrorCodes, type GradeServiceError } from './error';
import type {
  AssignmentGradeItem,
  GradesResponse,
  SubmissionGradeInfo,
} from './schema';

type AssignmentRow = {
  id: string;
  title: string;
  due_at: string;
  weight: number; // Supabase NUMERIC -> string
};

type SubmissionRow = {
  id: string;
  assignment_id: string;
  status: 'submitted' | 'graded' | 'resubmission_required';
  is_late: boolean;
  score: number | null;
  feedback: string | null;
  submitted_at: string;
  graded_at: string | null;
};

const mapSubmissionRow = (row: SubmissionRow): SubmissionGradeInfo => ({
  id: row.id,
  status: row.status,
  isLate: row.is_late,
  score: row.score,
  feedback: row.feedback,
  submittedAt: row.submitted_at,
  gradedAt: row.graded_at,
});

const verifyEnrollmentForGrades = async (
  supabase: AppSupabaseClient,
  courseId: string,
  learnerId: string,
): Promise<HandlerResult<null, GradeServiceError>> => {
  const { data, error } = await supabase
    .from('enrollments')
    .select('id')
    .eq('course_id', courseId)
    .eq('learner_id', learnerId)
    .is('cancelled_at', null)
    .maybeSingle();

  if (error) {
    return failure(500, gradeErrorCodes.fetchError, error.message);
  }

  if (!data) {
    return failure(403, gradeErrorCodes.enrollmentRequired, '수강 중인 코스가 아닙니다.');
  }

  return success(null);
};

// 채점된 제출물이 없으면 null 반환, 그 외 가중 평균 계산
const calculateCurrentGrade = (
  assignments: AssignmentRow[],
  submissionMap: Map<string, SubmissionRow>,
): number | null => {
  let weightedScoreSum = 0;
  let gradedWeightSum = 0;

  for (const assignment of assignments) {
    const submission = submissionMap.get(assignment.id);
    if (submission?.status === 'graded' && submission.score !== null) {
      const weight = Number(assignment.weight);
      weightedScoreSum += submission.score * weight;
      gradedWeightSum += weight;
    }
  }

  if (gradedWeightSum === 0) return null;

  return weightedScoreSum / gradedWeightSum;
};

export const getGrades = async (
  supabase: AppSupabaseClient,
  courseId: string,
  learnerId: string,
): Promise<HandlerResult<GradesResponse, GradeServiceError>> => {
  const enrollmentCheck = await verifyEnrollmentForGrades(supabase, courseId, learnerId);
  if (!enrollmentCheck.ok) return enrollmentCheck;

  const { data: assignmentsRaw, error: assignmentsError } = await supabase
    .from('assignments')
    .select('id, title, due_at, weight')
    .eq('course_id', courseId)
    .eq('status', 'published')
    .order('due_at', { ascending: true });

  if (assignmentsError) {
    return failure(500, gradeErrorCodes.fetchError, assignmentsError.message);
  }

  const assignments = (assignmentsRaw ?? []) as AssignmentRow[];
  const assignmentIds = assignments.map((a) => a.id);

  let submissions: SubmissionRow[] = [];
  if (assignmentIds.length > 0) {
    const { data: submissionsRaw, error: submissionsError } = await supabase
      .from('submissions')
      .select('id, assignment_id, status, is_late, score, feedback, submitted_at, graded_at')
      .eq('learner_id', learnerId)
      .in('assignment_id', assignmentIds);

    if (submissionsError) {
      return failure(500, gradeErrorCodes.fetchError, submissionsError.message);
    }

    submissions = (submissionsRaw ?? []) as SubmissionRow[];
  }

  const submissionMap = new Map(submissions.map((s) => [s.assignment_id, s]));

  const currentGrade = calculateCurrentGrade(assignments, submissionMap);

  const assignmentGradeItems: AssignmentGradeItem[] = assignments.map((a) => {
    const sub = submissionMap.get(a.id) ?? null;
    return {
      id: a.id,
      title: a.title,
      dueAt: a.due_at,
      weight: a.weight,
      mySubmission: sub ? mapSubmissionRow(sub) : null,
    };
  });

  return success({
    currentGrade,
    assignments: assignmentGradeItems,
  });
};
