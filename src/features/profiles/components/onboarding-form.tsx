"use client";

import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import {
  useOnboardingMutation,
  extractApiErrorMessage,
} from "@/features/profiles/hooks/useOnboardingMutation";
import type { OnboardingRequest } from "@/features/profiles/lib/dto";

// 폼 내부용 스키마 (termsAgreed를 boolean으로 처리 후 true 여부 검증)
const onboardingFormSchema = z.object({
  role: z.enum(["learner", "instructor"], {
    errorMap: () => ({ message: "역할을 선택해주세요." }),
  }),
  name: z.string().min(1, "이름을 입력해주세요."),
  phone: z.string().min(1, "휴대폰번호를 입력해주세요."),
  termsAgreed: z.boolean().refine((val) => val === true, {
    message: "약관에 동의해야 합니다.",
  }),
});

type OnboardingFormValues = z.infer<typeof onboardingFormSchema>;

export const OnboardingForm = () => {
  const router = useRouter();
  const { refresh } = useCurrentUser();
  const { mutateAsync, isPending } = useOnboardingMutation();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    formState: { errors, isValid },
  } = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingFormSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      phone: "",
      termsAgreed: false,
    },
  });

  const selectedRole = watch("role");

  const handleRoleSelect = useCallback(
    (role: OnboardingRequest["role"]) => {
      setValue("role", role, { shouldValidate: true });
    },
    [setValue],
  );

  const onSubmit = useCallback(
    async (values: OnboardingFormValues) => {
      const supabase = getSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError("root", {
          message: "세션이 만료되었습니다. 다시 로그인해주세요.",
        });
        return;
      }

      const data: OnboardingRequest = {
        role: values.role,
        name: values.name,
        phone: values.phone,
        termsAgreed: true,
      };

      try {
        const result = await mutateAsync({
          data,
          token: session.access_token,
        });

        await refresh();
        router.replace(result.redirectTo);
      } catch (error) {
        setError("root", {
          message: extractApiErrorMessage(error, "온보딩 처리 중 문제가 발생했습니다."),
        });
      }
    },
    [mutateAsync, refresh, router, setError],
  );

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex w-full flex-col gap-6 rounded-xl border border-slate-200 p-6 shadow-sm"
    >
      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-medium text-slate-700">역할 선택</legend>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleRoleSelect("learner")}
            className={[
              "rounded-lg border-2 px-4 py-5 text-left transition",
              selectedRole === "learner"
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 hover:border-slate-400",
            ].join(" ")}
          >
            <p className="font-semibold">학습자</p>
            <p className="mt-1 text-xs opacity-70">코스를 수강하고 과제를 제출합니다.</p>
          </button>
          <button
            type="button"
            onClick={() => handleRoleSelect("instructor")}
            className={[
              "rounded-lg border-2 px-4 py-5 text-left transition",
              selectedRole === "instructor"
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 hover:border-slate-400",
            ].join(" ")}
          >
            <p className="font-semibold">강사</p>
            <p className="mt-1 text-xs opacity-70">코스를 개설하고 과제를 채점합니다.</p>
          </button>
        </div>
        {errors.role ? (
          <p className="text-sm text-rose-500">{errors.role.message}</p>
        ) : null}
      </fieldset>

      <label className="flex flex-col gap-2 text-sm text-slate-700">
        이름
        <input
          type="text"
          autoComplete="name"
          {...register("name")}
          className="rounded-md border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
          placeholder="홍길동"
        />
        {errors.name ? (
          <p className="text-xs text-rose-500">{errors.name.message}</p>
        ) : null}
      </label>

      <label className="flex flex-col gap-2 text-sm text-slate-700">
        휴대폰번호
        <input
          type="tel"
          autoComplete="tel"
          {...register("phone")}
          className="rounded-md border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
          placeholder="010-0000-0000"
        />
        {errors.phone ? (
          <p className="text-xs text-rose-500">{errors.phone.message}</p>
        ) : null}
      </label>

      <label className="flex cursor-pointer items-start gap-3 text-sm text-slate-700">
        <input
          type="checkbox"
          {...register("termsAgreed")}
          className="mt-0.5 size-4 accent-slate-900"
        />
        <span>
          서비스 이용약관 및 개인정보처리방침에 동의합니다.{" "}
          <span className="text-rose-500">*</span>
        </span>
      </label>
      {errors.termsAgreed ? (
        <p className="text-sm text-rose-500">{errors.termsAgreed.message}</p>
      ) : null}

      {errors.root ? (
        <p className="text-sm text-rose-500">{errors.root.message}</p>
      ) : null}

      <button
        type="submit"
        disabled={isPending || !isValid}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {isPending ? "처리 중..." : "시작하기"}
      </button>
    </form>
  );
};
