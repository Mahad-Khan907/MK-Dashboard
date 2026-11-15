"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, ReactNode, FC } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute: FC<ProtectedRouteProps> = ({ children }) => {
  const router = useRouter();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    async function verifyAuth() {
      try {
        const res = await fetch("/api/auth/check");
        if (res.ok) {
          setAuthorized(true);
        } else {
          setAuthorized(false);
          router.replace("/admin");
        }
      } catch (err) {
        setAuthorized(false);
        router.replace("/admin");
      }
    }
    verifyAuth();
  }, [router]);

  if (authorized === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
          <p className="text-sm font-medium tracking-wide">Verifying secure admin session...</p>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
