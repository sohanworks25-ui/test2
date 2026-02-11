
import React from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: 'danger' | 'warning' | 'info';
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Delete Permanently',
  cancelLabel = 'Abort Action',
  type = 'danger'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6 no-print">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl animate-fade-in" 
        onClick={onCancel}
      />
      
      {/* Modal Card */}
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[40px] shadow-[0_0_100px_-20px_rgba(0,0,0,0.5)] border border-white/20 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Visual Accent */}
        <div className="h-2 w-full bg-rose-600"></div>

        <div className="p-8 md:p-10 text-center">
          {/* Warning Icon */}
          <div className="w-24 h-24 bg-rose-50 dark:bg-rose-900/20 rounded-[35px] flex items-center justify-center mx-auto mb-8 animate-pulse shadow-inner">
             <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-rose-600"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>

          <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase mb-4 leading-tight">
            {title}
          </h3>
          
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm leading-relaxed mb-10 px-4">
            {message}
          </p>

          <div className="space-y-3">
             <button 
                onClick={onConfirm}
                className="w-full bg-slate-900 dark:bg-rose-600 text-white py-5 rounded-[24px] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-black dark:hover:bg-rose-500 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group"
             >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="opacity-50 group-hover:opacity-100 transition-opacity"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                {confirmLabel}
             </button>
             
             <button 
                onClick={onCancel}
                className="w-full py-4 text-slate-400 dark:text-slate-500 font-black text-[10px] uppercase tracking-widest hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
             >
                {cancelLabel}
             </button>
          </div>
        </div>

        {/* Technical Footer Decoration */}
        <div className="bg-slate-50 dark:bg-slate-950/50 py-4 px-8 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center opacity-30">
           <span className="text-[8px] font-black uppercase tracking-widest">Protocol Override Req</span>
           <span className="text-[8px] font-mono">CODE_403_DEL</span>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
