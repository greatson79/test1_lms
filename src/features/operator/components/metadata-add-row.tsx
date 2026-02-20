'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type MetadataAddRowProps = {
  onAdd: (name: string) => void;
  isPending: boolean;
  placeholder: string;
};

export const MetadataAddRow = ({ onAdd, isPending, placeholder }: MetadataAddRowProps) => {
  const [name, setName] = useState('');

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setName('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={isPending}
        className="max-w-xs"
      />
      <Button
        type="button"
        size="sm"
        onClick={handleSubmit}
        disabled={isPending || !name.trim()}
      >
        {isPending ? '추가 중...' : '추가'}
      </Button>
    </div>
  );
};
