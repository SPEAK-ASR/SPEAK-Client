import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useSinhalaIme } from './useSinhalaIme';

describe('useSinhalaIme', () => {
  const mockAttach = vi.fn();
  const mockDetach = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    mockAttach.mockReturnValue({
      detach: mockDetach,
      set mode(val: string) {},
      set enabled(val: boolean) {},
    });

    (window as any).SinPhoneticIME = {
      attach: mockAttach,
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    delete (window as any).SinPhoneticIME;
  });

  it('attaches to the textarea when SinPhoneticIME is available', () => {
    const textarea = document.createElement('textarea');
    const textareaRef = { current: textarea };

    renderHook(() => useSinhalaIme({ textareaRef }));

    expect(mockAttach).toHaveBeenCalledWith(textarea, {
      toggle: undefined,
      chip: undefined,
    });
  });

  it('retries if SinPhoneticIME is not initially available', () => {
    delete (window as any).SinPhoneticIME;
    mockAttach.mockClear();

    const textarea = document.createElement('textarea');
    const textareaRef = { current: textarea };

    renderHook(() => useSinhalaIme({ textareaRef }));

    expect(mockAttach).not.toHaveBeenCalled();

    // Make it available
    (window as any).SinPhoneticIME = {
      attach: mockAttach,
    };

    vi.advanceTimersByTime(200);

    expect(mockAttach).toHaveBeenCalledWith(textarea, {
      toggle: undefined,
      chip: undefined,
    });
  });

  it('detaches on unmount', () => {
    const textarea = document.createElement('textarea');
    const textareaRef = { current: textarea };
    const { unmount } = renderHook(() => useSinhalaIme({ textareaRef }));

    unmount();

    expect(mockDetach).toHaveBeenCalled();
  });
});
