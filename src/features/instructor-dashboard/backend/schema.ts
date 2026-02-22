import { z } from 'zod';

export const InstructorCourseItemSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  status: z.enum(['draft', 'published', 'archived']),
  pendingCount: z.number().int().nonnegative(),
  categoryName: z.string().nullable(),
  difficultyName: z.string().nullable(),
});

export const RecentSubmissionItemSchema = z.object({
  submissionId: z.string().uuid(),
  learnerName: z.string(),
  assignmentTitle: z.string(),
  courseTitle: z.string(),
  submittedAt: z.string(),
});

const MetaItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
});

export const InstructorDashboardResponseSchema = z.object({
  courses: z.array(InstructorCourseItemSchema),
  totalPendingCount: z.number().int().nonnegative(),
  recentSubmissions: z.array(RecentSubmissionItemSchema),
  meta: z.object({
    categories: z.array(MetaItemSchema),
    difficulties: z.array(MetaItemSchema),
  }),
});

export type InstructorCourseItem = z.infer<typeof InstructorCourseItemSchema>;
export type RecentSubmissionItem = z.infer<typeof RecentSubmissionItemSchema>;
export type InstructorDashboardResponse = z.infer<typeof InstructorDashboardResponseSchema>;
export type MetaItem = z.infer<typeof MetaItemSchema>;
