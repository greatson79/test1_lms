"use client";

import Link from "next/link";
import { useRoleGuard } from "@/hooks/useRoleGuard";

type InstructorDashboardPageProps = {
  params: Promise<Record<string, never>>;
};

export default function InstructorDashboardPage({ params }: InstructorDashboardPageProps) {
  void params;
  const { isAllowed, isLoading } = useRoleGuard("instructor");

  if (isLoading || !isAllowed) return null;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-6 py-16">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold">강사 대시보드</h1>
        <p className="text-slate-500">코스와 과제를 관리하세요.</p>
      </header>

      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 py-24 text-center">
        <p className="text-lg font-medium text-slate-700">아직 개설된 코스가 없습니다.</p>
        <p className="mt-2 text-sm text-slate-400">코스를 개설하고 수강생을 모집해보세요.</p>
        <Link
          href="/instructor/courses/new"
          className="mt-6 rounded-md bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          코스 만들기
        </Link>
      </div>
    </div>
  );
}
