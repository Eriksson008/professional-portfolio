import { useCallback, useRef, useState } from 'react';

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

  const close = useCallback(() => {
    setOpen(false);
    trigger.current?.focus();
  }, []);

  return { open, toggle, close };
}
