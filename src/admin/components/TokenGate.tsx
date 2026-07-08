import { useState } from 'react';

interface TokenGateProps {
  error: string | null;
  /** False when the build has no admin API URL — the token can't be used. */
  configured: boolean;
  onSubmit: (token: string) => void;
}

/**
 * Login screen for the dashboard. The token is never validated here — it's
 * handed up, sent as a Bearer header to the Worker, and the server decides.
 * Nothing is persisted beyond the current tab's sessionStorage.
 */
export function TokenGate({ error, configured, onSubmit }: TokenGateProps) {
  const [value, setValue] = useState('');
  return (
    <div className="admin-gate">
      <form
        className="admin-gate-card"
        onSubmit={(e) => {
          e.preventDefault();
          if (value.trim()) onSubmit(value.trim());
        }}
      >
        <p className="admin-gate-kicker">Ask&nbsp;Fredrik · Mission Control</p>
        <h1 className="admin-gate-title">Admin access</h1>
        <p className="admin-gate-sub">
          Enter the admin token to view prompt analytics. It is held only in this browser tab and
          sent straight to the Worker — never stored in the site.
        </p>
        <input
          type="password"
          autoFocus
          className="admin-gate-input"
          placeholder="Admin token"
          value={value}
          autoComplete="off"
          spellCheck={false}
          onChange={(e) => setValue(e.target.value)}
        />
        {!configured && (
          <p className="admin-gate-error">
            This build has no admin API URL configured (set VITE_ASK_FREDRIK_API_URL). See the
            dashboard docs.
          </p>
        )}
        {error && <p className="admin-gate-error">{error}</p>}
        <button type="submit" className="admin-btn admin-btn--primary" disabled={!value.trim()}>
          Unlock
        </button>
      </form>
    </div>
  );
}
