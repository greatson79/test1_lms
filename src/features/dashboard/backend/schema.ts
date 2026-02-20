import { z } from 'zod';
import { CourseDtoSchema } from '@/features/courses/backend/schema';

export const EnrolledCourseSchema = CourseDtoSchema.extend({
  completedCount: z.number().int().nonnegative(),
  totalCount: z.number().int().nonnegative(),
});

export const UpcomingAssignmentSchema = z.object({
  id: z.string().uuid(),
  courseId: z.string().uuid(),
  courseTitle: z.string(),
  title: z.string(),
  dueAt: z.string(),
  weight: z.number(),
  isSubmitted: z.boolean(),
});

export const RecentFeedbackSchema = z.object({
  submissionId: z.string().uuid(),
  assignmentId: z.string().uuid(),
  courseId: z.string(),
  assignmentTitle: z.string(),
  courseTitle: z.string(),
  score: z.number().int().nullable(),
  feedback: z.string().nullable(),
  gradedAt: z.string().nullable(),
});

export const LearnerDashboardResponseSchema = z.object({
  courses: z.array(EnrolledCourseSchema),
  upcomingAssignments: z.array(UpcomingAssignmentSchema),
  recentFeedbacks: z.array(RecentFeedbackSchema),
});

export type EnrolledCourse = z.infer<typeof EnrolledCourseSchema>;
export type UpcomingAssignment = z.infer<typeof UpcomingAssignmentSchema>;
export type RecentFeedback = z.infer<typeof RecentFeedbackSchema>;
export type LearnerDashboardResponse = z.infer<typeof LearnerDashboardResponseSchema>;
