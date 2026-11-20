import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, User, KeyRound, AlertTriangle, ArrowRight, ShieldCheck, Truck, Crosshair } from 'lucide-react';

export const Login = () => {
  const [username, setUsername] = useState('admin_user');
  const [password, setPassword] = useState('AdminPass123!');
  const [errorMessage, setErrorMessage] = useState('');
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    const result = await login(username, password);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setErrorMessage(result.error);
    }
  };

  const setCredentials = (user, pass) => {
    setUsername(user);
    setPassword(pass);
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background Tactical Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293710_1px,transparent_1px),linear-gradient(to_bottom,#1f293710_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Crest & Title Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-4 shadow-xl shadow-emerald-500/10">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black tracking-widest uppercase text-slate-100 font-mono">
            KRISTALLBALL
          </h1>
          <p className="text-xs uppercase tracking-widest text-emerald-400 font-mono mt-1">
            MILITARY ASSET MANAGEMENT PORTAL
          </p>
          <p className="text-xs text-slate-400 mt-2">
            Defense Logistics & Operational Inventory System
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {errorMessage && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 flex items-center gap-3 text-xs text-rose-300">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
                Operator Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition font-mono"
                  placeholder="Enter operator code / username"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
                Security Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition font-mono"
                  placeholder="Enter password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-slate-950 font-bold rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 disabled:opacity-50"
            >
              {isLoading ? (
                <span>Authenticating Credentials...</span>
              ) : (
                <>
                  <span>Authenticate Session</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Credential Switcher for Demo / Testing */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-3 text-center">
              Quick Test Credentials (1-Click Fill)
            </p>

            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => setCredentials('admin_user', 'AdminPass123!')}
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 hover:bg-purple-950/30 border border-slate-800 hover:border-purple-600/50 text-left transition group"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-purple-400" />
                  <div>
                    <div className="text-xs font-bold text-slate-200 group-hover:text-purple-300">
                      General Arthur (Admin)
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">admin_user | Global HQ</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  ALL BASES
                </span>
              </button>

              <button
                type="button"
                onClick={() => setCredentials('commander_alpha', 'CommandPass123!')}
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 hover:bg-emerald-950/30 border border-slate-800 hover:border-emerald-600/50 text-left transition group"
              >
                <div className="flex items-center gap-2.5">
                  <Crosshair className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div className="text-xs font-bold text-slate-200 group-hover:text-emerald-300">
                      Col. Vance (Base Commander)
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">commander_alpha | Fort Alpha</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  BASE #1
                </span>
              </button>

              <button
                type="button"
                onClick={() => setCredentials('logistics_officer', 'LogisticsPass123!')}
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 hover:bg-cyan-950/30 border border-slate-800 hover:border-cyan-600/50 text-left transition group"
              >
                <div className="flex items-center gap-2.5">
                  <Truck className="w-4 h-4 text-cyan-400" />
                  <div>
                    <div className="text-xs font-bold text-slate-200 group-hover:text-cyan-300">
                      Maj. Elena (Logistics Officer)
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">logistics_officer | Supply Ops</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  MOVEMENTS
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <p className="text-center text-[11px] text-slate-600 mt-6 font-mono">
          SECURE PROTOCOL SHA-256 • STRICT ROLE-BASED ACCESS CONTROL
        </p>
      </div>
    </div>
  );
};

export default Login;
