import type { SupabaseClient } from '@supabase/supabase-js';
import { failure, success, type HandlerResult } from '@/backend/http/response';
import { dashboardErrorCodes, type DashboardServiceError } from './error';
import type {
  LearnerDashboardResponse,
  EnrolledCourse,
  UpcomingAssignment,
  RecentFeedback,
} from './schema';

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
