import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth as authApi } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [studentProfile, setStudentProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const checkAuth = useCallback(async () => {
    try {
      const data = await authApi.me();
      setUser(data.user);
      setStudentProfile(data.studentProfile || null);
    } catch (err) {
      setUser(null);
      setStudentProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);
  
  const login = async (email, password) => {
    setError(null);
    try {
      const data = await authApi.login(email, password);
      setUser(data.user);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };
  
  const logout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      // Ignore logout errors
    }
    setUser(null);
    setStudentProfile(null);
  };
  
  const value = {
    user,
    studentProfile,
    loading,
    error,
    login,
    logout,
    checkAuth,
    isAdmin: user?.role === 'admin',
    isStudent: user?.role === 'student',
    isAuthenticated: !!user,
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
