import "server-only";

import type { User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import type { CurrentUserSnapshot, UserRole } from "../types";

const mapUser = (user: User, role: UserRole | null) => ({
  id: user.id,
  email: user.email ?? null,
  role,
  appMetadata: user.app_metadata ?? {},
  userMetadata: user.user_metadata ?? {},
});

export const loadCurrentUser = async (): Promise<CurrentUserSnapshot> => {
  const supabase = await createSupabaseServerClient();
  const result = await supabase.auth.getUser();
  const user = result.data.user;

  if (!user) {
    return { status: "unauthenticated", user: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle<{ role: UserRole }>();

  return {
    status: "authenticated",
    user: mapUser(user, profile?.role ?? null),
  };
};
