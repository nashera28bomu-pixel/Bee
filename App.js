import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import MatchDay from './pages/MatchDay';
import MatchDetail from './pages/MatchDetail';
import LiveOdds from './pages/LiveOdds';
import H2H from './pages/H2H';
import TeamForm from './pages/TeamForm';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/matches" element={<MatchDay />} />
            <Route path="/match/:id" element={<MatchDetail />} />
            <Route path="/odds" element={<LiveOdds />} />
            <Route path="/h2h" element={<H2H />} />
            <Route path="/team/:id" element={<TeamForm />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
