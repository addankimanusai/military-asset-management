import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, ShieldCheck, LogOut, Radio, User, MapPin } from 'lucide-react';

export const Navbar = () => {
  const { user, logout, isAdmin, isCommander, isLogistics } = useAuth();

  const getRoleBadge = () => {
    if (isAdmin) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-950/80 text-purple-300 border border-purple-700/50">
          <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
          HQ ADMIN
        </span>
      );
    }
    if (isCommander) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-700/50">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          BASE COMMANDER
        </span>
      );
    }
    if (isLogistics) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-950/80 text-cyan-300 border border-cyan-700/50">
          <Radio className="w-3.5 h-3.5 text-cyan-400" />
          LOGISTICS OFFICER
        </span>
      );
    }
    return null;
  };

  return (
    <header className="h-16 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Brand & System Status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-wider text-slate-100 uppercase">
                Kristallball
              </span>
              <span className="text-[10px] uppercase font-mono tracking-widest px-1.5 py-0.2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded">
                MIL-SPEC v1.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono tracking-tight">
              TACTICAL ASSET MANAGEMENT & RECONCILIATION
            </p>
          </div>
        </div>

        {/* Live Channel Status */}
        <div className="hidden lg:flex items-center gap-2 pl-4 border-l border-slate-800 text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 radar-live"></span>
          <span className="font-mono text-emerald-400">SECURE LINK ONLINE</span>
          <span className="text-slate-600">|</span>
          <span className="font-mono text-slate-400">ACID VERIFIED</span>
        </div>
      </div>

      {/* User Information & Role Scoping */}
      <div className="flex items-center gap-4">
        {/* Active Base Badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-800/80 border border-slate-700/60 text-xs">
          <MapPin className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400 font-medium">Assigned Base:</span>
          <span className="text-slate-200 font-semibold font-mono">
            {isAdmin
              ? 'GLOBAL THEATER (ALL BASES)'
              : user?.baseName
              ? `${user.baseName} (${user.baseCode || 'B-0' + user.baseId})`
              : `BASE #${user?.baseId || 'HQ'}`}
          </span>
        </div>

        {/* User Badge */}
        <div className="flex items-center gap-3 pl-2">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-semibold text-slate-200 leading-tight">
              {user?.fullName || user?.username}
            </div>
            <div className="mt-0.5">{getRoleBadge()}</div>
          </div>

          <button
            onClick={logout}
            title="Log Out of Tactical Session"
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-rose-300 bg-slate-800 hover:bg-rose-950/40 border border-slate-700 hover:border-rose-700/50 rounded-md transition-all shadow-sm"
          >
            <LogOut className="w-3.5 h-3.5 text-slate-400 hover:text-rose-400" />
            <span className="hidden md:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
