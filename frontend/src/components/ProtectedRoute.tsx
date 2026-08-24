"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: string[];
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/");
      } else if (allowedRoles && user.role && !allowedRoles.includes(user.role.name)) {
        router.push("/dashboard");
      }
    }
  }, [user, loading, router, allowedRoles]);

  if (loading || !user) {
    return <div className="loader">Loading...</div>;
  }

  if (allowedRoles && user.role && !allowedRoles.includes(user.role.name)) {
    return null; // Will redirect
  }

  return <>{children}</>;
}
