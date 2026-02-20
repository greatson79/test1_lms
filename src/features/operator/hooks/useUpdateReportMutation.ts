'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { getAuthHeadersOrThrow } from '@/lib/remote/auth-headers';
import { ReportResponseSchema } from '@/features/operator/lib/dto';
import type { UpdateReportBody } from '@/features/operator/lib/dto';

const updateReportApi = async ({ reportId, body }: { reportId: string; body: UpdateReportBody }) => {
  try {
    const headers = await getAuthHeadersOrThrow();
    const { data } = await apiClient.patch(`/api/operator/reports/${reportId}`, body, { headers });
    return ReportResponseSchema.parse(data);
  } catch (error) {
    const message = extractApiErrorMessage(error, '신고 처리에 실패했습니다.');
    throw new Error(message);
  }
};

export const useUpdateReportMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { reportId: string; body: UpdateReportBody }) => updateReportApi(params),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['operator', 'reports'] });
    },
  });
};
