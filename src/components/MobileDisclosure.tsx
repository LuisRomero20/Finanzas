import { useState, type ReactNode } from 'react';
export function MobileDisclosure({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return <div>
    <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="sm:hidden flex min-h-11 w-full items-center justify-between rounded-xl border border-slate-300 dark:border-slate-700 px-3 text-xs font-bold">
      {label}<span>{open ? '−' : '+'}</span>
    </button>
    <div className={open ? 'block pt-2 sm:pt-0' : 'hidden sm:block'}>{children}</div>
  </div>;
}
