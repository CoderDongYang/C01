import { useAuthStore } from '@/stores/authStore';
import type { ApiResponse } from '@/types';

class ApiClient {
  private baseURL: string;

  constructor() {
    this.baseURL = '';
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    const token = useAuthStore.getState().accessToken;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (response.status === 401) {
      useAuthStore.getState().logout();
      throw new Error('未授权，请重新登录');
    }
    const body = await response.json();
    if (!response.ok) {
      throw new Error(body.error || body.message || '请求失败');
    }
    return (body as ApiResponse<T>).data;
  }

  async get<T>(url: string): Promise<T> {
    const response = await fetch(`${this.baseURL}${url}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    return this.handleResponse<T>(response);
  }

  async post<T>(url: string, data?: unknown): Promise<T> {
    const response = await fetch(`${this.baseURL}${url}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: data !== undefined ? JSON.stringify(data) : undefined,
    });
    return this.handleResponse<T>(response);
  }

  async patch<T>(url: string, data?: unknown): Promise<T> {
    const response = await fetch(`${this.baseURL}${url}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: data !== undefined ? JSON.stringify(data) : undefined,
    });
    return this.handleResponse<T>(response);
  }

  async put<T>(url: string, data?: unknown): Promise<T> {
    const response = await fetch(`${this.baseURL}${url}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: data !== undefined ? JSON.stringify(data) : undefined,
    });
    return this.handleResponse<T>(response);
  }

  async delete<T>(url: string): Promise<T> {
    const response = await fetch(`${this.baseURL}${url}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    return this.handleResponse<T>(response);
  }
}

export const api = new ApiClient();
