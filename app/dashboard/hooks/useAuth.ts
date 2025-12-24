"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ApiUser } from "@/lib/api";
import { clearAuth, loadAuth } from "@/lib/storage";

export function useAuth() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<ApiUser | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const stored = loadAuth();
    if (!stored) {
      setCheckingAuth(false);
      router.replace("/");
      return;
    }
    setToken(stored.token);
    setCurrentUser(stored.user);
    setCheckingAuth(false);
  }, [router]);

  const handleLogout = useCallback(() => {
    clearAuth();
    router.replace("/");
  }, [router]);

  const isAdmin = currentUser?.role === "admin";
  const isNavigator = currentUser?.role === "navigator";
  const isDistrictOfficer = currentUser?.role === "district_officer";

  return {
    token,
    currentUser,
    checkingAuth,
    handleLogout,
    isAdmin,
    isNavigator,
    isDistrictOfficer,
  };
}

