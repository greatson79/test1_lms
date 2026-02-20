'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { getAuthHeadersOrThrow } from '@/lib/remote/auth-headers';
import { ReportListResponseSchema } from '@/features/operator/lib/dto';
import type { ReportStatus } from '@/features/operator/lib/dto';

const fetchOperatorReports = async (params: { status?: ReportStatus; sort?: 'asc' | 'desc' }) => {
  try {
    const headers = await getAuthHeadersOrThrow();
    const queryParams = new URLSearchParams();

    if (params.status) queryParams.set('status', params.status);
    if (params.sort) queryParams.set('sort', params.sort);

    const queryString = queryParams.toString();
    const url = queryString ? `/api/operator/reports?${queryString}` : '/api/operator/reports';

    const { data } = await apiClient.get(url, { headers });
    return ReportListResponseSchema.parse(data);
  } catch (error) {
    const message = extractApiErrorMessage(error, '신고 목록을 불러오는 데 실패했습니다.');
    throw new Error(message);
  }
};

export const useOperatorReportsQuery = (params: { status?: ReportStatus; sort?: 'asc' | 'desc' }) => {
  return useQuery({
    queryKey: ['operator', 'reports', { status: params.status, sort: params.sort }],
    queryFn: () => fetchOperatorReports(params),
  });
};
