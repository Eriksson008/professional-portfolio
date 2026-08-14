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

  // Deep link: /#ask opens the assistant, so the URL can be handed to a
  // recruiter directly. Handled on load *and* on hashchange, because a hash
  // that only differs from the current one is a same-document navigation —
  // React never remounts, so a load-time check alone would do nothing for
  // anyone already on the page.
  //
  // The hash is normalised away before opening: the sheet pushes its own #ask
  // entry (useSheetHistory), and two of them in the stack would need Back
  // pressed twice to get out. Only ever *opens* — a hashchange back to '' is
  // what Back already produces, and acting on it would fight useSheetHistory.
  useEffect(() => {
    const openFromHash = () => {
      if (window.location.hash !== '#ask') return;
      history.replaceState(null, '', window.location.pathname + window.location.search);
      setOpen(true);
    };
    openFromHash();
    window.addEventListener('hashchange', openFromHash);
    return () => window.removeEventListener('hashchange', openFromHash);
  }, []);

  // Focus goes back after the close has been painted, not during it. The phone
  // dock is suspended while the panel is open, so the trigger is still hidden
  // at the moment close() runs — focusing it there silently does nothing.
  useEffect(() => {
    if (open) return;
    trigger.current?.focus();
  }, [open]);

  return { open, toggle, close };
}
