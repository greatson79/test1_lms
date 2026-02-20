'use client';

import { useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { CategoryDto, DifficultyDto } from '@/features/courses/lib/dto';

type CourseFilterProps = {
  categories: CategoryDto[];
  difficulties: DifficultyDto[];
};

const ALL_VALUE = 'all';
const SORT_OPTIONS = [
  { value: 'recent', label: '최신순' },
  { value: 'popular', label: '인기순' },
] as const;

export const CourseFilter = ({ categories, difficulties }: CourseFilterProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentSearch = searchParams.get('search') ?? '';
  const currentCategory = searchParams.get('categoryId') ?? ALL_VALUE;
  const currentDifficulty = searchParams.get('difficultyId') ?? ALL_VALUE;
  const currentSort = searchParams.get('sort') ?? 'recent';

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === ALL_VALUE || value === '') {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });

      router.push(`/courses?${params.toString()}`);
    },
    [router, searchParams],
  );

  const handleSearchSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = e.currentTarget;
      const input = form.elements.namedItem('search') as HTMLInputElement;
      updateParams({ search: input.value || null });
    },
    [updateParams],
  );

  const hasActiveFilters =
    currentSearch || currentCategory !== ALL_VALUE || currentDifficulty !== ALL_VALUE || currentSort !== 'recent';

  const handleReset = useCallback(() => {
    router.push('/courses');
  }, [router]);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
      <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-48">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        <Input
          name="search"
          type="text"
          placeholder="코스 검색..."
          defaultValue={currentSearch}
          className="pl-9 h-9"
        />
      </form>

      <Select
        value={currentCategory}
        onValueChange={(value) => updateParams({ categoryId: value })}
      >
        <SelectTrigger className="h-9 w-full sm:w-36">
          <SelectValue placeholder="카테고리" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE}>전체 카테고리</SelectItem>
          {categories.map((cat) => (
            <SelectItem key={cat.id} value={cat.id}>
              {cat.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={currentDifficulty}
        onValueChange={(value) => updateParams({ difficultyId: value })}
      >
        <SelectTrigger className="h-9 w-full sm:w-32">
          <SelectValue placeholder="난이도" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE}>전체 난이도</SelectItem>
          {difficulties.map((diff) => (
            <SelectItem key={diff.id} value={diff.id}>
              {diff.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={currentSort}
        onValueChange={(value) => updateParams({ sort: value })}
      >
        <SelectTrigger className="h-9 w-full sm:w-28">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={handleReset} className="h-9 text-slate-500">
          <X className="h-4 w-4 mr-1" />
          초기화
        </Button>
      )}
    </div>
  );
};
