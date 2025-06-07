import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../context/useAuthStore';
import { toast } from 'react-toastify';
import axios from 'axios';

// SVG Icons
const Shield = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const MessageCircle = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const Users = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const LogOut = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const Home = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const Link = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
  </svg>
);

const Menu = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const X = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const OvercloakLogo = ({ className = "" }) => (
  <svg className={className} viewBox="0 0 64 64" fill="none">
    <circle cx="32" cy="32" r="30" fill="#7c3aed" opacity="0.15"/>
    <path d="M32 8C20 8 12 16 12 28c0 12 8 20 20 28 12-8 20-16 20-28 0-12-8-20-20-20z" fill="#7c3aed" stroke="#a21caf" strokeWidth="2"/>
    <rect x="24" y="28" width="16" height="14" rx="4" fill="#fff" stroke="#a21caf" strokeWidth="2"/>
    <circle cx="32" cy="35" r="2" fill="#7c3aed"/>
    <rect x="30" y="37" width="4" height="5" rx="2" fill="#a21caf"/>
  </svg>
);

// ... (Keep all SVG and import statements unchanged)

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

 

  const handleLogout = async () => {
    try {
      await axios.post('/api/v1/auth/logout');
      // logout();
      toast.success('Logged out successfully');
      // navigate('/');
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      logout();
      navigate('/');
    }
  };

  const NavLink = ({ to, children, icon, className = "" }) => {
    const isActive = location.pathname === to;
    return (
      <div
        className={`relative group cursor-pointer ${className}`}
        onClick={() => navigate(to)}
      >
        <div className={`flex items-center space-x-2 px-3 py-1.5 text-sm rounded-md transition-all duration-300 border ${
          isActive 
            ? 'bg-purple-500/30 border-purple-400/50 text-white' 
            : 'hover:bg-purple-500/20 hover:backdrop-blur-sm border-transparent hover:border-purple-500/30 text-gray-300 hover:text-white'
        }`}>
          {icon && <span className={`${
            isActive ? 'text-purple-300' : 'text-purple-400 group-hover:text-purple-300'
          }`}>{icon}</span>}
          <span className="font-medium">{children}</span>
        </div>
      </div>
    );
  };

  const AuthButton = ({ onClick, children, variant = "primary", icon }) => (
    <button
      onClick={onClick}
      className={`group relative flex items-center space-x-2 px-5 py-2 text-sm rounded-md font-semibold transition-all duration-300 transform hover:scale-105 overflow-hidden ${
        variant === "primary"
          ? "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white hover:shadow-xl"
          : "border border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white"
      }`}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 transform translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
      {icon && <span className="relative z-10">{icon}</span>}
      <span className="relative z-10">{children}</span>
    </button>
  );

  return (
    <>
    <nav className="sticky top-0 z-50 bg-gradient-to-r from-purple-950 via-black to-purple-900 border-b border-purple-700 shadow-md">

        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-3">
            <div 
              className="flex items-center space-x-3 cursor-pointer group"
              onClick={() => navigate('/')}
            >
              <OvercloakLogo className="w-8 h-8 drop-shadow-lg group-hover:scale-110 transition-transform duration-300" />
              <span className="text-xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                Overcloak
              </span>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center space-x-1">
              {user && (
                <>
                  <NavLink to="/chat" icon={<MessageCircle className="w-4 h-4" />}>
                    Secure Chat
                  </NavLink>
                  <NavLink to="/invite" icon={<Link className="w-4 h-4" />}>
                    Connect
                  </NavLink>
                </>
              )}
            </div>

            {/* Right Side Auth */}
            <div className="hidden md:flex items-center space-x-3">
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
                  <div className="bg-purple-900/30 border border-purple-500/20 rounded-md px-3 py-1 flex items-center space-x-2 text-sm">
                    <div className="bg-gradient-to-r from-purple-500 to-blue-500 w-7 h-7 rounded-full flex items-center justify-center text-white font-bold">
                      {user.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <div className="text-purple-300 font-medium">{user.username}</div>
                      <div className="text-xs text-purple-400 font-semibold">
                        Invite Code:
                        <span className="ml-1 px-1 py-0.5 rounded bg-purple-800 text-purple-100">
                          {user.invite_code || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <AuthButton 
                    onClick={handleLogout} 
                    variant="secondary"
                    icon={<LogOut className="w-4 h-4" />}
                  >
                    Logout
                  </AuthButton>
                </>
              )}
            </div>

            {/* Mobile toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-purple-400 hover:text-purple-300 hover:bg-purple-500/20 rounded-lg"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`md:hidden transition-all duration-300 overflow-hidden ${
          isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <div className="bg-black/90 backdrop-blur-xl border-t border-purple-500/20 px-4 py-3 space-y-2 text-sm">
            {user && (
              <>
                <NavLink to="/chat" icon={<MessageCircle className="w-4 h-4" />}>
                  Secure Chat
                </NavLink>
                <NavLink to="/invite" icon={<Link className="w-4 h-4" />}>
                  Connect
                </NavLink>

                {/* Mobile User Info */}
                <div className="mt-3 p-3 rounded-md bg-purple-900/30 border border-purple-500/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                        {user.username?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <div className="text-purple-300 font-medium">{user.username}</div>
                        <div className="text-purple-400 text-xs font-semibold">
                          Invite Code: <span className="bg-purple-800 px-1 py-0.5 rounded text-white">{user.invite_code || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg"
                    >
                      <LogOut className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </>
            )}

            {!user && (
              <div className="space-y-2 pt-3 border-t border-purple-500/20">
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
    </>
  );
}
