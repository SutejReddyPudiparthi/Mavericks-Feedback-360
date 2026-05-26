import { createContext, useContext, useState } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  });
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', data.accessToken);
      const me = await api.get('/auth/me');
      localStorage.setItem('user', JSON.stringify(me.data));
      setUser(me.data);
      return me.data;
    } finally { setLoading(false); }
  };

  const loginOtp = async (email, otp) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/otp/verify', { email, otp });
      localStorage.setItem('token', data.accessToken);
      const me = await api.get('/auth/me');
      localStorage.setItem('user', JSON.stringify(me.data));
      setUser(me.data);
      return me.data;
    } finally { setLoading(false); }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, loginOtp, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
