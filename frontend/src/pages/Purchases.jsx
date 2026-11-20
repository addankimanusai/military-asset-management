import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  ShoppingCart,
  Plus,
  Search,
  Filter,
  DollarSign,
  Package,
  Calendar,
  CheckCircle2,
  AlertCircle,
  X,
  FileSpreadsheet,
} from 'lucide-react';

export const Purchases = () => {
  const { user, isAdmin, isCommander, canManagePurchases } = useAuth();

  const [purchases, setPurchases] = useState([]);
  const [bases, setBases] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedBase, setSelectedBase] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Form Fields
  const [formData, setFormData] = useState({
    baseId: '',
    equipmentTypeId: '',
    quantity: '',
    unitCost: '',
    supplier: '',
    purchaseOrderNumber: '',
    purchaseDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [basesRes, equipRes] = await Promise.all([
          api.get('/meta/bases'),
          api.get('/meta/equipment-types'),
        ]);
        setBases(basesRes.data);
        setEquipmentTypes(equipRes.data);

        // Pre-fill base for Commander
        if (isCommander && user?.baseId) {
          setSelectedBase(String(user.baseId));
          setFormData((prev) => ({ ...prev, baseId: String(user.baseId) }));
        } else if (basesRes.data.length > 0) {
          setFormData((prev) => ({ ...prev, baseId: String(basesRes.data[0].id) }));
        }

        if (equipRes.data.length > 0) {
          setFormData((prev) => ({ ...prev, equipmentTypeId: String(equipRes.data[0].id) }));
        }
      } catch (err) {
        console.error('Failed to fetch metadata:', err);
      }
    };
    fetchMetadata();
  }, [isCommander, user]);

  const fetchPurchases = async () => {
    setIsLoading(true);
    try {
      const params = {};
      if (selectedBase) params.baseId = selectedBase;
      if (selectedEquipment) params.equipmentTypeId = selectedEquipment;
      if (search) params.search = search;

      const res = await api.get('/purchases', { params });
      setPurchases(res.data);
    } catch (err) {
      console.error('Failed to fetch purchases:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, [selectedBase, selectedEquipment, search]);

  const handleOpenModal = () => {
    setFormError('');
    setFormSuccess('');
    setFormData((prev) => ({
      ...prev,
      purchaseOrderNumber: `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      quantity: '',
      unitCost: '',
      supplier: '',
      purchaseDate: new Date().toISOString().split('T')[0],
    }));
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError('');
    setFormSuccess('');

    try {
      await api.post('/purchases', {
        baseId: parseInt(formData.baseId, 10),
        equipmentTypeId: parseInt(formData.equipmentTypeId, 10),
        quantity: parseInt(formData.quantity, 10),
        unitCost: parseFloat(formData.unitCost || 0),
        supplier: formData.supplier,
        purchaseOrderNumber: formData.purchaseOrderNumber,
        purchaseDate: formData.purchaseDate,
      });

      setFormSuccess('Purchase order logged and inventory replenished successfully!');
      fetchPurchases();
      setTimeout(() => {
        setIsModalOpen(false);
      }, 1200);
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to submit purchase order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalProcurementSpend = purchases.reduce((acc, p) => acc + parseFloat(p.total_cost || 0), 0);
  const totalUnitsPurchased = purchases.reduce((acc, p) => acc + parseInt(p.quantity || 0, 10), 0);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-100 font-mono">
                PROCUREMENT & ASSET INFLOW
              </h1>
              <p className="text-xs text-slate-400">
                Log ordnance, weaponry, and vehicle purchases into base armory inventory
              </p>
            </div>
          </div>
        </div>

        {canManagePurchases && (
          <button
            onClick={handleOpenModal}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-xl text-xs transition shadow-lg shadow-cyan-600/20 font-mono"
          >
            <Plus className="w-4 h-4" />
            <span>LOG NEW PURCHASE</span>
          </button>
        )}
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-400 uppercase font-mono font-semibold">Total Purchase Orders</p>
          <p className="text-2xl font-bold font-mono text-slate-100 mt-1">{purchases.length}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-400 uppercase font-mono font-semibold">Total Inflow Units</p>
          <p className="text-2xl font-bold font-mono text-cyan-400 mt-1">+{totalUnitsPurchased.toLocaleString()}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-400 uppercase font-mono font-semibold">Total Procurement Value</p>
          <p className="text-2xl font-bold font-mono text-emerald-400 mt-1">
            ${totalProcurementSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-[240px]">
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by PO #, Supplier, or Item..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="min-w-[160px]">
            <select
              value={selectedBase}
              onChange={(e) => setSelectedBase(e.target.value)}
              disabled={isCommander}
              className={`w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500 ${
                isCommander ? 'opacity-70 cursor-not-allowed bg-slate-900' : ''
              }`}
            >
              {!isCommander && <option value="">All Bases</option>}
              {bases.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-[160px]">
            <select
              value={selectedEquipment}
              onChange={(e) => setSelectedEquipment(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="">All Equipment</option>
              {equipmentTypes.map((eq) => (
                <option key={eq.id} value={eq.id}>
                  {eq.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={() => {
            setSearch('');
            if (!isCommander) setSelectedBase('');
            setSelectedEquipment('');
          }}
          className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-800 rounded-lg border border-slate-700 font-mono"
        >
          Reset Filters
        </button>
      </div>

      {/* Historical Purchases Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-850">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-slate-100 font-mono">
              PROCUREMENT AUDIT LOG ARCHIVE
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">{purchases.length} Records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-5 py-3 font-semibold">PO NUMBER</th>
                <th className="px-4 py-3 font-semibold">DATE</th>
                <th className="px-4 py-3 font-semibold">DESTINATION BASE</th>
                <th className="px-5 py-3 font-semibold">EQUIPMENT TYPE</th>
                <th className="px-4 py-3 text-right font-semibold">QTY</th>
                <th className="px-4 py-3 text-right font-semibold">UNIT COST</th>
                <th className="px-4 py-3 text-right font-semibold">TOTAL SPEND</th>
                <th className="px-4 py-3 font-semibold">SUPPLIER</th>
                <th className="px-4 py-3 font-semibold">LOGGED BY</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {purchases.length > 0 ? (
                purchases.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-850/60 transition">
                    <td className="px-5 py-3.5 font-bold text-cyan-400">{p.purchase_order_number}</td>
                    <td className="px-4 py-3.5 text-slate-400">{new Date(p.purchase_date).toLocaleDateString()}</td>
                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">
                        {p.base_name} ({p.base_code})
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-sans font-medium text-slate-100">
                      <div>{p.equipment_name}</div>
                      <span className="text-[10px] font-mono text-slate-500 uppercase">{p.equipment_category}</span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold text-cyan-300">
                      +{parseInt(p.quantity, 10).toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 text-right text-slate-400">
                      ${parseFloat(p.unit_cost).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold text-emerald-400">
                      ${parseFloat(p.total_cost).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3.5 text-slate-300 font-sans">{p.supplier}</td>
                    <td className="px-4 py-3.5 text-slate-400">
                      {p.created_by_name || p.created_by_username || 'System'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="px-6 py-8 text-center text-slate-500 font-mono">
                    No purchase inflow records matching current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form to Log Incoming Purchase */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-850">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-slate-100 font-mono">
                  LOG INCOMING PROCUREMENT
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}
              {formSuccess && (
                <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{formSuccess}</span>
                </div>
              )}

              {/* Destination Base */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 font-mono">
                  Destination Base
                </label>
                <select
                  required
                  value={formData.baseId}
                  onChange={(e) => setFormData({ ...formData, baseId: e.target.value })}
                  disabled={isCommander}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
                >
                  {bases.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code}) - {b.location}
                    </option>
                  ))}
                </select>
              </div>

              {/* Equipment Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 font-mono">
                  Equipment Type
                </label>
                <select
                  required
                  value={formData.equipmentTypeId}
                  onChange={(e) => setFormData({ ...formData, equipmentTypeId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
                >
                  {equipmentTypes.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      [{eq.category}] {eq.name} ({eq.unit_of_measure})
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity & Unit Cost */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 font-mono">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="e.g. 50"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 font-mono">
                    Unit Cost ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="e.g. 1200.00"
                    value={formData.unitCost}
                    onChange={(e) => setFormData({ ...formData, unitCost: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Supplier & PO Number */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 font-mono">
                    Supplier / Contractor
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. General Dynamics"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 font-mono">
                    PO Reference #
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.purchaseOrderNumber}
                    onChange={(e) => setFormData({ ...formData, purchaseOrderNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Purchase Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 font-mono">
                  Delivery / Procurement Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.purchaseDate}
                  onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-mono transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-xl text-xs font-mono transition shadow-lg shadow-cyan-600/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'Recording Inflow...' : 'Commit Inflow Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Purchases;
