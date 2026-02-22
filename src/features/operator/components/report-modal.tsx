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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="신고 사유를 선택해 주세요." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="부적절한 콘텐츠">부적절한 콘텐츠</SelectItem>
                      <SelectItem value="저작권 침해">저작권 침해</SelectItem>
                      <SelectItem value="스팸 / 광고">스팸 / 광고</SelectItem>
                      <SelectItem value="허위 정보">허위 정보</SelectItem>
                      <SelectItem value="욕설 / 혐오 표현">욕설 / 혐오 표현</SelectItem>
                      <SelectItem value="기타">기타</SelectItem>
                    </SelectContent>
                  </Select>
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
