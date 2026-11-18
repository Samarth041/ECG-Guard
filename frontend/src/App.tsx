import React, { useState, useEffect } from 'react';
import { HealthStatus, ModelInfo, PageRoute } from './types';
import { fetchHealth, fetchModelInfo } from './services/api';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { ClassifierPage } from './pages/ClassifierPage';
import { AboutPage } from './pages/AboutPage';

export const App: React.FC = () => {
  // Sync page route with URL hash if available
  const getInitialRoute = (): PageRoute => {
    const hash = window.location.hash.replace('#', '').toLowerCase();
    if (hash === 'classifier') return 'classifier';
    if (hash === 'about') return 'about';
    return 'home';
  };

  const [currentPage, setCurrentPage] = useState<PageRoute>(getInitialRoute);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);

  // Initial data loading
  useEffect(() => {
    async function init() {
      try {
        const [h, m] = await Promise.all([fetchHealth(), fetchModelInfo()]);
        setHealth(h);
        setModelInfo(m);
      } catch (err) {
        console.warn('Backend API connection warning:', err);
      }
    }
    init();

    // Listen to hash changes
    const onHashChange = () => {
      setCurrentPage(getInitialRoute());
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const handleNavigate = (page: PageRoute) => {
    setCurrentPage(page);
    window.location.hash = page;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-navy-950 text-slate-100 font-sans selection:bg-teal-400/20 selection:text-teal-300">
      <Navbar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        health={health}
      />

      <main className="flex-1">
        {currentPage === 'home' && (
          <HomePage onNavigate={handleNavigate} modelInfo={modelInfo} />
        )}
        {currentPage === 'classifier' && <ClassifierPage />}
        {currentPage === 'about' && <AboutPage modelInfo={modelInfo} />}
      </main>

      <Footer onNavigate={handleNavigate} />
    </div>
  );
};

export default App;
