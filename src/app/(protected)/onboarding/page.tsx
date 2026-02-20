"use client";

import Image from "next/image";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { match } from "ts-pattern";
import { OnboardingForm } from "@/features/profiles/components/onboarding-form";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { LEARNER_HOME_PATH, INSTRUCTOR_HOME_PATH } from "@/constants/auth";

type OnboardingPageProps = {
  params: Promise<Record<string, never>>;
};

export default function OnboardingPage({ params }: OnboardingPageProps) {
  void params;
  const router = useRouter();
  const { user, isLoading } = useCurrentUser();

  useEffect(() => {
    if (isLoading || !user?.role) return;

    const redirectTo = match(user.role)
      .with("learner", () => LEARNER_HOME_PATH)
      .with("instructor", () => INSTRUCTOR_HOME_PATH)
      .otherwise(() => "/");

    router.replace(redirectTo);
  }, [user, isLoading, router]);

  if (isLoading || user?.role) return null;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center gap-10 px-6 py-16">
      <header className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-3xl font-semibold">프로필 설정</h1>
        <p className="text-slate-500">
          역할과 기본 정보를 입력하면 서비스를 시작할 수 있습니다.
        </p>
      </header>
      <div className="grid w-full gap-8 md:grid-cols-2">
        <OnboardingForm />
        <figure className="overflow-hidden rounded-xl border border-slate-200">
          <Image
            src="https://picsum.photos/seed/onboarding/640/640"
            alt="온보딩"
            width={640}
            height={640}
            className="h-full w-full object-cover"
            priority
          />
        </figure>
      </div>
    </div>
  );
}
