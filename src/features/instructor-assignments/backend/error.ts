export const instructorAssignmentErrorCodes = {
  forbidden: 'FORBIDDEN',
  notFound: 'INSTRUCTOR_ASSIGNMENT_NOT_FOUND',
  invalidStatus: 'INVALID_ASSIGNMENT_STATUS_TRANSITION',
  invalidFilter: 'INVALID_SUBMISSION_FILTER',
  resubmitNotAllowed: 'RESUBMIT_NOT_ALLOWED',
  fetchError: 'INSTRUCTOR_ASSIGNMENT_FETCH_ERROR',
} as const;

type InstructorAssignmentErrorValue =
  (typeof instructorAssignmentErrorCodes)[keyof typeof instructorAssignmentErrorCodes];

export type InstructorAssignmentServiceError = InstructorAssignmentErrorValue;
