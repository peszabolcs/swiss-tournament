import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import SwissPhase from './components/SwissPhase';
import AdminPanel from './components/AdminPanel';

function Navigation() {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-dark-card border-b border-dark-border sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-neon-purple">
              CS2 Tournament
            </div>
          </Link>

          {/* Nav Links */}
          <div className="flex space-x-1">
            <Link
              to="/"
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                isActive('/')
                  ? 'bg-gradient-to-r from-neon-blue to-neon-purple text-white'
                  : 'text-gray-300 hover:text-white hover:bg-dark-border'
              }`}
            >
              Dashboard
            </Link>
            <Link
              to="/matches"
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                isActive('/matches')
                  ? 'bg-gradient-to-r from-neon-blue to-neon-purple text-white'
                  : 'text-gray-300 hover:text-white hover:bg-dark-border'
              }`}
            >
              Matches
            </Link>
            <Link
              to="/admin"
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                isActive('/admin')
                  ? 'bg-gradient-to-r from-neon-purple to-neon-pink text-white'
                  : 'text-gray-300 hover:text-white hover:bg-dark-border'
              }`}
            >
              Admin
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-dark-bg">
        <Navigation />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/matches" element={<SwissPhase />} />
          <Route path="/admin" element={<AdminPanel />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
