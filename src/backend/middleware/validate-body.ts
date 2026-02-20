import { createMiddleware } from 'hono/factory';
import type { ZodSchema } from 'zod';
import type { AppEnv } from '@/backend/hono/context';
import { contextKeys } from '@/backend/hono/context';
import { respond, failure } from '@/backend/http/response';

export const validateBody = <T>(schema: ZodSchema<T>) =>
  createMiddleware<AppEnv>(async (c, next) => {
    let raw: unknown;

    try {
      raw = await c.req.json();
    } catch {
      return respond(c, failure(400, 'INVALID_INPUT', '요청 본문을 파싱할 수 없습니다.'));
    }

    const parsed = schema.safeParse(raw);

    if (!parsed.success) {
      return respond(
        c,
        failure(
          400,
          'INVALID_INPUT',
          parsed.error.errors[0]?.message ?? '입력값이 올바르지 않습니다.',
          parsed.error.format(),
        ),
      );
    }

    c.set(contextKeys.validatedBody, parsed.data);
    await next();
  });
