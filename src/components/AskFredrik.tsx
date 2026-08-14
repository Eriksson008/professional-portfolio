import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import { askFredrik } from '../lib/askFredrik';
import { matchCuratedId } from '../lib/matchStaticAnswer';
import { followUpPrompts, starterPrompts } from '../lib/askPrompts';
import type { AskPrompt } from '../lib/askPrompts';
import { disclosure, welcome } from '../data/fredrikContext';
import { nextFollowState } from './askScroll';
import { useAskSheet, useSheetViewport } from './useSheetViewport';
import type { AskFredrikController } from './useAskFredrik';

interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  text: string;
  /** Curated topic this turn landed on — what the follow-ups are drawn from. */
  topicId?: string;
}

interface AskFredrikProps {
  ask: AskFredrikController;
}

/** The launcher stays hidden until the hero's opening frame has passed. */
const REVEAL_FRACTION = 0.55;
/** Contextual follow-ups shown under an answer before "More questions". */
const FOLLOW_UP_LIMIT = 3;

const glyph = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: false,
} as const;

const reduceMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Ask Fredrik — recruiter concierge. Answers come from the curated knowledge
 * base via askFredrik(), upgraded to the Worker when VITE_ASK_FREDRIK_API_URL
 * is set. This component owns presentation only; nothing here touches the
 * request contract, the session id, or logging.
 *
 * Two shells, one transcript. Desktop (≥720px) keeps the floating concierge
 * card opened from a pill, non-modal so the page stays usable. Phones (≤719px)
 * get a full-viewport sheet opened from the dock: modal, page pinned, dock
 * suspended, sized to window.visualViewport so the composer sits on the
 * keyboard instead of under it.
 */
export function AskFredrik({ ask }: AskFredrikProps) {
  const { open, close } = ask;
  // Which shell CSS is rendering — read from the same query, never re-derived.
  const isSheet = useAskSheet();
  const isDesktop = !isSheet;

  const [pastHero, setPastHero] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [askedIds, setAskedIds] = useState<string[]>([]);
  const [showAllFollowUps, setShowAllFollowUps] = useState(false);
  const [fadeTop, setFadeTop] = useState(false);
  const [fadeBottom, setFadeBottom] = useState(false);
  const [atBottom, setAtBottom] = useState(true);

  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(0);
  /** Should new turns pull the log down? Cleared as soon as the user scrolls up. */
  const follow = useRef(true);
  /** A scroll we started ourselves — its own scroll events must not clear `follow`. */
  const autoScrolling = useRef(false);
  /** Previous distance-to-bottom, used to tell our animation from the reader. */
  const lastDistance = useRef(Number.POSITIVE_INFINITY);

  useSheetViewport(open && isSheet);

  // Keep the hero's opening frame clean: reveal only after real scrolling.
  useEffect(() => {
    const onScroll = () => setPastHero(window.scrollY > window.innerHeight * REVEAL_FRACTION);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /**
   * Park focus somewhere that will still exist after this render.
   *
   * Every prompt control removes itself when it is used: a starter card ends
   * the empty state, a follow-up chip is replaced by the thinking indicator,
   * "More questions" is replaced by the questions. The browser drops focus to
   * <body> when that happens — outside the panel, where the Tab trap can no
   * longer see it, so the next Tab walks into the page hidden behind the sheet.
   */
  const parkFocus = () => {
    if (isDesktop) inputRef.current?.focus();
    else panelRef.current?.focus();
  };

  // Desktop opens ready to type. Phones deliberately do not: an iOS keyboard
  // on first paint takes the half of the sheet the starter grid lives in, so
  // the most useful thing here would be hidden before it was ever seen.
  // Layout effect, not a passive one: the dock goes aria-hidden in the same
  // commit, and Chrome ignores aria-hidden on an ancestor of the focused
  // element, so focus has to leave the dock before the browser paints.
  useLayoutEffect(() => {
    if (!open) return;
    parkFocus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isDesktop]);

  // Closing unmounts the log, so the next open starts at the newest turn
  // again. Without this, someone who scrolled up to re-read an early answer,
  // then closed and reopened, landed on their oldest message.
  useEffect(() => {
    if (open) return;
    follow.current = true;
    lastDistance.current = Number.POSITIVE_INFINITY;
    autoScrolling.current = false;
  }, [open]);

  const syncScroll = () => {
    const log = logRef.current;
    if (!log) return;
    const distance = log.scrollHeight - log.scrollTop - log.clientHeight;
    const next = nextFollowState({
      distance,
      lastDistance: lastDistance.current,
      autoScrolling: autoScrolling.current,
      follow: follow.current,
    });
    autoScrolling.current = next.autoScrolling;
    follow.current = next.follow;
    lastDistance.current = distance;
    setAtBottom(next.atBottom);
    setFadeTop(log.scrollTop > 4);
    setFadeBottom(distance > 4);
  };

  const scrollToLatest = (smooth = !reduceMotion()) => {
    const log = logRef.current;
    if (!log) return;
    follow.current = true;
    autoScrolling.current = true;
    // New content just changed the distance out from under us; let the next
    // scroll event set the baseline instead of reading it as a reversal.
    lastDistance.current = Number.POSITIVE_INFINITY;
    log.scrollTo({ top: log.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
  };

  // Follow the conversation only when the reader is already at the end of it.
  useEffect(() => {
    if (!open) return;
    if (follow.current) scrollToLatest();
    syncScroll();
  }, [messages, busy, open]);

  // The conversation area changes height for reasons that are not new turns:
  // the keyboard opening, the device rotating, the composer growing a line.
  // Someone who was reading the end should still be reading the end after it.
  // Instant, never animated — a smooth scroll racing the keyboard transition
  // is exactly the fight that makes iOS chat layouts feel broken.
  useEffect(() => {
    const log = logRef.current;
    if (!open || !log || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => {
      if (follow.current) scrollToLatest(false);
      syncScroll();
    });
    observer.observe(log);
    return () => observer.disconnect();
  }, [open]);

  // Grow the composer with its content, up to the CSS max-height.
  useEffect(() => {
    const field = inputRef.current;
    if (!field) return;
    field.style.height = 'auto';
    // scrollHeight is content + padding; the field is border-box, so the
    // borders have to be added back or it sits 2px short and shows a
    // scrollbar on a single line of text.
    const style = getComputedStyle(field);
    const borders = parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth);
    field.style.height = `${field.scrollHeight + borders}px`;
  }, [input, open]);

  const send = async (question: string, promptId?: string) => {
    const trimmed = question.trim();
    if (trimmed === '' || busy) return;
    // The control that triggered this is about to unmount underneath us.
    parkFocus();
    const topicId = promptId ?? matchCuratedId(trimmed);
    setShowAllFollowUps(false);
    setMessages((prev) => [...prev, { id: nextId.current++, role: 'user', text: trimmed }]);
    setInput('');
    setBusy(true);
    // The reader asked for this turn, so take them to it regardless of position.
    follow.current = true;
    // Brief considered pause so instant static answers don't feel canned.
    const pause = new Promise((resolve) => setTimeout(resolve, 550));
    const [result] = await Promise.all([askFredrik(trimmed), pause]);
    setMessages((prev) => [
      ...prev,
      { id: nextId.current++, role: 'assistant', text: result.answer, topicId },
    ]);
    // Retire a topic only when its curated answer is what was actually shown.
    // topicId is a keyword guess for free text, and several topics match on a
    // single common word — 'why' resolves to why-interview. In production the
    // Worker answers, so a question like "why did he build this site?" would
    // otherwise delete the strongest recruiter prompt from every later
    // follow-up list on the strength of an answer nobody saw.
    if (topicId && (promptId !== undefined || result.source === 'static')) {
      setAskedIds((ids) => (ids.includes(topicId) ? ids : [...ids, topicId]));
    }
    setBusy(false);
    // Desktop returns to the field; on a phone that would re-open the keyboard
    // over the answer the reader just asked for.
    if (isDesktop) inputRef.current?.focus();
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void send(input);
  };

  const onComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey) return;
    // Enter confirms an IME candidate before it means "send"; submitting here
    // would post half a word for anyone composing CJK.
    if (event.nativeEvent.isComposing) return;
    event.preventDefault();
    void send(input);
  };

  // Escape always closes. Tab is trapped only in the phone sheet, which is the
  // only shell that claims aria-modal.
  const onPanelKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      close();
      return;
    }
    if (event.key !== 'Tab' || !isSheet) return;
    // tabindex="-1" excluded: the jump button is always in the DOM and is only
    // reachable when it is on screen. Letting it be the trap's last stop would
    // send focus to something invisible, where .focus() quietly does nothing.
    const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
      'button:not([disabled]):not([tabindex="-1"]), textarea:not([disabled])'
    );
    if (!focusable || focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;
    if (event.shiftKey && (active === first || active === panelRef.current)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const last = messages[messages.length - 1];
  const answered = !busy && last?.role === 'assistant' ? last : undefined;
  const followUps: AskPrompt[] = answered ? followUpPrompts(answered.topicId, askedIds) : [];
  const shownFollowUps = showAllFollowUps ? followUps : followUps.slice(0, FOLLOW_UP_LIMIT);
  const isEmpty = messages.length === 0;
  const canSend = !busy && input.trim() !== '';
  const visible = open || pastHero;

  return (
    <div className={`af-root ${open ? 'is-open' : ''}`}>
      <button
        type="button"
        className={`af-launcher ${visible ? 'is-visible' : ''}`}
        tabIndex={visible ? 0 : -1}
        aria-hidden={!visible}
        aria-expanded={open}
        aria-controls="ask-fredrik-panel"
        onClick={(e) => ask.toggle(e.currentTarget)}
      >
        <span className="af-dot" aria-hidden="true" />
        Ask Fredrik
      </button>

      {open && (
        <>
          {/* Phone only (CSS). Purely a scrim, deliberately with no click
              handler: the sheet covers the whole visible viewport, so the only
              backdrop a finger could reach is the strip behind the keyboard.
              A tap-to-close that can never be tapped is worse than none —
              the × in the header is the dismissal affordance here. */}
          <div className="af-backdrop" aria-hidden="true" />

          <div
            id="ask-fredrik-panel"
            ref={panelRef}
            className="af-panel"
            role="dialog"
            aria-modal={isSheet || undefined}
            aria-label="Ask Fredrik — portfolio assistant"
            tabIndex={-1}
            onKeyDown={onPanelKeyDown}
          >
            <header className="af-head">
              <div className="af-head-text">
                <p className="af-eyebrow">Portfolio Concierge</p>
                <h2 className="af-title">Ask Fredrik</h2>
              </div>
              <button
                type="button"
                className="af-close"
                onClick={close}
                aria-label="Close Ask Fredrik"
              >
                <svg {...glyph} width={18} height={18}>
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </header>

            {/* Shell exists so the scroll fades and the jump button can overlay
                the log without scrolling with it. */}
            <div
              className={`af-log-shell ${fadeTop ? 'is-faded-top' : ''} ${
                fadeBottom ? 'is-faded-bottom' : ''
              }`}
            >
              <div
                ref={logRef}
                className="af-log"
                role="log"
                aria-live="polite"
                onScroll={syncScroll}
                // A deliberate gesture takes the log back from any auto-scroll.
                onPointerDown={() => {
                  autoScrolling.current = false;
                }}
                onWheel={() => {
                  autoScrolling.current = false;
                }}
              >
                {isEmpty ? (
                  // aria-live="off": the log is a polite live region so answers
                  // get announced, but these are controls, not status. Without
                  // this they would be read out as though they had just arrived.
                  <div className="af-welcome" aria-live="off">
                    <p className="af-welcome-title">{welcome.headline}</p>
                    <p className="af-welcome-lead">{welcome.lead}</p>
                    <div className="af-starters" role="group" aria-labelledby="af-starters-label">
                      <p className="af-starters-label" id="af-starters-label">
                        Suggested
                      </p>
                      <div className="af-starter-grid">
                        {starterPrompts.map((prompt) => (
                          <button
                            key={prompt.id}
                            type="button"
                            className="af-starter"
                            disabled={busy}
                            onClick={() => void send(prompt.question, prompt.id)}
                          >
                            <span className="af-starter-label">{prompt.label}</span>
                            <svg {...glyph} className="af-starter-arrow" width={14} height={14}>
                              <path d="M6 18L18 6M9 6h9v9" />
                            </svg>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className={`af-msg af-msg-${msg.role}`}>
                      {msg.text}
                    </div>
                  ))
                )}

                {busy && (
                  <div className="af-msg af-msg-assistant af-typing" aria-label="Preparing answer">
                    <span className="af-typing-label">Thinking</span>
                    <span className="af-typing-dot" />
                    <span className="af-typing-dot" />
                    <span className="af-typing-dot" />
                  </div>
                )}

                {shownFollowUps.length > 0 && (
                  <div
                    className="af-followups"
                    role="group"
                    aria-live="off"
                    aria-labelledby="af-followups-label"
                  >
                    <p className="af-followups-label" id="af-followups-label">
                      You might also ask
                    </p>
                    <div className="af-followup-row">
                      {shownFollowUps.map((prompt) => (
                        <button
                          key={prompt.id}
                          type="button"
                          className="af-followup"
                          onClick={() => void send(prompt.question, prompt.id)}
                        >
                          {prompt.label}
                        </button>
                      ))}
                      {!showAllFollowUps && followUps.length > FOLLOW_UP_LIMIT && (
                        <button
                          type="button"
                          className="af-followup af-followup-more"
                          onClick={() => {
                            // This button is what the expansion replaces.
                            parkFocus();
                            setShowAllFollowUps(true);
                          }}
                        >
                          More questions
                          <svg {...glyph} width={13} height={13}>
                            <path d="M6 9l6 6 6-6" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                className={`af-jump ${!atBottom && !isEmpty ? 'is-visible' : ''}`}
                tabIndex={!atBottom && !isEmpty ? 0 : -1}
                aria-hidden={atBottom || isEmpty}
                aria-label="Jump to the latest message"
                onClick={() => scrollToLatest()}
              >
                <svg {...glyph} width={16} height={16}>
                  <path d="M12 5v14M5 12l7 7 7-7" />
                </svg>
              </button>
            </div>

            <form className="af-form" onSubmit={onSubmit}>
              <label className="visually-hidden" htmlFor="af-input">
                Ask a question about Fredrik
              </label>
              <textarea
                id="af-input"
                ref={inputRef}
                className="af-input"
                placeholder="Ask about projects, stack, leadership…"
                autoComplete="off"
                rows={1}
                maxLength={300}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onComposerKeyDown}
              />
              <button
                type="submit"
                className="af-send"
                disabled={!canSend}
                aria-label="Send question"
              >
                <span className="af-send-text">Send</span>
                <svg {...glyph} className="af-send-icon" width={18} height={18}>
                  <path d="M12 19V5M5 12l7-7 7 7" />
                </svg>
              </button>
            </form>

            <p className={`af-disclosure ${isEmpty ? '' : 'is-compact'}`}>{disclosure}</p>
          </div>
        </>
      )}
    </div>
  );
}
