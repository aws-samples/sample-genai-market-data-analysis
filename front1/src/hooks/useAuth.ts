'use client';

import { useAuth as useOidcAuth } from 'react-oidc-context';
import { getCognitoLogoutUrl } from '@/config/auth';

export const useAuth = () => {
  const auth = useOidcAuth();

  const signOut = () => {
    const logoutUrl = getCognitoLogoutUrl();
    window.location.href = logoutUrl;
  };

  const signOutLocal = () => {
    auth.removeUser();
  };

  return {
    ...auth,
    signOut,
    signOutLocal,
    user: auth.user,
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    error: auth.error,
  };
};