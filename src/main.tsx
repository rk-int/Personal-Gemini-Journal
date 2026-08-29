// Ensure window.fetch has both getter and setter in iframe sandbox environments
if (typeof window !== 'undefined') {
  try {
    const originalFetch = window.fetch ? window.fetch.bind(window) : undefined;
    let currentFetch = originalFetch;
    Object.defineProperty(window, 'fetch', {
      get() {
        return currentFetch || originalFetch;
      },
      set(newFetch) {
        currentFetch = typeof newFetch === 'function' ? newFetch : originalFetch;
      },
      configurable: true,
      enumerable: true,
    });
  } catch (_e) {
    // Non-fatal if already defined or restricted
  }
}

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
