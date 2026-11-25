import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { authApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isWarehouse: boolean;
  isStaff: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  demoLogin: (role: 'admin' | 'manager' | 'warehouse' | 'customer') => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('commercepilot_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('commercepilot_access_token'));
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const profile = await authApi.getProfile();
          setUser(profile);
          localStorage.setItem('commercepilot_user', JSON.stringify(profile));
        } catch {
          logout();
        }
      }
      setLoading(false);
    };
    initAuth();
  }, [token]);

  const login = async (username: string, password: string) => {
    setLoading(true);
    try {
      const data = await authApi.login({ username, password });
      localStorage.setItem('commercepilot_access_token', data.access);
      localStorage.setItem('commercepilot_refresh_token', data.refresh);
      localStorage.setItem('commercepilot_user', JSON.stringify(data.user));
      setToken(data.access);
      setUser(data.user);
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = async (role: 'admin' | 'manager' | 'warehouse' | 'customer') => {
    const creds = {
      admin: { u: 'admin', p: 'AdminPass123!' },
      manager: { u: 'manager', p: 'ManagerPass123!' },
      warehouse: { u: 'warehouse', p: 'WarehousePass123!' },
      customer: { u: 'customer', p: 'CustomerPass123!' },
    }[role];

    await login(creds.u, creds.p);
  };

  const register = async (userData: any) => {
    setLoading(true);
    try {
      await authApi.register(userData);
      await login(userData.username, userData.password);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('commercepilot_access_token');
    localStorage.removeItem('commercepilot_refresh_token');
    localStorage.removeItem('commercepilot_user');
    setToken(null);
    setUser(null);
  };

  const refreshProfile = async () => {
    if (token) {
      const profile = await authApi.getProfile();
      setUser(profile);
      localStorage.setItem('commercepilot_user', JSON.stringify(profile));
    }
  };

  const role: UserRole = user?.role || 'CUSTOMER';
  const isAdmin = role === 'ADMIN';
  const isManager = role === 'ADMIN' || role === 'STORE_MANAGER';
  const isWarehouse = role === 'ADMIN' || role === 'WAREHOUSE_STAFF';
  const isStaff = role === 'ADMIN' || role === 'STORE_MANAGER' || role === 'WAREHOUSE_STAFF';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isAdmin,
        isManager,
        isWarehouse,
        isStaff,
        loading,
        login,
        demoLogin,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
