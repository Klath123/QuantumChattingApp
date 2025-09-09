import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../context/useAuthStore';
import { toast } from 'react-toastify';
import axios from 'axios';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await axios.post('/api/v1/auth/logout');
      toast.success('Logged out successfully');
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      logout();
      navigate('/');
    }
  };

  const NavLink = ({ to, children, className = "" }) => {
    const isActive = location.pathname === to;
    return (
      <button
        className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
          isActive 
            ? 'bg-purple-600 text-white shadow-lg' 
            : 'text-gray-300 hover:bg-purple-500/20 hover:text-white'
        } ${className}`}
        onClick={() => navigate(to)}
      >
        {children}
      </button>
    );
  };

  const AuthButton = ({ onClick, children, variant = "primary" }) => (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
        variant === "primary"
          ? "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl"
          : "border border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white"
      }`}
    >
      {children}
    </button>
  );

  return (
    <nav className="sticky top-0 z-50 bg-gradient-to-r from-gray-900 via-black to-gray-900 border-b border-gray-800 backdrop-blur-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          <button 
            className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
            onClick={() => navigate('/')}
          >
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">O</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Overcloak
            </span>
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            {user && (
              <>
                <NavLink to="/chat">Secure Chat</NavLink>
                <NavLink to="/invite">Connect</NavLink>
              </>
            )}
          </div>

          {/* Desktop Auth Section */}
          <div className="hidden md:flex items-center space-x-4">
            {!user ? (
              <>
                <AuthButton onClick={() => navigate('/register')} variant="secondary">
                  Register
                </AuthButton>
                <AuthButton onClick={() => navigate('/login')}>
                  Login
                </AuthButton>
              </>
            ) : (
              <>
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {user.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <div className="text-white font-medium text-sm">{user.username}</div>
                    <div className="text-gray-400 text-xs">
                      Code: <span className="text-purple-400 font-mono">{user.invite_code || 'N/A'}</span>
                    </div>
                  </div>
                </div>
                <AuthButton onClick={handleLogout} variant="secondary">
                  Logout
                </AuthButton>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            {isMobileMenuOpen ? (
              <span className="text-xl">✕</span>
            ) : (
              <span className="text-xl">☰</span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`md:hidden transition-all duration-300 overflow-hidden ${
        isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <div className="bg-black/95 backdrop-blur-xl border-t border-gray-800 px-4 py-4 space-y-3">
          {user && (
            <>
              <NavLink to="/chat" className="w-full text-left">
                Secure Chat
              </NavLink>
              <NavLink to="/invite" className="w-full text-left">
                Connect
              </NavLink>

              {/* Mobile User Info */}
              <div className="mt-4 p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                      {user.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <div className="text-white font-medium">{user.username}</div>
                      <div className="text-gray-400 text-sm">
                        Code: <span className="text-purple-400 font-mono">{user.invite_code || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </>
          )}

          {!user && (
            <div className="space-y-3 pt-2 border-t border-gray-200">
              <AuthButton onClick={() => navigate('/register')} variant="secondary">
                Register
              </AuthButton>
              <AuthButton onClick={() => navigate('/login')}>
                Login
              </AuthButton>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}