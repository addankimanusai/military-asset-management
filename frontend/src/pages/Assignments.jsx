import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  ClipboardList,
  Flame,
  Plus,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  X,
  RotateCcw,
  Shield,
  Layers,
  Award,
} from 'lucide-react';

export const Assignments = () => {
  const { user, isAdmin, isCommander, canManageAssignments, canManageExpenditures } = useAuth();

  const [activeTab, setActiveTab] = useState('assignments'); // 'assignments' | 'expenditures'
  const [assignments, setAssignments] = useState([]);
  const [expenditures, setExpenditures] = useState([]);
  const [bases, setBases] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isExpendModalOpen, setIsExpendModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Form states
  const [assignForm, setAssignForm] = useState({
    baseId: '',
    equipmentTypeId: '',
    quantity: '',
    assignedToPersonnel: '',
    unitName: '',
    assignmentDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [expendForm, setExpendForm] = useState({
    baseId: '',
    equipmentTypeId: '',
    quantity: '',
    reason: 'TRAINING',
    authorizedBy: '',
    expenditureDate: new Date().toISOString().split('T')[0],
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

        const defaultBase = isCommander && user?.baseId ? String(user.baseId) : String(basesRes.data[0]?.id || '');
        const defaultEquip = String(equipRes.data[0]?.id || '');

        setAssignForm((prev) => ({
          ...prev,
          baseId: defaultBase,
          equipmentTypeId: defaultEquip,
        }));

        setExpendForm((prev) => ({
          ...prev,
          baseId: defaultBase,
          equipmentTypeId: defaultEquip,
          authorizedBy: user?.fullName || 'Commanding Officer',
        }));
      } catch (err) {
        console.error('Failed to load metadata:', err);
      }
    };
    fetchMetadata();
  }, [isCommander, user]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [assignRes, expendRes] = await Promise.all([
        api.get('/assignments'),
        api.get('/assignments/expenditures'),
      ]);
      setAssignments(assignRes.data);
      setExpenditures(expendRes.data);
    } catch (err) {
      console.error('Failed to fetch assignment/expenditure data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError('');
    setFormSuccess('');

    try {
      await api.post('/assignments', {
        baseId: parseInt(assignForm.baseId, 10),
        equipmentTypeId: parseInt(assignForm.equipmentTypeId, 10),
        quantity: parseInt(assignForm.quantity, 10),
        assignedToPersonnel: assignForm.assignedToPersonnel,
        unitName: assignForm.unitName,
        assignmentDate: assignForm.assignmentDate,
        notes: assignForm.notes,
      });

      setFormSuccess('Asset allocation assigned to personnel successfully!');
      fetchData();
      setTimeout(() => setIsAssignModalOpen(false), 1200);
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to allocate assignment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReturnAssignment = async (id) => {
    if (!window.confirm('Confirm returning this equipment to base inventory?')) return;
    try {
      await api.patch(`/assignments/${id}/return`);
      fetchData();
    } catch (err) {
      alert('Return failed: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleCreateExpenditure = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError('');
    setFormSuccess('');

    try {
      await api.post('/assignments/expenditures', {
        baseId: parseInt(expendForm.baseId, 10),
        equipmentTypeId: parseInt(expendForm.equipmentTypeId, 10),
        quantity: parseInt(expendForm.quantity, 10),
        reason: expendForm.reason,
        authorizedBy: expendForm.authorizedBy,
        expenditureDate: expendForm.expenditureDate,
        notes: expendForm.notes,
      });

      setFormSuccess('Expenditure logged and inventory balance updated!');
      fetchData();
      setTimeout(() => setIsExpendModalOpen(false), 1200);
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to record expenditure.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalActiveAssignments = assignments.filter((a) => a.status === 'ACTIVE').reduce((sum, a) => sum + parseInt(a.quantity, 10), 0);
  const totalExpendedUnits = expenditures.reduce((sum, e) => sum + parseInt(e.quantity, 10), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/30">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-100 font-mono">
                PERSONNEL ASSIGNMENTS & EXPENDITURES
              </h1>
              <p className="text-xs text-slate-400">
                Track assets allocated to active field personnel and log consumed munitions
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canManageAssignments && (
            <button
              onClick={() => {
                setFormError('');
                setFormSuccess('');
                setIsAssignModalOpen(true);
              }}
              className="flex items-center gap-2 px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-purple-600/20 font-mono"
            >
              <Plus className="w-4 h-4" />
              <span>ASSIGN TO PERSONNEL</span>
            </button>
          )}

          {canManageExpenditures && (
            <button
              onClick={() => {
                setFormError('');
                setFormSuccess('');
                setIsExpendModalOpen(true);
              }}
              className="flex items-center gap-2 px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-xl text-xs transition shadow-lg shadow-amber-600/20 font-mono"
            >
              <Flame className="w-4 h-4" />
              <span>LOG EXPENDITURE</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('assignments')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold transition ${
            activeTab === 'assignments'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>PERSONNEL ASSIGNMENTS ({assignments.length})</span>
          <span className="px-1.5 py-0.2 rounded-full bg-purple-900/50 text-[10px] text-purple-300">
            {totalActiveAssignments} Active
          </span>
        </button>

        <button
          onClick={() => setActiveTab('expenditures')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold transition ${
            activeTab === 'expenditures'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
          }`}
        >
          <Flame className="w-4 h-4" />
          <span>CONSUMED EXPENDITURES ({expenditures.length})</span>
          <span className="px-1.5 py-0.2 rounded-full bg-amber-900/50 text-[10px] text-amber-300">
            {totalExpendedUnits} Expended
          </span>
        </button>
      </div>

      {/* Tab 1: Assignments Table */}
      {activeTab === 'assignments' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-850">
            <h2 className="text-sm font-bold text-slate-100 font-mono">
              ACTIVE PERSONNEL DEPLOYMENT LOG
            </h2>
            <span className="text-xs text-slate-400 font-mono">{assignments.length} Total Assignments</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3 font-semibold">ASSIGNMENT ID</th>
                  <th className="px-4 py-3 font-semibold">BASE</th>
                  <th className="px-5 py-3 font-semibold">EQUIPMENT TYPE</th>
                  <th className="px-4 py-3 text-right font-semibold">QTY</th>
                  <th className="px-4 py-3 font-semibold">ASSIGNED TO</th>
                  <th className="px-4 py-3 font-semibold">UNIT / BATTALION</th>
                  <th className="px-4 py-3 font-semibold">DATE</th>
                  <th className="px-4 py-3 font-semibold">STATUS</th>
                  <th className="px-4 py-3 text-right font-semibold">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {assignments.length > 0 ? (
                  assignments.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-850/60 transition">
                      <td className="px-5 py-3.5 font-bold text-slate-200">#{a.id}</td>
                      <td className="px-4 py-3.5">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">
                          {a.base_name} ({a.base_code})
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-sans font-medium text-slate-100">
                        <div>{a.equipment_name}</div>
                        <span className="text-[10px] font-mono text-slate-500 uppercase">{a.equipment_category}</span>
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold text-purple-400 text-sm">
                        {parseInt(a.quantity, 10).toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5 font-sans font-semibold text-slate-200">
                        {a.assigned_to_personnel}
                      </td>
                      <td className="px-4 py-3.5 text-slate-400 font-sans">{a.unit_name}</td>
                      <td className="px-4 py-3.5 text-slate-400">
                        {new Date(a.assignment_date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3.5">
                        {a.status === 'ACTIVE' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30">
                            ACTIVE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                            RETURNED ({new Date(a.return_date).toLocaleDateString()})
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        {a.status === 'ACTIVE' && canManageAssignments && (
                          <button
                            onClick={() => handleReturnAssignment(a.id)}
                            className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-slate-950 font-bold rounded text-[10px] transition border border-slate-700 ml-auto"
                            title="Return asset back to base storage"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Return</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="px-6 py-8 text-center text-slate-500 font-mono">
                      No active assignments found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Expenditures Table */}
      {activeTab === 'expenditures' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-850">
            <h2 className="text-sm font-bold text-slate-100 font-mono">
              MUNITIONS & ASSET EXPENDITURES AUDIT
            </h2>
            <span className="text-xs text-slate-400 font-mono">{expenditures.length} Logged Expenditures</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3 font-semibold">RECORD ID</th>
                  <th className="px-4 py-3 font-semibold">BASE</th>
                  <th className="px-5 py-3 font-semibold">EQUIPMENT TYPE</th>
                  <th className="px-4 py-3 text-right font-semibold">QTY EXPENDED</th>
                  <th className="px-4 py-3 font-semibold">REASON</th>
                  <th className="px-4 py-3 font-semibold">AUTHORIZED BY</th>
                  <th className="px-4 py-3 font-semibold">DATE</th>
                  <th className="px-4 py-3 font-semibold">NOTES / DETAILS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {expenditures.length > 0 ? (
                  expenditures.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-850/60 transition">
                      <td className="px-5 py-3.5 font-bold text-slate-200">#{e.id}</td>
                      <td className="px-4 py-3.5">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">
                          {e.base_name} ({e.base_code})
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-sans font-medium text-slate-100">
                        <div>{e.equipment_name}</div>
                        <span className="text-[10px] font-mono text-slate-500 uppercase">{e.equipment_category}</span>
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold text-amber-400 text-sm">
                        -{parseInt(e.quantity, 10).toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                          {e.reason}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-sans text-slate-200">{e.authorized_by}</td>
                      <td className="px-4 py-3.5 text-slate-400">
                        {new Date(e.expenditure_date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3.5 text-slate-400 font-sans max-w-xs truncate" title={e.notes}>
                        {e.notes || 'Routine qualification'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="px-6 py-8 text-center text-slate-500 font-mono">
                      No expenditure records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal 1: Assign to Personnel */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-850">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-slate-100 font-mono">
                  ASSIGN ASSETS TO UNIT / PERSONNEL
                </h3>
              </div>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="p-6 space-y-4">
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

              {/* Base */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 font-mono">
                  Station Base
                </label>
                <select
                  required
                  value={assignForm.baseId}
                  onChange={(e) => setAssignForm({ ...assignForm, baseId: e.target.value })}
                  disabled={isCommander}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-slate-100 focus:outline-none focus:border-purple-500"
                >
                  {bases.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Equipment Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 font-mono">
                  Equipment Type to Allocate
                </label>
                <select
                  required
                  value={assignForm.equipmentTypeId}
                  onChange={(e) => setAssignForm({ ...assignForm, equipmentTypeId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-slate-100 focus:outline-none focus:border-purple-500"
                >
                  {equipmentTypes.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      [{eq.category}] {eq.name} ({eq.unit_of_measure})
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 font-mono">
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="e.g. 15"
                  value={assignForm.quantity}
                  onChange={(e) => setAssignForm({ ...assignForm, quantity: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-slate-100 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Assigned To Personnel & Unit Name */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 font-mono">
                    Recipient Personnel / Officer
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sgt. John Miller"
                    value={assignForm.assignedToPersonnel}
                    onChange={(e) => setAssignForm({ ...assignForm, assignedToPersonnel: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-slate-100 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 font-mono">
                    Assigned Unit / Platoon
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1st Marine Battalion"
                    value={assignForm.unitName}
                    onChange={(e) => setAssignForm({ ...assignForm, unitName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-slate-100 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Date & Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 font-mono">
                  Assignment Date
                </label>
                <input
                  type="date"
                  required
                  value={assignForm.assignmentDate}
                  onChange={(e) => setAssignForm({ ...assignForm, assignmentDate: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-slate-100 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 font-mono">
                  Mission / Assignment Notes
                </label>
                <textarea
                  rows="2"
                  placeholder="Deployment mission parameters..."
                  value={assignForm.notes}
                  onChange={(e) => setAssignForm({ ...assignForm, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-slate-100 focus:outline-none focus:border-purple-500"
                ></textarea>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-mono transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs font-mono transition shadow-lg shadow-purple-600/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'Allocating...' : 'Commit Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Log Consumed Expenditure */}
      {isExpendModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-850">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-slate-100 font-mono">
                  RECORD CONSUMED ASSET / EXPENDITURE
                </h3>
              </div>
              <button
                onClick={() => setIsExpendModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExpenditure} className="p-6 space-y-4">
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

              {/* Base */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 font-mono">
                  Base Location
                </label>
                <select
                  required
                  value={expendForm.baseId}
                  onChange={(e) => setExpendForm({ ...expendForm, baseId: e.target.value })}
                  disabled={isCommander}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500"
                >
                  {bases.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Equipment Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 font-mono">
                  Expended Item / Ordnance
                </label>
                <select
                  required
                  value={expendForm.equipmentTypeId}
                  onChange={(e) => setExpendForm({ ...expendForm, equipmentTypeId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500"
                >
                  {equipmentTypes.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      [{eq.category}] {eq.name} ({eq.unit_of_measure})
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity & Reason */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 font-mono">
                    Quantity Consumed
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="e.g. 5"
                    value={expendForm.quantity}
                    onChange={(e) => setExpendForm({ ...expendForm, quantity: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 font-mono">
                    Operational Reason
                  </label>
                  <select
                    value={expendForm.reason}
                    onChange={(e) => setExpendForm({ ...expendForm, reason: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="TRAINING">Live-Fire Training Drills</option>
                    <option value="COMBAT_OPS">Combat Operations</option>
                    <option value="MAINTENANCE_LOSS">Maintenance Loss / Failure</option>
                    <option value="DECOMMISSIONED">Decommissioned / Obsolete</option>
                    <option value="EXPIRED">Shelf-Life Expired</option>
                  </select>
                </div>
              </div>

              {/* Authorizing Officer & Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 font-mono">
                    Authorized Officer
                  </label>
                  <input
                    type="text"
                    required
                    value={expendForm.authorizedBy}
                    onChange={(e) => setExpendForm({ ...expendForm, authorizedBy: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 font-mono">
                    Expenditure Date
                  </label>
                  <input
                    type="date"
                    required
                    value={expendForm.expenditureDate}
                    onChange={(e) => setExpendForm({ ...expendForm, expenditureDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 font-mono">
                  Expenditure Remarks
                </label>
                <textarea
                  rows="2"
                  placeholder="e.g. Range 4 qualification exercise, 15 crates expended..."
                  value={expendForm.notes}
                  onChange={(e) => setExpendForm({ ...expendForm, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500"
                ></textarea>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsExpendModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-mono transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-xl text-xs font-mono transition shadow-lg shadow-amber-600/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'Recording Loss...' : 'Record Stock Expenditure'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Assignments;
