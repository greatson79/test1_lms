'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useSubmitReportMutation } from '@/features/operator/hooks/useSubmitReportMutation';
import { CreateReportBodySchema } from '@/features/operator/lib/dto';
import type { ReportTargetType, CreateReportBody } from '@/features/operator/lib/dto';

type ReportModalProps = {
  targetType: ReportTargetType;
  targetId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const ReportModal = ({ targetType, targetId, open, onOpenChange }: ReportModalProps) => {
  const { toast } = useToast();
  const { mutate, isPending } = useSubmitReportMutation();

  const form = useForm<CreateReportBody>({
    resolver: zodResolver(CreateReportBodySchema),
    defaultValues: {
      targetType,
      targetId,
      reason: '',
      content: '',
    },
  });

  const onSubmit = (values: CreateReportBody) => {
    mutate(values, {
      onSuccess: () => {
        toast({ title: '신고가 접수되었습니다.' });
        form.reset();
        onOpenChange(false);
      },
      onError: (error) => {
        toast({
          title: '신고 접수에 실패했습니다.',
          description: error.message,
          variant: 'destructive',
        });
      },
    });
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) form.reset();
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>신고하기</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>신고 사유</FormLabel>
                  <FormControl>
                    <Input placeholder="신고 사유를 입력해 주세요." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>상세 내용</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="신고 내용을 상세히 입력해 주세요."
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="mt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isPending}
              >
                취소
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? '접수 중...' : '신고 접수'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
