import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import StatCard from '../components/StatCard';
import NetMoveModal from '../components/NetMoveModal';
import {
  Boxes,
  ArrowLeftRight,
  UserCheck,
  Flame,
  CheckCircle,
  Filter,
  RefreshCw,
  TrendingUp,
  PieChart as PieIcon,
  BarChart3,
  Layers,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

export const Dashboard = () => {
  const { user, isAdmin, isCommander } = useAuth();

  // Filter state
  const [selectedBase, setSelectedBase] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Data state
  const [metrics, setMetrics] = useState({
    openingBalance: 0,
    purchases: 0,
    transfersIn: 0,
    transfersOut: 0,
    netMovement: 0,
    assigned: 0,
    expended: 0,
    inTransit: 0,
    closingBalance: 0,
    totalSpend: 0,
  });
  const [inventoryList, setInventoryList] = useState([]);
  const [categoryStats, setCategoryStats] = useState([]);
  const [baseComparison, setBaseComparison] = useState([]);
  const [bases, setBases] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  
  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isNetModalOpen, setIsNetModalOpen] = useState(false);

  // Initialize dropdown options
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const [basesRes, equipRes] = await Promise.all([
          api.get('/meta/bases'),
          api.get('/meta/equipment-types'),
        ]);
        setBases(basesRes.data);
        setEquipmentTypes(equipRes.data);

        // If Base Commander, fix selected base to their assigned base
        if (isCommander && user?.baseId) {
          setSelectedBase(String(user.baseId));
        }
      } catch (err) {
        console.error('Failed to load metadata:', err);
      }
    };
    fetchMeta();
  }, [isCommander, user]);

  // Fetch Dashboard Metrics & Tables
  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const params = {};
      if (selectedBase) params.baseId = selectedBase;
      if (selectedCategory) params.category = selectedCategory;
      if (selectedEquipment) params.equipmentTypeId = selectedEquipment;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const [metricsRes, breakdownRes, catStatsRes] = await Promise.all([
        api.get('/assets/metrics', { params }),
        api.get('/assets/breakdown', { params }),
        api.get('/assets/categories', { params }),
      ]);

      setMetrics(metricsRes.data);
      setInventoryList(breakdownRes.data);
      setCategoryStats(catStatsRes.data);

      // Base comparison (Admin only)
      if (isAdmin) {
        const baseCompRes = await api.get('/assets/base-comparison');
        setBaseComparison(baseCompRes.data);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedBase, selectedCategory, selectedEquipment, startDate, endDate]);

  const handleResetFilters = () => {
    if (!isCommander) {
      setSelectedBase('');
    }
    setSelectedCategory('');
    setSelectedEquipment('');
    setStartDate('');
    setEndDate('');
  };

  // Recharts color palette
  const CATEGORY_COLORS = {
    WEAPON: '#3b82f6',
    VEHICLE: '#10b981',
    AMMUNITION: '#f59e0b',
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Tactical Overview */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-100 tracking-wide font-mono">
              COMMAND THEATER ASSET DASHBOARD
            </h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              REAL-TIME
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Reconciling inventory balances across active military commands:
            <span className="font-mono text-emerald-400 font-semibold ml-1">
              Closing = Opening + Net Movement - Assigned - Expended
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardData}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Sync Balances</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-md">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 pr-2 border-r border-slate-800">
            <Filter className="w-3.5 h-3.5 text-emerald-400" />
            <span>FILTERS:</span>
          </div>

          {/* Base Filter */}
          <div className="min-w-[180px]">
            <select
              value={selectedBase}
              onChange={(e) => setSelectedBase(e.target.value)}
              disabled={isCommander}
              className={`w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500 ${
                isCommander ? 'opacity-70 cursor-not-allowed bg-slate-900' : ''
              }`}
            >
              {!isCommander && <option value="">Global Command (All Bases)</option>}
              {bases.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="min-w-[140px]">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="">All Categories</option>
              <option value="WEAPON">Weapons</option>
              <option value="VEHICLE">Vehicles</option>
              <option value="AMMUNITION">Ammunition</option>
            </select>
          </div>

          {/* Equipment Type Filter */}
          <div className="min-w-[180px]">
            <select
              value={selectedEquipment}
              onChange={(e) => setSelectedEquipment(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="">All Equipment Types</option>
              {equipmentTypes.map((eq) => (
                <option key={eq.id} value={eq.id}>
                  {eq.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
              placeholder="Start Date"
            />
            <span className="text-slate-600 font-mono text-xs">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
              placeholder="End Date"
            />
          </div>

          {/* Reset Filters */}
          <button
            onClick={handleResetFilters}
            className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-lg transition font-mono"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Mathematical Inventory Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* 1. Opening Balance */}
        <StatCard
          title="Opening Balance"
          value={metrics.openingBalance}
          subtitle="Baseline inventory stock"
          icon={Boxes}
          variant="blue"
          badge="Baseline"
        />

        {/* 2. Net Movement (CLICKABLE -> Opens NetMoveModal) */}
        <StatCard
          title="Net Movement"
          value={metrics.netMovement >= 0 ? `+${metrics.netMovement}` : metrics.netMovement}
          subtitle={`Purchases (${metrics.purchases}) + Tr. In (${metrics.transfersIn}) - Tr. Out (${metrics.transfersOut})`}
          icon={ArrowLeftRight}
          variant="emerald"
          badge="Formula"
          isClickable={true}
          onClick={() => setIsNetModalOpen(true)}
          hint="Click for detailed breakdown"
        />

        {/* 3. Assigned Equipment */}
        <StatCard
          title="Assigned to Units"
          value={metrics.assigned}
          subtitle="Active field deployments"
          icon={UserCheck}
          variant="purple"
          badge="Active"
        />

        {/* 4. Expended Stock */}
        <StatCard
          title="Expended Stock"
          value={metrics.expended}
          subtitle="Munitions spent / losses"
          icon={Flame}
          variant="amber"
          badge="Consumed"
        />

        {/* 5. Closing Balance */}
        <StatCard
          title="Closing Balance"
          value={metrics.closingBalance}
          subtitle="Available reconciled assets"
          icon={CheckCircle}
          variant="cyan"
          badge="Reconciled"
        />
      </div>

      {/* Visual Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Distribution Donut Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-slate-100 font-mono">
                CATEGORY DISTRIBUTION
              </h2>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
              Live Stock
            </span>
          </div>

          <div className="h-64 w-full">
            {categoryStats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryStats}
                    dataKey="total_stock"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                  >
                    {categoryStats.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CATEGORY_COLORS[entry.category] || '#64748b'}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      color: '#f8fafc',
                      fontSize: '12px',
                      fontFamily: 'monospace',
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500 font-mono">
                No inventory data available
              </div>
            )}
          </div>
        </div>

        {/* Base Comparison Bar Chart (Admin & Global View) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-slate-100 font-mono">
                BASE INVENTORY & MOVEMENTS COMPARISON
              </h2>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              Cross-Base Comparison
            </span>
          </div>

          <div className="h-64 w-full">
            {baseComparison.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={baseComparison} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="base_code" stroke="#64748b" fontSize={11} fontFamily="monospace" />
                  <YAxis stroke="#64748b" fontSize={11} fontFamily="monospace" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      color: '#f8fafc',
                      fontSize: '12px',
                      fontFamily: 'monospace',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                  <Bar dataKey="opening_balance" name="Opening" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="closing_balance" name="Closing" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="net_movement" name="Net Move" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expended" name="Expended" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-xs text-slate-500 font-mono space-y-2">
                <Layers className="w-8 h-8 text-slate-700" />
                <span>Base comparison active for HQ Admin theater view</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Itemized Inventory Matrix Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-850">
          <div className="flex items-center gap-3">
            <Layers className="w-4 h-4 text-emerald-400" />
            <div>
              <h2 className="text-sm font-bold text-slate-100 font-mono">
                END-TO-END ASSET VISIBILITY MATRIX
              </h2>
              <p className="text-[11px] text-slate-400 font-mono">
                Itemized Reconciliation Table by Equipment Type
              </p>
            </div>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {inventoryList.length} items logged
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-5 py-3 font-semibold">EQUIPMENT TYPE</th>
                <th className="px-4 py-3 font-semibold">CATEGORY</th>
                <th className="px-4 py-3 text-right font-semibold">OPENING</th>
                <th className="px-4 py-3 text-right font-semibold text-cyan-400">PURCHASES (+)</th>
                <th className="px-4 py-3 text-right font-semibold text-emerald-400">TR. IN (+)</th>
                <th className="px-4 py-3 text-right font-semibold text-rose-400">TR. OUT (-)</th>
                <th className="px-4 py-3 text-right font-semibold text-emerald-300">NET MOVE</th>
                <th className="px-4 py-3 text-right font-semibold text-purple-400">ASSIGNED (-)</th>
                <th className="px-4 py-3 text-right font-semibold text-amber-400">EXPENDED (-)</th>
                <th className="px-5 py-3 text-right font-semibold text-cyan-300">CLOSING</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {inventoryList.length > 0 ? (
                inventoryList.map((item) => {
                  const netMove = parseInt(item.net_movement, 10);
                  return (
                    <tr key={item.equipment_type_id} className="hover:bg-slate-800/40 transition">
                      <td className="px-5 py-3.5 font-medium text-slate-100 font-sans">
                        <div className="font-semibold">{item.equipment_name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{item.unit_of_measure}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.category === 'WEAPON'
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              : item.category === 'VEHICLE'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {item.category}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right font-semibold text-slate-300">
                        {parseInt(item.opening_balance, 10).toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5 text-right text-cyan-400">
                        +{parseInt(item.purchases, 10).toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5 text-right text-emerald-400">
                        +{parseInt(item.transfers_in, 10).toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5 text-right text-rose-400">
                        -{parseInt(item.transfers_out, 10).toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold">
                        <span className={netMove >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          {netMove >= 0 ? `+${netMove}` : netMove}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right text-purple-400">
                        -{parseInt(item.assigned, 10).toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5 text-right text-amber-400">
                        -{parseInt(item.expended, 10).toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 text-right font-extrabold text-cyan-400 text-sm">
                        {parseInt(item.closing_balance, 10).toLocaleString()}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="10" className="px-6 py-8 text-center text-slate-500 font-mono">
                    No matching equipment inventory records found for current filter selection.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Net Movement Breakdown Modal */}
      <NetMoveModal
        isOpen={isNetModalOpen}
        onClose={() => setIsNetModalOpen(false)}
        metrics={metrics}
      />
    </div>
  );
};

export default Dashboard;
