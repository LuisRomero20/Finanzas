import React from 'react';

interface MetricProps {
  label: string;
  value: string;
  subValue?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  color?: string;
}

export const Metric: React.FC<MetricProps> = ({ label, value, subValue, icon, color }) => {
  return (
    <div className="flex flex-col justify-between h-full">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</span>
        {icon && (
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60 text-slate-600 dark:text-slate-300">
            {icon}
          </div>
        )}
      </div>
      <div>
        <div className={`text-2xl sm:text-3xl font-black tracking-tight ${color || 'text-slate-900 dark:text-slate-100'}`}>
          {value}
        </div>
        {subValue && (
          <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-1.5 flex items-center gap-1">
            {subValue}
          </p>
        )}
      </div>
    </div>
  );
};
