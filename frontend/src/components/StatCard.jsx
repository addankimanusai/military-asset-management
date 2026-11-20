import React from 'react';

export const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'blue',
  badge,
  onClick,
  isClickable = false,
  hint,
}) => {
  const variantStyles = {
    blue: {
      border: 'border-l-4 border-l-blue-500 border-slate-800',
      badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      text: 'text-blue-400',
      hover: 'hover:border-blue-500/60 hover:bg-slate-850',
    },
    emerald: {
      border: 'border-l-4 border-l-emerald-500 border-slate-800',
      badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      text: 'text-emerald-400',
      hover: 'hover:border-emerald-500/60 hover:bg-slate-850',
    },
    purple: {
      border: 'border-l-4 border-l-purple-500 border-slate-800',
      badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      text: 'text-purple-400',
      hover: 'hover:border-purple-500/60 hover:bg-slate-850',
    },
    amber: {
      border: 'border-l-4 border-l-amber-500 border-slate-800',
      badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      text: 'text-amber-400',
      hover: 'hover:border-amber-500/60 hover:bg-slate-850',
    },
    rose: {
      border: 'border-l-4 border-l-rose-500 border-slate-800',
      badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      text: 'text-rose-400',
      hover: 'hover:border-rose-500/60 hover:bg-slate-850',
    },
    cyan: {
      border: 'border-l-4 border-l-cyan-500 border-slate-800',
      badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      text: 'text-cyan-400',
      hover: 'hover:border-cyan-500/60 hover:bg-slate-850',
    },
  };

  const style = variantStyles[variant] || variantStyles.blue;

  return (
    <div
      onClick={isClickable ? onClick : undefined}
      className={`relative bg-slate-900 border rounded-xl p-5 shadow-lg transition-all duration-200 ${
        style.border
      } ${
        isClickable
          ? `cursor-pointer ${style.hover} hover:shadow-xl hover:-translate-y-0.5`
          : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase font-mono">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl lg:text-3xl font-extrabold text-slate-100 font-mono tracking-tight">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </h3>
            {badge && (
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${style.badge}`}>
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-slate-400 font-medium">{subtitle}</p>
          )}
        </div>

        {Icon && (
          <div className={`p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/50 ${style.text}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {hint && (
        <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
          <span className="font-mono text-emerald-400 flex items-center gap-1">
            <span>●</span> {hint}
          </span>
          <span className="text-slate-500">&rarr;</span>
        </div>
      )}
    </div>
  );
};

export default StatCard;
