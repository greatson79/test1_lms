'use client';

import { useMutation } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { getAuthHeadersOrThrow } from '@/lib/remote/auth-headers';
import { CreateReportResponseSchema } from '@/features/operator/lib/dto';
import type { CreateReportBody } from '@/features/operator/lib/dto';

const submitReportApi = async (body: CreateReportBody) => {
  try {
    const headers = await getAuthHeadersOrThrow();
    const { data } = await apiClient.post('/api/reports', body, { headers });
    return CreateReportResponseSchema.parse(data);
  } catch (error) {
    const message = extractApiErrorMessage(error, '신고 접수에 실패했습니다.');
    throw new Error(message);
  }
};

export const useSubmitReportMutation = () => {
  return useMutation({
    mutationFn: (body: CreateReportBody) => submitReportApi(body),
  });
};
