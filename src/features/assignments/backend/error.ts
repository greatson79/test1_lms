export const assignmentErrorCodes = {
  enrollmentRequired: 'ENROLLMENT_REQUIRED',
  assignmentNotFound: 'ASSIGNMENT_NOT_FOUND',
  fetchError: 'ASSIGNMENT_FETCH_ERROR',
  forbidden: 'FORBIDDEN',
} as const;

type AssignmentErrorValue = (typeof assignmentErrorCodes)[keyof typeof assignmentErrorCodes];
export type AssignmentServiceError = AssignmentErrorValue;
