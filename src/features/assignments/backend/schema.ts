import { z } from 'zod';

export const MySubmissionDtoSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['submitted', 'graded', 'resubmission_required', 'invalidated']),
  contentText: z.string().nullable(),
  contentLink: z.string().nullable(),
  isLate: z.boolean(),
  score: z.number().int().nullable(),
  feedback: z.string().nullable(),
  submittedAt: z.string(),
  gradedAt: z.string().nullable(),
});

export const AssignmentDtoSchema = z.object({
  id: z.string().uuid(),
  courseId: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  dueAt: z.string(),
  weight: z.number(),
  allowLate: z.boolean(),
  allowResubmit: z.boolean(),
  status: z.enum(['published', 'closed']),
  mySubmission: MySubmissionDtoSchema.nullable(),
});

export const AssignmentListResponseSchema = z.object({
  assignments: z.array(AssignmentDtoSchema),
});

export const AssignmentDetailResponseSchema = z.object({
  assignment: AssignmentDtoSchema,
});

export type MySubmissionDto = z.infer<typeof MySubmissionDtoSchema>;
export type AssignmentDto = z.infer<typeof AssignmentDtoSchema>;
export type AssignmentListResponse = z.infer<typeof AssignmentListResponseSchema>;
export type AssignmentDetailResponse = z.infer<typeof AssignmentDetailResponseSchema>;
