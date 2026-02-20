'use client';

import { match } from 'ts-pattern';
import { Globe, Lock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
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
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button disabled={isPending} variant="outline">
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Lock className="mr-2 h-4 w-4" />
            )}
            수동 마감
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>과제 마감 확인</AlertDialogTitle>
            <AlertDialogDescription>
              마감 후 학습자 제출이 불가합니다. 계속하시겠습니까?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={onClose}>마감하기</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    ))
    .with('closed', () => (
      <Badge variant="outline" className="text-slate-500">
        마감됨
      </Badge>
    ))
    .exhaustive();
