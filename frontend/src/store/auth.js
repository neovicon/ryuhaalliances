import { create } from 'zustand';
import client from '../api/client';

// Load user from localStorage on initialization
const loadUserFromStorage = () => {
  try {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : undefined;
  } catch {
    return undefined;
  }
};

export const useAuth = create((set, get) => ({
  user: loadUserFromStorage(),
  token: localStorage.getItem('token') || undefined,
  async loadUser() {
    const token = get().token;
    if (!token) {
      set({ user: undefined });
      return;
    }
    try {
      const { data } = await client.get('/users/me');
      const user = data.user;
      localStorage.setItem('user', JSON.stringify(user));
      set({ user });
    } catch (error) {
      // Token is invalid, clear everything
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      set({ token: undefined, user: undefined });
    }
  },
  async login(email, password) {
    const { data } = await client.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    set({ token: data.token, user: data.user });
  },
  async signup(payload) {
    await client.post('/auth/signup', payload);
    // Don't auto-login after signup - user needs to wait for admin approval
    // They will need to login manually after their account is approved
  },
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ token: undefined, user: undefined });
  },
}));


