import { z } from 'zod';

// --- 요청 스키마 ---

export const CreateAssignmentBodySchema = z.object({
  title: z.string().min(1, '제목은 필수입니다.'),
  description: z.string().nullable().optional(),
  dueAt: z.string().datetime('올바른 날짜/시간 형식이 아닙니다.'),
  weight: z.number().positive('점수 비중은 0보다 커야 합니다.'),
  allowLate: z.boolean().optional().default(false),
  allowResubmit: z.boolean().optional().default(false),
});

export const UpdateAssignmentBodySchema = z.object({
  title: z.string().min(1, '제목은 필수입니다.'),
  description: z.string().nullable().optional(),
  dueAt: z.string().datetime('올바른 날짜/시간 형식이 아닙니다.'),
  weight: z.number().positive('점수 비중은 0보다 커야 합니다.'),
  allowLate: z.boolean().optional(),
  allowResubmit: z.boolean().optional(),
});

export const UpdateAssignmentStatusBodySchema = z.object({
  status: z.enum(['published', 'closed']),
});

// 제출물 필터: 단일값만 허용
export const SubmissionFilterSchema = z.enum(['pending', 'late', 'resubmission']).optional();

// --- 응답 스키마 ---

export const InstructorAssignmentDtoSchema = z.object({
  id: z.string().uuid(),
  courseId: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  dueAt: z.string(),
  weight: z.number(),
  allowLate: z.boolean(),
  allowResubmit: z.boolean(),
  status: z.enum(['draft', 'published', 'closed']),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const InstructorAssignmentResponseSchema = z.object({
  assignment: InstructorAssignmentDtoSchema,
});

export const InstructorCourseAssignmentsResponseSchema = z.object({
  assignments: z.array(InstructorAssignmentDtoSchema),
});

// 제출물 목록 아이템
export const InstructorSubmissionItemSchema = z.object({
  id: z.string().uuid(),
  learnerId: z.string().uuid(),
  learnerName: z.string(),
  submittedAt: z.string(),
  isLate: z.boolean(),
  status: z.enum(['submitted', 'graded', 'resubmission_required', 'invalidated']),
  score: z.number().int().nullable(),
});

export const InstructorSubmissionListResponseSchema = z.object({
  submissions: z.array(InstructorSubmissionItemSchema),
  totalCount: z.number().int().nonnegative(),
});

// --- 타입 추론 ---

export type CreateAssignmentBody = z.infer<typeof CreateAssignmentBodySchema>;
export type UpdateAssignmentBody = z.infer<typeof UpdateAssignmentBodySchema>;
export type UpdateAssignmentStatusBody = z.infer<typeof UpdateAssignmentStatusBodySchema>;
export type SubmissionFilter = z.infer<typeof SubmissionFilterSchema>;
export type InstructorAssignmentDto = z.infer<typeof InstructorAssignmentDtoSchema>;
export type InstructorAssignmentResponse = z.infer<typeof InstructorAssignmentResponseSchema>;
export type InstructorCourseAssignmentsResponse = z.infer<typeof InstructorCourseAssignmentsResponseSchema>;
export type InstructorSubmissionItem = z.infer<typeof InstructorSubmissionItemSchema>;
export type InstructorSubmissionListResponse = z.infer<typeof InstructorSubmissionListResponseSchema>;
