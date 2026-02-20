'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { CreateAssignmentBodySchema } from '@/features/instructor-assignments/lib/dto';
import type { CreateAssignmentBody } from '@/features/instructor-assignments/lib/dto';

type AssignmentFormProps = {
  defaultValues?: Partial<CreateAssignmentBody>;
  onSubmit: (values: CreateAssignmentBody) => void;
  isPending: boolean;
  submitLabel?: string;
};

const toDatetimeLocalValue = (isoString: string): string => {
  if (!isoString) return '';
  // ISO 8601 형식을 datetime-local 입력 형식으로 변환 (초 제거)
  return isoString.slice(0, 16);
};

export const AssignmentForm = ({
  defaultValues,
  onSubmit,
  isPending,
  submitLabel = '저장',
}: AssignmentFormProps) => {
  const form = useForm<CreateAssignmentBody>({
    resolver: zodResolver(CreateAssignmentBodySchema),
    defaultValues: {
      title: defaultValues?.title ?? '',
      description: defaultValues?.description ?? null,
      dueAt: defaultValues?.dueAt ? toDatetimeLocalValue(defaultValues.dueAt) : '',
      weight: defaultValues?.weight ?? 0,
      allowLate: defaultValues?.allowLate ?? false,
      allowResubmit: defaultValues?.allowResubmit ?? false,
    },
  });

  const handleSubmit = form.handleSubmit((values) => {
    // datetime-local 값을 ISO 8601 형식으로 변환
    const normalized: CreateAssignmentBody = {
      ...values,
      dueAt: new Date(values.dueAt).toISOString(),
    };
    onSubmit(normalized);
  });

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>제목 *</FormLabel>
              <FormControl>
                <Input placeholder="과제 제목을 입력하세요" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>설명</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="과제 설명을 입력하세요"
                  rows={4}
                  {...field}
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value || null)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="dueAt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>마감일 *</FormLabel>
              <FormControl>
                <Input
                  type="datetime-local"
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="weight"
          render={({ field }) => (
            <FormItem>
              <FormLabel>점수 비중 * (%)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0.01}
                  step={0.01}
                  placeholder="점수 비중을 입력하세요 (예: 30)"
                  {...field}
                  value={field.value === 0 ? '' : field.value}
                  onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="allowLate"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start gap-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value ?? false}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>지각 제출 허용</FormLabel>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="allowResubmit"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start gap-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value ?? false}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>재제출 허용</FormLabel>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isPending} className="self-start">
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {submitLabel}
        </Button>
      </form>
    </Form>
  );
};
