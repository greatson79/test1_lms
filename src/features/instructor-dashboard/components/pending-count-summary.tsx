'use client';

import { ClipboardCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type PendingCountSummaryProps = {
  totalPendingCount: number;
};

export const PendingCountSummary = ({ totalPendingCount }: PendingCountSummaryProps) => (
  <Card>
    <CardHeader className="pb-2">
      <div className="flex items-center gap-2">
        <ClipboardCheck className="h-5 w-5 text-slate-600" />
        <CardTitle className="text-base">전체 채점 대기</CardTitle>
      </div>
    </CardHeader>
    <CardContent>
      {totalPendingCount === 0 ? (
        <p className="text-sm text-slate-400">채점할 제출물이 없습니다.</p>
      ) : (
        <p className="text-3xl font-bold text-slate-900">
          {totalPendingCount}
          <span className="ml-1 text-base font-normal text-slate-500">건</span>
        </p>
      )}
    </CardContent>
  </Card>
);
