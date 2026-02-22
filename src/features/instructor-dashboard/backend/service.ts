import type { SupabaseClient } from '@supabase/supabase-js';
import { failure, success, type HandlerResult } from '@/backend/http/response';
import {
  instructorDashboardErrorCodes,
  type InstructorDashboardServiceError,
} from './error';
import type {
  InstructorCourseItem,
  RecentSubmissionItem,
  InstructorDashboardResponse,
} from './schema';

type CourseRow = {
  id: string;
  title: string;
  status: 'draft' | 'published' | 'archived';
  category: { id: string; name: string } | null;
  difficulty: { id: string; name: string } | null;
};

type AssignmentRow = {
  id: string;
  course_id: string;
};

type PendingSubmissionRow = {
  id: string;
  assignment_id: string;
};

type RecentSubmissionRow = {
  id: string;
  submitted_at: string;
  assignment_id: string;
  learner_id: string;
};

type ProfileRow = {
  id: string;
  name: string;
};

type AssignmentTitleRow = {
  id: string;
  title: string;
};

// pendingMap(courseId => pendingCount)과 courses를 합산하여 InstructorCourseItem 배열 생성
export const mergePendingCounts = (
  courses: CourseRow[],
  pendingMap: Map<string, number>,
): InstructorCourseItem[] =>
  courses.map((c) => ({
    id: c.id,
    title: c.title,
    status: c.status,
    pendingCount: pendingMap.get(c.id) ?? 0,
    categoryName: c.category?.name ?? null,
    difficultyName: c.difficulty?.name ?? null,
  }));

export const getInstructorDashboard = async (
  supabase: SupabaseClient,
  instructorId: string,
): Promise<HandlerResult<InstructorDashboardResponse, InstructorDashboardServiceError>> => {
  // 1. 내 코스 목록 조회 (전체 status, created_at DESC)
  const { data: coursesRaw, error: coursesError } = await supabase
    .from('courses')
    .select('id, title, status, category:categories!category_id(id, name), difficulty:difficulties!difficulty_id(id, name)')
    .eq('instructor_id', instructorId)
    .order('created_at', { ascending: false });

  if (coursesError) {
    return failure(500, instructorDashboardErrorCodes.fetchError, coursesError.message);
  }

  const courses = (coursesRaw ?? []) as unknown as CourseRow[];
  const courseIds = courses.map((c) => c.id);

  const pendingMap = new Map<string, number>();
  let recentSubmissions: RecentSubmissionItem[] = [];

  // meta: 필터용 카테고리·난이도 목록
  const [categoriesResult, difficultiesResult] = await Promise.all([
    supabase.from('categories').select('id, name').eq('is_active', true).order('name', { ascending: true }),
    supabase.from('difficulties').select('id, name').eq('is_active', true).order('name', { ascending: true }),
  ]);

  const meta = {
    categories: (categoriesResult.data ?? []) as { id: string; name: string }[],
    difficulties: (difficultiesResult.data ?? []) as { id: string; name: string }[],
  };

  if (courseIds.length === 0) {
    return success({
      courses: [],
      totalPendingCount: 0,
      recentSubmissions: [],
      meta,
    });
  }

  // Step A: 내 코스의 assignment_id 목록 조회 (2-step 쿼리)
  const { data: assignmentsRaw, error: assignmentsError } = await supabase
    .from('assignments')
    .select('id, course_id')
    .in('course_id', courseIds);

  if (assignmentsError) {
    return failure(500, instructorDashboardErrorCodes.fetchError, assignmentsError.message);
  }

  const assignments = (assignmentsRaw ?? []) as unknown as AssignmentRow[];
  const assignmentIdToCourseId = new Map(assignments.map((a) => [a.id, a.course_id]));
  const assignmentIds = assignments.map((a) => a.id);

  if (assignmentIds.length > 0) {
    // 2. 채점 대기 수 집계 (submitted 상태만)
    const { data: pendingRaw, error: pendingError } = await supabase
      .from('submissions')
      .select('id, assignment_id')
      .in('assignment_id', assignmentIds)
      .eq('status', 'submitted');

    if (pendingError) {
      return failure(500, instructorDashboardErrorCodes.fetchError, pendingError.message);
    }

    for (const row of (pendingRaw ?? []) as unknown as PendingSubmissionRow[]) {
      const courseId = assignmentIdToCourseId.get(row.assignment_id);
      if (courseId) {
        pendingMap.set(courseId, (pendingMap.get(courseId) ?? 0) + 1);
      }
    }

    // 3. 최근 제출물 10건 조회
    const { data: submissionsRaw, error: submissionsError } = await supabase
      .from('submissions')
      .select('id, submitted_at, assignment_id, learner_id')
      .in('assignment_id', assignmentIds)
      .order('submitted_at', { ascending: false })
      .limit(10);

    if (submissionsError) {
      return failure(500, instructorDashboardErrorCodes.fetchError, submissionsError.message);
    }

    const submissionRows = (submissionsRaw ?? []) as unknown as RecentSubmissionRow[];

    if (submissionRows.length > 0) {
      const learnerIds = [...new Set(submissionRows.map((s) => s.learner_id))];
      const submissionAssignmentIds = [...new Set(submissionRows.map((s) => s.assignment_id))];

      const [profilesResult, assignmentTitlesResult] = await Promise.all([
        supabase.from('profiles').select('id, name').in('id', learnerIds),
        supabase.from('assignments').select('id, title').in('id', submissionAssignmentIds),
      ]);

      if (profilesResult.error) {
        return failure(
          500,
          instructorDashboardErrorCodes.fetchError,
          profilesResult.error.message,
        );
      }

      if (assignmentTitlesResult.error) {
        return failure(
          500,
          instructorDashboardErrorCodes.fetchError,
          assignmentTitlesResult.error.message,
        );
      }

      const profileMap = new Map(
        (profilesResult.data as unknown as ProfileRow[]).map((p) => [p.id, p.name]),
      );
      const assignmentTitleMap = new Map(
        (assignmentTitlesResult.data as unknown as AssignmentTitleRow[]).map((a) => [
          a.id,
          a.title,
        ]),
      );
      const courseIdToTitle = new Map(courses.map((c) => [c.id, c.title]));

      recentSubmissions = submissionRows.map((s) => ({
        submissionId: s.id,
        learnerName: profileMap.get(s.learner_id) ?? '알 수 없음',
        assignmentTitle: assignmentTitleMap.get(s.assignment_id) ?? '알 수 없음',
        courseTitle:
          courseIdToTitle.get(assignmentIdToCourseId.get(s.assignment_id) ?? '') ??
          '알 수 없음',
        submittedAt: s.submitted_at,
      }));
    }
  }

  const courseItems = mergePendingCounts(courses, pendingMap);
  const totalPendingCount = courseItems.reduce((sum, c) => sum + c.pendingCount, 0);

  return success({
    courses: courseItems,
    totalPendingCount,
    recentSubmissions,
    meta,
  });
};
