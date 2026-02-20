export const gradeErrorCodes = {
  forbidden: 'FORBIDDEN',
  enrollmentRequired: 'ENROLLMENT_REQUIRED',
  fetchError: 'GRADE_FETCH_ERROR',
} as const;

type GradeErrorValue = (typeof gradeErrorCodes)[keyof typeof gradeErrorCodes];
export type GradeServiceError = GradeErrorValue;
