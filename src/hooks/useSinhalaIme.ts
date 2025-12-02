import { type RefObject, useEffect } from 'react';

interface SinhalaImeTargets {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  toggleRef?: RefObject<HTMLInputElement | null>;
  chipRef?: RefObject<HTMLButtonElement | null>;
}

/**
 * Attaches the global Sinhala IME controller to a textarea without touching its internals.
 * The underlying logic stays inside public/sin-phonetic-ime.js as requested.
 */
export function useSinhalaIme({ textareaRef, toggleRef, chipRef }: SinhalaImeTargets) {
  useEffect(() => {
    let detach: (() => void) | undefined;
    let cancelled = false;
    let interval: number | undefined;

    const tryAttach = () => {
      if (!textareaRef.current || typeof window === 'undefined') {
        return false;
      }
      if (toggleRef && !toggleRef.current) {
        return false;
      }
      if (chipRef && !chipRef.current) {
        return false;
      }
      if (window.SinPhoneticIME && typeof window.SinPhoneticIME.attach === 'function') {
        const controller = window.SinPhoneticIME.attach(textareaRef.current, {
          toggle: toggleRef?.current ?? undefined,
          chip: chipRef?.current ?? undefined,
        });
        if (controller && typeof controller.detach === 'function') {
          detach = controller.detach;
        }
        if (controller) {
          try {
            controller.mode = 'si';
            controller.enabled = true;
          } catch (err) {
            console.warn('Sinhala IME controller state error', err);
          }
        }
        if (toggleRef?.current) {
          toggleRef.current.checked = true;
          toggleRef.current.dispatchEvent(new Event('change', { bubbles: true }));
        }
        return true;
      }
      return false;
    };

    if (!tryAttach()) {
      interval = window.setInterval(() => {
        if (cancelled) {
          if (interval) window.clearInterval(interval);
          return;
        }
        if (tryAttach() && interval) {
          window.clearInterval(interval);
          interval = undefined;
        }
      }, 200);
    }

    return () => {
      cancelled = true;
      if (interval) {
        window.clearInterval(interval);
      }
      if (typeof detach === 'function') {
        detach();
      }
    };
  }, [textareaRef, toggleRef, chipRef]);
}
