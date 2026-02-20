import type { Hono } from 'hono';
import { failure, respond, handleServiceResult } from '@/backend/http/response';
import { getCurrentUser, getSupabase, getValidatedBody, type AppEnv } from '@/backend/hono/context';
import { withAuth } from '@/backend/middleware/auth';
import { validateBody } from '@/backend/middleware/validate-body';
import { profileErrorCodes } from './error';
import { OnboardingRequestSchema, SignupRequestSchema } from './schema';
import { onboardUser, signupUser } from './service';
import type { SignupRequest, OnboardingRequest } from './schema';

export const registerProfileRoutes = (app: Hono<AppEnv>) => {
  app.post('/api/auth/signup', validateBody(SignupRequestSchema), async (c) => {
    const body = getValidatedBody<SignupRequest>(c);
    const supabase = getSupabase(c);
    const result = await signupUser(supabase, body);
    return handleServiceResult(c, result, 'Signup failed');
  });

  app.post('/api/auth/onboarding', withAuth(), validateBody(OnboardingRequestSchema), async (c) => {
    const currentUser = getCurrentUser(c);

    if (!currentUser) {
      return respond(c, failure(401, profileErrorCodes.unauthorized, '인증이 필요합니다.'));
    }

    const body = getValidatedBody<OnboardingRequest>(c);
    const supabase = getSupabase(c);
    const result = await onboardUser(supabase, currentUser.id, body);
    return handleServiceResult(c, result, 'Onboarding failed');
  });
};
