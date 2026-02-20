export const instructorCourseErrorCodes = {
  forbidden: 'FORBIDDEN',
  notFound: 'INSTRUCTOR_COURSE_NOT_FOUND',
  invalidStatus: 'INVALID_STATUS_TRANSITION',
  inactiveMeta: 'INACTIVE_META',
  fetchError: 'INSTRUCTOR_COURSE_FETCH_ERROR',
} as const;

type InstructorCourseErrorValue =
  (typeof instructorCourseErrorCodes)[keyof typeof instructorCourseErrorCodes];

export type InstructorCourseServiceError = InstructorCourseErrorValue;
