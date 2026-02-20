"use client";

import { useMutation } from "@tanstack/react-query";
import { apiClient, extractApiErrorMessage } from "@/lib/remote/api-client";
import type { OnboardingRequest, OnboardingResponse } from "@/features/profiles/lib/dto";

const onboard = async ({
  data,
  token,
}: {
  data: OnboardingRequest;
  token: string;
}): Promise<OnboardingResponse> => {
  const response = await apiClient.post<OnboardingResponse>("/api/auth/onboarding", data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const useOnboardingMutation = () =>
  useMutation<OnboardingResponse, Error, { data: OnboardingRequest; token: string }>({
    mutationFn: onboard,
    throwOnError: false,
  });

export { extractApiErrorMessage };
