'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from 'react-oidc-context';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const auth = useAuth();
  const [isClient, setIsClient] = useState(false);
  const [isCallback, setIsCallback] = useState(false);
  const [hasTriggeredRedirect, setHasTriggeredRedirect] = useState(false);

  useEffect(() => {
    // Set client-side flag
    setIsClient(true);
    
    // Check if we're in a callback scenario (only on client)
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const hasCode = urlParams.has('code');
      const hasState = urlParams.has('state');
      setIsCallback(hasCode && hasState);
    }
  }, []);

  useEffect(() => {
    // Auto-redirect to Cognito if not authenticated and not in callback
    if (isClient && !auth.isAuthenticated && !auth.isLoading && !isCallback && !hasTriggeredRedirect && !auth.error) {
      setHasTriggeredRedirect(true);
      auth.signinRedirect();
    }
  }, [auth, isClient, isCallback, hasTriggeredRedirect]);

  // Show loading during SSR or while determining callback status
  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-pulse">
            <div className="w-16 h-16 bg-blue-200 rounded-full mx-auto mb-4"></div>
          </div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Handle callback processing
  if (isCallback && auth.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Completing sign in...</p>
        </div>
      </div>
    );
  }

  // Show loading while authentication is in progress
  if (auth.isLoading || (!auth.isAuthenticated && !auth.error)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Redirecting to sign in...</p>
        </div>
      </div>
    );
  }

  // Handle authentication errors
  if (auth.error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Authentication Error</h2>
            <p className="text-slate-600 mb-6">{auth.error.message}</p>
            <button
              onClick={() => {
                setHasTriggeredRedirect(false);
                window.location.reload();
              }}
              className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // User is authenticated, show the protected content
  return <>{children}</>;
};