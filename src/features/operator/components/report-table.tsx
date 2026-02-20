'use client';

import { match } from 'ts-pattern';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { ReportDto } from '@/features/operator/lib/dto';

type ReportTableProps = {
  reports: ReportDto[];
  isLoading: boolean;
  onSelectReport: (report: ReportDto) => void;
  selectedReportId?: string;
};

const TARGET_TYPE_LABEL: Record<ReportDto['targetType'], string> = {
  course: '코스',
  assignment: '과제',
  submission: '제출물',
  user: '사용자',
};

const ACTION_LABEL: Record<NonNullable<ReportDto['action']>, string> = {
  warning: '경고',
  invalidate_submission: '제출 무효',
  restrict_account: '계정 제한',
};

const StatusBadge = ({ status }: { status: ReportDto['status'] }) => {
  const { label, className } = match(status)
    .with('received', () => ({ label: '접수됨', className: 'bg-slate-100 text-slate-700 hover:bg-slate-100' }))
    .with('investigating', () => ({ label: '조사 중', className: 'bg-blue-100 text-blue-700 hover:bg-blue-100' }))
    .with('resolved', () => ({ label: '처리 완료', className: 'bg-green-100 text-green-700 hover:bg-green-100' }))
    .exhaustive();

  return <Badge className={className}>{label}</Badge>;
};

const SKELETON_ROW_COUNT = 5;

export const ReportTable = ({
  reports,
  isLoading,
  onSelectReport,
  selectedReportId,
}: ReportTableProps) => {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: SKELETON_ROW_COUNT }).map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />
        ))}
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-dashed border-slate-300 py-16">
        <p className="text-sm text-slate-500">신고 내역이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>신고 일시</TableHead>
            <TableHead>대상 유형</TableHead>
            <TableHead>신고 사유</TableHead>
            <TableHead>처리 상태</TableHead>
            <TableHead>처리 액션</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports.map((report) => (
            <TableRow
              key={report.id}
              className={`cursor-pointer hover:bg-slate-50 ${
                selectedReportId === report.id ? 'bg-slate-50' : ''
              }`}
              onClick={() => onSelectReport(report)}
            >
              <TableCell className="text-sm text-slate-600">
                {format(new Date(report.createdAt), 'yyyy.MM.dd HH:mm', { locale: ko })}
              </TableCell>
              <TableCell>
                <span className="text-sm font-medium">
                  {TARGET_TYPE_LABEL[report.targetType]}
                </span>
              </TableCell>
              <TableCell>
                <span className="max-w-xs truncate text-sm text-slate-700">{report.reason}</span>
              </TableCell>
              <TableCell>
                <StatusBadge status={report.status} />
              </TableCell>
              <TableCell>
                <span className="text-sm text-slate-600">
                  {report.action ? ACTION_LABEL[report.action] : '-'}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
