import { failure, success, type HandlerResult, type ErrorResult } from '@/backend/http/response';
import type { AppSupabaseClient } from '@/backend/supabase/client';
import { operatorErrorCodes, type OperatorServiceError } from './error';
import type {
  ReportTargetType,
  ReportStatus,
  CreateReportBody,
  CreateReportResponse,
  UpdateReportBody,
  ReportDto,
  ReportListResponse,
  ReportResponse,
  CategoryDto,
  CategoryListResponse,
  CategoryResponse,
  DifficultyDto,
  DifficultyListResponse,
  DifficultyResponse,
} from './schema';

// ============================================================
// 내부 Row 타입 (service.ts 전용)
// ============================================================

type ReportRow = {
  id: string;
  reporter_id: string;
  target_type: ReportTargetType;
  target_id: string;
  reason: string;
  content: string;
  status: ReportStatus;
  action: 'warning' | 'invalidate_submission' | 'restrict_account' | null;
  created_at: string;
  updated_at: string;
};

type MetaRow = {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

// ============================================================
// 매퍼
// ============================================================

const mapReportRow = (row: ReportRow): ReportDto => ({
  id: row.id,
  reporterId: row.reporter_id,
  targetType: row.target_type,
  targetId: row.target_id,
  reason: row.reason,
  content: row.content,
  status: row.status,
  action: row.action,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapMetaToCategoryDto = (row: MetaRow): CategoryDto => ({
  id: row.id,
  name: row.name,
  isActive: row.is_active,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapMetaToDifficultyDto = (row: MetaRow): DifficultyDto => ({
  id: row.id,
  name: row.name,
  isActive: row.is_active,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

// ============================================================
// 신고 대상 존재 확인 헬퍼
// ============================================================

const verifyTargetExists = async (
  supabase: AppSupabaseClient,
  targetType: ReportTargetType,
  targetId: string,
): Promise<HandlerResult<null, OperatorServiceError>> => {
  const tableMap: Record<ReportTargetType, Parameters<typeof supabase.from>[0]> = {
    course: 'courses',
    assignment: 'assignments',
    submission: 'submissions',
    user: 'profiles',
  };

  const tableName = tableMap[targetType];

  const { data, error } = await supabase
    .from(tableName)
    .select('id')
    .eq('id', targetId)
    .maybeSingle();

  if (error) {
    return failure(500, operatorErrorCodes.fetchError, error.message);
  }

  if (!data) {
    return failure(404, operatorErrorCodes.targetNotFound, '존재하지 않는 대상입니다.');
  }

  return success(null);
};

// ============================================================
// 신고 접수 (createReport)
// ============================================================

export const createReport = async (
  supabase: AppSupabaseClient,
  reporterId: string,
  body: CreateReportBody,
): Promise<HandlerResult<CreateReportResponse, OperatorServiceError>> => {
  const targetCheckResult = await verifyTargetExists(supabase, body.targetType, body.targetId);
  if (!targetCheckResult.ok) return targetCheckResult;

  const { data, error } = await supabase
    .from('reports')
    .insert({
      reporter_id: reporterId,
      target_type: body.targetType,
      target_id: body.targetId,
      reason: body.reason,
      content: body.content,
      status: 'received',
    })
    .select('id')
    .single();

  if (error) {
    return failure(500, operatorErrorCodes.fetchError, error.message);
  }

  return success({ reportId: data.id }, 201);
};

// ============================================================
// 신고 목록 조회 (listReports)
// ============================================================

export const listReports = async (
  supabase: AppSupabaseClient,
  params: { status?: ReportStatus; sort?: 'asc' | 'desc' },
): Promise<HandlerResult<ReportListResponse, OperatorServiceError>> => {
  let query = supabase
    .from('reports')
    .select('*', { count: 'exact', head: false })
    .order('created_at', { ascending: params.sort === 'asc' });

  if (params.status) {
    query = query.eq('status', params.status);
  }

  const { data, error, count } = await query;

  if (error) {
    return failure(500, operatorErrorCodes.fetchError, error.message);
  }

  const reports = (data ?? []) as unknown as ReportRow[];

  return success({
    reports: reports.map(mapReportRow),
    totalCount: count ?? 0,
  });
};

// ============================================================
// 신고 처리 후속 액션 헬퍼
// ============================================================

// 경고 대상 사용자 ID를 대상 유형에 따라 결정
const resolveWarningUserId = async (
  supabase: AppSupabaseClient,
  targetType: ReportTargetType,
  targetId: string,
): Promise<{ userId: string | null; error?: string }> => {
  if (targetType === 'user') {
    return { userId: targetId };
  }

  if (targetType === 'submission') {
    const { data, error } = await supabase
      .from('submissions')
      .select('learner_id')
      .eq('id', targetId)
      .maybeSingle();

    if (error) return { userId: null, error: error.message };

    const row = data as unknown as { learner_id: string } | null;
    return { userId: row?.learner_id ?? null };
  }

  if (targetType === 'course') {
    const { data, error } = await supabase
      .from('courses')
      .select('instructor_id')
      .eq('id', targetId)
      .maybeSingle();

    if (error) return { userId: null, error: error.message };

    const row = data as unknown as { instructor_id: string } | null;
    return { userId: row?.instructor_id ?? null };
  }

  if (targetType === 'assignment') {
    const { data: assignmentData, error: assignmentError } = await supabase
      .from('assignments')
      .select('course_id')
      .eq('id', targetId)
      .maybeSingle();

    if (assignmentError) return { userId: null, error: assignmentError.message };

    const assignmentRow = assignmentData as unknown as { course_id: string } | null;
    if (!assignmentRow) return { userId: null };

    const { data: courseData, error: courseError } = await supabase
      .from('courses')
      .select('instructor_id')
      .eq('id', assignmentRow.course_id)
      .maybeSingle();

    if (courseError) return { userId: null, error: courseError.message };

    const courseRow = courseData as unknown as { instructor_id: string } | null;
    return { userId: courseRow?.instructor_id ?? null };
  }

  return { userId: null };
};

// ============================================================
// 신고 처리 (updateReport)
// ============================================================

export const updateReport = async (
  supabase: AppSupabaseClient,
  reportId: string,
  body: UpdateReportBody,
): Promise<HandlerResult<ReportResponse, OperatorServiceError>> => {
  const { data: currentReportData, error: fetchError } = await supabase
    .from('reports')
    .select('*')
    .eq('id', reportId)
    .maybeSingle();

  if (fetchError) {
    return failure(500, operatorErrorCodes.fetchError, fetchError.message);
  }

  if (!currentReportData) {
    return failure(404, operatorErrorCodes.notFound, '신고를 찾을 수 없습니다.');
  }

  const currentReport = currentReportData as unknown as ReportRow;

  if (currentReport.status === 'resolved') {
    return failure(400, operatorErrorCodes.alreadyResolved, '이미 처리 완료된 신고입니다.');
  }

  const actionToSave = body.status === 'resolved' ? (body.action ?? null) : null;

  const { error: updateError } = await supabase
    .from('reports')
    .update({
      status: body.status,
      action: actionToSave,
    })
    .eq('id', reportId);

  if (updateError) {
    return failure(500, operatorErrorCodes.fetchError, updateError.message);
  }

  // 후속 액션 처리
  if (body.status === 'resolved' && body.action) {
    if (body.action === 'warning') {
      const { userId, error: resolveError } = await resolveWarningUserId(
        supabase,
        currentReport.target_type,
        currentReport.target_id,
      );

      if (resolveError) {
        return failure(500, operatorErrorCodes.fetchError, resolveError);
      }

      if (userId) {
        const { error: warningError } = await supabase
          .from('warnings')
          .insert({
            user_id: userId,
            report_id: reportId,
          });

        if (warningError) {
          return failure(500, operatorErrorCodes.fetchError, warningError.message);
        }
      }
    }

    if (body.action === 'invalidate_submission' && currentReport.target_type === 'submission') {
      const { error: submissionError } = await supabase
        .from('submissions')
        .update({ status: 'invalidated' })
        .eq('id', currentReport.target_id);

      if (submissionError) {
        return failure(500, operatorErrorCodes.fetchError, submissionError.message);
      }
    }

    if (body.action === 'restrict_account' && currentReport.target_type === 'user') {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ is_active: false })
        .eq('id', currentReport.target_id);

      if (profileError) {
        return failure(500, operatorErrorCodes.fetchError, profileError.message);
      }
    }
  }

  const { data: updatedReportData, error: refetchError } = await supabase
    .from('reports')
    .select('*')
    .eq('id', reportId)
    .maybeSingle();

  if (refetchError) {
    return failure(500, operatorErrorCodes.fetchError, refetchError.message);
  }

  if (!updatedReportData) {
    return failure(404, operatorErrorCodes.notFound, '신고를 찾을 수 없습니다.');
  }

  return success({ report: mapReportRow(updatedReportData as unknown as ReportRow) });
};

// ============================================================
// 카테고리/난이도 공통 내부 헬퍼
// ============================================================

const listMeta = async (
  supabase: AppSupabaseClient,
  table: 'categories' | 'difficulties',
): Promise<MetaRow[]> => {
  const { data } = await supabase
    .from(table)
    .select('id, name, is_active, created_at, updated_at')
    .order('name', { ascending: true });

  return (data ?? []) as unknown as MetaRow[];
};

const createMeta = async (
  supabase: AppSupabaseClient,
  table: 'categories' | 'difficulties',
  name: string,
): Promise<HandlerResult<MetaRow, OperatorServiceError>> => {
  const { data: existing } = await supabase
    .from(table)
    .select('id')
    .eq('name', name)
    .maybeSingle();

  if (existing) {
    return failure(409, operatorErrorCodes.duplicateName, '이미 존재하는 이름입니다.');
  }

  const { data, error } = await supabase
    .from(table)
    .insert({ name, is_active: true })
    .select('id, name, is_active, created_at, updated_at')
    .single();

  if (error) {
    return failure(500, operatorErrorCodes.fetchError, error.message);
  }

  return success(data as unknown as MetaRow, 201);
};

const updateMeta = async (
  supabase: AppSupabaseClient,
  table: 'categories' | 'difficulties',
  id: string,
  update: { name?: string; isActive?: boolean },
): Promise<HandlerResult<MetaRow, OperatorServiceError>> => {
  const { data: existing, error: fetchError } = await supabase
    .from(table)
    .select('id, name')
    .eq('id', id)
    .maybeSingle();

  if (fetchError) {
    return failure(500, operatorErrorCodes.fetchError, fetchError.message);
  }

  if (!existing) {
    return failure(404, operatorErrorCodes.notFound, '항목을 찾을 수 없습니다.');
  }

  const existingRow = existing as unknown as MetaRow;

  if (update.name !== undefined && update.name !== existingRow.name) {
    const { data: duplicate } = await supabase
      .from(table)
      .select('id')
      .eq('name', update.name)
      .maybeSingle();

    if (duplicate) {
      return failure(409, operatorErrorCodes.duplicateName, '이미 존재하는 이름입니다.');
    }
  }

  const updatePayload: { name?: string; is_active?: boolean } = {};
  if (update.name !== undefined) updatePayload.name = update.name;
  if (update.isActive !== undefined) updatePayload.is_active = update.isActive;

  const { data, error } = await supabase
    .from(table)
    .update(updatePayload)
    .eq('id', id)
    .select('id, name, is_active, created_at, updated_at')
    .single();

  if (error) {
    return failure(500, operatorErrorCodes.fetchError, error.message);
  }

  return success(data as unknown as MetaRow);
};

// ============================================================
// 카테고리 공개 서비스 함수
// ============================================================

export const listCategories = async (
  supabase: AppSupabaseClient,
): Promise<HandlerResult<CategoryListResponse, OperatorServiceError>> => {
  const rows = await listMeta(supabase, 'categories');
  return success({ categories: rows.map(mapMetaToCategoryDto) });
};

export const createCategory = async (
  supabase: AppSupabaseClient,
  name: string,
): Promise<HandlerResult<CategoryResponse, OperatorServiceError>> => {
  const result = await createMeta(supabase, 'categories', name);
  if (!result.ok) return result as ErrorResult<OperatorServiceError>;
  return success({ category: mapMetaToCategoryDto(result.data) }, 201);
};

export const updateCategory = async (
  supabase: AppSupabaseClient,
  id: string,
  update: { name?: string; isActive?: boolean },
): Promise<HandlerResult<CategoryResponse, OperatorServiceError>> => {
  const result = await updateMeta(supabase, 'categories', id, update);
  if (!result.ok) return result as ErrorResult<OperatorServiceError>;
  return success({ category: mapMetaToCategoryDto(result.data) });
};

// ============================================================
// 난이도 공개 서비스 함수
// ============================================================

export const listDifficulties = async (
  supabase: AppSupabaseClient,
): Promise<HandlerResult<DifficultyListResponse, OperatorServiceError>> => {
  const rows = await listMeta(supabase, 'difficulties');
  return success({ difficulties: rows.map(mapMetaToDifficultyDto) });
};

export const createDifficulty = async (
  supabase: AppSupabaseClient,
  name: string,
): Promise<HandlerResult<DifficultyResponse, OperatorServiceError>> => {
  const result = await createMeta(supabase, 'difficulties', name);
  if (!result.ok) return result as ErrorResult<OperatorServiceError>;
  return success({ difficulty: mapMetaToDifficultyDto(result.data) }, 201);
};

export const updateDifficulty = async (
  supabase: AppSupabaseClient,
  id: string,
  update: { name?: string; isActive?: boolean },
): Promise<HandlerResult<DifficultyResponse, OperatorServiceError>> => {
  const result = await updateMeta(supabase, 'difficulties', id, update);
  if (!result.ok) return result as ErrorResult<OperatorServiceError>;
  return success({ difficulty: mapMetaToDifficultyDto(result.data) });
};
