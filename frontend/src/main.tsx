import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { ColorSchemeProvider } from './features/theme/ColorSchemeProvider';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ColorSchemeProvider>
      <App />
    </ColorSchemeProvider>
  </React.StrictMode>,
);

