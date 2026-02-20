export const operatorErrorCodes = {
  forbidden: 'FORBIDDEN',
  notFound: 'OPERATOR_NOT_FOUND',
  targetNotFound: 'REPORT_TARGET_NOT_FOUND',
  alreadyResolved: 'REPORT_ALREADY_RESOLVED',
  duplicateName: 'DUPLICATE_METADATA_NAME',
  invalidReportStatus: 'INVALID_REPORT_STATUS',
  fetchError: 'OPERATOR_FETCH_ERROR',
} as const;

type OperatorErrorValue =
  (typeof operatorErrorCodes)[keyof typeof operatorErrorCodes];

export type OperatorServiceError = OperatorErrorValue;
