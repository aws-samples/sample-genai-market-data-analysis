import { useRef } from 'react';

/**
 * Hook for managing screen reader announcements
 */
export const useAnnouncements = () => {
  const announcementRef = useRef<HTMLDivElement>(null);

  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (announcementRef.current) {
      // Clear previous announcement
      announcementRef.current.textContent = '';
      
      // Set aria-live attribute
      announcementRef.current.setAttribute('aria-live', priority);
      
      // Add new announcement after a brief delay to ensure screen readers pick it up
      setTimeout(() => {
        if (announcementRef.current) {
          announcementRef.current.textContent = message;
        }
      }, 100);
    }
  };

  const AnnouncementRegion = () => {
    return {
      ref: announcementRef,
      'aria-live': 'polite' as const,
      'aria-atomic': 'true' as const,
      className: 'sr-only',
      role: 'status' as const,
    };
  };

  return {
    announce,
    AnnouncementRegion,
  };
};