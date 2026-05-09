import { useEffect } from "react";

interface HotkeyOptions {
  enabled?: boolean;
  preventDefault?: boolean;
  ignoreInputs?: boolean;
}

interface ParsedCombo {
  key: string;
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
  meta: boolean;
}

function parseCombo(combo: string): ParsedCombo {
  const parts = combo.toLowerCase().split("+").map((p) => p.trim());
  const out: ParsedCombo = {
    key: "",
    ctrl: false,
    shift: false,
    alt: false,
    meta: false,
  };
  for (const p of parts) {
    if (p === "ctrl" || p === "control") out.ctrl = true;
    else if (p === "shift") out.shift = true;
    else if (p === "alt" || p === "option") out.alt = true;
    else if (p === "meta" || p === "cmd" || p === "command") out.meta = true;
    else out.key = p;
  }
  return out;
}

function eventMatches(e: KeyboardEvent, c: ParsedCombo): boolean {
  if (e.ctrlKey !== c.ctrl) return false;
  if (e.shiftKey !== c.shift) return false;
  if (e.altKey !== c.alt) return false;
  if (e.metaKey !== c.meta) return false;
  const key = e.key.toLowerCase();
  const code = e.code.toLowerCase();
  return key === c.key || code === c.key;
}

export function useHotkey(
  combo: string,
  handler: (e: KeyboardEvent) => void,
  options: HotkeyOptions = {},
) {
  const {
    enabled = true,
    preventDefault = true,
    ignoreInputs = false,
  } = options;

  useEffect(() => {
    if (!enabled) return;
    const parsed = parseCombo(combo);

    function onKey(e: KeyboardEvent) {
      if (ignoreInputs) {
        const t = e.target as HTMLElement | null;
        if (
          t &&
          (t.tagName === "INPUT" ||
            t.tagName === "TEXTAREA" ||
            t.isContentEditable)
        ) {
          return;
        }
      }
      if (eventMatches(e, parsed)) {
        if (preventDefault) e.preventDefault();
        handler(e);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [combo, handler, enabled, preventDefault, ignoreInputs]);
}
