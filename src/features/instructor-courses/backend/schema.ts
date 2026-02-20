import { z } from 'zod';

// --- 요청 스키마 ---

export const CreateCourseBodySchema = z.object({
  title: z.string().min(1, '제목은 필수입니다.'),
  description: z.string().nullable().optional(),
  categoryId: z.string().uuid().nullable().optional(),
  difficultyId: z.string().uuid().nullable().optional(),
  curriculum: z.string().nullable().optional(),
});

export const UpdateCourseBodySchema = z.object({
  title: z.string().min(1, '제목은 필수입니다.'),
  description: z.string().nullable().optional(),
  categoryId: z.string().uuid().nullable().optional(),
  difficultyId: z.string().uuid().nullable().optional(),
  curriculum: z.string().nullable().optional(),
});

export const UpdateCourseStatusBodySchema = z.object({
  status: z.enum(['published', 'archived']),
});

// --- 응답 스키마 ---

export const InstructorCourseCategorySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
});

export const InstructorCourseDifficultySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
});

export const InstructorCourseDtoSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  category: InstructorCourseCategorySchema.nullable(),
  difficulty: InstructorCourseDifficultySchema.nullable(),
  curriculum: z.string().nullable(),
  status: z.enum(['draft', 'published', 'archived']),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const InstructorCourseResponseSchema = z.object({
  course: InstructorCourseDtoSchema,
});

// --- 메타 스키마 (생성/수정 폼에 필요한 카테고리/난이도 목록) ---

export const InstructorCourseMetaSchema = z.object({
  categories: z.array(InstructorCourseCategorySchema),
  difficulties: z.array(InstructorCourseDifficultySchema),
});

export const InstructorCourseWithMetaResponseSchema = z.object({
  course: InstructorCourseDtoSchema,
  meta: InstructorCourseMetaSchema,
});

export const InstructorCourseMetaOnlyResponseSchema = z.object({
  meta: InstructorCourseMetaSchema,
});

// --- 타입 추론 ---

export type CreateCourseBody = z.infer<typeof CreateCourseBodySchema>;
export type UpdateCourseBody = z.infer<typeof UpdateCourseBodySchema>;
export type UpdateCourseStatusBody = z.infer<typeof UpdateCourseStatusBodySchema>;
export type InstructorCourseDto = z.infer<typeof InstructorCourseDtoSchema>;
export type InstructorCourseResponse = z.infer<typeof InstructorCourseResponseSchema>;
export type InstructorCourseWithMetaResponse = z.infer<typeof InstructorCourseWithMetaResponseSchema>;
export type InstructorCourseMetaOnlyResponse = z.infer<typeof InstructorCourseMetaOnlyResponseSchema>;
export type InstructorCourseMeta = z.infer<typeof InstructorCourseMetaSchema>;
