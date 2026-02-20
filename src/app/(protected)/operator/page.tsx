'use client';

import { redirect } from 'next/navigation';

type OperatorPageProps = {
  params: Promise<Record<string, never>>;
};

export default function OperatorPage({ params }: OperatorPageProps) {
  void params;
  redirect('/operator/reports');
}
