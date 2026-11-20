import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('military_auth_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('military_auth_token'));
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (token) {
      // Verify token on mount
      api.get('/auth/me')
        .then((res) => {
          const updatedUser = {
            id: res.data.id,
            username: res.data.username,
            fullName: res.data.full_name,
            role: res.data.role,
            baseId: res.data.base_id,
            baseName: res.data.base_name,
            baseCode: res.data.base_code,
          };
          setUser(updatedUser);
          localStorage.setItem('military_auth_user', JSON.stringify(updatedUser));
        })
        .catch(() => {
          logout();
        });
    }
  }, [token]);

  const login = async (username, password) => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/login', { username, password });
      const { token: jwtToken, user: authUser } = res.data;
      
      localStorage.setItem('military_auth_token', jwtToken);
      localStorage.setItem('military_auth_user', JSON.stringify(authUser));
      
      setToken(jwtToken);
      setUser(authUser);
      return { success: true, user: authUser };
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Login failed. Please check your credentials.';
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('military_auth_token');
    localStorage.removeItem('military_auth_user');
    setToken(null);
    setUser(null);
  };

  const role = user?.role;
  const isAdmin = role === 'ADMIN';
  const isCommander = role === 'BASE_COMMANDER';
  const isLogistics = role === 'LOGISTICS_OFFICER';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
        isAdmin,
        isCommander,
        isLogistics,
        canManagePurchases: isAdmin || isLogistics || isCommander,
        canManageTransfers: isAdmin || isLogistics || isCommander,
        canManageAssignments: isAdmin || isCommander,
        canManageExpenditures: isAdmin || isCommander || isLogistics,
        canViewAuditLogs: isAdmin || isCommander,
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

export default AuthContext;
