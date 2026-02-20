"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { match } from "ts-pattern";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import {
  useOnboardingMutation,
  extractApiErrorMessage,
} from "@/features/profiles/hooks/useOnboardingMutation";
import type { OnboardingRequest } from "@/features/profiles/lib/dto";
import {
  ONBOARDING_PATH,
  LEARNER_HOME_PATH,
  INSTRUCTOR_HOME_PATH,
} from "@/constants/auth";

const signupFormSchema = z
  .object({
    email: z.string().email("유효한 이메일을 입력해주세요."),
    password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다."),
    confirmPassword: z.string().min(1, "비밀번호 확인을 입력해주세요."),
    role: z.enum(["learner", "instructor"], {
      errorMap: () => ({ message: "역할을 선택해주세요." }),
    }),
    name: z.string().min(1, "이름을 입력해주세요."),
    phone: z.string().min(1, "휴대폰번호를 입력해주세요."),
    termsAgreed: z.boolean().refine((val) => val === true, {
      message: "약관에 동의해야 합니다.",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "비밀번호가 일치하지 않습니다.",
    path: ["confirmPassword"],
  });

type SignupFormValues = z.infer<typeof signupFormSchema>;

type SignupPageProps = {
  params: Promise<Record<string, never>>;
};

export default function SignupPage({ params }: SignupPageProps) {
  void params;
  const router = useRouter();
  const { isAuthenticated, user, refresh } = useCurrentUser();
  const { mutateAsync, isPending } = useOnboardingMutation();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    formState: { errors, isValid },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupFormSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      phone: "",
      termsAgreed: false,
    },
  });

  const selectedRole = watch("role");

  useEffect(() => {
    if (!isAuthenticated) return;

    const redirectTo = match(user?.role)
      .with("learner", () => LEARNER_HOME_PATH)
      .with("instructor", () => INSTRUCTOR_HOME_PATH)
      .otherwise(() => ONBOARDING_PATH);

    router.replace(redirectTo);
  }, [isAuthenticated, user, router]);

  if (isAuthenticated) return null;

  const handleRoleSelect = (role: OnboardingRequest["role"]) => {
    setValue("role", role, { shouldValidate: true });
  };

  const onSubmit = useCallback(
    async (values: SignupFormValues) => {
      const supabase = getSupabaseBrowserClient();

      // Step 1: Supabase Auth 계정 생성 (자동 로그인 포함)
      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email: values.email,
          password: values.password,
        });

      if (signUpError) {
        const isConflict = signUpError.message.toLowerCase().includes("already");
        setError("root", {
          message: isConflict
            ? "이미 사용 중인 이메일입니다."
            : signUpError.message,
        });
        return;
      }

      if (!signUpData.session) {
        setError("root", {
          message:
            "이메일 인증이 필요합니다. 받은 편지함을 확인해주세요.",
        });
        return;
      }

      // Step 2: 프로필 생성 (역할·이름·전화번호·약관)
      try {
        const result = await mutateAsync({
          data: {
            role: values.role,
            name: values.name,
            phone: values.phone,
            termsAgreed: true,
          },
          token: signUpData.session.access_token,
        });

        await refresh();
        router.replace(result.redirectTo);
      } catch (error) {
        setError("root", {
          message: extractApiErrorMessage(
            error,
            "회원가입 처리 중 문제가 발생했습니다.",
          ),
        });
      }
    },
    [mutateAsync, refresh, router, setError],
  );

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center gap-10 px-6 py-16">
      <header className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-3xl font-semibold">회원가입</h1>
        <p className="text-slate-500">계정을 만들고 서비스를 시작하세요.</p>
      </header>

      <div className="grid w-full gap-8 md:grid-cols-2">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-5 rounded-xl border border-slate-200 p-6 shadow-sm"
        >
          {/* 역할 선택 */}
          <fieldset className="flex flex-col gap-3">
            <legend className="text-sm font-medium text-slate-700">
              역할 선택
            </legend>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleRoleSelect("learner")}
                className={[
                  "rounded-lg border-2 px-4 py-4 text-left transition",
                  selectedRole === "learner"
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 hover:border-slate-400",
                ].join(" ")}
              >
                <p className="font-semibold">수강생</p>
                <p className="mt-1 text-xs opacity-70">
                  코스를 수강하고 과제를 제출합니다.
                </p>
              </button>
              <button
                type="button"
                onClick={() => handleRoleSelect("instructor")}
                className={[
                  "rounded-lg border-2 px-4 py-4 text-left transition",
                  selectedRole === "instructor"
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 hover:border-slate-400",
                ].join(" ")}
              >
                <p className="font-semibold">강사</p>
                <p className="mt-1 text-xs opacity-70">
                  코스를 개설하고 과제를 채점합니다.
                </p>
              </button>
            </div>
            {errors.role ? (
              <p className="text-xs text-rose-500">{errors.role.message}</p>
            ) : null}
          </fieldset>

          <div className="h-px bg-slate-100" />

          {/* 계정 정보 */}
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            이메일
            <input
              type="email"
              autoComplete="email"
              {...register("email")}
              className="rounded-md border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
            />
            {errors.email ? (
              <p className="text-xs text-rose-500">{errors.email.message}</p>
            ) : null}
          </label>

          <label className="flex flex-col gap-2 text-sm text-slate-700">
            비밀번호
            <input
              type="password"
              autoComplete="new-password"
              {...register("password")}
              className="rounded-md border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
            />
            {errors.password ? (
              <p className="text-xs text-rose-500">{errors.password.message}</p>
            ) : null}
          </label>

          <label className="flex flex-col gap-2 text-sm text-slate-700">
            비밀번호 확인
            <input
              type="password"
              autoComplete="new-password"
              {...register("confirmPassword")}
              className="rounded-md border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
            />
            {errors.confirmPassword ? (
              <p className="text-xs text-rose-500">
                {errors.confirmPassword.message}
              </p>
            ) : null}
          </label>

          <div className="h-px bg-slate-100" />

          {/* 프로필 정보 */}
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

          <div className="h-px bg-slate-100" />

          {/* 약관 동의 */}
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
            <p className="text-xs text-rose-500">{errors.termsAgreed.message}</p>
          ) : null}

          {errors.root ? (
            <p className="text-sm text-rose-500">{errors.root.message}</p>
          ) : null}

          <button
            type="submit"
            disabled={isPending || !isValid}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isPending ? "처리 중..." : "가입하기"}
          </button>

          <p className="text-xs text-slate-500">
            이미 계정이 있으신가요?{" "}
            <Link
              href="/login"
              className="font-medium text-slate-700 underline hover:text-slate-900"
            >
              로그인으로 이동
            </Link>
          </p>
        </form>

        <figure className="hidden overflow-hidden rounded-xl border border-slate-200 md:block">
          <Image
            src="https://picsum.photos/seed/signup/640/960"
            alt="회원가입"
            width={640}
            height={960}
            className="h-full w-full object-cover"
            priority
          />
        </figure>
      </div>
    </div>
  );
}
