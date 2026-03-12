import Api from './api';

export interface RegisterData {
  email: string;
  password: string;
  name?: string;
  role?: 'ADMIN' | 'VENDOR' | 'PARTNER';
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
    vendorSlug?: string | null;
    partnerSlug?: string | null;
    verified: boolean;
  };
  token: string;
}

export const register = async (data: RegisterData): Promise<AuthResponse> => {
  const response = await Api.post<{ data: AuthResponse }>('/auth/register', data);
  return response.data.data;
};

export const login = async (data: LoginData): Promise<AuthResponse> => {
  const response = await Api.post<{ data: AuthResponse }>('/auth/login', data);
  return response.data.data;
};

// Browser window helper
interface BrowserWindow {
  localStorage?: {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
  };
}

const getBrowserWindow = (): BrowserWindow | null => {
  try {
    return ((globalThis as any).window as BrowserWindow | undefined) || null;
  } catch {
    return null;
  }
};

export const setToken = (token: string): void => {
  const win = getBrowserWindow();
  if (win?.localStorage) {
    win.localStorage.setItem('token', token);
  }
};

export const setUser = (user: any): void => {
  const win = getBrowserWindow();
  if (win?.localStorage) {
    win.localStorage.setItem('user', JSON.stringify(user));
  }
};

export const getToken = (): string | null => {
  const win = getBrowserWindow();
  if (win?.localStorage) {
    return win.localStorage.getItem('token');
  }
  return null;
};

export const getCurrentUser = (): any | null => {
  const win = getBrowserWindow();
  if (win?.localStorage) {
    const userStr = win.localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }
  return null;
};

export const logout = (): void => {
  const win = getBrowserWindow();
  if (win?.localStorage) {
    win.localStorage.removeItem('token');
    win.localStorage.removeItem('user');
  }
};

export default {
  register,
  login,
  setToken,
  setUser,
  getToken,
  getCurrentUser,
  logout,
};

