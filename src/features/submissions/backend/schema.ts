import { z } from 'zod';

export const SubmitRequestSchema = z.object({
  contentText: z.string().min(1, '내용을 입력해주세요.'),
  contentLink: z.string().url('유효한 URL 형식이 아닙니다.').optional(),
});

export const ResubmitRequestSchema = z.object({
  contentText: z.string().min(1, '내용을 입력해주세요.'),
  contentLink: z.string().url('유효한 URL 형식이 아닙니다.').optional(),
});

export const SubmissionResponseSchema = z.object({
  id: z.string().uuid(),
  assignmentId: z.string().uuid(),
  learnerId: z.string().uuid(),
  contentText: z.string(),
  contentLink: z.string().nullable(),
  isLate: z.boolean(),
  status: z.enum(['submitted', 'graded', 'resubmission_required', 'invalidated']),
  score: z.number().int().nullable(),
  feedback: z.string().nullable(),
  submittedAt: z.string(),
  gradedAt: z.string().nullable(),
});

export const SubmitResponseSchema = z.object({
  submission: SubmissionResponseSchema,
});

export type SubmitRequest = z.infer<typeof SubmitRequestSchema>;
export type ResubmitRequest = z.infer<typeof ResubmitRequestSchema>;
export type SubmissionResponse = z.infer<typeof SubmissionResponseSchema>;
export type SubmitResponse = z.infer<typeof SubmitResponseSchema>;
