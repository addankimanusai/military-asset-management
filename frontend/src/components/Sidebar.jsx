import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  ShoppingCart,
  ArrowLeftRight,
  ClipboardList,
  FileText,
  Shield,
  Layers,
} from 'lucide-react';

export const Sidebar = () => {
  const { user, isAdmin, isCommander, isLogistics } = useAuth();

  const navItems = [
    {
      label: 'Tactical Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      allowed: true, // Everyone
      badge: null,
    },
    {
      label: 'Purchases (Inflow)',
      path: '/purchases',
      icon: ShoppingCart,
      allowed: true, // Everyone can view; Admin/Logistics/Commander can create
      badge: 'Procurement',
    },
    {
      label: 'Asset Transfers',
      path: '/transfers',
      icon: ArrowLeftRight,
      allowed: true, // Everyone can view; Admin/Logistics/Commander can transfer
      badge: 'Movement',
    },
    {
      label: 'Assignments & Outflow',
      path: '/assignments',
      icon: ClipboardList,
      allowed: isAdmin || isCommander || isLogistics,
      badge: 'Deploy',
    },
    {
      label: 'System Audit Logs',
      path: '/audit-logs',
      icon: FileText,
      allowed: isAdmin || isCommander,
      badge: 'Audit',
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)]">
      {/* Navigation List */}
      <div className="p-4 space-y-6">
        <div>
          <div className="px-3 mb-2 text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
            Command Modules
          </div>
          <nav className="space-y-1">
            {navItems
              .filter((item) => item.allowed)
              .map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                        isActive
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                      }`
                    }
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 transition-transform group-hover:scale-110" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 group-hover:text-slate-300">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
          </nav>
        </div>

        {/* Tactical Scope Notice */}
        <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs">
          <div className="flex items-center gap-2 text-slate-300 font-semibold mb-1">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>RBAC Active Scope</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            {isAdmin && 'Global oversight across all 4 tactical bases. Unrestricted read/write operations.'}
            {isCommander && 'Locked to your assigned base. Cannot mutate or inspect external base inventories.'}
            {isLogistics && 'Supply chain authorization for inventory procurement and cross-base transfers.'}
          </p>
        </div>
      </div>

      {/* Terminal Info Footer */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold text-xs uppercase">
            {user?.username ? user.username.slice(0, 2) : 'OP'}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-slate-200 truncate">
              {user?.fullName || user?.username}
            </p>
            <p className="text-[10px] font-mono text-emerald-400 truncate">
              ROLE: {user?.role || 'UNKNOWN'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
