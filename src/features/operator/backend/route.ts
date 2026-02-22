import type { Hono } from 'hono';
import { respond, failure } from '@/backend/http/response';
import { withAuth } from '@/backend/middleware/auth';
import { getCurrentUser, getSupabase, type AppEnv } from '@/backend/hono/context';
import { UUID_REGEX } from '@/constants/validation';
import { operatorErrorCodes } from './error';
import {
  CreateReportBodySchema,
  UpdateReportBodySchema,
  CreateCategoryBodySchema,
  UpdateCategoryBodySchema,
  CreateDifficultyBodySchema,
  UpdateDifficultyBodySchema,
  ReportStatusSchema,
} from './schema';
import {
  createReport,
  listReports,
  updateReport,
  listPublicCategories,
  listPublicDifficulties,
  listCategories,
  createCategory,
  updateCategory,
  listDifficulties,
  createDifficulty,
  updateDifficulty,
} from './service';

export const registerOperatorRoutes = (app: Hono<AppEnv>) => {
  // ============================================================
  // 공개 메타데이터 (인증 불필요)
  // ============================================================

  // GET /api/metadata/categories
  app.get('/api/metadata/categories', async (c) => {
    const supabase = getSupabase(c);
    const result = await listPublicCategories(supabase);
    return respond(c, result);
  });

  // GET /api/metadata/difficulties
  app.get('/api/metadata/difficulties', async (c) => {
    const supabase = getSupabase(c);
    const result = await listPublicDifficulties(supabase);
    return respond(c, result);
  });

  // ============================================================
  // 신고 접수 (인증된 모든 역할)
  // ============================================================

  // POST /api/reports
  app.post('/api/reports', withAuth(), async (c) => {
    const currentUser = getCurrentUser(c);

    if (!currentUser) {
      return respond(c, failure(401, operatorErrorCodes.forbidden, '인증이 필요합니다.'));
    }

    const rawBody = await c.req.json().catch(() => null);
    const parsed = CreateReportBodySchema.safeParse(rawBody);

    if (!parsed.success) {
      return respond(
        c,
        failure(400, operatorErrorCodes.fetchError, '올바르지 않은 요청입니다.', parsed.error.format()),
      );
    }

    const supabase = getSupabase(c);
    const result = await createReport(supabase, currentUser.id, parsed.data);
    return respond(c, result);
  });

  // ============================================================
  // operator 전용 라우트
  // ============================================================

  // GET /api/operator/reports
  app.get('/api/operator/reports', withAuth(), async (c) => {
    const currentUser = getCurrentUser(c);

    if (!currentUser) {
      return respond(c, failure(401, operatorErrorCodes.forbidden, '인증이 필요합니다.'));
    }

    if (currentUser.role !== 'operator') {
      return respond(c, failure(403, operatorErrorCodes.forbidden, '운영자만 접근할 수 있습니다.'));
    }

    const statusRaw = c.req.query('status');
    const sortRaw = c.req.query('sort');

    const statusParsed = statusRaw ? ReportStatusSchema.safeParse(statusRaw) : null;

    if (statusParsed && !statusParsed.success) {
      return respond(
        c,
        failure(400, operatorErrorCodes.invalidReportStatus, '허용된 status 값: received, investigating, resolved'),
      );
    }

    const sort = sortRaw === 'asc' ? 'asc' : 'desc';

    const supabase = getSupabase(c);
    const result = await listReports(supabase, {
      status: statusParsed?.data,
      sort,
    });
    return respond(c, result);
  });

  // PATCH /api/operator/reports/:reportId
  app.patch('/api/operator/reports/:reportId', withAuth(), async (c) => {
    const currentUser = getCurrentUser(c);

    if (!currentUser) {
      return respond(c, failure(401, operatorErrorCodes.forbidden, '인증이 필요합니다.'));
    }

    if (currentUser.role !== 'operator') {
      return respond(c, failure(403, operatorErrorCodes.forbidden, '운영자만 접근할 수 있습니다.'));
    }

    const reportId = c.req.param('reportId');

    if (!UUID_REGEX.test(reportId)) {
      return respond(c, failure(400, operatorErrorCodes.notFound, '올바르지 않은 신고 ID입니다.'));
    }

    const rawBody = await c.req.json().catch(() => null);
    const parsed = UpdateReportBodySchema.safeParse(rawBody);

    if (!parsed.success) {
      return respond(
        c,
        failure(400, operatorErrorCodes.fetchError, '올바르지 않은 요청입니다.', parsed.error.format()),
      );
    }

    const supabase = getSupabase(c);
    const result = await updateReport(supabase, reportId, parsed.data);
    return respond(c, result);
  });

  // ============================================================
  // 카테고리 관리
  // ============================================================

  // GET /api/operator/categories
  app.get('/api/operator/categories', withAuth(), async (c) => {
    const currentUser = getCurrentUser(c);

    if (!currentUser) {
      return respond(c, failure(401, operatorErrorCodes.forbidden, '인증이 필요합니다.'));
    }

    if (currentUser.role !== 'operator') {
      return respond(c, failure(403, operatorErrorCodes.forbidden, '운영자만 접근할 수 있습니다.'));
    }

    const supabase = getSupabase(c);
    const result = await listCategories(supabase);
    return respond(c, result);
  });

  // POST /api/operator/categories
  app.post('/api/operator/categories', withAuth(), async (c) => {
    const currentUser = getCurrentUser(c);

    if (!currentUser) {
      return respond(c, failure(401, operatorErrorCodes.forbidden, '인증이 필요합니다.'));
    }

    if (currentUser.role !== 'operator') {
      return respond(c, failure(403, operatorErrorCodes.forbidden, '운영자만 접근할 수 있습니다.'));
    }

    const rawBody = await c.req.json().catch(() => null);
    const parsed = CreateCategoryBodySchema.safeParse(rawBody);

    if (!parsed.success) {
      return respond(
        c,
        failure(400, operatorErrorCodes.fetchError, '올바르지 않은 요청입니다.', parsed.error.format()),
      );
    }

    const supabase = getSupabase(c);
    const result = await createCategory(supabase, parsed.data.name);
    return respond(c, result);
  });

  // PATCH /api/operator/categories/:id
  app.patch('/api/operator/categories/:id', withAuth(), async (c) => {
    const currentUser = getCurrentUser(c);

    if (!currentUser) {
      return respond(c, failure(401, operatorErrorCodes.forbidden, '인증이 필요합니다.'));
    }

    if (currentUser.role !== 'operator') {
      return respond(c, failure(403, operatorErrorCodes.forbidden, '운영자만 접근할 수 있습니다.'));
    }

    const id = c.req.param('id');

    if (!UUID_REGEX.test(id)) {
      return respond(c, failure(400, operatorErrorCodes.notFound, '올바르지 않은 카테고리 ID입니다.'));
    }

    const rawBody = await c.req.json().catch(() => null);
    const parsed = UpdateCategoryBodySchema.safeParse(rawBody);

    if (!parsed.success) {
      return respond(
        c,
        failure(400, operatorErrorCodes.fetchError, '올바르지 않은 요청입니다.', parsed.error.format()),
      );
    }

    const supabase = getSupabase(c);
    const result = await updateCategory(supabase, id, {
      name: parsed.data.name,
      isActive: parsed.data.isActive,
    });
    return respond(c, result);
  });

  // ============================================================
  // 난이도 관리
  // ============================================================

  // GET /api/operator/difficulties
  app.get('/api/operator/difficulties', withAuth(), async (c) => {
    const currentUser = getCurrentUser(c);

    if (!currentUser) {
      return respond(c, failure(401, operatorErrorCodes.forbidden, '인증이 필요합니다.'));
    }

    if (currentUser.role !== 'operator') {
      return respond(c, failure(403, operatorErrorCodes.forbidden, '운영자만 접근할 수 있습니다.'));
    }

    const supabase = getSupabase(c);
    const result = await listDifficulties(supabase);
    return respond(c, result);
  });

  // POST /api/operator/difficulties
  app.post('/api/operator/difficulties', withAuth(), async (c) => {
    const currentUser = getCurrentUser(c);

    if (!currentUser) {
      return respond(c, failure(401, operatorErrorCodes.forbidden, '인증이 필요합니다.'));
    }

    if (currentUser.role !== 'operator') {
      return respond(c, failure(403, operatorErrorCodes.forbidden, '운영자만 접근할 수 있습니다.'));
    }

    const rawBody = await c.req.json().catch(() => null);
    const parsed = CreateDifficultyBodySchema.safeParse(rawBody);

    if (!parsed.success) {
      return respond(
        c,
        failure(400, operatorErrorCodes.fetchError, '올바르지 않은 요청입니다.', parsed.error.format()),
      );
    }

    const supabase = getSupabase(c);
    const result = await createDifficulty(supabase, parsed.data.name);
    return respond(c, result);
  });

  // PATCH /api/operator/difficulties/:id
  app.patch('/api/operator/difficulties/:id', withAuth(), async (c) => {
    const currentUser = getCurrentUser(c);

    if (!currentUser) {
      return respond(c, failure(401, operatorErrorCodes.forbidden, '인증이 필요합니다.'));
    }

    if (currentUser.role !== 'operator') {
      return respond(c, failure(403, operatorErrorCodes.forbidden, '운영자만 접근할 수 있습니다.'));
    }

    const id = c.req.param('id');

    if (!UUID_REGEX.test(id)) {
      return respond(c, failure(400, operatorErrorCodes.notFound, '올바르지 않은 난이도 ID입니다.'));
    }

    const rawBody = await c.req.json().catch(() => null);
    const parsed = UpdateDifficultyBodySchema.safeParse(rawBody);

    if (!parsed.success) {
      return respond(
        c,
        failure(400, operatorErrorCodes.fetchError, '올바르지 않은 요청입니다.', parsed.error.format()),
      );
    }

    const supabase = getSupabase(c);
    const result = await updateDifficulty(supabase, id, {
      name: parsed.data.name,
      isActive: parsed.data.isActive,
    });
    return respond(c, result);
  });
};
