import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuthStore } from '../store/useAuthStore';

const { axiosMock, apiInstance, handlers } = vi.hoisted(() => {
  const handlers = {};
  const apiInstance = vi.fn((req) => Promise.resolve({ data: { ok: true }, status: 200 }));
  apiInstance.interceptors = {
    request: { use: (cb) => { handlers.request = cb; } },
    response: { use: (cb, errCb) => { handlers.response = errCb; } },
  };
  apiInstance.defaults = { headers: { common: {} } };
  const axiosMock = {
    create: vi.fn(() => apiInstance),
    post: vi.fn(),
  };
  return { axiosMock, apiInstance, handlers };
});

vi.mock('axios', () => ({ default: axiosMock }));

import api from '../services/api';

describe('api service interceptors', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    useAuthStore.setState({ user: null, accessToken: null });
  });

  it('exposes the axios instance as the default export', () => {
    expect(api).toBe(apiInstance);
  });

  it('attaches the bearer token to requests when present', () => {
    useAuthStore.getState().setToken('secret-token');
    const config = { headers: {} };
    const result = handlers.request(config);
    expect(result.headers.Authorization).toBe('Bearer secret-token');
  });

  it('leaves the request unchanged when no token is present', () => {
    const config = { headers: {} };
    const result = handlers.request(config);
    expect(result.headers.Authorization).toBeUndefined();
  });

  it('rethrows non-401 errors untouched', async () => {
    const error = { config: { url: '/notes' }, response: { status: 500 } };
    await expect(handlers.response(error)).rejects.toEqual(error);
  });

  it('logs out and rethrows when the refresh request itself returns 401', async () => {
    useAuthStore.getState().setAuth({ name: 'User' }, 'token');
    const error = { config: { url: '/auth/refresh' }, response: { status: 401 } };

    await expect(handlers.response(error)).rejects.toEqual(error);
    expect(useAuthStore.getState().accessToken).toBeNull();
  });

  it('refreshes the token and retries the original request', async () => {
    axiosMock.post.mockResolvedValueOnce({ data: { data: { accessToken: 'new-token' } } });
    apiInstance.mockResolvedValueOnce({ data: { ok: true } });
    const error = { config: { url: '/notes', headers: {} }, response: { status: 401 } };

    const result = await handlers.response(error);

    expect(axiosMock.post).toHaveBeenCalledWith('/api/auth/refresh', {}, { withCredentials: true });
    expect(useAuthStore.getState().accessToken).toBe('new-token');
    expect(error.config.headers.Authorization).toBe('Bearer new-token');
    expect(result).toEqual({ data: { ok: true } });
  });

  it('logs out when the refresh call fails', async () => {
    axiosMock.post.mockRejectedValueOnce(new Error('refresh failed'));
    useAuthStore.getState().setAuth({ name: 'User' }, 'old-token');
    const error = { config: { url: '/notes', headers: {} }, response: { status: 401 } };

    await expect(handlers.response(error)).rejects.toThrow('refresh failed');
    expect(useAuthStore.getState().accessToken).toBeNull();
  });

  it('queues concurrent requests while a refresh is in flight and fails them on retry', async () => {
    useAuthStore.getState().setAuth({ name: 'User' }, 'old-token');
    let resolveRefresh;
    axiosMock.post.mockImplementationOnce(() => new Promise((r) => { resolveRefresh = r; }));
    apiInstance.mockRejectedValue(new Error('retry failed'));

    const error1 = { config: { url: '/a', headers: {} }, response: { status: 401 } };
    const error2 = { config: { url: '/b', headers: {} }, response: { status: 401 } };

    const p1 = handlers.response(error1);
    const p2 = handlers.response(error2);

    resolveRefresh({ data: { data: { accessToken: 't2' } } });

    await expect(p1).rejects.toThrow('retry failed');
    await expect(p2).rejects.toThrow('retry failed');
    expect(useAuthStore.getState().accessToken).toBe('t2');
  });
});