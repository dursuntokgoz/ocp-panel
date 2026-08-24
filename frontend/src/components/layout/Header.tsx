import { useAuth } from '../../contexts/AuthContext';
import { Menu, LogOut, HelpCircle, Home, Settings, User } from 'lucide-react';
import { useState } from 'react';

export function Header() {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="top-nav-bar">
      <div className="top-nav-left flex items-center gap-2">
        <button
          className="top-btn lg:hidden"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        <a href="#" className="top-btn hidden sm:flex" onClick={(e) => { e.preventDefault(); }}>
          <Home className="w-4 h-4" />
          <span>HOME</span>
        </a>
        <a href="#" className="top-btn hidden sm:flex" onClick={(e) => { e.preventDefault(); }}>
          <HelpCircle className="w-4 h-4" />
          <span>HELP</span>
        </a>
      </div>
      <div className="top-nav-right flex items-center gap-2 relative">
        <div className="relative">
          <button
            className="top-btn flex items-center gap-2"
            onClick={() => setShowUserMenu(!showUserMenu)}
            aria-expanded={showUserMenu}
            aria-haspopup="true"
          >
            <User className="w-4 h-4" />
            <span className="hidden sm:block">{user?.name || user?.username}</span>
          </button>
          {showUserMenu && (
            <div className="dropdown">
              <div className="dropdown-item px-3 py-2 text-xs text-slate-500 border-b border-slate-100">
                {user?.username} ({user?.role})
              </div>
              <a href="#" className="dropdown-item flex items-center gap-2" onClick={(e) => { e.preventDefault(); }}>
                <Settings className="w-4 h-4" />
                Settings
              </a>
              <button
                className="dropdown-item flex items-center gap-2 w-full text-left text-red-600 hover:bg-red-50"
                onClick={logout}
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}