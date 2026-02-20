'use client';

import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { RecentFeedback } from '@/features/dashboard/lib/dto';

type RecentFeedbacksSectionProps = {
  feedbacks: RecentFeedback[];
};

type FeedbackCardProps = {
  feedback: RecentFeedback;
};

const FeedbackCard = ({ feedback }: FeedbackCardProps) => {
  const gradedAt = feedback.gradedAt ? new Date(feedback.gradedAt) : null;
  const relativeTime = gradedAt
    ? formatDistanceToNow(gradedAt, { addSuffix: true, locale: ko })
    : null;

  return (
    <li className="flex flex-col gap-2 rounded-lg border border-slate-100 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-900">
            {feedback.assignmentTitle}
          </p>
          <p className="truncate text-xs text-slate-500">{feedback.courseTitle}</p>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {feedback.score !== null && (
            <Badge className="gap-1 text-xs">
              <Star className="h-3 w-3" />
              {feedback.score}점
            </Badge>
          )}
          {relativeTime && <span className="text-xs text-slate-400">{relativeTime}</span>}
        </div>
      </div>

      {feedback.feedback && (
        <p className="line-clamp-2 rounded bg-slate-50 p-2 text-xs leading-relaxed text-slate-600">
          {feedback.feedback}
        </p>
      )}
    </li>
  );
};

export const RecentFeedbacksSection = ({ feedbacks }: RecentFeedbacksSectionProps) => (
  <section className="flex flex-col gap-3">
    <h2 className="text-lg font-semibold text-slate-900">최근 피드백</h2>
    {feedbacks.length === 0 ? (
      <div className="flex items-center justify-center rounded-lg border border-dashed border-slate-200 py-8 text-center">
        <p className="text-sm text-slate-400">아직 채점된 과제가 없습니다.</p>
      </div>
    ) : (
      <ul className="flex flex-col gap-2">
        {feedbacks.map((f) => (
          <FeedbackCard key={f.submissionId} feedback={f} />
        ))}
      </ul>
    )}
  </section>
);
