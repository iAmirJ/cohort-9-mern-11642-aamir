import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './useAuthStore';

describe('useAuthStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useAuthStore.setState({ user: null, accessToken: null });
  });

  it('starts with null user and token', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
  });

  it('setAuth sets user and token correctly', () => {
    const mockUser = { id: 1, name: 'Test User' };
    const mockToken = 'mock-jwt-token';
    
    useAuthStore.getState().setAuth(mockUser, mockToken);
    
    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.accessToken).toBe(mockToken);
  });

  it('logout clears user and token', () => {
    // Set first
    useAuthStore.getState().setAuth({ id: 1 }, 'token');
    
    // Then logout
    useAuthStore.getState().logout();
    
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
  });
});
