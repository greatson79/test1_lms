'use client';

import { use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Users, BookOpen, BarChart2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { useCourseDetailQuery } from '@/features/courses/hooks/useCourseDetailQuery';
import { EnrollmentButton } from '@/features/enrollments/components/enrollment-button';

type CourseDetailPageProps = {
  params: Promise<{ courseId: string }>;
};

const THUMBNAIL_WIDTH = 800;
const THUMBNAIL_HEIGHT = 450;

export default function CourseDetailPage({ params }: CourseDetailPageProps) {
  const { courseId } = use(params);
  const { user } = useCurrentUser();
  const { data, isLoading, isError, error } = useCourseDetailQuery(courseId);

  const canEnroll = user?.role === 'learner';

  if (isLoading) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-24 rounded bg-slate-100" />
          <div className="aspect-video w-full rounded-lg bg-slate-100" />
          <div className="h-8 w-3/4 rounded bg-slate-100" />
          <div className="h-4 w-1/2 rounded bg-slate-100" />
        </div>
      </main>
    );
  }

  if (isError || !data) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8">
        <Link
          href="/courses"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          코스 목록으로 돌아가기
        </Link>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <BookOpen className="h-12 w-12 text-slate-300 mb-4" />
          <p className="text-slate-500 font-medium">코스를 찾을 수 없습니다.</p>
          <p className="text-sm text-slate-400 mt-1">{error?.message}</p>
        </div>
      </main>
    );
  }

  const { course } = data;
  const thumbnailUrl = `https://picsum.photos/seed/${course.id}/${THUMBNAIL_WIDTH}/${THUMBNAIL_HEIGHT}`;

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <Link
        href="/courses"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        코스 목록으로 돌아가기
      </Link>

      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-slate-100 mb-6">
        <Image
          src={thumbnailUrl}
          alt={course.title}
          fill
          className="object-cover"
          priority
          sizes="(max-width: 896px) 100vw, 896px"
        />
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1">
            <div className="flex flex-wrap gap-1.5 mb-2">
              {course.category && (
                <Badge variant="secondary">{course.category.name}</Badge>
              )}
              {course.difficulty && (
                <Badge variant="outline">{course.difficulty.name}</Badge>
              )}
            </div>
            <h1 className="text-2xl font-bold text-slate-900">{course.title}</h1>
          </div>

          {canEnroll && (
            <div className="shrink-0">
              <EnrollmentButton
                courseId={course.id}
                enrollmentStatus={course.enrollmentStatus}
                canEnroll={canEnroll}
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 text-sm text-slate-500">
          <span className="flex items-center gap-1.5">
            <BookOpen className="h-4 w-4" />
            {course.instructorName}
          </span>
          <Separator orientation="vertical" className="h-4" />
          <span className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            수강생 {course.enrollmentCount.toLocaleString()}명
          </span>
          {course.difficulty && (
            <>
              <Separator orientation="vertical" className="h-4" />
              <span className="flex items-center gap-1.5">
                <BarChart2 className="h-4 w-4" />
                {course.difficulty.name}
              </span>
            </>
          )}
        </div>

        {course.description && (
          <div>
            <h2 className="text-base font-semibold text-slate-900 mb-2">코스 소개</h2>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
              {course.description}
            </p>
          </div>
        )}

        {course.curriculum && (
          <>
            <Separator />
            <div>
              <h2 className="text-base font-semibold text-slate-900 mb-2">커리큘럼</h2>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                {course.curriculum}
              </p>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
