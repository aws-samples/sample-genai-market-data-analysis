'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthProvider as OidcAuthProvider } from 'react-oidc-context';
import { AuthConfig, loadAuthConfig } from '@/config/auth';
import { AuthCallback } from './AuthCallback';

interface AuthContextType {
  authConfig: AuthConfig | null;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType>({
  authConfig: null,
  isLoading: true,
  error: null,
});

export const useAuthConfig = () => useContext(AuthContext);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authConfig, setAuthConfig] = useState<AuthConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const config = await loadAuthConfig();
        setAuthConfig(config);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load auth configuration');
      } finally {
        setIsLoading(false);
      }
    };

    loadConfig();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading authentication configuration...</p>
        </div>
      </div>
    );
  }

  if (error || !authConfig) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-red-600">
          <p className="text-lg font-semibold mb-2">Authentication Configuration Error</p>
          <p className="text-sm">{error || 'Failed to load authentication configuration'}</p>
        </div>
      </div>
    );
  }

  const oidcConfig = {
    ...authConfig,
    // Explicitly provide metadata for Cognito
    metadata: {
      issuer: authConfig.authority,
      authorization_endpoint: `${authConfig.domain}/oauth2/authorize`,
      token_endpoint: `${authConfig.domain}/oauth2/token`,
      userinfo_endpoint: `${authConfig.domain}/oauth2/userInfo`,
      end_session_endpoint: `${authConfig.domain}/logout`,
      jwks_uri: `${authConfig.authority}/.well-known/jwks.json`,
    },
    onSigninCallback: () => {
      // Remove the query parameters from URL after successful signin
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    },
  };

  return (
    <AuthContext.Provider value={{ authConfig, isLoading, error }}>
      <OidcAuthProvider {...oidcConfig}>
        <AuthCallback />
        {children}
      </OidcAuthProvider>
    </AuthContext.Provider>
  );
};