import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { askFredrik } from '../lib/askFredrik';
import { disclosure, greeting, suggestedQuestions } from '../data/fredrikContext';

interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  text: string;
}

/** The launcher stays hidden until the hero's opening frame has passed. */
const REVEAL_FRACTION = 0.55;

/**
 * Ask Fredrik — floating recruiter concierge. v1 is fully static:
 * curated answers from src/data/fredrikContext.ts via askFredrik(),
 * no backend, no keys. Non-modal dialog so the page stays usable.
 */
export function AskFredrik() {
  const [open, setOpen] = useState(false);
  const [pastHero, setPastHero] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [askedIds, setAskedIds] = useState<string[]>([]);
  const [fadeTop, setFadeTop] = useState(false);
  const [fadeBottom, setFadeBottom] = useState(false);

  const launcherRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(0);

  // Keep the hero's opening frame clean: reveal only after real scrolling.
  useEffect(() => {
    const onScroll = () => setPastHero(window.scrollY > window.innerHeight * REVEAL_FRACTION);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Fade the transcript edges only when there is content beyond them.
  const syncFades = () => {
    const log = logRef.current;
    if (!log) return;
    setFadeTop(log.scrollTop > 4);
    setFadeBottom(log.scrollTop + log.clientHeight < log.scrollHeight - 4);
  };

  // Follow the conversation: pin the log to its newest message.
  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
    syncFades();
  }, [messages, busy, open]);

  const close = () => {
    setOpen(false);
    launcherRef.current?.focus();
  };

  const send = async (question: string, suggestionId?: string) => {
    const trimmed = question.trim();
    if (trimmed === '' || busy) return;
    if (suggestionId) setAskedIds((ids) => [...ids, suggestionId]);
    setMessages((prev) => [...prev, { id: nextId.current++, role: 'user', text: trimmed }]);
    setInput('');
    setBusy(true);
    // Brief considered pause so instant static answers don't feel canned.
    const pause = new Promise((resolve) => setTimeout(resolve, 550));
    const [result] = await Promise.all([askFredrik(trimmed), pause]);
    setMessages((prev) => [
      ...prev,
      { id: nextId.current++, role: 'assistant', text: result.answer },
    ]);
    setBusy(false);
    inputRef.current?.focus();
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void send(input);
  };

  const remaining = suggestedQuestions.filter((s) => !askedIds.includes(s.id));
  const visible = open || pastHero;

  return (
    <div className="af-root">
      <button
        ref={launcherRef}
        type="button"
        className={`af-launcher ${visible ? 'is-visible' : ''}`}
        tabIndex={visible ? 0 : -1}
        aria-hidden={!visible}
        aria-expanded={open}
        aria-controls="ask-fredrik-panel"
        onClick={() => (open ? close() : setOpen(true))}
      >
        <span className="af-dot" aria-hidden="true" />
        Ask Fredrik
      </button>

      {open && (
        <div
          id="ask-fredrik-panel"
          className="af-panel"
          role="dialog"
          aria-label="Ask Fredrik — portfolio assistant"
          onKeyDown={(e) => {
            if (e.key === 'Escape') close();
          }}
        >
          <header className="af-head">
            <div>
              <p className="af-eyebrow">Portfolio Concierge</p>
              <h2 className="af-title">Ask Fredrik</h2>
            </div>
            <button type="button" className="af-close" onClick={close} aria-label="Close Ask Fredrik">
              ×
            </button>
          </header>

          <div
            className={`af-log-shell ${fadeTop ? 'is-faded-top' : ''} ${
              fadeBottom ? 'is-faded-bottom' : ''
            }`}
          >
            <div ref={logRef} className="af-log" role="log" aria-live="polite" onScroll={syncFades}>
              <div className="af-msg af-msg-assistant">{greeting}</div>
              {messages.map((msg) => (
                <div key={msg.id} className={`af-msg af-msg-${msg.role}`}>
                  {msg.text}
                </div>
              ))}
              {busy && (
                <div className="af-msg af-msg-assistant af-typing" aria-label="Preparing answer">
                  <span className="af-typing-label">Thinking</span>
                  <span className="af-typing-dot" />
                  <span className="af-typing-dot" />
                  <span className="af-typing-dot" />
                </div>
              )}
            </div>
          </div>

          {remaining.length > 0 && (
            <div className="af-tray" role="group" aria-labelledby="af-tray-label">
              <p className="af-tray-label" id="af-tray-label">
                Suggested prompts
              </p>
              <div className="af-chips">
                {remaining.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className="af-chip"
                    disabled={busy}
                    onClick={() => void send(s.question, s.id)}
                  >
                    {s.question}
                  </button>
                ))}
              </div>
            </div>
          )}

          <form className="af-form" onSubmit={onSubmit}>
            <label className="visually-hidden" htmlFor="af-input">
              Ask a question about Fredrik
            </label>
            <input
              id="af-input"
              ref={inputRef}
              type="text"
              className="af-input"
              placeholder="Ask about projects, stack, leadership…"
              autoComplete="off"
              maxLength={300}
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit" className="af-send" disabled={busy || input.trim() === ''}>
              Send
            </button>
          </form>
          <p className="af-disclosure">{disclosure}</p>
        </div>
      )}
    </div>
  );
}
