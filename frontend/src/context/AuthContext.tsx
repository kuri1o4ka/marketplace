import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/endpoints';
import { tokenStore } from '../api/client';
import type { LoginPayload, RegisterPayload, Role, User } from '../api/types';
import { AuthContext } from './auth';
import type { AuthContextValue, ChangePasswordPayload, UpdateProfilePayload } from './auth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(() => Boolean(tokenStore.get()));

  useEffect(() => {
    const token = tokenStore.get();
    if (!token) return;

    let cancelled = false;
    authApi
      .me()
      .then((me) => {
        if (!cancelled) setUser(me);
      })
      .catch(() => {
        tokenStore.clear();
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      tokenStore.clear();
      setUser(null);
      setLoading(false);
      queryClient.clear();
    };
    window.addEventListener('polyclothes:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('polyclothes:unauthorized', handleUnauthorized);
  }, [queryClient]);

  const login = useCallback(
    async (payload: LoginPayload) => {
      const response = await authApi.login(payload);
      tokenStore.set(response.token);
      setUser(response.user);
      queryClient.clear();
      return response.user;
    },
    [queryClient],
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      const response = await authApi.register(payload);
      tokenStore.set(response.token);
      setUser(response.user);
      queryClient.clear();
      return response.user;
    },
    [queryClient],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // The local session is cleared even if the server call fails.
    }
    tokenStore.clear();
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  const refreshUser = useCallback(async () => {
    if (!tokenStore.get()) return;
    try {
      const me = await authApi.me();
      setUser(me);
      queryClient.setQueryData(['me'], me);
    } catch {
      // Ignore transient refresh failures; the interceptor handles 401s.
    }
  }, [queryClient]);

  const updateProfile = useCallback(
    async (payload: UpdateProfilePayload) => {
      const me = await authApi.updateMe(payload);
      setUser(me);
      queryClient.setQueryData(['me'], me);
      return me;
    },
    [queryClient],
  );

  const changePassword = useCallback(
    async (payload: ChangePasswordPayload) => {
      await authApi.changePassword(payload);
    },
    [],
  );

  const hasRole = useCallback(
    (...roles: Role[]) => {
      if (!user) return false;
      return roles.includes(user.role);
    },
    [user],
  );

  const canSell = Boolean(user && (user.role === 'user' || user.role === 'shop'));
  const isModerator = Boolean(user && (user.role === 'moderator' || user.role === 'admin'));
  const isShop = user?.role === 'shop';

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
      refreshUser,
      updateProfile,
      changePassword,
      hasRole,
      canSell,
      isModerator,
      isShop,
    }),
    [
      user,
      loading,
      login,
      register,
      logout,
      refreshUser,
      updateProfile,
      changePassword,
      hasRole,
      canSell,
      isModerator,
      isShop,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
