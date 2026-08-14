import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * The assistant's open/close state, owned above both of its triggers: the
 * desktop floating pill and the phone dock's Ask button. One state, one panel,
 * one transcript — the dock is a second way in, not a second assistant.
 *
 * Whichever trigger opened the panel is remembered so closing returns focus
 * to a control that is actually on screen at that viewport.
 */
export interface AskFredrikController {
  open: boolean;
  /** Toggle from `trigger`; focus returns there on close. */
  toggle: (trigger: HTMLElement) => void;
  close: () => void;
}

export function useAskFredrik(): AskFredrikController {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLElement | null>(null);

  const toggle = useCallback((el: HTMLElement) => {
    trigger.current = el;
    setOpen((v) => !v);
  }, []);

  const close = useCallback(() => setOpen(false), []);

  // Focus goes back after the close has been painted, not during it. The phone
  // dock is suspended while the panel is open, so the trigger is still hidden
  // at the moment close() runs — focusing it there silently does nothing.
  useEffect(() => {
    if (open) return;
    trigger.current?.focus();
  }, [open]);

  return { open, toggle, close };
}
