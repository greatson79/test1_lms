import type { Hono } from 'hono';
import { failure, respond, handleServiceResult } from '@/backend/http/response';
import { getCurrentUser, getSupabase, type AppEnv } from '@/backend/hono/context';
import { withAuth } from '@/backend/middleware/auth';
import { profileErrorCodes } from './error';
import { OnboardingRequestSchema, SignupRequestSchema } from './schema';
import { onboardUser, signupUser } from './service';

export const registerProfileRoutes = (app: Hono<AppEnv>) => {
  app.post('/api/auth/signup', async (c) => {
    const body = await c.req.json();
    const parsed = SignupRequestSchema.safeParse(body);

    if (!parsed.success) {
      return respond(
        c,
        failure(400, profileErrorCodes.invalidInput, '입력값이 올바르지 않습니다.', parsed.error.format()),
      );
    }

    const supabase = getSupabase(c);
    const result = await signupUser(supabase, parsed.data);
    return handleServiceResult(c, result, 'Signup failed');
  });

  app.post('/api/auth/onboarding', withAuth(), async (c) => {
    const body = await c.req.json();
    const parsed = OnboardingRequestSchema.safeParse(body);

    if (!parsed.success) {
      return respond(
        c,
        failure(400, profileErrorCodes.invalidInput, '입력값이 올바르지 않습니다.', parsed.error.format()),
      );
    }

    const currentUser = getCurrentUser(c);

    if (!currentUser) {
      return respond(c, failure(401, profileErrorCodes.unauthorized, '인증이 필요합니다.'));
    }

    const supabase = getSupabase(c);
    const result = await onboardUser(supabase, currentUser.id, parsed.data);
    return handleServiceResult(c, result, 'Onboarding failed');
  });
};
