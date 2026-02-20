import { failure, success, type HandlerResult, type ErrorResult } from '@/backend/http/response';
import type { AppSupabaseClient } from '@/backend/supabase/client';
import {
  instructorAssignmentErrorCodes,
  type InstructorAssignmentServiceError,
} from './error';
import type {
  CreateAssignmentBody,
  UpdateAssignmentBody,
  UpdateAssignmentStatusBody,
  SubmissionFilter,
  InstructorAssignmentDto,
  InstructorAssignmentResponse,
  InstructorCourseAssignmentsResponse,
  InstructorSubmissionItem,
  InstructorSubmissionListResponse,
} from './schema';

// --- 내부 Row 타입 ---

type AssignmentRow = {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  due_at: string;
  weight: string; // Supabase NUMERIC → string 반환
  allow_late: boolean;
  allow_resubmit: boolean;
  status: 'draft' | 'published' | 'closed';
  created_at: string;
  updated_at: string;
};

type CourseOwnerRow = {
  id: string;
  instructor_id: string;
};

type SubmissionRow = {
  id: string;
  learner_id: string;
  is_late: boolean;
  status: 'submitted' | 'graded' | 'resubmission_required' | 'invalidated';
  score: number | null;
  submitted_at: string;
};

const ASSIGNMENT_SELECT = `
  id,
  course_id,
  title,
  description,
  due_at,
  weight,
  allow_late,
  allow_resubmit,
  status,
  created_at,
  updated_at
` as const;

// --- 순수 함수 ---

const mapAssignmentRow = (row: AssignmentRow): InstructorAssignmentDto => ({
  id: row.id,
  courseId: row.course_id,
  title: row.title,
  description: row.description,
  dueAt: row.due_at,
  weight: Number(row.weight), // NUMERIC(5,2) → number 변환
  allowLate: row.allow_late,
  allowResubmit: row.allow_resubmit,
  status: row.status,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

// 허용: draft → published, published → closed
// 불허: 그 외 모든 전환 (closed → *, published → draft, draft → closed)
export const isAllowedAssignmentStatusTransition = (
  currentStatus: string,
  nextStatus: string,
): boolean => {
  if (currentStatus === 'draft' && nextStatus === 'published') return true;
  if (currentStatus === 'published' && nextStatus === 'closed') return true;
  return false;
};

// --- 내부 헬퍼 ---

const verifyAssignmentOwnership = async (
  supabase: AppSupabaseClient,
  assignmentId: string,
  instructorId: string,
): Promise<HandlerResult<AssignmentRow, InstructorAssignmentServiceError>> => {
  const { data: assignmentData, error: assignmentError } = await supabase
    .from('assignments')
    .select(ASSIGNMENT_SELECT)
    .eq('id', assignmentId)
    .maybeSingle();

  if (assignmentError) {
    return failure(500, instructorAssignmentErrorCodes.fetchError, assignmentError.message);
  }

  if (!assignmentData) {
    return failure(404, instructorAssignmentErrorCodes.notFound, '과제를 찾을 수 없습니다.');
  }

  const assignment = assignmentData as unknown as AssignmentRow;

  const { data: courseData, error: courseError } = await supabase
    .from('courses')
    .select('id, instructor_id')
    .eq('id', assignment.course_id)
    .maybeSingle();

  if (courseError) {
    return failure(500, instructorAssignmentErrorCodes.fetchError, courseError.message);
  }

  if (!courseData) {
    return failure(404, instructorAssignmentErrorCodes.notFound, '코스를 찾을 수 없습니다.');
  }

  const course = courseData as unknown as CourseOwnerRow;

  if (course.instructor_id !== instructorId) {
    return failure(403, instructorAssignmentErrorCodes.forbidden, '해당 과제에 대한 권한이 없습니다.');
  }

  return success(assignment);
};

const verifyCourseOwnershipForCreate = async (
  supabase: AppSupabaseClient,
  courseId: string,
  instructorId: string,
): Promise<HandlerResult<{ id: string }, InstructorAssignmentServiceError>> => {
  const { data, error } = await supabase
    .from('courses')
    .select('id, instructor_id')
    .eq('id', courseId)
    .maybeSingle();

  if (error) {
    return failure(500, instructorAssignmentErrorCodes.fetchError, error.message);
  }

  if (!data) {
    return failure(404, instructorAssignmentErrorCodes.notFound, '코스를 찾을 수 없습니다.');
  }

  const course = data as unknown as CourseOwnerRow;

  if (course.instructor_id !== instructorId) {
    return failure(403, instructorAssignmentErrorCodes.forbidden, '해당 코스에 대한 권한이 없습니다.');
  }

  return success({ id: course.id });
};

// --- 서비스 함수 ---

export const createAssignment = async (
  supabase: AppSupabaseClient,
  courseId: string,
  instructorId: string,
  body: CreateAssignmentBody,
): Promise<HandlerResult<InstructorAssignmentResponse, InstructorAssignmentServiceError>> => {
  const ownershipResult = await verifyCourseOwnershipForCreate(supabase, courseId, instructorId);
  if (!ownershipResult.ok) return ownershipResult as ErrorResult<InstructorAssignmentServiceError>;

  const { data, error } = await supabase
    .from('assignments')
    .insert({
      course_id: courseId,
      title: body.title,
      description: body.description ?? null,
      due_at: body.dueAt,
      weight: body.weight,
      allow_late: body.allowLate ?? false,
      allow_resubmit: body.allowResubmit ?? false,
      status: 'draft',
    })
    .select(ASSIGNMENT_SELECT)
    .single();

  if (error) {
    return failure(500, instructorAssignmentErrorCodes.fetchError, error.message);
  }

  return success({ assignment: mapAssignmentRow(data as unknown as AssignmentRow) }, 201);
};

export const updateAssignment = async (
  supabase: AppSupabaseClient,
  assignmentId: string,
  instructorId: string,
  body: UpdateAssignmentBody,
): Promise<HandlerResult<InstructorAssignmentResponse, InstructorAssignmentServiceError>> => {
  const ownershipResult = await verifyAssignmentOwnership(supabase, assignmentId, instructorId);
  if (!ownershipResult.ok) return ownershipResult as ErrorResult<InstructorAssignmentServiceError>;

  const { data, error } = await supabase
    .from('assignments')
    .update({
      title: body.title,
      description: body.description ?? null,
      due_at: body.dueAt,
      weight: body.weight,
      allow_late: body.allowLate ?? ownershipResult.data.allow_late,
      allow_resubmit: body.allowResubmit ?? ownershipResult.data.allow_resubmit,
    })
    .eq('id', assignmentId)
    .select(ASSIGNMENT_SELECT)
    .single();

  if (error) {
    return failure(500, instructorAssignmentErrorCodes.fetchError, error.message);
  }

  return success({ assignment: mapAssignmentRow(data as unknown as AssignmentRow) });
};

export const updateAssignmentStatus = async (
  supabase: AppSupabaseClient,
  assignmentId: string,
  instructorId: string,
  body: UpdateAssignmentStatusBody,
): Promise<HandlerResult<InstructorAssignmentResponse, InstructorAssignmentServiceError>> => {
  const ownershipResult = await verifyAssignmentOwnership(supabase, assignmentId, instructorId);
  if (!ownershipResult.ok) return ownershipResult as ErrorResult<InstructorAssignmentServiceError>;

  const currentStatus = ownershipResult.data.status;

  if (!isAllowedAssignmentStatusTransition(currentStatus, body.status)) {
    return failure(
      400,
      instructorAssignmentErrorCodes.invalidStatus,
      `'${currentStatus}' 상태에서 '${body.status}'로 전환할 수 없습니다.`,
    );
  }

  const { data, error } = await supabase
    .from('assignments')
    .update({ status: body.status })
    .eq('id', assignmentId)
    .select(ASSIGNMENT_SELECT)
    .single();

  if (error) {
    return failure(500, instructorAssignmentErrorCodes.fetchError, error.message);
  }

  return success({ assignment: mapAssignmentRow(data as unknown as AssignmentRow) });
};

export const listAssignmentSubmissions = async (
  supabase: AppSupabaseClient,
  assignmentId: string,
  instructorId: string,
  filter: SubmissionFilter,
): Promise<HandlerResult<InstructorSubmissionListResponse, InstructorAssignmentServiceError>> => {
  const ownershipResult = await verifyAssignmentOwnership(supabase, assignmentId, instructorId);
  if (!ownershipResult.ok) return ownershipResult as ErrorResult<InstructorAssignmentServiceError>;

  let query = supabase
    .from('submissions')
    .select('id, learner_id, is_late, status, score, submitted_at')
    .eq('assignment_id', assignmentId)
    .order('submitted_at', { ascending: false });

  // 필터 적용 (단일 필터만 허용, spec 비즈니스 룰)
  if (filter === 'pending') {
    query = query.eq('status', 'submitted');
  } else if (filter === 'late') {
    query = query.eq('is_late', true);
  } else if (filter === 'resubmission') {
    query = query.eq('status', 'resubmission_required');
  }

  const { data: submissionsRaw, error: submissionsError } = await query;

  if (submissionsError) {
    return failure(500, instructorAssignmentErrorCodes.fetchError, submissionsError.message);
  }

  const submissions = (submissionsRaw ?? []) as SubmissionRow[];

  // 학습자명 2-step 조회
  const learnerIds = [...new Set(submissions.map((s) => s.learner_id))];

  let profileMap = new Map<string, string>();

  if (learnerIds.length > 0) {
    const { data: profilesRaw, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name')
      .in('id', learnerIds);

    if (profilesError) {
      return failure(500, instructorAssignmentErrorCodes.fetchError, profilesError.message);
    }

    profileMap = new Map(
      (profilesRaw ?? []).map((p) => [p.id, p.name as string]),
    );
  }

  const result: InstructorSubmissionItem[] = submissions.map((s) => ({
    id: s.id,
    learnerId: s.learner_id,
    learnerName: profileMap.get(s.learner_id) ?? '알 수 없음',
    submittedAt: s.submitted_at,
    isLate: s.is_late,
    status: s.status,
    score: s.score,
  }));

  return success({
    submissions: result,
    totalCount: result.length,
  });
};

export const getInstructorAssignment = async (
  supabase: AppSupabaseClient,
  assignmentId: string,
  instructorId: string,
): Promise<HandlerResult<InstructorAssignmentResponse, InstructorAssignmentServiceError>> => {
  const ownershipResult = await verifyAssignmentOwnership(supabase, assignmentId, instructorId);
  if (!ownershipResult.ok) return ownershipResult as ErrorResult<InstructorAssignmentServiceError>;

  return success({ assignment: mapAssignmentRow(ownershipResult.data) });
};

export const listInstructorCourseAssignments = async (
  supabase: AppSupabaseClient,
  courseId: string,
  instructorId: string,
): Promise<HandlerResult<InstructorCourseAssignmentsResponse, InstructorAssignmentServiceError>> => {
  const ownershipResult = await verifyCourseOwnershipForCreate(supabase, courseId, instructorId);
  if (!ownershipResult.ok) return ownershipResult as ErrorResult<InstructorAssignmentServiceError>;

  const { data, error } = await supabase
    .from('assignments')
    .select(ASSIGNMENT_SELECT)
    .eq('course_id', courseId)
    .order('created_at', { ascending: false });

  if (error) {
    return failure(500, instructorAssignmentErrorCodes.fetchError, error.message);
  }

  const assignments = (data ?? []) as unknown as AssignmentRow[];

  return success({ assignments: assignments.map(mapAssignmentRow) });
};
