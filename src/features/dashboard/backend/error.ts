export const dashboardErrorCodes = {
  fetchError: 'DASHBOARD_FETCH_ERROR',
} as const;

type DashboardErrorValue = (typeof dashboardErrorCodes)[keyof typeof dashboardErrorCodes];
export type DashboardServiceError = DashboardErrorValue;
