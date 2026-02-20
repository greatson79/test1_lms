import type { SupabaseClient } from '@supabase/supabase-js';
import { failure, success, type HandlerResult } from '@/backend/http/response';
import { LEARNER_HOME_PATH, INSTRUCTOR_HOME_PATH } from '@/constants/auth';
import { PG_ERROR_CODES } from '@/constants/postgres-error-codes';
import { profileErrorCodes, type ProfileServiceError } from './error';
import type { SignupRequest, SignupResponse, OnboardingRequest, OnboardingResponse } from './schema';

export const signupUser = async (
  supabase: SupabaseClient,
  data: SignupRequest,
): Promise<HandlerResult<SignupResponse, ProfileServiceError>> => {
  const { data: authData, error } = await supabase.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true,
  });

  if (error) {
    const isEmailConflict =
      error.message?.toLowerCase().includes('already') ||
      error.message?.toLowerCase().includes('duplicate');

    if (isEmailConflict) {
      return failure(409, profileErrorCodes.emailAlreadyExists, '이미 사용 중인 이메일입니다.');
    }

    return failure(500, profileErrorCodes.signupFailed, error.message);
  }

  return success({ userId: authData.user.id }, 201);
};

export const onboardUser = async (
  supabase: SupabaseClient,
  userId: string,
  data: OnboardingRequest,
): Promise<HandlerResult<OnboardingResponse, ProfileServiceError>> => {
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({ id: userId, name: data.name, phone: data.phone, role: data.role });

  if (profileError) {
    if (profileError.code === PG_ERROR_CODES.UNIQUE_VIOLATION) {
      return failure(409, profileErrorCodes.profileAlreadyExists, '이미 온보딩이 완료된 계정입니다.');
    }

    await supabase.auth.admin.deleteUser(userId);
    return failure(500, profileErrorCodes.onboardingFailed, '프로필 생성에 실패했습니다.');
  }

  const { error: termsError } = await supabase
    .from('terms_agreements')
    .insert({ user_id: userId });

  if (termsError) {
    await supabase.from('profiles').delete().eq('id', userId);
    await supabase.auth.admin.deleteUser(userId);
    return failure(500, profileErrorCodes.onboardingFailed, '약관 동의 처리에 실패했습니다.');
  }

  const redirectTo = data.role === 'learner' ? LEARNER_HOME_PATH : INSTRUCTOR_HOME_PATH;

  return success({ role: data.role, redirectTo });
};
