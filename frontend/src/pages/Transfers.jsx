import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  ArrowLeftRight,
  Plus,
  Truck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  X,
  FileText,
  Shield,
  ArrowRight,
  Filter,
} from 'lucide-react';

export const Transfers = () => {
  const { user, isAdmin, isCommander, canManageTransfers } = useAuth();

  const [transfers, setTransfers] = useState([]);
  const [bases, setBases] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [equipFilter, setEquipFilter] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Form Fields
  const [formData, setFormData] = useState({
    sourceBaseId: '',
    destinationBaseId: '',
    equipmentTypeId: '',
    quantity: '',
    status: 'COMPLETED',
    notes: '',
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

        // Pre-configure bases
        if (basesRes.data.length >= 2) {
          const defaultSrc = isCommander && user?.baseId ? String(user.baseId) : String(basesRes.data[0].id);
          const defaultDst = basesRes.data.find((b) => String(b.id) !== defaultSrc)?.id || basesRes.data[1].id;

          setFormData((prev) => ({
            ...prev,
            sourceBaseId: String(defaultSrc),
            destinationBaseId: String(defaultDst),
            equipmentTypeId: equipRes.data[0]?.id ? String(equipRes.data[0].id) : '',
          }));
        }
      } catch (err) {
        console.error('Failed to load metadata:', err);
      }
    };
    fetchMetadata();
  }, [isCommander, user]);

  const fetchTransfers = async () => {
    setIsLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (equipFilter) params.equipmentTypeId = equipFilter;

      const res = await api.get('/transfers', { params });
      setTransfers(res.data);
    } catch (err) {
      console.error('Failed to fetch transfers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, [statusFilter, equipFilter]);

  const handleOpenModal = () => {
    setFormError('');
    setFormSuccess('');
    setFormData((prev) => ({
      ...prev,
      quantity: '',
      notes: '',
      status: 'COMPLETED',
    }));
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError('');
    setFormSuccess('');

    if (formData.sourceBaseId === formData.destinationBaseId) {
      setFormError('Source base and destination base cannot be identical.');
      setIsSubmitting(false);
      return;
    }

    try {
      await api.post('/transfers', {
        sourceBaseId: parseInt(formData.sourceBaseId, 10),
        destinationBaseId: parseInt(formData.destinationBaseId, 10),
        equipmentTypeId: parseInt(formData.equipmentTypeId, 10),
        quantity: parseInt(formData.quantity, 10),
        status: formData.status,
        notes: formData.notes,
      });

      setFormSuccess('Atomic cross-base transfer recorded and reconciled successfully!');
      fetchTransfers();
      setTimeout(() => {
        setIsModalOpen(false);
      }, 1200);
    } catch (err) {
      setFormError(err.response?.data?.error || 'Transfer failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusUpdate = async (transferId, newStatus) => {
    try {
      await api.patch(`/transfers/${transferId}/status`, { status: newStatus });
      fetchTransfers();
    } catch (err) {
      alert('Failed to update status: ' + (err.response?.data?.error || err.message));
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono">
            <CheckCircle2 className="w-3 h-3" />
            COMPLETED
          </span>
        );
      case 'IN_TRANSIT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 font-mono">
            <Truck className="w-3 h-3" />
            IN TRANSIT
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30 font-mono">
            <Clock className="w-3 h-3" />
            PENDING
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30 font-mono">
            CANCELLED
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-100 font-mono">
                CROSS-BASE ASSET MOVEMENTS & TRANSFERS
              </h1>
              <p className="text-xs text-slate-400">
                Atomic database transactions ensuring physical stock integrity across military commands
              </p>
            </div>
          </div>
        </div>

        {canManageTransfers && (
          <button
            onClick={handleOpenModal}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs transition shadow-lg shadow-emerald-600/20 font-mono"
          >
            <Plus className="w-4 h-4" />
            <span>DISPATCH NEW TRANSFER</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <Filter className="w-3.5 h-3.5 text-emerald-400" />
            <span>STATUS:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Statuses</option>
            <option value="COMPLETED">Completed</option>
            <option value="IN_TRANSIT">In Transit</option>
            <option value="PENDING">Pending</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <select
            value={equipFilter}
            onChange={(e) => setEquipFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Equipment</option>
            {equipmentTypes.map((eq) => (
              <option key={eq.id} value={eq.id}>
                {eq.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => {
            setStatusFilter('');
            setEquipFilter('');
          }}
          className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-800 rounded-lg border border-slate-700 font-mono"
        >
          Reset Filters
        </button>
      </div>

      {/* Historical Movement Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-850">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-slate-100 font-mono">
              TACTICAL MOVEMENT AUDIT TRAIL
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">{transfers.length} Movements Logged</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-5 py-3 font-semibold">TRANSFER ID</th>
                <th className="px-4 py-3 font-semibold">ORIGIN (SOURCE)</th>
                <th className="px-4 py-3 font-semibold">DESTINATION</th>
                <th className="px-5 py-3 font-semibold">EQUIPMENT TYPE</th>
                <th className="px-4 py-3 text-right font-semibold">QTY</th>
                <th className="px-4 py-3 font-semibold">STATUS</th>
                <th className="px-4 py-3 font-semibold">OPERATIONAL NOTES</th>
                <th className="px-4 py-3 font-semibold">INITIATED</th>
                <th className="px-4 py-3 text-right font-semibold">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {transfers.length > 0 ? (
                transfers.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-850/60 transition">
                    <td className="px-5 py-3.5 font-bold text-slate-200">#{t.id}</td>
                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded bg-rose-950/40 text-rose-300 border border-rose-800/40">
                        {t.source_base_name} ({t.source_base_code})
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-300 border border-emerald-800/40">
                        {t.destination_base_name} ({t.destination_base_code})
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-sans font-medium text-slate-100">
                      <div>{t.equipment_name}</div>
                      <span className="text-[10px] font-mono text-slate-500 uppercase">{t.equipment_category}</span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold text-slate-100 text-sm">
                      {parseInt(t.quantity, 10).toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5">{getStatusBadge(t.status)}</td>
                    <td className="px-4 py-3.5 text-slate-400 font-sans max-w-xs truncate" title={t.notes}>
                      {t.notes || 'Routine rebalance'}
                    </td>
                    <td className="px-4 py-3.5 text-slate-400">
                      <div>{new Date(t.timestamp).toLocaleDateString()}</div>
                      <div className="text-[10px] text-slate-500">{t.initiated_by_name || t.initiated_by_username}</div>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {t.status === 'IN_TRANSIT' && canManageTransfers && (
                        <button
                          onClick={() => handleStatusUpdate(t.id, 'COMPLETED')}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded text-[10px] transition shadow"
                          title="Confirm arrival at destination base"
                        >
                          Confirm Arrival
                        </button>
                      )}
                      {t.status === 'PENDING' && canManageTransfers && (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleStatusUpdate(t.id, 'IN_TRANSIT')}
                            className="px-2 py-0.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded text-[10px] transition"
                            title="Dispatch convoy"
                          >
                            Dispatch
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(t.id, 'CANCELLED')}
                            className="px-2 py-0.5 bg-rose-800 hover:bg-rose-700 text-slate-200 font-bold rounded text-[10px] transition"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="px-6 py-8 text-center text-slate-500 font-mono">
                    No cross-base transfer records found matching current criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form to Initiate Transfer */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-850">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-slate-100 font-mono">
                  DISPATCH ATOMIC ASSET TRANSFER
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
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}
              {formSuccess && (
                <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{formSuccess}</span>
                </div>
              )}

              {/* Source & Destination Bases */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-rose-300 uppercase tracking-wider mb-1 font-mono">
                    Origin Base (Source)
                  </label>
                  <select
                    required
                    value={formData.sourceBaseId}
                    onChange={(e) => setFormData({ ...formData, sourceBaseId: e.target.value })}
                    disabled={isCommander}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    {bases.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-emerald-300 uppercase tracking-wider mb-1 font-mono">
                    Destination Base
                  </label>
                  <select
                    required
                    value={formData.destinationBaseId}
                    onChange={(e) => setFormData({ ...formData, destinationBaseId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    {bases.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Equipment Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 font-mono">
                  Equipment Type to Transfer
                </label>
                <select
                  required
                  value={formData.equipmentTypeId}
                  onChange={(e) => setFormData({ ...formData, equipmentTypeId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  {equipmentTypes.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      [{eq.category}] {eq.name} ({eq.unit_of_measure})
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity & Initial Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 font-mono">
                    Quantity to Transfer
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="e.g. 10"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 font-mono">
                    Transfer Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="COMPLETED">Instant Completed</option>
                    <option value="IN_TRANSIT">In Transit (Convoy)</option>
                    <option value="PENDING">Pending Approval</option>
                  </select>
                </div>
              </div>

              {/* Tactical Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 font-mono">
                  Operational Purpose & Convoy Notes
                </label>
                <textarea
                  rows="2"
                  placeholder="e.g. Scheduled armor redeployment, authorized under Operation Sentinel..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
                ></textarea>
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
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs font-mono transition shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'Executing Transaction...' : 'Commit Atomic Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transfers;
