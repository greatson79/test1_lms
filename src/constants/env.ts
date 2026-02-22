import { z } from 'zod';

const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;

// 모듈 로드 시점이 아닌 첫 접근 시점에 검증 — 빌드 타임 안전
const validate = (): ClientEnv => {
  const parsed = clientEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });

  if (!parsed.success) {
    console.error('환경 변수 검증 실패:', parsed.error.flatten().fieldErrors);
    throw new Error('환경 변수를 확인하세요.');
  }

  return parsed.data;
};

let _cache: ClientEnv | null = null;

export const env: ClientEnv = new Proxy({} as ClientEnv, {
  get(_, prop: string) {
    if (!_cache) _cache = validate();
    return _cache[prop as keyof ClientEnv];
  },
});
