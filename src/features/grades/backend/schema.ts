import { z } from 'zod';

export const SubmissionGradeInfoSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['submitted', 'graded', 'resubmission_required']),
  isLate: z.boolean(),
  score: z.number().int().nullable(),
  feedback: z.string().nullable(),
  submittedAt: z.string(),
  gradedAt: z.string().nullable(),
});

export const AssignmentGradeItemSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  dueAt: z.string(),
  weight: z.number(),
  mySubmission: SubmissionGradeInfoSchema.nullable(),
});

export const GradesResponseSchema = z.object({
  currentGrade: z.number().nullable(),
  assignments: z.array(AssignmentGradeItemSchema),
});

export type SubmissionGradeInfo = z.infer<typeof SubmissionGradeInfoSchema>;
export type AssignmentGradeItem = z.infer<typeof AssignmentGradeItemSchema>;
export type GradesResponse = z.infer<typeof GradesResponseSchema>;
