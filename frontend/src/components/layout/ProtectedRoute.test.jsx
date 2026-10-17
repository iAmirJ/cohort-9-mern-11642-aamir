import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { useAuthStore } from '../../store/useAuthStore';

describe('ProtectedRoute', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null });
  });

  it('redirects to /login if user is not authenticated', () => {
    // Should render the Login Page because user is null
    const { getByText } = render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/protected" element={<div>Protected Content</div>} />
          </Route>
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(getByText('Login Page')).toBeInTheDocument();
  });

  it('renders Outlet if user is authenticated', () => {
    // Set a dummy user
    useAuthStore.setState({ user: { id: 1, name: 'Test' } });

    const { getByText } = render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/protected" element={<div>Protected Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(getByText('Protected Content')).toBeInTheDocument();
  });
});
