export const instructorDashboardErrorCodes = {
  forbidden: 'FORBIDDEN',
  fetchError: 'INSTRUCTOR_DASHBOARD_FETCH_ERROR',
} as const;

type InstructorDashboardErrorValue =
  (typeof instructorDashboardErrorCodes)[keyof typeof instructorDashboardErrorCodes];

export type InstructorDashboardServiceError = InstructorDashboardErrorValue;
