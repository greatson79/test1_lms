import { z } from 'zod';

export const InstructorCourseItemSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  status: z.enum(['draft', 'published', 'archived']),
  pendingCount: z.number().int().nonnegative(),
});

export const RecentSubmissionItemSchema = z.object({
  submissionId: z.string().uuid(),
  learnerName: z.string(),
  assignmentTitle: z.string(),
  courseTitle: z.string(),
  submittedAt: z.string(),
});

export const InstructorDashboardResponseSchema = z.object({
  courses: z.array(InstructorCourseItemSchema),
  totalPendingCount: z.number().int().nonnegative(),
  recentSubmissions: z.array(RecentSubmissionItemSchema),
});

export type InstructorCourseItem = z.infer<typeof InstructorCourseItemSchema>;
export type RecentSubmissionItem = z.infer<typeof RecentSubmissionItemSchema>;
export type InstructorDashboardResponse = z.infer<typeof InstructorDashboardResponseSchema>;
