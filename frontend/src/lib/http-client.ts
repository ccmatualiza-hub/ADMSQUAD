import { useAuthStore } from '../store/auth-store';

const BASE = '';

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  retries = 3,
): Promise<T> {
  const token = useAuthStore.getState().token;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(`${BASE}${path}`, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });

      if (res.status === 401) {
        useAuthStore.getState().logout();
        window.location.href = '/login';
        throw new Error('Não autenticado');
      }

      if (!res.ok) {
        let detail = `HTTP ${res.status}`;
        try {
          const json = await res.json();
          detail = json.detail || detail;
        } catch { /* ignore */ }
        // retry on 500/502/503/504 server errors
        if ([500, 502, 503, 504].includes(res.status) && attempt < retries) {
          await new Promise(r => setTimeout(r, 600 * (attempt + 1)));
          continue;
        }
        throw new Error(detail);
      }

      if (res.status === 204) return undefined as T;
      return res.json() as Promise<T>;
    } catch (err) {
      const isNetworkError = err instanceof TypeError;
      if (isNetworkError && attempt < retries) {
        await new Promise(r => setTimeout(r, 600 * (attempt + 1)));
        continue;
      }
      throw err;
    }
  }
  throw new Error('Falha na requisição após múltiplas tentativas');
}

export const http = {
  get:  <T>(path: string)                  => request<T>('GET',    path),
  post: <T>(path: string, body: unknown)   => request<T>('POST',   path, body),
  put:  <T>(path: string, body: unknown)   => request<T>('PUT',    path, body),
  del:  <T>(path: string)                  => request<T>('DELETE', path),
};
