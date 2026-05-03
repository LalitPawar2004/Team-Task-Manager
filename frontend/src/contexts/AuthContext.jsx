import { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in on mount
  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      setUser(JSON.parse(userInfo));
    }
    setLoading(false);
  }, []);

  // Signup
  const signup = async (name, email, password) => {
    const { data } = await api.post('/auth/signup', { name, email, password });
    const userData = {
      _id: data._id,
      name: data.name,
      email: data.email,
      token: data.token,
    };
    localStorage.setItem('userInfo', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  // Login
  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    const userData = {
      _id: data._id,
      name: data.name,
      email: data.email,
      token: data.token,
    };
    localStorage.setItem('userInfo', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  // Logout
  const logout = () => {
    localStorage.removeItem('userInfo');
    setUser(null);
  };

  const value = {
    user,
    loading,
    signup,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};