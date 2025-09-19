'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export const UserProfile: React.FC = () => {
  const { user, signOut, signOutLocal } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 rounded-lg hover:bg-slate-100 transition-colors"
        aria-label="User menu"
      >
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
          <span className="text-white text-sm font-medium">
            {user.profile.email?.charAt(0).toUpperCase() || 'U'}
          </span>
        </div>
        <div className="hidden md:block text-left">
          <div className="text-sm font-medium text-slate-900">
            {user.profile.name || user.profile.email}
          </div>
          <div className="text-xs text-slate-500">
            {user.profile.email}
          </div>
        </div>
        <svg 
          className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-slate-200 z-20">
            <div className="p-4 border-b border-slate-200">
              <div className="text-sm font-medium text-slate-900">
                {user.profile.name || 'User'}
              </div>
              <div className="text-xs text-slate-500">
                {user.profile.email}
              </div>
              {user.profile.sub && (
                <div className="text-xs text-slate-400 mt-1">
                  ID: {user.profile.sub.substring(0, 8)}...
                </div>
              )}
            </div>
            
            <div className="p-2">
              <button
                onClick={() => {
                  signOutLocal();
                  setIsOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
              >
                Sign Out (Local)
              </button>
              <button
                onClick={() => {
                  signOut();
                  setIsOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
              >
                Sign Out (Complete)
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};