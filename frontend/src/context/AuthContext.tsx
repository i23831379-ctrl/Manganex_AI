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
  login: (email: string) => Promise<boolean>;
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

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('manganex_user');

      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      }
    } catch (error) {
      console.error('Failed to load saved user:', error);
      localStorage.removeItem('manganex_user');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string): Promise<boolean> => {
    const normalizedEmail = email.trim().toLowerCase();

    await new Promise((resolve) => setTimeout(resolve, 500));

    let loggedInUser: User | null = null;

    if (normalizedEmail === 'admin@manganex.ai') {
      loggedInUser = {
        id: 'u_1',
        name: 'Dr. Jane Smith',
        email: 'admin@manganex.ai',
        role: 'admin',
        avatar: 'JS',
      };
    }

    if (normalizedEmail === 'geo@manganex.ai') {
      loggedInUser = {
        id: 'u_2',
        name: 'Alex Geologist',
        email: 'geo@manganex.ai',
        role: 'geologist',
        avatar: 'AG',
      };
    }

    if (!loggedInUser) {
      return false;
    }

    setUser(loggedInUser);

    localStorage.setItem(
      'manganex_user',
      JSON.stringify(loggedInUser)
    );

    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('manganex_user');
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