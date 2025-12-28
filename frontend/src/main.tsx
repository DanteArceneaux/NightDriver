import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { ColorSchemeProvider } from './features/theme/ColorSchemeProvider';
import './index.css';

/**
 * Service worker strategy:
 * - DEV: unregister any previously-registered SW and clear our caches to prevent CacheStorage QuotaExceededError
 *        (Vite dev serves thousands of module URLs; runtime caching them fills storage quickly).
 * - PROD: register SW for lightweight offline/PWA support.
 */
async function setupServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  // DEV: hard-disable SW to avoid cache quota storms
  if (import.meta.env.DEV) {
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    } catch (e) {
      // Best-effort; ignore
    }

    // Also clear our caches (Cache Storage quota is separate from localStorage)
    try {
      const keys = await caches.keys();
      const ours = keys.filter((k) => k.startsWith('neon-cockpit-') || k.startsWith('night-driver-'));
      await Promise.all(ours.map((k) => caches.delete(k)));
    } catch (e) {
      // Best-effort; ignore
    }

    return;
  }

  // PROD: register SW
  try {
    window.addEventListener('load', async () => {
      const reg = await navigator.serviceWorker.register('/service-worker.js');
      console.log('✅ Service Worker registered:', reg.scope);
    });
  } catch (err) {
    console.warn('⚠️ Service Worker registration failed:', err);
  }
}

setupServiceWorker();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ColorSchemeProvider>
      <App />
    </ColorSchemeProvider>
  </React.StrictMode>,
);

