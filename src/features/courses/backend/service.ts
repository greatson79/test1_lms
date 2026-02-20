import { failure, success, type HandlerResult } from '@/backend/http/response';
import type { AppSupabaseClient } from '@/backend/supabase/client';
import type { Tables } from '@/types/database.types';
import { courseErrorCodes, type CourseServiceError } from './error';
import type {
  CourseListQuery,
  CourseDto,
  CourseDetailDto,
  CategoryDto,
  DifficultyDto,
  CourseListResponse,
  CourseDetailResponse,
} from './schema';

type CourseRow = Pick<Tables<'courses'>, 'id' | 'title' | 'description' | 'curriculum' | 'created_at'> & {
  category: { id: string; name: string } | null;
  difficulty: { id: string; name: string } | null;
  instructor: { name: string } | null;
  enrollments: { id: string }[];
};

const COURSE_SELECT = `
  id,
  title,
  description,
  curriculum,
  created_at,
  category:categories!category_id(id, name),
  difficulty:difficulties!difficulty_id(id, name),
  instructor:profiles!instructor_id(name),
  enrollments(id)
` as const;

const mapCourseRow = (row: CourseRow): CourseDto => ({
  id: row.id,
  title: row.title,
  description: row.description,
  category: row.category ?? null,
  difficulty: row.difficulty ?? null,
  instructorName: row.instructor?.name ?? '알 수 없음',
  enrollmentCount: Array.isArray(row.enrollments) ? row.enrollments.length : 0,
  createdAt: row.created_at,
});

export const listCourses = async (
  supabase: AppSupabaseClient,
  params: CourseListQuery,
): Promise<HandlerResult<CourseListResponse, CourseServiceError>> => {
  let query = supabase
    .from('courses')
    .select(COURSE_SELECT)
    .eq('status', 'published');

  if (params.search) {
    query = query.ilike('title', `%${params.search}%`);
  }

  if (params.categoryId) {
    query = query.eq('category_id', params.categoryId);
  }

  if (params.difficultyId) {
    query = query.eq('difficulty_id', params.difficultyId);
  }

  if (params.sort !== 'popular') {
    query = query.order('created_at', { ascending: false });
  }

  const { data: coursesRaw, error: coursesError } = await query;

  if (coursesError) {
    return failure(500, courseErrorCodes.fetchError, coursesError.message);
  }

  const rows = (coursesRaw ?? []) as CourseRow[];
  let courses: CourseDto[] = rows.map(mapCourseRow);

  if (params.sort === 'popular') {
    courses = [...courses].sort((a, b) => b.enrollmentCount - a.enrollmentCount);
  }

  const { data: categoriesRaw, error: categoriesError } = await supabase
    .from('categories')
    .select('id, name')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (categoriesError) {
    return failure(500, courseErrorCodes.fetchError, categoriesError.message);
  }

  const { data: difficultiesRaw, error: difficultiesError } = await supabase
    .from('difficulties')
    .select('id, name')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (difficultiesError) {
    return failure(500, courseErrorCodes.fetchError, difficultiesError.message);
  }

  return success({
    courses,
    meta: {
      categories: (categoriesRaw ?? []) as CategoryDto[],
      difficulties: (difficultiesRaw ?? []) as DifficultyDto[],
    },
  });
};

export const getCourseDetail = async (
  supabase: AppSupabaseClient,
  courseId: string,
  learnerId: string | null,
): Promise<HandlerResult<CourseDetailResponse, CourseServiceError>> => {
  const { data: courseRaw, error: courseError } = await supabase
    .from('courses')
    .select(COURSE_SELECT)
    .eq('id', courseId)
    .eq('status', 'published')
    .maybeSingle();

  if (courseError) {
    return failure(500, courseErrorCodes.fetchError, courseError.message);
  }

  if (!courseRaw) {
    return failure(404, courseErrorCodes.notFound, '코스를 찾을 수 없습니다.');
  }

  const row = courseRaw as CourseRow;
  const courseDto = mapCourseRow(row);

  let enrollmentStatus: 'active' | 'cancelled' | null = null;

  if (learnerId) {
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id, cancelled_at')
      .eq('course_id', courseId)
      .eq('learner_id', learnerId)
      .maybeSingle();

    if (enrollment) {
      enrollmentStatus = enrollment.cancelled_at ? 'cancelled' : 'active';
    }
  }

  const course: CourseDetailDto = {
    ...courseDto,
    curriculum: row.curriculum,
    enrollmentStatus,
  };

  return success({ course });
};
