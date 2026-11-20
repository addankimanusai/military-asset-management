import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  FileText,
  Shield,
  Search,
  Filter,
  RefreshCw,
  Clock,
  Terminal,
  Download,
} from 'lucide-react';

export const AuditLogs = () => {
  const { user, isAdmin } = useAuth();
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [actionFilter, setActionFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchAuditLogs = async () => {
    setIsLoading(true);
    try {
      const params = {};
      if (actionFilter) params.action = actionFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      params.limit = 200;

      const res = await api.get('/audit-logs', { params });
      setLogs(res.data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [actionFilter, startDate, endDate]);

  const filteredLogs = logs.filter((log) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      log.details?.toLowerCase().includes(term) ||
      log.username?.toLowerCase().includes(term) ||
      log.full_name?.toLowerCase().includes(term) ||
      log.action?.toLowerCase().includes(term)
    );
  });

  const getActionBadge = (action) => {
    switch (action) {
      case 'PURCHASE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">PURCHASE</span>;
      case 'TRANSFER':
      case 'TRANSFER_STATUS_UPDATE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">{action}</span>;
      case 'ASSIGNMENT':
      case 'ASSIGNMENT_RETURNED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 font-mono">{action}</span>;
      case 'EXPENDITURE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">EXPENDITURE</span>;
      case 'LOGIN':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">AUTH_LOGIN</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 font-mono">{action}</span>;
    }
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `military_audit_logs_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100 font-mono">
              CENTRAL SECURITY & TRANSACTION AUDIT TRAIL
            </h1>
            <p className="text-xs text-slate-400">
              Immutable ledger logging all mutations, transfers, procurement orders, and access events
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchAuditLogs}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-mono transition border border-slate-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleExportJson}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs font-mono transition shadow-lg shadow-emerald-600/20"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-[240px]">
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by keyword, officer, or details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="min-w-[160px]">
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="">All Audit Actions</option>
              <option value="PURCHASE">Purchases</option>
              <option value="TRANSFER">Transfers</option>
              <option value="ASSIGNMENT">Assignments</option>
              <option value="EXPENDITURE">Expenditures</option>
              <option value="LOGIN">Logins</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
            />
            <span className="text-slate-600 font-mono text-xs">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <button
          onClick={() => {
            setSearchTerm('');
            setActionFilter('');
            setStartDate('');
            setEndDate('');
          }}
          className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-800 rounded-lg border border-slate-700 font-mono"
        >
          Reset
        </button>
      </div>

      {/* Audit Log Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-850">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-slate-100 font-mono">
              CENTRAL AUDIT LOG CHRONOLOGY
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">{filteredLogs.length} Events Retained</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-5 py-3 font-semibold">EVENT ID</th>
                <th className="px-4 py-3 font-semibold">TIMESTAMP</th>
                <th className="px-4 py-3 font-semibold">ACTION TYPE</th>
                <th className="px-4 py-3 font-semibold">OPERATOR</th>
                <th className="px-4 py-3 font-semibold">ROLE</th>
                <th className="px-6 py-3 font-semibold">MUTATION / AUDIT DETAILS</th>
                <th className="px-4 py-3 font-semibold">ORIGIN IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-850/60 transition">
                    <td className="px-5 py-3.5 text-slate-500 font-bold">#{log.id}</td>
                    <td className="px-4 py-3.5 text-slate-400">
                      <div>{new Date(log.created_at).toLocaleDateString()}</div>
                      <div className="text-[10px] text-slate-500">
                        {new Date(log.created_at).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">{getActionBadge(log.action)}</td>
                    <td className="px-4 py-3.5 font-sans font-semibold text-slate-200">
                      {log.full_name || log.username || 'System Engine'}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-[10px] text-slate-400 font-mono">{log.role || 'CORE_SVC'}</span>
                    </td>
                    <td className="px-6 py-3.5 text-slate-300 font-sans max-w-md break-words">
                      {log.details}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 font-mono">{log.ip_address}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-slate-500 font-mono">
                    No matching audit records in specified timeframe.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;
