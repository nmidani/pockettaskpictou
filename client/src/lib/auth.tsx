import { useState, useEffect, createContext, useContext, type ReactNode } from "react";
import { API_BASE, getStoredToken, storeToken, clearStoredToken } from "./api";

interface AuthUser {
  id: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImage: string | null;
  email: string | null;
  role?: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // If the backend redirected back here with ?sid=..., capture and store it,
    // then strip it from the URL so it's not exposed in the address bar.
    const params = new URLSearchParams(window.location.search);
    const sid = params.get("sid");
    if (sid) {
      storeToken(sid);
      params.delete("sid");
      const newSearch = params.toString();
      const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : "") + window.location.hash;
      window.history.replaceState({}, "", newUrl);
    }

    const token = getStoredToken();
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (token) {
      (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
    }

    fetch(`${API_BASE}/api/auth/user`, { credentials: "include", headers })
      .then((r) => r.json())
      .then((data) => {
        if (data?.user?.id) setUser(data.user as AuthUser);
        else setUser(null);
      })
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  const login = () => {
    window.location.href = `${API_BASE}/api/login?redirect=${encodeURIComponent(window.location.href)}`;
  };

  const logout = () => {
    clearStoredToken();
    window.location.href = `${API_BASE}/api/logout`;
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
