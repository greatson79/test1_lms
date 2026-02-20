import { z } from 'zod';

// ============================================================
// 신고 접수 스키마
// ============================================================

export const ReportTargetTypeSchema = z.enum(['course', 'assignment', 'submission', 'user']);

export const CreateReportBodySchema = z.object({
  targetType: ReportTargetTypeSchema,
  targetId: z.string().uuid('대상 ID가 유효하지 않습니다.'),
  reason: z.string().min(1, '신고 사유를 입력해 주세요.'),
  content: z.string().min(1, '신고 내용을 입력해 주세요.'),
});

export const CreateReportResponseSchema = z.object({
  reportId: z.string().uuid(),
});

// ============================================================
// 신고 처리 스키마
// ============================================================

export const ReportStatusSchema = z.enum(['received', 'investigating', 'resolved']);

export const ReportActionSchema = z.enum([
  'warning',
  'invalidate_submission',
  'restrict_account',
]);

export const UpdateReportBodySchema = z.object({
  status: ReportStatusSchema,
  action: ReportActionSchema.nullable().optional(),
});

export const ReportDtoSchema = z.object({
  id: z.string().uuid(),
  reporterId: z.string().uuid(),
  targetType: ReportTargetTypeSchema,
  targetId: z.string().uuid(),
  reason: z.string(),
  content: z.string(),
  status: ReportStatusSchema,
  action: ReportActionSchema.nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const ReportListResponseSchema = z.object({
  reports: z.array(ReportDtoSchema),
  totalCount: z.number().int().nonnegative(),
});

export const ReportResponseSchema = z.object({
  report: ReportDtoSchema,
});

// ============================================================
// 카테고리 스키마
// ============================================================

export const CreateCategoryBodySchema = z.object({
  name: z.string().min(1, '이름을 입력해 주세요.'),
});

export const UpdateCategoryBodySchema = z.object({
  name: z.string().min(1, '이름을 입력해 주세요.').optional(),
  isActive: z.boolean().optional(),
});

export const CategoryDtoSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const CategoryListResponseSchema = z.object({
  categories: z.array(CategoryDtoSchema),
});

export const CategoryResponseSchema = z.object({
  category: CategoryDtoSchema,
});

// ============================================================
// 난이도 스키마 (카테고리와 동일 구조)
// ============================================================

export const CreateDifficultyBodySchema = z.object({
  name: z.string().min(1, '이름을 입력해 주세요.'),
});

export const UpdateDifficultyBodySchema = z.object({
  name: z.string().min(1, '이름을 입력해 주세요.').optional(),
  isActive: z.boolean().optional(),
});

export const DifficultyDtoSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const DifficultyListResponseSchema = z.object({
  difficulties: z.array(DifficultyDtoSchema),
});

export const DifficultyResponseSchema = z.object({
  difficulty: DifficultyDtoSchema,
});

// ============================================================
// 타입 추론
// ============================================================

export type ReportTargetType = z.infer<typeof ReportTargetTypeSchema>;
export type ReportStatus = z.infer<typeof ReportStatusSchema>;
export type ReportAction = z.infer<typeof ReportActionSchema>;
export type CreateReportBody = z.infer<typeof CreateReportBodySchema>;
export type CreateReportResponse = z.infer<typeof CreateReportResponseSchema>;
export type UpdateReportBody = z.infer<typeof UpdateReportBodySchema>;
export type ReportDto = z.infer<typeof ReportDtoSchema>;
export type ReportListResponse = z.infer<typeof ReportListResponseSchema>;
export type ReportResponse = z.infer<typeof ReportResponseSchema>;
export type CreateCategoryBody = z.infer<typeof CreateCategoryBodySchema>;
export type UpdateCategoryBody = z.infer<typeof UpdateCategoryBodySchema>;
export type CategoryDto = z.infer<typeof CategoryDtoSchema>;
export type CategoryListResponse = z.infer<typeof CategoryListResponseSchema>;
export type CategoryResponse = z.infer<typeof CategoryResponseSchema>;
export type CreateDifficultyBody = z.infer<typeof CreateDifficultyBodySchema>;
export type UpdateDifficultyBody = z.infer<typeof UpdateDifficultyBodySchema>;
export type DifficultyDto = z.infer<typeof DifficultyDtoSchema>;
export type DifficultyListResponse = z.infer<typeof DifficultyListResponseSchema>;
export type DifficultyResponse = z.infer<typeof DifficultyResponseSchema>;
