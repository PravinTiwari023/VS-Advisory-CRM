import React, { useState } from 'react';
import { 
  Building2, 
  RefreshCw, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Plus,
  LogOut,
  ChevronDown,
  ShieldCheck,
  X
} from 'lucide-react';
import { SheetConfig } from '../types';
import { User as FirebaseUser } from 'firebase/auth';
import { logoutUser } from '../services/firebase';

interface NavbarProps {
  config: SheetConfig;
  authUser: FirebaseUser | null;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onRefresh: () => void;
  isLoading: boolean;
  isConnected: boolean;
  onOpenNewLead: () => void;
  onNavigateSettings: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  authUser,
  searchQuery,
  onSearchChange,
  onRefresh,
  isLoading,
  isConnected,
  onOpenNewLead,
  onNavigateSettings
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  const displayName = authUser?.displayName || authUser?.email?.split('@')[0] || 'Advisor';
  const email = authUser?.email || '';
  const photo = authUser?.photoURL;

  return (
    <header className="h-14 sm:h-16 bg-slate-900 border-b border-slate-800 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-md">
      {/* Mobile Search Bar Overlay */}
      {mobileSearchOpen ? (
        <div className="flex-1 flex items-center space-x-2 animate-in fade-in-50">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search leads across all sheets..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-8 py-1.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs"
              >
                ✕
              </button>
            )}
          </div>
          <button
            onClick={() => setMobileSearchOpen(false)}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <>
          {/* Brand & Connection Status */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-sky-400 flex items-center justify-center shadow-lg shadow-brand-500/20 ring-1 ring-white/20 shrink-0">
                <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-bold text-sm sm:text-lg text-white tracking-tight">VS Advisory</span>
                  <span className="text-[9px] uppercase font-bold tracking-widest px-1.5 py-0.2 rounded bg-brand-500/20 text-brand-400 border border-brand-500/30 hidden xs:inline-block">
                    CRM
                  </span>
                </div>
                <p className="text-[10px] sm:text-xs text-slate-400 hidden sm:block">Live Google Sheets Portal</p>
              </div>
            </div>

            {/* Live Status Pill */}
            <button
              onClick={onNavigateSettings}
              className={`flex items-center space-x-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium border transition-colors ${
                isConnected
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
              }`}
              title="Click to manage Google Sheet Connection"
            >
              {isConnected ? (
                <>
                  <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400" />
                  <span className="hidden xs:inline">Connected</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400" />
                  <span className="hidden xs:inline">Setup</span>
                </>
              )}
            </button>
          </div>

          {/* Desktop Center Search */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search leads across all connected sheets..."
                className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-200"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center space-x-1.5 sm:space-x-3">
            {/* Mobile Search Toggle Button */}
            <button
              onClick={() => setMobileSearchOpen(true)}
              className="md:hidden p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white"
              title="Search Leads"
            >
              <Search className="w-3.5 h-3.5" />
            </button>

            {/* Desktop New Lead Button */}
            <button
              onClick={onOpenNewLead}
              className="hidden sm:flex items-center space-x-1.5 bg-brand-600 hover:bg-brand-500 text-white px-3.5 py-2 rounded-xl text-sm font-semibold shadow-md shadow-brand-600/30 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>New Lead</span>
            </button>

            {/* Refresh / Sync Button */}
            <button
              onClick={onRefresh}
              disabled={isLoading}
              title="Refresh & Sync with Google Sheets"
              className="p-1.5 sm:p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700/80 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isLoading ? 'animate-spin text-brand-400' : ''}`} />
            </button>

            {/* Firebase User Profile Menu */}
            <div className="relative pl-1 sm:pl-2 border-l border-slate-800">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-1.5 p-1 rounded-xl hover:bg-slate-800 transition-colors"
              >
                {photo ? (
                  <img src={photo} alt={displayName} className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover ring-1 ring-brand-500" />
                ) : (
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-brand-600/30 border border-brand-500/40 text-brand-300 flex items-center justify-center font-bold text-xs">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="hidden lg:block text-left">
                  <p className="text-xs font-semibold text-slate-200 truncate max-w-[90px]">{displayName}</p>
                </div>
                <ChevronDown className="w-3 h-3 text-slate-400 hidden sm:block" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl p-2 shadow-2xl z-50 animate-in fade-in-50 zoom-in-95">
                  <div className="px-3 py-2 border-b border-slate-800/80">
                    <p className="text-xs font-bold text-slate-100 truncate">{displayName}</p>
                    <p className="text-[11px] text-slate-400 truncate">{email}</p>
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-semibold mt-1">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Firebase Verified</span>
                    </span>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="w-full mt-1.5 flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </header>
  );
};
