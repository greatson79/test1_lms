import type { SupabaseClient } from '@supabase/supabase-js';
import { failure, success, type HandlerResult } from '@/backend/http/response';
import { dashboardErrorCodes, type DashboardServiceError } from './error';
import type {
  LearnerDashboardResponse,
  EnrolledCourse,
  UpcomingAssignment,
  RecentFeedback,
  AssignmentGrade,
  CourseGradesResponse,
} from './schema';
import { assignmentSubmissionStatuses } from './schema';

type CourseRow = {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  category: { id: string; name: string } | null;
  difficulty: { id: string; name: string } | null;
  instructor: { name: string } | null;
  enrollments: { id: string }[];
};

type AssignmentRow = {
  id: string;
  course_id: string;
  title: string;
  due_at: string;
  weight: string;
};

type SubmissionProgressRow = {
  id: string;
  assignment_id: string;
  status: string;
};

type FeedbackRow = {
  id: string;
  assignment_id: string;
  score: number | null;
  feedback: string | null;
  graded_at: string | null;
  assignment: {
    id: string;
    course_id: string;
    title: string;
    course: { id: string; title: string } | null;
  } | null;
};

export const calculateProgress = (
  courseId: string,
  assignments: Pick<AssignmentRow, 'id' | 'course_id'>[],
  submissions: Pick<SubmissionProgressRow, 'assignment_id' | 'status'>[],
): { completedCount: number; totalCount: number } => {
  const courseAssignmentIds = new Set(
    assignments.filter((a) => a.course_id === courseId).map((a) => a.id),
  );
  const totalCount = courseAssignmentIds.size;

  if (totalCount === 0) return { completedCount: 0, totalCount: 0 };

  const completedCount = submissions.filter(
    (s) =>
      courseAssignmentIds.has(s.assignment_id) && s.status !== 'resubmission_required',
  ).length;

  return { completedCount, totalCount };
};

export const getLearnerDashboard = async (
  supabase: SupabaseClient,
  learnerId: string,
): Promise<HandlerResult<LearnerDashboardResponse, DashboardServiceError>> => {
  const { data: enrollmentRows, error: enrollmentError } = await supabase
    .from('enrollments')
    .select('course_id')
    .eq('learner_id', learnerId)
    .is('cancelled_at', null);

  if (enrollmentError) {
    return failure(500, dashboardErrorCodes.fetchError, enrollmentError.message);
  }

  const courseIds = (enrollmentRows ?? []).map((e) => e.course_id as string);

  if (courseIds.length === 0) {
    return success({ courses: [], upcomingAssignments: [], recentFeedbacks: [] });
  }

  const { data: coursesRaw, error: coursesError } = await supabase
    .from('courses')
    .select(`
      id, title, description, created_at,
      category:categories!category_id(id, name),
      difficulty:difficulties!difficulty_id(id, name),
      instructor:profiles!instructor_id(name),
      enrollments(id)
    `)
    .in('id', courseIds)
    .eq('status', 'published');

  if (coursesError) {
    return failure(500, dashboardErrorCodes.fetchError, coursesError.message);
  }

  const { data: assignmentsRaw, error: assignmentsError } = await supabase
    .from('assignments')
    .select('id, course_id, title, due_at, weight')
    .in('course_id', courseIds)
    .eq('status', 'published');

  if (assignmentsError) {
    return failure(500, dashboardErrorCodes.fetchError, assignmentsError.message);
  }

  const assignments = (assignmentsRaw ?? []) as unknown as AssignmentRow[];
  const assignmentIds = assignments.map((a) => a.id);

  let progressSubmissions: SubmissionProgressRow[] = [];

  if (assignmentIds.length > 0) {
    const { data: submissionsRaw, error: submissionsError } = await supabase
      .from('submissions')
      .select('id, assignment_id, status')
      .eq('learner_id', learnerId)
      .in('assignment_id', assignmentIds);

    if (submissionsError) {
      return failure(500, dashboardErrorCodes.fetchError, submissionsError.message);
    }

    progressSubmissions = (submissionsRaw ?? []) as unknown as SubmissionProgressRow[];
  }

  const courseRows = (coursesRaw ?? []) as unknown as CourseRow[];
  const courseMap = new Map(courseRows.map((c) => [c.id, c]));
  const submissionByAssignment = new Map(progressSubmissions.map((s) => [s.assignment_id, s]));

  const courses: EnrolledCourse[] = courseRows.map((c) => {
    const { completedCount, totalCount } = calculateProgress(
      c.id,
      assignments,
      progressSubmissions,
    );

    return {
      id: c.id,
      title: c.title,
      description: c.description ?? null,
      category: c.category ?? null,
      difficulty: c.difficulty ?? null,
      instructorName: c.instructor?.name ?? '알 수 없음',
      enrollmentCount: Array.isArray(c.enrollments) ? c.enrollments.length : 0,
      createdAt: c.created_at,
      completedCount,
      totalCount,
    };
  });

  const now = new Date().toISOString();
  const upcomingAssignments: UpcomingAssignment[] = assignments
    .filter((a) => a.due_at > now)
    .sort((a, b) => a.due_at.localeCompare(b.due_at))
    .map((a) => {
      const course = courseMap.get(a.course_id);
      return {
        id: a.id,
        courseId: a.course_id,
        courseTitle: course?.title ?? '알 수 없음',
        title: a.title,
        dueAt: a.due_at,
        weight: Number(a.weight),
        isSubmitted: submissionByAssignment.has(a.id),
      };
    });

  const { data: feedbacksRaw, error: feedbacksError } = await supabase
    .from('submissions')
    .select(`
      id, assignment_id, score, feedback, graded_at,
      assignment:assignments!assignment_id(
        id, course_id, title,
        course:courses!course_id(id, title)
      )
    `)
    .eq('learner_id', learnerId)
    .eq('status', 'graded')
    .order('graded_at', { ascending: false })
    .limit(5);

  if (feedbacksError) {
    return failure(500, dashboardErrorCodes.fetchError, feedbacksError.message);
  }

  const recentFeedbacks: RecentFeedback[] = (
    (feedbacksRaw ?? []) as unknown as FeedbackRow[]
  ).map((f) => ({
    submissionId: f.id,
    assignmentId: f.assignment_id,
    courseId: f.assignment?.course?.id ?? '',
    assignmentTitle: f.assignment?.title ?? '알 수 없음',
    courseTitle: f.assignment?.course?.title ?? '알 수 없음',
    score: f.score ?? null,
    feedback: f.feedback ?? null,
    gradedAt: f.graded_at ?? null,
  }));

  return success({ courses, upcomingAssignments, recentFeedbacks });
};

// --- Grades ---

type GradeAssignmentRow = {
  id: string;
  title: string;
  weight: string;
  due_at: string;
};

type GradeSubmissionRow = {
  assignment_id: string;
  score: number | null;
  feedback: string | null;
  graded_at: string | null;
  status: string;
  is_late: boolean;
};

const roundGrade = (value: number) => Math.round(value * 10) / 10;

const toSubmissionStatus = (raw: string): AssignmentGrade['submissionStatus'] => {
  const valid = assignmentSubmissionStatuses as readonly string[];
  return valid.includes(raw)
    ? (raw as AssignmentGrade['submissionStatus'])
    : 'submitted';
};

export const getCourseGrades = async (
  supabase: SupabaseClient,
  learnerId: string,
  courseId: string,
): Promise<HandlerResult<CourseGradesResponse, DashboardServiceError>> => {
  // 1. 수강 여부 확인
  const { data: enrollment, error: enrollmentError } = await supabase
    .from('enrollments')
    .select('id')
    .eq('learner_id', learnerId)
    .eq('course_id', courseId)
    .is('cancelled_at', null)
    .maybeSingle();

  if (enrollmentError) {
    return failure(500, dashboardErrorCodes.fetchError, enrollmentError.message);
  }

  if (!enrollment) {
    return failure(403, dashboardErrorCodes.notEnrolled, '수강 중이 아닌 코스입니다.');
  }

  // 2. 코스 기본 정보
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('id, title')
    .eq('id', courseId)
    .maybeSingle<{ id: string; title: string }>();

  if (courseError || !course) {
    return failure(404, dashboardErrorCodes.fetchError, '코스를 찾을 수 없습니다.');
  }

  // 3. 코스의 published 과제 목록
  const { data: assignmentsRaw, error: assignmentsError } = await supabase
    .from('assignments')
    .select('id, title, weight, due_at')
    .eq('course_id', courseId)
    .eq('status', 'published')
    .order('due_at', { ascending: true });

  if (assignmentsError) {
    return failure(500, dashboardErrorCodes.fetchError, assignmentsError.message);
  }

  const gradeAssignments = (assignmentsRaw ?? []) as unknown as GradeAssignmentRow[];

  if (gradeAssignments.length === 0) {
    return success({
      courseId,
      courseTitle: course.title,
      assignments: [],
      currentGpa: null,
      expectedFinalGrade: 0,
      totalWeight: 0,
      gradedWeight: 0,
    });
  }

  // 4. 학습자의 제출 현황
  const assignmentIds = gradeAssignments.map((a) => a.id);
  const { data: submissionsRaw, error: submissionsError } = await supabase
    .from('submissions')
    .select('assignment_id, score, feedback, graded_at, status, is_late')
    .eq('learner_id', learnerId)
    .in('assignment_id', assignmentIds);

  if (submissionsError) {
    return failure(500, dashboardErrorCodes.fetchError, submissionsError.message);
  }

  const submissionMap = new Map(
    ((submissionsRaw ?? []) as unknown as GradeSubmissionRow[]).map((s) => [
      s.assignment_id,
      s,
    ]),
  );

  // 5. 성적 계산
  let gradedWeightedScoreSum = 0;
  let gradedWeightSum = 0;
  let totalWeightSum = 0;

  const assignments: AssignmentGrade[] = gradeAssignments.map((a) => {
    const weight = Number(a.weight);
    totalWeightSum += weight;

    const submission = submissionMap.get(a.id);

    if (!submission) {
      return {
        assignmentId: a.id,
        assignmentTitle: a.title,
        weight,
        dueAt: a.due_at,
        submissionStatus: 'not_submitted' as const,
        score: null,
        feedback: null,
        gradedAt: null,
        isLate: false,
      };
    }

    if (submission.status === 'graded' && submission.score !== null) {
      gradedWeightedScoreSum += submission.score * weight;
      gradedWeightSum += weight;
    }

    return {
      assignmentId: a.id,
      assignmentTitle: a.title,
      weight,
      dueAt: a.due_at,
      submissionStatus: toSubmissionStatus(submission.status),
      score: submission.score ?? null,
      feedback: submission.feedback ?? null,
      gradedAt: submission.graded_at ?? null,
      isLate: submission.is_late,
    };
  });

  // 현재 평점: 채점된 과제들의 가중 평균 (퀄리티 지표)
  const currentGpa =
    gradedWeightSum > 0 ? roundGrade(gradedWeightedScoreSum / gradedWeightSum) : null;

  // 예상 최종 성적: 전체 과제 대비 (미제출 = 0점, 달성도 지표)
  const expectedFinalGrade =
    totalWeightSum > 0 ? roundGrade(gradedWeightedScoreSum / totalWeightSum) : 0;

  return success({
    courseId,
    courseTitle: course.title,
    assignments,
    currentGpa,
    expectedFinalGrade,
    totalWeight: totalWeightSum,
    gradedWeight: gradedWeightSum,
  });
};
