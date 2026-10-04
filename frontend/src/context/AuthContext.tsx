import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from 'react';

export type UserRole = 'admin' | 'geologist';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount, attempt to restore session from stored JWT token
  useEffect(() => {
    const token = localStorage.getItem('manganex_token');
    if (token) {
      // Fetch current user using token
      fetch(`${process.env.VITE_API_URL || ''}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(async (res) => {
          if (!res.ok) throw new Error('Failed to fetch user');
          return res.json();
        })
        .then((data) => {
          setUser(data);
          localStorage.setItem('manganex_user', JSON.stringify(data));
        })
        .catch((err) => {
          console.error(err);
          localStorage.removeItem('manganex_token');
          localStorage.removeItem('manganex_user');
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(`${process.env.VITE_API_URL || ''}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) return false;
      const data = await response.json();
      const token = data.access_token;
      // Store token securely (localStorage for demo)
      localStorage.setItem('manganex_token', token);
      // Fetch user profile
      const meRes = await fetch(`${process.env.VITE_API_URL || ''}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!meRes.ok) return false;
      const userData = await meRes.json();
      setUser(userData);
      localStorage.setItem('manganex_user', JSON.stringify(userData));
      return true;
    } catch (err) {
      console.error('Login error:', err);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('manganex_user');
    localStorage.removeItem('manganex_token');
    // Optionally navigate to login page handled by caller
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used inside AuthProvider'
    );
  }

  return context;
}