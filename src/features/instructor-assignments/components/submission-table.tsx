'use client';

import { match } from 'ts-pattern';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import type {
  InstructorSubmissionItem,
  SubmissionFilter,
} from '@/features/instructor-assignments/lib/dto';

type FilterTab = {
  value: SubmissionFilter;
  label: string;
};

const FILTER_TABS: FilterTab[] = [
  { value: undefined, label: '전체' },
  { value: 'pending', label: '미채점' },
  { value: 'late', label: '지각' },
  { value: 'resubmission', label: '재제출 요청' },
];

type SubmissionTableProps = {
  submissions: InstructorSubmissionItem[];
  totalCount: number;
  currentFilter: SubmissionFilter;
  onFilterChange: (filter: SubmissionFilter) => void;
  isLoading: boolean;
};

const SubmissionStatusBadge = ({ status }: { status: InstructorSubmissionItem['status'] }) => {
  const { label, variant } = match(status)
    .with('submitted', () => ({ label: '미채점', variant: 'secondary' as const }))
    .with('graded', () => ({ label: '채점 완료', variant: 'default' as const }))
    .with('resubmission_required', () => ({ label: '재제출 요청', variant: 'destructive' as const }))
    .with('invalidated', () => ({ label: '무효화', variant: 'outline' as const }))
    .exhaustive();

  return <Badge variant={variant}>{label}</Badge>;
};

const SkeletonRow = () => (
  <tr>
    <td className="px-4 py-3"><div className="h-4 w-24 animate-pulse rounded bg-slate-100" /></td>
    <td className="px-4 py-3"><div className="h-4 w-32 animate-pulse rounded bg-slate-100" /></td>
    <td className="px-4 py-3"><div className="h-4 w-12 animate-pulse rounded bg-slate-100" /></td>
    <td className="px-4 py-3"><div className="h-4 w-20 animate-pulse rounded bg-slate-100" /></td>
    <td className="px-4 py-3"><div className="h-4 w-12 animate-pulse rounded bg-slate-100" /></td>
  </tr>
);

export const SubmissionTable = ({
  submissions,
  totalCount,
  currentFilter,
  onFilterChange,
  isLoading,
}: SubmissionTableProps) => (
  <div className="flex flex-col gap-4">
    <div className="flex items-center gap-2">
      {FILTER_TABS.map((tab) => (
        <button
          key={String(tab.value)}
          type="button"
          onClick={() => onFilterChange(tab.value)}
          className={[
            'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            currentFilter === tab.value
              ? 'bg-slate-900 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
          ].join(' ')}
        >
          {tab.label}
        </button>
      ))}
      <span className="ml-auto text-sm text-slate-500">총 {totalCount}건</span>
    </div>

    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-slate-50 text-left text-slate-500">
            <th className="px-4 py-3 font-medium">학습자</th>
            <th className="px-4 py-3 font-medium">제출 시각</th>
            <th className="px-4 py-3 font-medium">지각</th>
            <th className="px-4 py-3 font-medium">상태</th>
            <th className="px-4 py-3 font-medium">점수</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {isLoading ? (
            <>
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </>
          ) : submissions.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                제출물이 없습니다.
              </td>
            </tr>
          ) : (
            submissions.map((submission) => (
              <tr key={submission.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{submission.learnerName}</td>
                <td className="px-4 py-3 text-slate-600">
                  {format(new Date(submission.submittedAt), 'yyyy.MM.dd HH:mm', { locale: ko })}
                </td>
                <td className="px-4 py-3">
                  {submission.isLate ? (
                    <Badge variant="destructive" className="text-xs">지각</Badge>
                  ) : null}
                </td>
                <td className="px-4 py-3">
                  <SubmissionStatusBadge status={submission.status} />
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {submission.score !== null ? `${submission.score}점` : '-'}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </div>
);
