'use client';

import { match } from 'ts-pattern';
import { ClipboardList } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { InstructorCourseItem } from '@/features/instructor-dashboard/lib/dto';

type InstructorCourseCardProps = {
  course: InstructorCourseItem;
};

type StatusBadgeProps = {
  status: InstructorCourseItem['status'];
};

const StatusBadge = ({ status }: StatusBadgeProps) => {
  const { label, variant } = match(status)
    .with('draft', () => ({ label: '초안', variant: 'secondary' as const }))
    .with('published', () => ({ label: '게시됨', variant: 'default' as const }))
    .with('archived', () => ({ label: '보관됨', variant: 'outline' as const }))
    .exhaustive();

  return <Badge variant={variant}>{label}</Badge>;
};

export const InstructorCourseCard = ({ course }: InstructorCourseCardProps) => (
  <Card className="flex flex-col gap-2">
    <CardHeader className="pb-2">
      <div className="flex items-start justify-between gap-2">
        <CardTitle className="line-clamp-2 text-base leading-snug">{course.title}</CardTitle>
        <StatusBadge status={course.status} />
      </div>
    </CardHeader>
    <CardContent>
      {course.pendingCount > 0 ? (
        <div className="flex items-center gap-1.5">
          <ClipboardList className="h-4 w-4 text-blue-500" />
          <span className="text-sm font-medium text-blue-600">
            채점 대기 {course.pendingCount}건
          </span>
        </div>
      ) : (
        <p className="text-sm text-slate-400">채점 대기 없음</p>
      )}
    </CardContent>
  </Card>
);
