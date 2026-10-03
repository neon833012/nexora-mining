import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Enforce Canonical Custom Domain: Redirect any visitor from *.pages.dev to official domain
if (typeof window !== 'undefined' && window.location.hostname.includes('pages.dev')) {
  window.location.replace('https://www.neoncryptomining.com' + window.location.pathname + window.location.search + window.location.hash);
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
