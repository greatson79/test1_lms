export const enrollmentErrorCodes = {
  alreadyEnrolled: 'ALREADY_ENROLLED',
  notFound: 'ENROLLMENT_NOT_FOUND',
  courseNotEnrollable: 'COURSE_NOT_ENROLLABLE',
  courseNotFound: 'COURSE_NOT_FOUND',
  forbidden: 'FORBIDDEN',
  upsertFailed: 'ENROLLMENT_UPSERT_FAILED',
  cancelFailed: 'ENROLLMENT_CANCEL_FAILED',
  fetchFailed: 'ENROLLMENT_FETCH_FAILED',
} as const;

type EnrollmentErrorValue = (typeof enrollmentErrorCodes)[keyof typeof enrollmentErrorCodes];
export type EnrollmentServiceError = EnrollmentErrorValue;
