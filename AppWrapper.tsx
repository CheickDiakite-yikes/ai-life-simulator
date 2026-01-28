import React, { useState, useEffect } from 'react';
import App from './App';
import LandingPage from './components/LandingPage';

const AppWrapper: React.FC = () => {
  const [showApp, setShowApp] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash === '#app') {
      setShowApp(true);
    }
  }, []);

  const handleEnterApp = () => {
    window.history.pushState(null, '', '#app');
    setShowApp(true);
  };

  const handleBackToLanding = () => {
    window.history.pushState(null, '', '/');
    setShowApp(false);
  };

  useEffect(() => {
    const handlePopState = () => {
      const hash = window.location.hash;
      setShowApp(hash === '#app');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  if (showApp) {
    return <App onBackToLanding={handleBackToLanding} />;
  }

  return <LandingPage onEnterApp={handleEnterApp} />;
};

export default AppWrapper;
