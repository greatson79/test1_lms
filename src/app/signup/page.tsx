"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { match } from "ts-pattern";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { useSignupMutation, extractApiErrorMessage } from "@/features/profiles/hooks/useSignupMutation";
import { SignupRequestSchema } from "@/features/profiles/lib/dto";
import {
  ONBOARDING_PATH,
  LEARNER_HOME_PATH,
  INSTRUCTOR_HOME_PATH,
} from "@/constants/auth";

const signupFormSchema = SignupRequestSchema.extend({
  confirmPassword: z.string().min(1, "비밀번호 확인을 입력해주세요."),
}).refine((data) => data.password === data.confirmPassword, {
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
  const { isAuthenticated, user } = useCurrentUser();
  const { mutateAsync } = useSignupMutation();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isValid },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupFormSchema),
    mode: "onChange",
  });

  useEffect(() => {
    if (!isAuthenticated) return;

    const redirectTo = match(user?.role)
      .with("learner", () => LEARNER_HOME_PATH)
      .with("instructor", () => INSTRUCTOR_HOME_PATH)
      .otherwise(() => ONBOARDING_PATH);

    router.replace(redirectTo);
  }, [isAuthenticated, user, router]);

  if (isAuthenticated) return null;

  const onSubmit = async (values: SignupFormValues) => {
    try {
      await mutateAsync({ email: values.email, password: values.password });

      const supabase = getSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (signInError) {
        setError("root", {
          message: "계정이 생성되었습니다. 로그인 페이지에서 로그인해주세요.",
        });
        return;
      }

      router.replace(ONBOARDING_PATH);
    } catch (error) {
      setError("root", {
        message: extractApiErrorMessage(error, "회원가입 처리 중 문제가 발생했습니다."),
      });
    }
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center gap-10 px-6 py-16">
      <header className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-3xl font-semibold">회원가입</h1>
        <p className="text-slate-500">계정을 만들고 서비스를 시작하세요.</p>
      </header>
      <div className="grid w-full gap-8 md:grid-cols-2">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4 rounded-xl border border-slate-200 p-6 shadow-sm"
        >
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
              <p className="text-xs text-rose-500">{errors.confirmPassword.message}</p>
            ) : null}
          </label>

          {errors.root ? (
            <p className="text-sm text-rose-500">{errors.root.message}</p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting || !isValid}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isSubmitting ? "등록 중..." : "회원가입"}
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

        <figure className="overflow-hidden rounded-xl border border-slate-200">
          <Image
            src="https://picsum.photos/seed/signup/640/640"
            alt="회원가입"
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
