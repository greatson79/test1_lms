"use client";

import { useCallback, useEffect, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { LOGIN_PATH } from "@/constants/auth";
import { Button } from "@/components/ui/button";

const buildRedirectUrl = (pathname: string) => {
  const redirectUrl = new URL(LOGIN_PATH, window.location.origin);
  redirectUrl.searchParams.set("redirectedFrom", pathname);
  return redirectUrl.toString();
};

type ProtectedLayoutProps = {
  children: ReactNode;
};

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const { isAuthenticated, isLoading, refresh } = useCurrentUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(buildRedirectUrl(pathname));
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  const handleLogout = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    await refresh();
    router.replace("/");
  }, [refresh, router]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <header className="border-b border-slate-100 bg-white px-6 py-3">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/" className="text-lg font-semibold text-slate-900">
            LMS
          </Link>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2 text-slate-500">
            <LogOut className="h-4 w-4" />
            로그아웃
          </Button>
        </div>
      </header>
      {children}
    </>
  );
}
