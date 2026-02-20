'use client';

import { useState } from 'react';
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
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { CategoryDto, DifficultyDto } from '@/features/operator/lib/dto';

type MetadataItem = CategoryDto | DifficultyDto;

type MetadataTableProps = {
  type: 'category' | 'difficulty';
  items: MetadataItem[];
  isLoading: boolean;
  onUpdate: (id: string, update: { name?: string; isActive?: boolean }) => void;
  isPending: boolean;
};

const SKELETON_ROW_COUNT = 4;

export const MetadataTable = ({
  items,
  isLoading,
  onUpdate,
  isPending,
}: MetadataTableProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [deactivateTargetId, setDeactivateTargetId] = useState<string | null>(null);

  const handleEditStart = (item: MetadataItem) => {
    setEditingId(item.id);
    setEditingName(item.name);
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleNameSave = (id: string) => {
    const trimmed = editingName.trim();
    if (!trimmed) return;
    onUpdate(id, { name: trimmed });
    setEditingId(null);
    setEditingName('');
  };

  const handleSwitchChange = (item: MetadataItem, checked: boolean) => {
    if (!checked) {
      setDeactivateTargetId(item.id);
      return;
    }
    onUpdate(item.id, { isActive: true });
  };

  const handleDeactivateConfirm = () => {
    if (!deactivateTargetId) return;
    onUpdate(deactivateTargetId, { isActive: false });
    setDeactivateTargetId(null);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: SKELETON_ROW_COUNT }).map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-dashed border-slate-300 py-12">
        <p className="text-sm text-slate-500">등록된 항목이 없습니다.</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>이름</TableHead>
              <TableHead className="w-24">활성화</TableHead>
              <TableHead className="w-40">생성일</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  {editingId === item.id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleNameSave(item.id);
                          if (e.key === 'Escape') handleEditCancel();
                        }}
                        className="h-8 max-w-xs"
                        autoFocus
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleNameSave(item.id)}
                        disabled={isPending || !editingName.trim()}
                      >
                        저장
                      </Button>
                      <Button size="sm" variant="ghost" onClick={handleEditCancel}>
                        취소
                      </Button>
                    </div>
                  ) : (
                    <span
                      className="cursor-pointer text-sm hover:text-slate-600"
                      onClick={() => handleEditStart(item)}
                    >
                      {item.name}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <Switch
                    checked={item.isActive}
                    onCheckedChange={(checked) => handleSwitchChange(item, checked)}
                    disabled={isPending}
                  />
                </TableCell>
                <TableCell className="text-sm text-slate-500">
                  {format(new Date(item.createdAt), 'yyyy.MM.dd', { locale: ko })}
                </TableCell>
                <TableCell>
                  {editingId !== item.id && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEditStart(item)}
                    >
                      수정
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={deactivateTargetId !== null}
        onOpenChange={(open) => {
          if (!open) setDeactivateTargetId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>항목 비활성화</AlertDialogTitle>
            <AlertDialogDescription>
              사용 중인 항목입니다. 비활성화하면 신규 코스에서 선택할 수 없습니다. 계속하시겠습니까?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeactivateTargetId(null)}>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeactivateConfirm}>비활성화</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
