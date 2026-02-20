'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useUpdateReportMutation } from '@/features/operator/hooks/useUpdateReportMutation';
import type { ReportDto, ReportStatus, ReportAction } from '@/features/operator/lib/dto';

type ReportActionDialogProps = {
  report: ReportDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

const TARGET_TYPE_LABEL: Record<ReportDto['targetType'], string> = {
  course: '코스',
  assignment: '과제',
  submission: '제출물',
  user: '사용자',
};

const STATUS_LABEL: Record<ReportStatus, string> = {
  received: '접수됨',
  investigating: '조사 중',
  resolved: '처리 완료',
};

const ACTION_OPTIONS: Array<{ value: ReportAction | 'none'; label: string }> = [
  { value: 'none', label: '무혐의 (액션 없음)' },
  { value: 'warning', label: '경고' },
  { value: 'invalidate_submission', label: '제출 무효' },
  { value: 'restrict_account', label: '계정 제한' },
];

export const ReportActionDialog = ({
  report,
  open,
  onOpenChange,
  onSuccess,
}: ReportActionDialogProps) => {
  const { toast } = useToast();
  const { mutate, isPending } = useUpdateReportMutation();

  const [selectedStatus, setSelectedStatus] = useState<ReportStatus | ''>('');
  const [selectedAction, setSelectedAction] = useState<ReportAction | 'none'>('none');

  const isAlreadyResolved = report.status === 'resolved';

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setSelectedStatus('');
      setSelectedAction('none');
    }
    onOpenChange(next);
  };

  const handleSubmit = () => {
    if (!selectedStatus) return;

    const action =
      selectedStatus === 'resolved' && selectedAction !== 'none' ? selectedAction : null;

    mutate(
      {
        reportId: report.id,
        body: { status: selectedStatus, action },
      },
      {
        onSuccess: () => {
          toast({ title: '신고가 처리되었습니다.' });
          handleOpenChange(false);
          onSuccess();
        },
        onError: (error) => {
          toast({
            title: '신고 처리에 실패했습니다.',
            description: error.message,
            variant: 'destructive',
          });
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>신고 처리</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="rounded-lg bg-slate-50 p-4">
            <dl className="flex flex-col gap-2 text-sm">
              <div className="flex gap-2">
                <dt className="w-20 shrink-0 font-medium text-slate-600">대상 유형</dt>
                <dd className="text-slate-900">{TARGET_TYPE_LABEL[report.targetType]}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-20 shrink-0 font-medium text-slate-600">신고 사유</dt>
                <dd className="text-slate-900">{report.reason}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-20 shrink-0 font-medium text-slate-600">상세 내용</dt>
                <dd className="text-slate-900">{report.content}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-20 shrink-0 font-medium text-slate-600">현재 상태</dt>
                <dd>
                  <Badge variant="outline">{STATUS_LABEL[report.status]}</Badge>
                </dd>
              </div>
            </dl>
          </div>

          {isAlreadyResolved ? (
            <p className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              이미 처리 완료된 신고입니다. 상태를 변경할 수 없습니다.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">처리 상태 변경</label>
                <Select
                  value={selectedStatus}
                  onValueChange={(value) => setSelectedStatus(value as ReportStatus)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="상태를 선택하세요." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="investigating">조사 중</SelectItem>
                    <SelectItem value="resolved">처리 완료</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedStatus === 'resolved' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700">처리 액션</label>
                  <Select
                    value={selectedAction}
                    onValueChange={(value) => setSelectedAction(value as ReportAction | 'none')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="액션을 선택하세요." />
                    </SelectTrigger>
                    <SelectContent>
                      {ACTION_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
          >
            닫기
          </Button>
          {!isAlreadyResolved && (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isPending || !selectedStatus}
            >
              {isPending ? '처리 중...' : '처리 적용'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
