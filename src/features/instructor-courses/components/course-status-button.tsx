'use client';

import { match } from 'ts-pattern';
import { Globe, Archive, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { InstructorCourseDto } from '@/features/instructor-courses/lib/dto';

type CourseStatusButtonProps = {
  status: InstructorCourseDto['status'];
  onPublish: () => void;
  onArchive: () => void;
  isPending: boolean;
};

export const CourseStatusButton = ({
  status,
  onPublish,
  onArchive,
  isPending,
}: CourseStatusButtonProps) =>
  match(status)
    .with('draft', () => (
      <Button onClick={onPublish} disabled={isPending} variant="default">
        {isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Globe className="mr-2 h-4 w-4" />
        )}
        공개하기
      </Button>
    ))
    .with('published', () => (
      <Button onClick={onArchive} disabled={isPending} variant="outline">
        {isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Archive className="mr-2 h-4 w-4" />
        )}
        보관하기
      </Button>
    ))
    .with('archived', () => (
      <Badge variant="outline" className="text-slate-500">
        보관됨
      </Badge>
    ))
    .exhaustive();
