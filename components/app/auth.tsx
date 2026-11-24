"use client";

import * as React from "react";
import { api, authToken, clearAuthToken, setAuthToken, type Item } from "@/lib/api";

export type AuthUser = Item & { role: "ADMIN" | "TEACHER" | "STUDENT"; username: string };

type AuthContextValue = {
  user: AuthUser | null;
  /** true until the first session check has finished */
  booting: boolean;
  login: (username: string, password: string) => Promise<AuthUser>;
  logout: () => void;
};

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [booting, setBooting] = React.useState(true);

  React.useEffect(() => {
    if (!authToken()) {
      setBooting(false);
      return;
    }
    api<AuthUser>("/api/me")
      .then(setUser)
      .catch(() => clearAuthToken())
      .finally(() => setBooting(false));
  }, []);

  const login = React.useCallback(async (username: string, password: string) => {
    setAuthToken(username, password);
    try {
      const me = await api<AuthUser>("/api/me");
      setUser(me);
      return me;
    } catch {
      clearAuthToken();
      throw new Error("Tên đăng nhập hoặc mật khẩu chưa đúng, hoặc tài khoản đã bị khóa.");
    }
  }, []);

  const logout = React.useCallback(() => {
    clearAuthToken();
    setUser(null);
  }, []);

  const value = React.useMemo(() => ({ user, booting, login, logout }), [user, booting, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export const homeFor = (role: AuthUser["role"]) => (role === "STUDENT" ? "/profile" : "/");
