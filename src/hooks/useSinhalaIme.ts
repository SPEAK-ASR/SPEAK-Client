import { type MutableRefObject, type RefObject, useEffect } from "react";

interface SinhalaImeTargets {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  toggleRef?: RefObject<HTMLInputElement | null>;
  chipRef?: RefObject<HTMLButtonElement | null>;
  /** Filled while the IME controller is attached; cleared on detach. */
  controllerRef?: MutableRefObject<SinhalaImeController | null>;
}

/**
 * Attaches the global Sinhala IME controller defined in
 * `public/sin-phonetic-ime.js` to a textarea. The script is loaded by
 * `index.html`; this hook just hands it our refs.
 */
export function useSinhalaIme({
  textareaRef,
  toggleRef,
  chipRef,
  controllerRef,
}: SinhalaImeTargets) {
  useEffect(() => {
    let detach: (() => void) | undefined;
    let cancelled = false;
    let interval: number | undefined;

    const clearControllerRef = () => {
      if (controllerRef) controllerRef.current = null;
    };

    const tryAttach = () => {
      if (!textareaRef.current || typeof window === "undefined") return false;
      if (toggleRef && !toggleRef.current) return false;
      if (chipRef && !chipRef.current) return false;
      if (
        window.SinPhoneticIME &&
        typeof window.SinPhoneticIME.attach === "function"
      ) {
        const controller = window.SinPhoneticIME.attach(textareaRef.current, {
          toggle: toggleRef?.current ?? undefined,
          chip: chipRef?.current ?? undefined,
        });
        if (controller && typeof controller.detach === "function") {
          detach = controller.detach;
        }
        if (controllerRef && controller) {
          controllerRef.current = controller;
        }
        if (controller) {
          try {
            controller.mode = "si";
            controller.enabled = true;
          } catch (err) {
            console.warn("Sinhala IME controller state error", err);
          }
        }
        if (toggleRef?.current) {
          toggleRef.current.checked = true;
          toggleRef.current.dispatchEvent(
            new Event("change", { bubbles: true }),
          );
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
      if (interval) window.clearInterval(interval);
      if (typeof detach === "function") detach();
      clearControllerRef();
    };
  }, [textareaRef, toggleRef, chipRef, controllerRef]);
}
