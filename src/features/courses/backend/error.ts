export const courseErrorCodes = {
  notFound: 'COURSE_NOT_FOUND',
  notPublished: 'COURSE_NOT_PUBLISHED',
  fetchError: 'COURSE_FETCH_ERROR',
} as const;

type CourseErrorValue = (typeof courseErrorCodes)[keyof typeof courseErrorCodes];
export type CourseServiceError = CourseErrorValue;
