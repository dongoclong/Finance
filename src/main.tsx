import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/globals.css';
import { App } from './App';

const container = document.getElementById('root');
if (!container) throw new Error('Không tìm thấy #root');

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>
);
