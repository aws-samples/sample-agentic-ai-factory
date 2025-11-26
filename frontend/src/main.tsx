
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initializeAmplify } from './config/amplify';

// Initialize Amplify before rendering the app
initializeAmplify().then((configured) => {
  if (!configured) {
    console.warn('Running without AWS configuration. Some features may not work.');
  }
  
  createRoot(document.getElementById('root')!).render(<App />);
});
  