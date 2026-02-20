import { failure, success, type HandlerResult, type ErrorResult } from '@/backend/http/response';
import type { AppSupabaseClient } from '@/backend/supabase/client';
import {
  instructorCourseErrorCodes,
  type InstructorCourseServiceError,
} from './error';
import type {
  CreateCourseBody,
  UpdateCourseBody,
  UpdateCourseStatusBody,
  InstructorCourseDto,
  InstructorCourseResponse,
  InstructorCourseWithMetaResponse,
  InstructorCourseMetaOnlyResponse,
} from './schema';

// --- 내부 Row 타입 ---
type CourseRow = {
  id: string;
  instructor_id: string;
  title: string;
  description: string | null;
  curriculum: string | null;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
  category: { id: string; name: string } | null;
  difficulty: { id: string; name: string } | null;
};

type MetaRow = {
  id: string;
  name: string;
};

const COURSE_SELECT = `
  id,
  instructor_id,
  title,
  description,
  curriculum,
  status,
  created_at,
  updated_at,
  category:categories!category_id(id, name),
  difficulty:difficulties!difficulty_id(id, name)
` as const;

// --- mapper ---
const mapCourseRow = (row: CourseRow): InstructorCourseDto => ({
  id: row.id,
  title: row.title,
  description: row.description,
  curriculum: row.curriculum,
  status: row.status,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  category: row.category ?? null,
  difficulty: row.difficulty ?? null,
});

// --- 상태 전환 허용 여부 순수 함수 ---
// 허용: draft -> published, published -> archived
// 불허: 그 외 모든 전환
export const isAllowedStatusTransition = (
  currentStatus: string,
  nextStatus: string,
): boolean => {
  if (currentStatus === 'draft' && nextStatus === 'published') return true;
  if (currentStatus === 'published' && nextStatus === 'archived') return true;
  return false;
};

// --- 소유권 검증 헬퍼 (feature 내 독립 정의) ---
const verifyCourseOwnership = async (
  supabase: AppSupabaseClient,
  courseId: string,
  instructorId: string,
): Promise<HandlerResult<CourseRow, InstructorCourseServiceError>> => {
  const { data, error } = await supabase
    .from('courses')
    .select(COURSE_SELECT)
    .eq('id', courseId)
    .maybeSingle();

  if (error) {
    return failure(500, instructorCourseErrorCodes.fetchError, error.message);
  }

  if (!data) {
    return failure(404, instructorCourseErrorCodes.notFound, '코스를 찾을 수 없습니다.');
  }

  const row = data as unknown as CourseRow;

  if (row.instructor_id !== instructorId) {
    return failure(403, instructorCourseErrorCodes.forbidden, '해당 코스에 대한 권한이 없습니다.');
  }

  return success(row);
};

// --- 메타 전용 조회 (생성 페이지용) ---
export const getInstructorCourseMeta = async (
  supabase: AppSupabaseClient,
): Promise<HandlerResult<InstructorCourseMetaOnlyResponse, InstructorCourseServiceError>> => {
  const [categoriesResult, difficultiesResult] = await Promise.all([
    supabase.from('categories').select('id, name').eq('is_active', true).order('name', { ascending: true }),
    supabase.from('difficulties').select('id, name').eq('is_active', true).order('name', { ascending: true }),
  ]);

  if (categoriesResult.error) {
    return failure(500, instructorCourseErrorCodes.fetchError, categoriesResult.error.message);
  }

  if (difficultiesResult.error) {
    return failure(500, instructorCourseErrorCodes.fetchError, difficultiesResult.error.message);
  }

  return success({
    meta: {
      categories: (categoriesResult.data ?? []) as MetaRow[],
      difficulties: (difficultiesResult.data ?? []) as MetaRow[],
    },
  });
};

// --- 코스 상세 + 메타 조회 ---
export const getInstructorCourse = async (
  supabase: AppSupabaseClient,
  courseId: string,
  instructorId: string,
): Promise<HandlerResult<InstructorCourseWithMetaResponse, InstructorCourseServiceError>> => {
  const ownershipResult = await verifyCourseOwnership(supabase, courseId, instructorId);
  if (!ownershipResult.ok) return ownershipResult as ErrorResult<InstructorCourseServiceError>;

  const course = mapCourseRow(ownershipResult.data);

  const [categoriesResult, difficultiesResult] = await Promise.all([
    supabase.from('categories').select('id, name').eq('is_active', true).order('name', { ascending: true }),
    supabase.from('difficulties').select('id, name').eq('is_active', true).order('name', { ascending: true }),
  ]);

  if (categoriesResult.error) {
    return failure(500, instructorCourseErrorCodes.fetchError, categoriesResult.error.message);
  }

  if (difficultiesResult.error) {
    return failure(500, instructorCourseErrorCodes.fetchError, difficultiesResult.error.message);
  }

  return success({
    course,
    meta: {
      categories: (categoriesResult.data ?? []) as MetaRow[],
      difficulties: (difficultiesResult.data ?? []) as MetaRow[],
    },
  });
};

// --- 코스 생성 ---
export const createCourse = async (
  supabase: AppSupabaseClient,
  instructorId: string,
  body: CreateCourseBody,
): Promise<HandlerResult<InstructorCourseResponse, InstructorCourseServiceError>> => {
  if (body.categoryId) {
    const { data: cat } = await supabase
      .from('categories')
      .select('id, is_active')
      .eq('id', body.categoryId)
      .maybeSingle();

    if (!cat || !cat.is_active) {
      return failure(400, instructorCourseErrorCodes.inactiveMeta, '사용할 수 없는 카테고리입니다.');
    }
  }

  if (body.difficultyId) {
    const { data: diff } = await supabase
      .from('difficulties')
      .select('id, is_active')
      .eq('id', body.difficultyId)
      .maybeSingle();

    if (!diff || !diff.is_active) {
      return failure(400, instructorCourseErrorCodes.inactiveMeta, '사용할 수 없는 난이도입니다.');
    }
  }

  const { data, error } = await supabase
    .from('courses')
    .insert({
      instructor_id: instructorId,
      title: body.title,
      description: body.description ?? null,
      category_id: body.categoryId ?? null,
      difficulty_id: body.difficultyId ?? null,
      curriculum: body.curriculum ?? null,
      status: 'draft',
    })
    .select(COURSE_SELECT)
    .single();

  if (error) {
    return failure(500, instructorCourseErrorCodes.fetchError, error.message);
  }

  return success({ course: mapCourseRow(data as unknown as CourseRow) }, 201);
};

// --- 코스 수정 ---
export const updateCourse = async (
  supabase: AppSupabaseClient,
  courseId: string,
  instructorId: string,
  body: UpdateCourseBody,
): Promise<HandlerResult<InstructorCourseResponse, InstructorCourseServiceError>> => {
  const ownershipResult = await verifyCourseOwnership(supabase, courseId, instructorId);
  if (!ownershipResult.ok) return ownershipResult as ErrorResult<InstructorCourseServiceError>;

  if (body.categoryId) {
    const { data: cat } = await supabase
      .from('categories')
      .select('id, is_active')
      .eq('id', body.categoryId)
      .maybeSingle();

    if (!cat || !cat.is_active) {
      return failure(400, instructorCourseErrorCodes.inactiveMeta, '사용할 수 없는 카테고리입니다.');
    }
  }

  if (body.difficultyId) {
    const { data: diff } = await supabase
      .from('difficulties')
      .select('id, is_active')
      .eq('id', body.difficultyId)
      .maybeSingle();

    if (!diff || !diff.is_active) {
      return failure(400, instructorCourseErrorCodes.inactiveMeta, '사용할 수 없는 난이도입니다.');
    }
  }

  const { data, error } = await supabase
    .from('courses')
    .update({
      title: body.title,
      description: body.description ?? null,
      category_id: body.categoryId ?? null,
      difficulty_id: body.difficultyId ?? null,
      curriculum: body.curriculum ?? null,
    })
    .eq('id', courseId)
    .select(COURSE_SELECT)
    .single();

  if (error) {
    return failure(500, instructorCourseErrorCodes.fetchError, error.message);
  }

  return success({ course: mapCourseRow(data as unknown as CourseRow) });
};

// --- 코스 상태 전환 ---
export const updateCourseStatus = async (
  supabase: AppSupabaseClient,
  courseId: string,
  instructorId: string,
  body: UpdateCourseStatusBody,
): Promise<HandlerResult<InstructorCourseResponse, InstructorCourseServiceError>> => {
  const ownershipResult = await verifyCourseOwnership(supabase, courseId, instructorId);
  if (!ownershipResult.ok) return ownershipResult as ErrorResult<InstructorCourseServiceError>;

  const currentStatus = ownershipResult.data.status;

  if (!isAllowedStatusTransition(currentStatus, body.status)) {
    return failure(
      400,
      instructorCourseErrorCodes.invalidStatus,
      `'${currentStatus}' 상태에서 '${body.status}'로 전환할 수 없습니다.`,
    );
  }

  const { data, error } = await supabase
    .from('courses')
    .update({ status: body.status })
    .eq('id', courseId)
    .select(COURSE_SELECT)
    .single();

  if (error) {
    return failure(500, instructorCourseErrorCodes.fetchError, error.message);
  }

  return success({ course: mapCourseRow(data as unknown as CourseRow) });
};
