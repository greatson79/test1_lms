'use client';

import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, GraduationCap, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const features = [
  {
    icon: <BookOpen className="h-6 w-6 text-slate-700" />,
    title: '체계적인 코스 관리',
    description: '카테고리·난이도별로 정리된 코스를 탐색하고 수강신청하세요.',
  },
  {
    icon: <GraduationCap className="h-6 w-6 text-slate-700" />,
    title: '과제 제출 & 피드백',
    description: '강사의 상세한 피드백과 채점으로 실력을 빠르게 향상시키세요.',
  },
  {
    icon: <BarChart3 className="h-6 w-6 text-slate-700" />,
    title: '성적 & 진도 추적',
    description: '과제별 성적과 코스 진행률을 한눈에 확인하세요.',
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      {/* 네비게이션 */}
      <nav className="border-b border-slate-100 px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <span className="text-lg font-semibold text-slate-900">LMS</span>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/login">로그인</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">회원가입</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* 히어로 섹션 */}
      <section className="mx-auto max-w-5xl px-6 py-24">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div className="flex flex-col gap-6">
            <h1 className="text-4xl font-bold leading-tight text-slate-900 md:text-5xl">
              배움을 더
              <br />
              체계적으로
            </h1>
            <p className="text-lg text-slate-500">
              코스 수강부터 과제 제출, 성적 확인까지.
              <br />
              학습의 모든 과정을 한 곳에서 관리하세요.
            </p>
            <div className="flex items-center gap-3">
              <Button size="lg" asChild>
                <Link href="/signup">무료로 시작하기</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/login">로그인</Link>
              </Button>
            </div>
          </div>
          <figure className="overflow-hidden rounded-2xl border border-slate-100 shadow-sm">
            <Image
              src="https://picsum.photos/seed/lms-hero/800/600"
              alt="학습 플랫폼 미리보기"
              width={800}
              height={600}
              className="h-full w-full object-cover"
              priority
            />
          </figure>
        </div>
      </section>

      {/* 기능 소개 */}
      <section className="border-t border-slate-100 bg-slate-50 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-2xl font-semibold text-slate-900">
            학습에 필요한 모든 것
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-6"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                  {feature.icon}
                </div>
                <h3 className="font-semibold text-slate-900">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-slate-500">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA 섹션 */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="mb-4 text-2xl font-semibold text-slate-900">지금 바로 시작하세요</h2>
          <p className="mb-8 text-slate-500">학습자 또는 강사로 가입하고 첫 코스를 탐색해보세요.</p>
          <Button size="lg" asChild>
            <Link href="/signup">무료 가입하기</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
