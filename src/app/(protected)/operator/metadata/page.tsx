'use client';

import Link from 'next/link';
import { RefreshCw } from 'lucide-react';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { useOperatorCategoriesQuery } from '@/features/operator/hooks/useOperatorCategoriesQuery';
import { useOperatorDifficultiesQuery } from '@/features/operator/hooks/useOperatorDifficultiesQuery';
import { useCreateCategoryMutation } from '@/features/operator/hooks/useCreateCategoryMutation';
import { useUpdateCategoryMutation } from '@/features/operator/hooks/useUpdateCategoryMutation';
import { useCreateDifficultyMutation } from '@/features/operator/hooks/useCreateDifficultyMutation';
import { useUpdateDifficultyMutation } from '@/features/operator/hooks/useUpdateDifficultyMutation';
import { MetadataTable } from '@/features/operator/components/metadata-table';
import { MetadataAddRow } from '@/features/operator/components/metadata-add-row';
import { useToast } from '@/hooks/use-toast';

type OperatorMetadataPageProps = {
  params: Promise<Record<string, never>>;
};

export default function OperatorMetadataPage({ params }: OperatorMetadataPageProps) {
  void params;
  const { isAllowed, isLoading: isRoleLoading } = useRoleGuard('operator');
  const { toast } = useToast();

  const {
    data: categoriesData,
    isLoading: isCategoriesLoading,
    isError: isCategoriesError,
    error: categoriesError,
    refetch: refetchCategories,
  } = useOperatorCategoriesQuery();

  const {
    data: difficultiesData,
    isLoading: isDifficultiesLoading,
    isError: isDifficultiesError,
    error: difficultiesError,
    refetch: refetchDifficulties,
  } = useOperatorDifficultiesQuery();

  const { mutate: createCategory, isPending: isCreatingCategory } = useCreateCategoryMutation();
  const { mutate: updateCategory, isPending: isUpdatingCategory } = useUpdateCategoryMutation();
  const { mutate: createDifficulty, isPending: isCreatingDifficulty } = useCreateDifficultyMutation();
  const { mutate: updateDifficulty, isPending: isUpdatingDifficulty } = useUpdateDifficultyMutation();

  if (isRoleLoading || !isAllowed) return null;

  const handleCreateCategory = (name: string) => {
    createCategory(name, {
      onError: (error) => {
        toast({
          title: '카테고리 생성에 실패했습니다.',
          description: error.message,
          variant: 'destructive',
        });
      },
    });
  };

  const handleUpdateCategory = (id: string, update: { name?: string; isActive?: boolean }) => {
    updateCategory(
      { id, body: update },
      {
        onError: (error) => {
          toast({
            title: '카테고리 수정에 실패했습니다.',
            description: error.message,
            variant: 'destructive',
          });
        },
      },
    );
  };

  const handleCreateDifficulty = (name: string) => {
    createDifficulty(name, {
      onError: (error) => {
        toast({
          title: '난이도 생성에 실패했습니다.',
          description: error.message,
          variant: 'destructive',
        });
      },
    });
  };

  const handleUpdateDifficulty = (id: string, update: { name?: string; isActive?: boolean }) => {
    updateDifficulty(
      { id, body: update },
      {
        onError: (error) => {
          toast({
            title: '난이도 수정에 실패했습니다.',
            description: error.message,
            variant: 'destructive',
          });
        },
      },
    );
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-10 px-6 py-16">
      <header className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-semibold">메타데이터 관리</h1>
          <p className="text-slate-500">카테고리와 난이도를 관리하세요.</p>
        </div>
        <Link
          href="/operator/reports"
          className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          신고 관리
        </Link>
      </header>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">카테고리</h2>
        </div>

        {isCategoriesError ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 py-12 text-center">
            <p className="text-sm text-slate-500">{categoriesError?.message}</p>
            <button
              type="button"
              onClick={() => void refetchCategories()}
              className="mt-4 flex items-center gap-2 rounded-md bg-slate-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              다시 시도
            </button>
          </div>
        ) : (
          <>
            <MetadataTable
              type="category"
              items={categoriesData?.categories ?? []}
              isLoading={isCategoriesLoading}
              onUpdate={handleUpdateCategory}
              isPending={isUpdatingCategory}
            />
            <MetadataAddRow
              onAdd={handleCreateCategory}
              isPending={isCreatingCategory}
              placeholder="새 카테고리 이름"
            />
          </>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">난이도</h2>
        </div>

        {isDifficultiesError ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 py-12 text-center">
            <p className="text-sm text-slate-500">{difficultiesError?.message}</p>
            <button
              type="button"
              onClick={() => void refetchDifficulties()}
              className="mt-4 flex items-center gap-2 rounded-md bg-slate-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              다시 시도
            </button>
          </div>
        ) : (
          <>
            <MetadataTable
              type="difficulty"
              items={difficultiesData?.difficulties ?? []}
              isLoading={isDifficultiesLoading}
              onUpdate={handleUpdateDifficulty}
              isPending={isUpdatingDifficulty}
            />
            <MetadataAddRow
              onAdd={handleCreateDifficulty}
              isPending={isCreatingDifficulty}
              placeholder="새 난이도 이름"
            />
          </>
        )}
      </section>
    </div>
  );
}
