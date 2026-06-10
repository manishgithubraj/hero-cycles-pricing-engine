import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Dashboard from './pages/Dashboard';
import PricingEngine from './pages/PricingEngine';
import PartsManager from './pages/PartsManager';
import QuoteHistory from './pages/QuoteHistory';
import { seedDatabase } from './services/api';
import './App.css';

function App() {
  useEffect(() => {
    seedDatabase().catch(() => {});
  }, []);

  return (
    <Router>
      <Toaster position="top-right" />
      <div className="app">
        <aside className="sidebar">
          <div className="logo">
            <div className="logo-icon">🚲</div>
            <div>
              <div className="logo-title">Hero Cycles</div>
              <div className="logo-sub">Pricing Engine</div>
            </div>
          </div>
          <nav className="nav">
            <NavLink to="/" end className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
              <span className="nav-icon">📊</span> Dashboard
            </NavLink>
            <NavLink to="/pricing" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
              <span className="nav-icon">🧮</span> Pricing Engine
            </NavLink>
            <NavLink to="/parts" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
              <span className="nav-icon">⚙️</span> Parts Manager
            </NavLink>
            <NavLink to="/quotes" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
              <span className="nav-icon">📄</span> Quote History
            </NavLink>
          </nav>
          <div className="sidebar-footer">v1.0 · Hero Digital Team</div>
        </aside>
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/pricing" element={<PricingEngine />} />
            <Route path="/parts" element={<PartsManager />} />
            <Route path="/quotes" element={<QuoteHistory />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
