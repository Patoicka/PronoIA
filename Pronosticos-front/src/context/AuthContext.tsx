import React, { createContext, useContext, useState } from 'react';

export interface AuthUser {
  id: number;
  nombres: string;
  apellidos: string;
  correo: string;
  telefono?: string | null;
  fecha_nacimiento?: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  updateUser: (user: AuthUser) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try { return JSON.parse(localStorage.getItem('kronos_user') ?? 'null'); } catch { return null; }
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('kronos_token'));

  const login = (tk: string, u: AuthUser) => {
    localStorage.setItem('kronos_token', tk);
    localStorage.setItem('kronos_user', JSON.stringify(u));
    setToken(tk); setUser(u);
  };

  const logout = () => {
    localStorage.removeItem('kronos_token');
    localStorage.removeItem('kronos_user');
    setToken(null); setUser(null);
  };

  const updateUser = (u: AuthUser) => {
    localStorage.setItem('kronos_user', JSON.stringify(u));
    setUser(u);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
