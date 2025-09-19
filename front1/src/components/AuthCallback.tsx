'use client';

import { useEffect } from 'react';
import { useAuth } from 'react-oidc-context';

export const AuthCallback: React.FC = () => {
  const auth = useAuth();

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    // Check if we're handling a callback (has code parameter)
    const urlParams = new URLSearchParams(window.location.search);
    const hasCode = urlParams.has('code');
    const hasState = urlParams.has('state');

    if (hasCode && hasState && !auth.isAuthenticated && !auth.isLoading) {
      // This is a callback from Cognito, let the OIDC library handle it
      console.log('Handling OAuth callback...');
    }

    // Clean up URL after successful authentication
    if (auth.isAuthenticated && (hasCode || hasState)) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [auth.isAuthenticated, auth.isLoading]);

  return null; // This component doesn't render anything
};