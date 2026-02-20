'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import { LearnerDashboardResponseSchema } from '@/features/dashboard/lib/dto';

const fetchLearnerDashboard = async () => {
  try {
    const supabase = getSupabaseBrowserClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error('인증이 필요합니다.');
    }

    const { data } = await apiClient.get('/api/dashboard/learner', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    return LearnerDashboardResponseSchema.parse(data);
  } catch (error) {
    const message = extractApiErrorMessage(error, '대시보드 데이터를 불러오지 못했습니다.');
    throw new Error(message);
  }
};

export const useLearnerDashboardQuery = () =>
  useQuery({
    queryKey: ['dashboard', 'learner'],
    queryFn: fetchLearnerDashboard,
    staleTime: 30 * 1000,
  });
