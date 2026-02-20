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

// --- Grades ---

export const assignmentSubmissionStatuses = [
  'not_submitted',
  'submitted',
  'graded',
  'resubmission_required',
  'invalidated',
] as const;

export const AssignmentGradeSchema = z.object({
  assignmentId: z.string().uuid(),
  assignmentTitle: z.string(),
  weight: z.number(),
  dueAt: z.string(),
  submissionStatus: z.enum(assignmentSubmissionStatuses),
  score: z.number().int().nullable(),
  feedback: z.string().nullable(),
  gradedAt: z.string().nullable(),
  isLate: z.boolean(),
});

export const CourseGradesResponseSchema = z.object({
  courseId: z.string().uuid(),
  courseTitle: z.string(),
  assignments: z.array(AssignmentGradeSchema),
  // 현재 평점: 채점된 과제만 집계 (퀄리티 지표). 채점 과제 없으면 null
  currentGpa: z.number().nullable(),
  // 예상 최종 성적: 미제출 0점 처리 (달성도 지표)
  expectedFinalGrade: z.number(),
  totalWeight: z.number(),
  gradedWeight: z.number(),
});

export type AssignmentGrade = z.infer<typeof AssignmentGradeSchema>;
export type CourseGradesResponse = z.infer<typeof CourseGradesResponseSchema>;
