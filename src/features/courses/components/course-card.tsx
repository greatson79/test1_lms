'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import type { CourseDto } from '@/features/courses/lib/dto';

type CourseCardProps = {
  course: CourseDto;
};

const THUMBNAIL_SIZE = 400;
const THUMBNAIL_HEIGHT = 225;

export const CourseCard = ({ course }: CourseCardProps) => {
  const thumbnailUrl = `https://picsum.photos/seed/${course.id}/${THUMBNAIL_SIZE}/${THUMBNAIL_HEIGHT}`;

  return (
    <Link href={`/courses/${course.id}`} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg">
      <Card className="h-full overflow-hidden transition-shadow hover:shadow-md">
        <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
          <Image
            src={thumbnailUrl}
            alt={course.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>

        <CardContent className="p-4">
          <div className="flex flex-wrap gap-1.5 mb-2">
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

          <h3 className="font-semibold text-sm leading-snug line-clamp-2 text-slate-900 mb-1">
            {course.title}
          </h3>

          {course.description && (
            <p className="text-xs text-slate-500 line-clamp-2 mt-1">
              {course.description}
            </p>
          )}
        </CardContent>

        <CardFooter className="px-4 pb-4 pt-0 flex items-center justify-between text-xs text-slate-500">
          <span>{course.instructorName}</span>
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {course.enrollmentCount.toLocaleString()}
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
};
