import React from 'react';
import ReactDOM from 'react-dom/client';
import AdminSettings from './AdminSettings';
import './assets/global.css';

// Mount the admin settings app
const rootElement = document.getElementById('wplc-admin-settings-root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <AdminSettings />
    </React.StrictMode>
  );
}
