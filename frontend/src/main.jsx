import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';
import { ActiveProjectProvider } from './context/ActiveProjectContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ActiveProjectProvider>
      <App />
    </ActiveProjectProvider>
  </React.StrictMode>
);
