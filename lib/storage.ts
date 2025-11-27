import type { ApiUser } from "./api";

const TOKEN_KEY = "d4i_token";
const USER_KEY = "d4i_user";

export function saveAuth(token: string, user: ApiUser) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function loadAuth(): {
  token: string;
  user: ApiUser;
} | null {
  if (typeof window === "undefined") return null;
  const token = window.localStorage.getItem(TOKEN_KEY);
  const userRaw = window.localStorage.getItem(USER_KEY);
  if (!token || !userRaw) return null;

  try {
    const user = JSON.parse(userRaw) as ApiUser;
    return { token, user };
  } catch {
    clearAuth();
    return null;
  }
}

export function clearAuth() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}
