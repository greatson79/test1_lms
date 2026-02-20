'use client';

import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { CourseGradesResponse, AssignmentGrade } from '@/features/dashboard/lib/dto';

type GradesViewProps = {
  data: CourseGradesResponse;
};

const STATUS_CONFIG: Record<
  AssignmentGrade['submissionStatus'],
  { label: string; variant: 'secondary' | 'outline' | 'default' | 'destructive' }
> = {
  not_submitted: { label: '미제출', variant: 'outline' },
  submitted: { label: '채점 대기', variant: 'secondary' },
  graded: { label: '채점 완료', variant: 'default' },
  resubmission_required: { label: '재제출 요청', variant: 'destructive' },
  invalidated: { label: '무효', variant: 'outline' },
};

type GradeMetricCardProps = {
  label: string;
  value: string;
  description: string;
};

const GradeMetricCard = ({ label, value, description }: GradeMetricCardProps) => (
  <Card>
    <CardContent className="flex flex-col gap-1 p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-3xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-400">{description}</p>
    </CardContent>
  </Card>
);

type AssignmentRowProps = {
  assignment: AssignmentGrade;
};

const AssignmentRow = ({ assignment }: AssignmentRowProps) => {
  const config = STATUS_CONFIG[assignment.submissionStatus];
  const dueDate = format(new Date(assignment.dueAt), 'MM/dd HH:mm', { locale: ko });

  return (
    <tr className="border-b border-slate-100 last:border-0">
      <td className="py-3 pr-4 text-sm font-medium text-slate-900">
        {assignment.assignmentTitle}
        {assignment.isLate && (
          <span className="ml-1.5 text-xs font-normal text-orange-500">(지각)</span>
        )}
      </td>
      <td className="py-3 pr-4 text-sm text-slate-500">{dueDate}</td>
      <td className="py-3 pr-4 text-sm text-slate-600">{assignment.weight}점</td>
      <td className="py-3 pr-4">
        <Badge variant={config.variant} className="text-xs">
          {config.label}
        </Badge>
      </td>
      <td className="py-3 text-right text-sm font-semibold text-slate-900">
        {assignment.submissionStatus === 'graded' && assignment.score !== null
          ? `${assignment.score}점`
          : '-'}
      </td>
    </tr>
  );
};

export const GradesView = ({ data }: GradesViewProps) => {
  const currentGpaText = data.currentGpa !== null ? `${data.currentGpa}점` : '-';
  const expectedFinalText = `${data.expectedFinalGrade}점`;

  return (
    <div className="flex flex-col gap-8">
      {/* 성적 요약 카드 */}
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-slate-900">성적 요약</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <GradeMetricCard
            label="현재 평점"
            value={currentGpaText}
            description="채점된 과제들의 가중 평균 — 제출 퀄리티 지표"
          />
          <GradeMetricCard
            label="예상 최종 성적"
            value={expectedFinalText}
            description="미제출 과제 0점 포함 — 실제 달성도 지표"
          />
        </div>
        {data.currentGpa !== null && data.currentGpa !== data.expectedFinalGrade && (
          <p className="text-xs text-slate-400">
            ※ 현재 평점과 예상 최종 성적의 차이는 미제출/미채점 과제를 반영합니다.
          </p>
        )}
      </section>

      {/* 과제별 성적 테이블 */}
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-slate-900">과제별 성적</h2>
        {data.assignments.length === 0 ? (
          <div className="flex items-center justify-center rounded-lg border border-dashed border-slate-200 py-12 text-center">
            <p className="text-sm text-slate-400">게시된 과제가 없습니다.</p>
          </div>
        ) : (
          <Card>
            <CardHeader className="pb-0">
              <CardTitle className="text-sm font-medium text-slate-500">
                총 {data.assignments.length}개 과제
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-2">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[540px]">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="pb-2 pr-4 text-left text-xs font-medium text-slate-400">
                        과제명
                      </th>
                      <th className="pb-2 pr-4 text-left text-xs font-medium text-slate-400">
                        마감일
                      </th>
                      <th className="pb-2 pr-4 text-left text-xs font-medium text-slate-400">
                        비중
                      </th>
                      <th className="pb-2 pr-4 text-left text-xs font-medium text-slate-400">
                        상태
                      </th>
                      <th className="pb-2 text-right text-xs font-medium text-slate-400">
                        점수
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.assignments.map((assignment) => (
                      <AssignmentRow key={assignment.assignmentId} assignment={assignment} />
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </section>

      {/* 강사 피드백 섹션 */}
      {data.assignments.some(
        (a) => a.submissionStatus === 'graded' && a.feedback,
      ) && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-slate-900">강사 피드백</h2>
          <div className="flex flex-col gap-3">
            {data.assignments
              .filter((a) => a.submissionStatus === 'graded' && a.feedback)
              .map((a) => (
                <Card key={a.assignmentId}>
                  <CardContent className="flex flex-col gap-2 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-900">
                        {a.assignmentTitle}
                      </p>
                      {a.score !== null && (
                        <Badge className="text-xs">{a.score}점</Badge>
                      )}
                    </div>
                    <p className="rounded bg-slate-50 p-3 text-sm leading-relaxed text-slate-600">
                      {a.feedback}
                    </p>
                  </CardContent>
                </Card>
              ))}
          </div>
        </section>
      )}
    </div>
  );
};
