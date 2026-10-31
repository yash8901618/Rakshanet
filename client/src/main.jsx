import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import './i18n';
import { useCrisisStore } from './store/crisisStore';

if (typeof window !== 'undefined') {
  window.__CRISIS_STORE__ = useCrisisStore;
}

// Register Service Worker for Offline PWA support (production only to prevent stale dev caching)
if ('serviceWorker' in navigator) {
  if (import.meta.env.DEV) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const reg of registrations) {
        reg.unregister();
      }
    });
    if (typeof caches !== 'undefined') {
      caches.keys().then((names) => {
        for (const name of names) {
          caches.delete(name);
        }
      });
    }
  } else {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('[PWA SW] Service Worker registered with scope:', reg.scope);
        })
        .catch((err) => {
          console.warn('[PWA SW] Service Worker registration failed:', err);
        });
    });
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
