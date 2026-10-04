// Safe fetch property patch: Ensure fetch on window/global has both getter & setter
(function() {
  try {
    if (typeof window !== 'undefined') {
      var origFetch = window.fetch ? window.fetch.bind(window) : undefined;
      var fetchHolder = origFetch;

      var defineSafeFetch = function(target: any) {
        if (!target) return;
        try {
          var desc = Object.getOwnPropertyDescriptor(target, 'fetch');
          if (!desc || desc.configurable) {
            Object.defineProperty(target, 'fetch', {
              get: function() {
                return fetchHolder || (origFetch ? (fetchHolder = origFetch) : undefined);
              },
              set: function(val) {
                fetchHolder = val;
              },
              configurable: true,
              enumerable: true
            });
          }
        } catch (e) {}
      };

      defineSafeFetch(window);
      if (typeof Window !== 'undefined' && Window.prototype) {
        defineSafeFetch(Window.prototype);
      }
      if (typeof globalThis !== 'undefined' && (globalThis as any) !== window) {
        defineSafeFetch(globalThis);
      }
    }
  } catch (e) {}
})();

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Register PWA Service Worker for Web Push and Offline capabilities
if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('GigMe PWA Service Worker registered with scope:', registration.scope);
      })
      .catch((err) => {
        console.warn('GigMe PWA Service Worker registration skipped or failed:', err);
      });
  });
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
