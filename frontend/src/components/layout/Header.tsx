import { useAuth } from '../../contexts/AuthContext';
import { useWHM } from '../../contexts/WHMContext';
import { Menu, LogOut, HelpCircle, Home, Settings, User, ChevronDown } from 'lucide-react';
import { useState } from 'react';

export function Header() {
  const { user, logout } = useAuth();
  const { 
    selectedReseller, 
    resellers, 
    setSelectedReseller, 
    selectedDomain, 
    domains, 
    setSelectedDomain,
    isLoadingResellers,
    isLoadingDomains,
    isSwitching
  } = useWHM();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showResellerMenu, setShowResellerMenu] = useState(false);
  const [showDomainMenu, setShowDomainMenu] = useState(false);

  const resellerOptions = resellers.map(r => ({
    value: r.username,
    label: `${r.username} (${r.package}) - ${r.domainCount} domains`
  }));

  const domainOptions = domains.map(d => ({
    value: d.name,
    label: `${d.name} (${d.reseller})`
  }));

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
        {/* Reseller Switcher */}
        <div className="relative hidden md:block">
          <button
            className="top-btn flex items-center gap-1 px-2 py-1.5 bg-slate-100 hover:bg-slate-200 rounded"
            onClick={() => setShowResellerMenu(!showResellerMenu)}
            aria-expanded={showResellerMenu}
            aria-haspopup="true"
            disabled={isLoadingResellers || isSwitching}
          >
            <User className="w-4 h-4" />
            <span className="text-xs font-medium truncate max-w-[180px]">
              {selectedReseller ? `👤 ${selectedReseller}` : '👤 All Resellers'}
            </span>
            <ChevronDown className={`w-3 h-3 transition-transform ${showResellerMenu ? 'rotate-180' : ''}`} />
            {isSwitching && <span className="animate-spin">⟳</span>}
          </button>
          {showResellerMenu && (
            <div className="dropdown w-64">
              <div className="dropdown-item px-3 py-2 text-xs text-slate-500 border-b border-slate-100 flex items-center justify-between">
                Reseller Context
                {selectedReseller && (
                  <button 
                    className="text-red-500 hover:text-red-700 text-xs"
                    onClick={(e) => { e.stopPropagation(); setSelectedReseller(null); setShowResellerMenu(false); }}
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="p-2">
                <input
                  type="text"
                  placeholder="Search resellers..."
                  className="x3-input text-xs mb-2"
                  onChange={(e) => {
                    // Filter logic could be added here
                  }}
                />
                <div className="max-h-48 overflow-y-auto">
                  <button
                    className={`dropdown-item w-full text-left ${!selectedReseller ? 'bg-blue-50' : ''}`}
                    onClick={() => { setSelectedReseller(null); setShowResellerMenu(false); }}
                  >
                    <span className="font-medium">🏠 Root (All Resellers)</span>
                  </button>
                  {resellerOptions.map(opt => (
                    <button
                      key={opt.value}
                      className={`dropdown-item w-full text-left ${selectedReseller === opt.value ? 'bg-blue-50' : ''}`}
                      onClick={() => { setSelectedReseller(opt.value); setShowResellerMenu(false); }}
                    >
                      <span className="font-medium">👤 {opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Domain Switcher */}
        <div className="relative hidden md:block">
          <button
            className="top-btn flex items-center gap-1 px-2 py-1.5 bg-slate-100 hover:bg-slate-200 rounded"
            onClick={() => setShowDomainMenu(!showDomainMenu)}
            aria-expanded={showDomainMenu}
            aria-haspopup="true"
            disabled={!selectedReseller || isLoadingDomains || isSwitching}
          >
            <span className="w-4 h-4" />🌐
            <span className="text-xs font-medium truncate max-w-[180px]">
              {selectedDomain ? selectedDomain : '🌐 All Domains'}
            </span>
            <ChevronDown className={`w-3 h-3 transition-transform ${showDomainMenu ? 'rotate-180' : ''}`} />
            {isSwitching && <span className="animate-spin">⟳</span>}
          </button>
          {showDomainMenu && (
            <div className="dropdown w-64">
              <div className="dropdown-item px-3 py-2 text-xs text-slate-500 border-b border-slate-100 flex items-center justify-between">
                Domain Context
                {selectedDomain && (
                  <button 
                    className="text-red-500 hover:text-red-700 text-xs"
                    onClick={(e) => { e.stopPropagation(); setSelectedDomain(null); setShowDomainMenu(false); }}
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="p-2">
                <div className="max-h-48 overflow-y-auto">
                  <button
                    className={`dropdown-item w-full text-left ${!selectedDomain ? 'bg-blue-50' : ''}`}
                    onClick={() => { setSelectedDomain(null); setShowDomainMenu(false); }}
                  >
                    <span className="font-medium">🏠 All Domains</span>
                  </button>
                  {domainOptions.map(opt => (
                    <button
                      key={opt.value}
                      className={`dropdown-item w-full text-left ${selectedDomain === opt.value ? 'bg-blue-50' : ''}`}
                      onClick={() => { setSelectedDomain(opt.value); setShowDomainMenu(false); }}
                    >
                      <span className="font-medium">🌐 {opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
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