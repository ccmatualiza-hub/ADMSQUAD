import { http } from '../lib/http-client';

interface LoginPayload {
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'user';
    avatarUrl?: string;
  };
}

export const authService = {
  login: (payload: LoginPayload) =>
    http.post<LoginResponse>('/api/auth/login', payload),
};
