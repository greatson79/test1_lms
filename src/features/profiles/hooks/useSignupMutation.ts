"use client";

import { useMutation } from "@tanstack/react-query";
import { apiClient, extractApiErrorMessage } from "@/lib/remote/api-client";
import type { SignupRequest, SignupResponse } from "@/features/profiles/lib/dto";

const signup = async (data: SignupRequest): Promise<SignupResponse> => {
  const response = await apiClient.post<SignupResponse>("/api/auth/signup", data);
  return response.data;
};

export const useSignupMutation = () =>
  useMutation<SignupResponse, Error, SignupRequest>({
    mutationFn: signup,
    throwOnError: false,
  });

export { extractApiErrorMessage };
