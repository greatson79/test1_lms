"use client";

import Link from "next/link";
import { useRoleGuard } from "@/hooks/useRoleGuard";

type CoursesPageProps = {
  params: Promise<Record<string, never>>;
};

export default function CoursesPage({ params }: CoursesPageProps) {
  void params;
  const { isAllowed, isLoading } = useRoleGuard("learner");

  if (isLoading || !isAllowed) return null;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-6 py-16">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold">코스 탐색</h1>
        <p className="text-slate-500">수강 가능한 코스를 둘러보세요.</p>
      </header>

      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 py-24 text-center">
        <p className="text-lg font-medium text-slate-700">아직 등록된 코스가 없습니다.</p>
        <p className="mt-2 text-sm text-slate-400">코스가 등록되면 이곳에 표시됩니다.</p>
        <Link
          href="/courses/my"
          className="mt-6 rounded-md bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          내 코스 보기
        </Link>
      </div>
    </div>
  );
}
