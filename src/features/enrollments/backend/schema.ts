import { z } from 'zod';

export const EnrollRequestSchema = z.object({
  courseId: z.string().uuid(),
});

export const EnrollmentDtoSchema = z.object({
  id: z.string().uuid(),
  courseId: z.string().uuid(),
  learnerId: z.string().uuid(),
  enrolledAt: z.string(),
  cancelledAt: z.string().nullable(),
});

export const EnrollResponseSchema = z.object({
  enrollment: EnrollmentDtoSchema,
  action: z.enum(['enrolled', 're-enrolled']),
});

export const CancelEnrollmentResponseSchema = z.object({
  success: z.literal(true),
});

export type EnrollRequest = z.infer<typeof EnrollRequestSchema>;
export type EnrollmentDto = z.infer<typeof EnrollmentDtoSchema>;
export type EnrollResponse = z.infer<typeof EnrollResponseSchema>;
export type CancelEnrollmentResponse = z.infer<typeof CancelEnrollmentResponseSchema>;
