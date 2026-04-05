import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      authAPI.me()
        .then(r => setUser(r.data.user))
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const r = await authAPI.login({ email, password });
    localStorage.setItem('token', r.data.token);
    setUser(r.data.user);
    return r.data;
  };

  const googleLogin = async (credential) => {
    const r = await authAPI.googleLogin(credential);
    localStorage.setItem('token', r.data.token);
    setUser(r.data.user);
    return r.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const isAdmin      = user?.role === 'admin';
  const isStudent    = user?.role === 'student';
  const isCaretaker  = user?.role === 'caretaker';
  const isWarden     = user?.role === 'warden';

  return (
    <AuthContext.Provider value={{ user, loading, login, googleLogin, logout, isAdmin, isStudent, isCaretaker, isWarden }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
