'use client';

import { match } from 'ts-pattern';
import { Globe, Lock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { InstructorAssignmentDto } from '@/features/instructor-assignments/lib/dto';

type AssignmentStatusButtonProps = {
  status: InstructorAssignmentDto['status'];
  onPublish: () => void;
  onClose: () => void;
  isPending: boolean;
};

export const AssignmentStatusButton = ({
  status,
  onPublish,
  onClose,
  isPending,
}: AssignmentStatusButtonProps) =>
  match(status)
    .with('draft', () => (
      <Button onClick={onPublish} disabled={isPending} variant="default">
        {isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Globe className="mr-2 h-4 w-4" />
        )}
        게시하기
      </Button>
    ))
    .with('published', () => (
      <Button onClick={onClose} disabled={isPending} variant="outline">
        {isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Lock className="mr-2 h-4 w-4" />
        )}
        수동 마감
      </Button>
    ))
    .with('closed', () => (
      <Badge variant="outline" className="text-slate-500">
        마감됨
      </Badge>
    ))
    .exhaustive();
