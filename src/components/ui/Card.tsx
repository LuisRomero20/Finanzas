import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  return (
    <div 
      className={`bg-white dark:bg-[#11191D] rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 p-6 transition-all duration-200 hover:shadow-md dark:shadow-slate-950/40 text-slate-800 dark:text-slate-100 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
