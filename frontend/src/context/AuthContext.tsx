import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

export type UserRole = "admin" | "geologist";

export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  created_at?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8001/api";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("manganex_token");
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const logout = () => {
    localStorage.removeItem("manganex_token");
    localStorage.removeItem("manganex_user");

    setToken(null);
    setUser(null);
  };

  const loadCurrentUser = async (accessToken: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Auth check failed: ${response.status}`);
      }

      const currentUser: User = await response.json();

      setUser(currentUser);
      localStorage.setItem(
        "manganex_user",
        JSON.stringify(currentUser)
      );

      return true;
    } catch (error) {
      console.error("Failed to load current user:", error);
      logout();
      return false;
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const savedToken = localStorage.getItem("manganex_token");

      if (!savedToken) {
        setIsLoading(false);
        return;
      }

      setToken(savedToken);

      await loadCurrentUser(savedToken);

      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (
    email: string,
    password: string
  ): Promise<boolean> => {
    try {
      setIsLoading(true);

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      if (!response.ok) {
        let errorMessage = "Login failed";

        try {
          const errorData = await response.json();

          if (Array.isArray(errorData?.detail)) {
            errorMessage = errorData.detail
              .map((item: any) => item.msg)
              .join(", ");
          } else if (typeof errorData?.detail === "string") {
            errorMessage = errorData.detail;
          }
        } catch {
          // Ignore JSON parsing errors
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (!data.access_token) {
        throw new Error("Backend did not return an access token");
      }

      const accessToken = data.access_token;

      localStorage.setItem("manganex_token", accessToken);
      setToken(accessToken);

      const userLoaded = await loadCurrentUser(accessToken);

      if (!userLoaded) {
        return false;
      }

      return true;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    login,
    logout,
    isAuthenticated: !!user && !!token,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }

  return context;
};