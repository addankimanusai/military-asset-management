import React from 'react';
import { X, ArrowUpRight, ArrowDownLeft, ShoppingBag, Truck, CheckCircle2, AlertCircle } from 'lucide-react';

export const NetMoveModal = ({ isOpen, onClose, metrics }) => {
  if (!isOpen || !metrics) return null;

  const purchases = metrics.purchases || 0;
  const transfersIn = metrics.transfersIn || 0;
  const transfersOut = metrics.transfersOut || 0;
  const netMovement = metrics.netMovement || 0;
  const inTransit = metrics.inTransit || 0;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-850">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Net Movement Audit Breakdown</h3>
              <p className="text-xs text-slate-400 font-mono">MATHEMATICAL RECONCILIATION</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mathematical Model Formula Callout */}
        <div className="p-6 space-y-5">
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-center font-mono text-xs">
            <span className="text-slate-400">Formula: </span>
            <span className="text-emerald-400 font-semibold">Net Movement</span>
            <span className="text-slate-400"> = </span>
            <span className="text-cyan-400 font-semibold">Purchases</span>
            <span className="text-slate-400"> + </span>
            <span className="text-emerald-400 font-semibold">Transfers In</span>
            <span className="text-slate-400"> - </span>
            <span className="text-rose-400 font-semibold">Transfers Out</span>
          </div>

          {/* Breakdown Items */}
          <div className="space-y-3">
            {/* Purchases */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-800/40 border border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-200">Purchases & Procurements (+)</p>
                  <p className="text-[11px] text-slate-400">Direct factory & arsenal deliveries</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-base font-bold font-mono text-cyan-400">
                  +{purchases.toLocaleString()}
                </span>
                <span className="block text-[10px] text-slate-500 font-mono">UNITS</span>
              </div>
            </div>

            {/* Transfers In */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-800/40 border border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <ArrowDownLeft className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-200">Cross-Base Transfers In (+)</p>
                  <p className="text-[11px] text-slate-400">Inbound logistics from other bases</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-base font-bold font-mono text-emerald-400">
                  +{transfersIn.toLocaleString()}
                </span>
                <span className="block text-[10px] text-slate-500 font-mono">COMPLETED</span>
              </div>
            </div>

            {/* Transfers Out */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-800/40 border border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-200">Cross-Base Transfers Out (-)</p>
                  <p className="text-[11px] text-slate-400">Dispatched units to other bases</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-base font-bold font-mono text-rose-400">
                  -{transfersOut.toLocaleString()}
                </span>
                <span className="block text-[10px] text-slate-500 font-mono">DISPATCHED</span>
              </div>
            </div>
          </div>

          {/* Total Net Balance Calculation */}
          <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider font-mono">
                Total Net Movement
              </span>
              <p className="text-[11px] text-slate-400">Integrated net physical movement</p>
            </div>
            <div className="text-right">
              <span className={`text-2xl font-extrabold font-mono ${netMovement >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {netMovement >= 0 ? `+${netMovement.toLocaleString()}` : netMovement.toLocaleString()}
              </span>
              <span className="block text-[10px] text-slate-400 font-mono">NET UNITS</span>
            </div>
          </div>

          {/* In-Transit Alert Notice */}
          {inTransit > 0 && (
            <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-500/30 flex items-center gap-3 text-xs text-amber-300">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>{inTransit} units</strong> are currently flagged as <span className="font-mono text-amber-200">IN_TRANSIT / PENDING</span> and will be factored into closing balance upon arrival confirmation.
              </span>
            </div>
          )}

          {/* Close Action */}
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-xl text-sm transition-all border border-slate-700 shadow-md"
          >
            Acknowledge & Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};

export default NetMoveModal;
