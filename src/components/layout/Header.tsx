import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Mic, BookOpen, Menu, X, Speech } from 'lucide-react';

export default function Header() {
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (location.pathname.split('/').length > 2 && location.pathname.includes('/dialogues')) {
    return null;
  }

  const navLinkClass = ({ isActive }) => `
    flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-white/20
    ${isActive 
      ? 'text-white bg-white/20 shadow-sm' 
      : 'text-white/90 hover:text-white hover:bg-white/10'
    }
  `;

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300
        ${isScrolled 
          ? 'bg-gradient-to-r from-indigo-700 via-indigo-800 to-purple-800 shadow-lg' 
          : 'bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700'
        }`}
      role="banner"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title Area */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="bg-white/10 rounded-full p-1.5">
                <Speech className="h-6 w-6 text-white" aria-hidden="true" />
                <div className="absolute -bottom-1 -right-1 bg-indigo-400 rounded-full p-1">
                  <Mic className="h-3 w-3 text-white" aria-hidden="true" />
                </div>
              </div>
            </div>
            
            <div className="flex flex-col">
              <div className="flex items-center relative">
                <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center">
                  Speak
                  <span className="inline-flex ml-1">
                    <span className="bg-yellow-400 text-indigo-900 text-xs px-1.5 py-0.5 rounded-full font-semibold transform -rotate-12 shadow-sm">
                      BETA
                    </span>
                  </span>
                </h1>
              </div>
              <div className="flex items-center -mt-0.5">
                <span className="text-sm font-bold bg-gradient-to-r from-indigo-100 to-purple-200 text-transparent bg-clip-text">
                  CODE<span className="font-black">BLACK</span>
                </span>
                <div className="h-3 w-px bg-indigo-400/30 mx-2"></div>
                <span className="text-xs text-indigo-100/70">Medical English</span>
              </div>
            </div>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden sm:block" aria-label="Main navigation">
            <ul className="flex items-center space-x-2">
              <li>
                <NavLink 
                  to="/" 
                  className={navLinkClass} 
                  end
                  aria-label="Practice section"
                >
                  <Mic className="w-4 h-4" aria-hidden="true" />
                  <span>Practice</span>
                </NavLink>
              </li>
              <li>
                <NavLink 
                  to="/dialogues" 
                  className={navLinkClass}
                  aria-label="Dialogues section"
                >
                  <BookOpen className="w-4 h-4" aria-hidden="true" />
                  <span>Dialogues</span>
                </NavLink>
              </li>
            </ul>
          </nav>
          
          {/* Mobile Menu Button */}
          <div className="block sm:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-lg text-white/90 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-expanded={isMobileMenuOpen}
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" aria-hidden="true" />
              ) : (
                <Menu className="w-5 h-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu - Direct Navigation */}
      {isMobileMenuOpen && (
        <div className="sm:hidden bg-gradient-to-r from-indigo-700 via-indigo-800 to-purple-800 border-t border-white/10">
          <nav className="px-4 py-2 space-y-1" aria-label="Mobile navigation">
            <NavLink
              to="/"
              className={navLinkClass}
              end
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Mic className="w-4 h-4" aria-hidden="true" />
              <span>Practice</span>
            </NavLink>
            <NavLink
              to="/dialogues"
              className={navLinkClass}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <BookOpen className="w-4 h-4" aria-hidden="true" />
              <span>Dialogues</span>
            </NavLink>
          </nav>
        </div>
      )}
    </header>
  );
}