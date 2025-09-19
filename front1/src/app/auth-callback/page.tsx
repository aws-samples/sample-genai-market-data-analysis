'use client';

import { useEffect } from 'react';
import { useAuth } from 'react-oidc-context';
import { useRouter } from 'next/navigation';

export default function AuthCallbackPage() {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Handle the callback automatically
    if (auth.isAuthenticated) {
      // User is authenticated, redirect to main app
      router.push('/');
    } else if (auth.error) {
      // Handle authentication error
      router.push('/?error=auth_failed');
    }
  }, [auth.isAuthenticated, auth.error, router]);

  if (auth.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Completing sign in...</p>
        </div>
      </div>
    );
  }

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
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Sign In Failed</h2>
            <p className="text-slate-600 mb-6">{auth.error.message}</p>
            <button
              onClick={() => router.push('/')}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <div className="animate-pulse">
          <div className="w-16 h-16 bg-blue-200 rounded-full mx-auto mb-4"></div>
        </div>
        <p className="text-slate-600">Processing authentication...</p>
      </div>
    </div>
  );
}