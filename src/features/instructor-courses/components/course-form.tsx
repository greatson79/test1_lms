'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { CreateCourseBodySchema } from '@/features/instructor-courses/lib/dto';
import type { CreateCourseBody, InstructorCourseMeta } from '@/features/instructor-courses/lib/dto';

const NONE_VALUE = '__none__';

type CourseFormProps = {
  defaultValues?: Partial<CreateCourseBody>;
  meta: InstructorCourseMeta;
  onSubmit: (values: CreateCourseBody) => void;
  isPending: boolean;
  submitLabel?: string;
};

export const CourseForm = ({
  defaultValues,
  meta,
  onSubmit,
  isPending,
  submitLabel = '저장',
}: CourseFormProps) => {
  const form = useForm<CreateCourseBody>({
    resolver: zodResolver(CreateCourseBodySchema),
    defaultValues: {
      title: defaultValues?.title ?? '',
      description: defaultValues?.description ?? null,
      categoryId: defaultValues?.categoryId ?? null,
      difficultyId: defaultValues?.difficultyId ?? null,
      curriculum: defaultValues?.curriculum ?? null,
    },
  });

  const handleSubmit = form.handleSubmit((values) => {
    onSubmit(values);
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
                <Input placeholder="코스 제목을 입력하세요" {...field} />
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
                  placeholder="코스 설명을 입력하세요"
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
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>카테고리</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(value === NONE_VALUE ? null : value)}
                value={field.value ?? NONE_VALUE}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="카테고리를 선택하세요" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>카테고리 없음</SelectItem>
                  {meta.categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="difficultyId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>난이도</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(value === NONE_VALUE ? null : value)}
                value={field.value ?? NONE_VALUE}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="난이도를 선택하세요" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>난이도 없음</SelectItem>
                  {meta.difficulties.map((difficulty) => (
                    <SelectItem key={difficulty.id} value={difficulty.id}>
                      {difficulty.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="curriculum"
          render={({ field }) => (
            <FormItem>
              <FormLabel>커리큘럼</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="커리큘럼 내용을 입력하세요"
                  rows={6}
                  {...field}
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value || null)}
                />
              </FormControl>
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
