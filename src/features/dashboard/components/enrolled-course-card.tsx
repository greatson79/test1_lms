'use client';

import Link from 'next/link';
import Image from 'next/image';
import { BarChart2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { EnrolledCourse } from '@/features/dashboard/lib/dto';

type EnrolledCourseCardProps = {
  course: EnrolledCourse;
};

const THUMBNAIL_WIDTH = 400;
const THUMBNAIL_HEIGHT = 225;

type ProgressBarProps = {
  value: number;
};

const ProgressBar = ({ value }: ProgressBarProps) => (
  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
    <div
      className="h-full rounded-full bg-slate-900 transition-all duration-300"
      style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
    />
  </div>
);

export const EnrolledCourseCard = ({ course }: EnrolledCourseCardProps) => {
  const progressPercent =
    course.totalCount > 0
      ? Math.round((course.completedCount / course.totalCount) * 100)
      : 0;

  const thumbnailUrl = `https://picsum.photos/seed/${course.id}/${THUMBNAIL_WIDTH}/${THUMBNAIL_HEIGHT}`;

  return (
    <div className="flex flex-col rounded-lg overflow-hidden border border-slate-200 transition-shadow hover:shadow-md">
      <Link
        href={`/courses/${course.id}`}
        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Card className="overflow-hidden rounded-none border-0 shadow-none">
          <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
            <Image
              src={thumbnailUrl}
              alt={course.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>

          <CardContent className="flex flex-col gap-3 p-4 pb-2">
            <div className="flex flex-wrap gap-1.5">
              {course.category && (
                <Badge variant="secondary" className="text-xs">
                  {course.category.name}
                </Badge>
              )}
              {course.difficulty && (
                <Badge variant="outline" className="text-xs">
                  {course.difficulty.name}
                </Badge>
              )}
            </div>

            <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900">
              {course.title}
            </h3>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>진행률</span>
                <span className="font-medium text-slate-700">
                  {progressPercent === 100 ? '완료' : `${progressPercent}%`}
                </span>
              </div>
              <ProgressBar value={progressPercent} />
              <p className="text-xs text-slate-400">
                {course.completedCount} / {course.totalCount}개 과제 완료
              </p>
            </div>
          </CardContent>
        </Card>
      </Link>

      <div className="px-4 pb-3">
        <Link
          href={`/courses/my/${course.id}/grades`}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800"
          onClick={(e) => e.stopPropagation()}
        >
          <BarChart2 className="h-3.5 w-3.5" />
          성적 보기
        </Link>
      </div>
    </div>
  );
};
