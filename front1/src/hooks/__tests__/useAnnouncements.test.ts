import { renderHook, act } from '@testing-library/react';
import { useAnnouncements } from '../useAnnouncements';

describe('useAnnouncements', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should provide announce function and AnnouncementRegion component', () => {
    const { result } = renderHook(() => useAnnouncements());

    expect(result.current.announce).toBeInstanceOf(Function);
    expect(result.current.AnnouncementRegion).toBeInstanceOf(Function);
  });

  it('should create announcement region with proper accessibility attributes', () => {
    const { result } = renderHook(() => useAnnouncements());
    const { AnnouncementRegion } = result.current;

    const props = AnnouncementRegion();
    expect(props).toHaveProperty('aria-live', 'polite');
    expect(props).toHaveProperty('aria-atomic', 'true');
    expect(props).toHaveProperty('className', 'sr-only');
    expect(props).toHaveProperty('role', 'status');
    expect(props).toHaveProperty('ref');
  });

  it('should announce messages with polite priority by default', () => {
    const { result } = renderHook(() => useAnnouncements());
    
    // Create a mock element and assign it to the ref
    const mockElement = document.createElement('div');
    document.body.appendChild(mockElement);
    
    // Get the props and assign the ref
    const props = result.current.AnnouncementRegion();
    props.ref.current = mockElement;

    act(() => {
      result.current.announce('Test message');
    });

    expect(mockElement.getAttribute('aria-live')).toBe('polite');

    // Fast-forward timers to trigger the announcement
    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(mockElement.textContent).toBe('Test message');
  });

  it('should announce messages with assertive priority when specified', () => {
    const { result } = renderHook(() => useAnnouncements());
    
    // Create a mock element and assign it to the ref
    const mockElement = document.createElement('div');
    document.body.appendChild(mockElement);
    
    // Get the props and assign the ref
    const props = result.current.AnnouncementRegion();
    props.ref.current = mockElement;

    act(() => {
      result.current.announce('Error message', 'assertive');
    });

    expect(mockElement.getAttribute('aria-live')).toBe('assertive');

    // Fast-forward timers to trigger the announcement
    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(mockElement.textContent).toBe('Error message');
  });

  it('should clear previous announcements before making new ones', () => {
    const { result } = renderHook(() => useAnnouncements());
    
    // Create a mock element and assign it to the ref
    const mockElement = document.createElement('div');
    mockElement.textContent = 'Previous message';
    document.body.appendChild(mockElement);
    
    // Get the props and assign the ref
    const props = result.current.AnnouncementRegion();
    props.ref.current = mockElement;

    act(() => {
      result.current.announce('New message');
    });

    // Should clear immediately
    expect(mockElement.textContent).toBe('');

    // Fast-forward timers to trigger the new announcement
    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(mockElement.textContent).toBe('New message');
  });

  it('should handle missing ref gracefully', () => {
    const { result } = renderHook(() => useAnnouncements());
    
    // Don't mock the ref, leaving it as null
    expect(() => {
      act(() => {
        result.current.announce('Test message');
      });
    }).not.toThrow();
  });
});