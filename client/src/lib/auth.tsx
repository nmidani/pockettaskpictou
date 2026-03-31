import { useState, useEffect, createContext, useContext, type ReactNode } from "react";
import { API_BASE } from "./api";

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
    fetch(`${API_BASE}/api/auth/user`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        // Server returns { user: AuthUser | null }
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
