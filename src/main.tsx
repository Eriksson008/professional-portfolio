import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './styles/tokens.css';
import './styles/app.css';
import './styles/hero.css';
import './styles/premium.css';
import './styles/finale.css';
import './styles/ask-fredrik.css';
import './styles/dock.css';

// Cloudflare Web Analytics (cookieless beacon). Production builds only, so dev
// sessions never count as visitors; the token is public by design (it ships in
// the page source of every site using Web Analytics).
if (import.meta.env.PROD) {
  const beacon = document.createElement('script');
  beacon.src = 'https://static.cloudflareinsights.com/beacon.min.js';
  beacon.type = 'module';
  beacon.dataset.cfBeacon = JSON.stringify({ token: '40ca5f813aa2431796d05e860fa4c043' });
  document.head.append(beacon);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
