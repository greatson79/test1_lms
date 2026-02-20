export const submissionErrorCodes = {
  forbidden: 'FORBIDDEN',
  enrollmentRequired: 'ENROLLMENT_REQUIRED',
  assignmentNotFound: 'ASSIGNMENT_NOT_FOUND',
  submissionNotFound: 'SUBMISSION_NOT_FOUND',
  assignmentClosed: 'ASSIGNMENT_CLOSED',
  lateSubmissionBlocked: 'LATE_SUBMISSION_BLOCKED',
  alreadySubmitted: 'ALREADY_SUBMITTED',
  resubmitNotAllowed: 'RESUBMIT_NOT_ALLOWED',
  resubmitNotRequested: 'RESUBMIT_NOT_REQUESTED',
  fetchError: 'SUBMISSION_FETCH_ERROR',
} as const;

type SubmissionErrorValue = (typeof submissionErrorCodes)[keyof typeof submissionErrorCodes];
export type SubmissionServiceError = SubmissionErrorValue;
