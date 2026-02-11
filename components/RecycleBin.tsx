import React, { useState } from 'react';
import { TrashItem } from '../types';

interface RecycleBinProps {
  trash: TrashItem[];
  onRestore: (item: TrashItem) => void;
  onPermanentDelete: (id: string) => void;
  onEmptyTrash: () => void;
}

const RecycleBin: React.FC<RecycleBinProps> = ({ trash, onRestore, onPermanentDelete, onEmptyTrash }) => {
  const [selectedItem, setSelectedItem] = useState<TrashItem | null>(null);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Bill': return <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>;
      case 'Patient': return <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
      case 'Service': return <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>;
      default: return <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Recycle Bin</h2>
          <p className="text-sm text-slate-500 font-medium">Manage and restore soft-deleted hospital data</p>
        </div>
        {trash.length > 0 && (
          <button 
            onClick={() => { if(window.confirm("Permanently wipe all trashed items? This cannot be undone.")) onEmptyTrash(); }}
            className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-rose-900/20 active:scale-95 flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
            Empty Trash Bin
          </button>
        )}
      </header>

      <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Item Type</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Identifier / Name</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Original ID</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Deleted On</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {trash.map(item => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                        {getTypeIcon(item.type)}
                      </div>
                      <span className="text-[10px] font-black uppercase text-slate-500 tracking-tighter">{item.type}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-black text-slate-800 dark:text-slate-200 text-sm truncate max-w-[200px]">{item.name}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">{item.originalId}</span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-[11px] font-bold text-slate-500">{new Date(item.deletedAt).toLocaleDateString()}</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase">{new Date(item.deletedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                       <button onClick={() => setSelectedItem(item)} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl transition-all" title="View Details">
                         <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                       </button>
                       <button onClick={() => onRestore(item)} className="p-2 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-xl transition-all" title="Restore Item">
                         <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                       </button>
                       <button onClick={() => onPermanentDelete(item.id)} className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all" title="Permanent Delete">
                         <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
              {trash.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-32 text-center">
                    <div className="flex flex-col items-center justify-center opacity-20 dark:opacity-10">
                       <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-4"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                       <p className="text-xl font-black uppercase tracking-[0.2em]">Recycle Bin Empty</p>
                       <p className="text-sm font-bold uppercase mt-2">No soft-deleted records found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* INSPECT MODAL */}
      {selectedItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
           <div className="bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-between items-center">
                 <div>
                    <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Record Inspection</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Inspecting deleted {selectedItem.type}</p>
                 </div>
                 <button onClick={() => setSelectedItem(null)} className="p-2 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                 </button>
              </div>
              <div className="p-8 space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                       <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Deleted At</p>
                       <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{new Date(selectedItem.deletedAt).toLocaleString()}</p>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                       <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Original Item ID</p>
                       <p className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">{selectedItem.originalId}</p>
                    </div>
                 </div>
                 
                 <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Raw Content Audit</p>
                    <div className="bg-slate-950 rounded-2xl p-6 overflow-hidden">
                       <pre className="text-[11px] font-mono text-emerald-400 overflow-x-auto custom-scrollbar max-h-60 leading-relaxed whitespace-pre-wrap">
                          {JSON.stringify(selectedItem.data, null, 2)}
                       </pre>
                    </div>
                 </div>

                 <div className="flex gap-4 pt-4">
                    <button onClick={() => { onRestore(selectedItem); setSelectedItem(null); }} className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-900/20">Restore Now</button>
                    <button onClick={() => { onPermanentDelete(selectedItem.id); setSelectedItem(null); }} className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-rose-700 transition-all shadow-xl shadow-rose-900/20">Wipe Permanently</button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default RecycleBin;