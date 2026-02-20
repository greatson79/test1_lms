import { z } from 'zod';

export const CourseListQuerySchema = z.object({
  search: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  difficultyId: z.string().uuid().optional(),
  sort: z.enum(['recent', 'popular']).optional().default('recent'),
});

export const CategorySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
});

export const DifficultySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
});

export const CourseDtoSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  category: CategorySchema.nullable(),
  difficulty: DifficultySchema.nullable(),
  instructorName: z.string(),
  enrollmentCount: z.number().int().nonnegative(),
  createdAt: z.string(),
});

export const CourseListResponseSchema = z.object({
  courses: z.array(CourseDtoSchema),
  meta: z.object({
    categories: z.array(CategorySchema),
    difficulties: z.array(DifficultySchema),
  }),
});

export const CourseDetailDtoSchema = CourseDtoSchema.extend({
  curriculum: z.string().nullable(),
  enrollmentStatus: z.enum(['active', 'cancelled']).nullable(),
});

export const CourseDetailResponseSchema = z.object({
  course: CourseDetailDtoSchema,
});

export type CourseListQuery = z.infer<typeof CourseListQuerySchema>;
export type CategoryDto = z.infer<typeof CategorySchema>;
export type DifficultyDto = z.infer<typeof DifficultySchema>;
export type CourseDto = z.infer<typeof CourseDtoSchema>;
export type CourseDetailDto = z.infer<typeof CourseDetailDtoSchema>;
export type CourseListResponse = z.infer<typeof CourseListResponseSchema>;
export type CourseDetailResponse = z.infer<typeof CourseDetailResponseSchema>;
