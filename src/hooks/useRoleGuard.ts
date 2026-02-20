"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import type { UserRole } from "@/features/auth/types";
import {
  ONBOARDING_PATH,
  LEARNER_HOME_PATH,
  INSTRUCTOR_HOME_PATH,
  OPERATOR_HOME_PATH,
} from "@/constants/auth";

const ROLE_HOME: Record<UserRole, string> = {
  learner: LEARNER_HOME_PATH,
  instructor: INSTRUCTOR_HOME_PATH,
  operator: OPERATOR_HOME_PATH,
};

export const useRoleGuard = (requiredRole: UserRole) => {
  const { user, isAuthenticated, isLoading } = useCurrentUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;

    if (!user?.role) {
      router.replace(ONBOARDING_PATH);
      return;
    }

    if (user.role !== requiredRole) {
      router.replace(ROLE_HOME[user.role]);
    }
  }, [isLoading, isAuthenticated, user, requiredRole, router]);

  return {
    isAllowed: !isLoading && isAuthenticated && user?.role === requiredRole,
    isLoading,
  };
};
