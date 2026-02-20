import { z } from 'zod';

export const SignupRequestSchema = z.object({
  email: z.string().email('유효한 이메일을 입력해주세요.'),
  password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다.'),
});

export const SignupResponseSchema = z.object({
  userId: z.string().uuid(),
});

export const OnboardingRequestSchema = z.object({
  role: z.enum(['learner', 'instructor']),
  name: z.string().min(1, '이름을 입력해주세요.'),
  phone: z.string().min(1, '휴대폰번호를 입력해주세요.'),
  termsAgreed: z.literal(true, {
    errorMap: () => ({ message: '약관에 동의해야 합니다.' }),
  }),
});

export const OnboardingResponseSchema = z.object({
  role: z.enum(['learner', 'instructor']),
  redirectTo: z.string(),
});

export type SignupRequest = z.infer<typeof SignupRequestSchema>;
export type SignupResponse = z.infer<typeof SignupResponseSchema>;
export type OnboardingRequest = z.infer<typeof OnboardingRequestSchema>;
export type OnboardingResponse = z.infer<typeof OnboardingResponseSchema>;
