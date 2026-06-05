import { useState, useEffect, useCallback } from "react";
import { api, setToken, clearToken, getToken } from "../services/api";

export type AuthUser = {
  id: string;
  email: string;
  stage_name: string | null;
};

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If a token exists, treat user as logged in (token is self-contained JWT)
    getToken().then((token) => {
      if (token) {
        const payload = parseJwtPayload(token);
        if (payload) {
          setUser({ id: payload.sub as string, email: payload.email as string, stage_name: null });
        }
      }
      setLoading(false);
    });
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await api.post<{ token: string; user: AuthUser }>(
        "/auth/login",
        { email, password }
      );
      await setToken(res.token);
      setUser(res.user);
      return res.user;
    },
    []
  );

  const register = useCallback(
    async (email: string, password: string, stage_name?: string) => {
      const res = await api.post<{ token: string; user: AuthUser }>(
        "/auth/register",
        { email, password, stage_name }
      );
      await setToken(res.token);
      setUser(res.user);
      return res.user;
    },
    []
  );

  const logout = useCallback(async () => {
    await clearToken();
    setUser(null);
  }, []);

  return { user, loading, login, register, logout };
}

function parseJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const b64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(b64));
  } catch {
    return null;
  }
}
