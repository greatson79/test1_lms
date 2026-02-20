'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { useOperatorReportsQuery } from '@/features/operator/hooks/useOperatorReportsQuery';
import { ReportTable } from '@/features/operator/components/report-table';
import { ReportActionDialog } from '@/features/operator/components/report-action-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import type { ReportDto, ReportStatus } from '@/features/operator/lib/dto';

type OperatorReportsPageProps = {
  params: Promise<Record<string, never>>;
};

const STATUS_OPTIONS: Array<{ value: ReportStatus | 'all'; label: string }> = [
  { value: 'all', label: '전체' },
  { value: 'received', label: '접수됨' },
  { value: 'investigating', label: '조사 중' },
  { value: 'resolved', label: '처리 완료' },
];

export default function OperatorReportsPage({ params }: OperatorReportsPageProps) {
  void params;
  const { isAllowed, isLoading: isRoleLoading } = useRoleGuard('operator');

  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'all'>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedReport, setSelectedReport] = useState<ReportDto | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data, isLoading, isError, error, refetch } = useOperatorReportsQuery({
    status: statusFilter === 'all' ? undefined : statusFilter,
    sort: sortOrder,
  });

  if (isRoleLoading || !isAllowed) return null;

  const handleSelectReport = (report: ReportDto) => {
    setSelectedReport(report);
    setDialogOpen(true);
  };

  const handleDialogSuccess = () => {
    setSelectedReport(null);
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-6 py-16">
      <header className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-semibold">신고 관리</h1>
          <p className="text-slate-500">접수된 신고를 조회하고 처리하세요.</p>
        </div>
        <Link
          href="/operator/metadata"
          className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          메타데이터 관리
        </Link>
      </header>

      <div className="flex items-center gap-3">
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as ReportStatus | 'all')}
        >
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
        >
          {sortOrder === 'desc' ? '최신순' : '오래된순'}
        </Button>

        <div className="ml-auto text-sm text-slate-500">
          총 {data?.totalCount ?? 0}건
        </div>
      </div>

      {isError ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 py-24 text-center">
          <p className="font-medium text-slate-700">데이터를 불러오지 못했습니다.</p>
          <p className="mt-1 text-sm text-slate-400">{error?.message}</p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-6 flex items-center gap-2 rounded-md bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            <RefreshCw className="h-4 w-4" />
            다시 시도
          </button>
        </div>
      ) : (
        <ReportTable
          reports={data?.reports ?? []}
          isLoading={isLoading}
          onSelectReport={handleSelectReport}
          selectedReportId={selectedReport?.id}
        />
      )}

      {selectedReport && (
        <ReportActionDialog
          report={selectedReport}
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setSelectedReport(null);
          }}
          onSuccess={handleDialogSuccess}
        />
      )}
    </div>
  );
}
