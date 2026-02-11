import React, { useState } from 'react';
import { Degree } from '../types';

interface DegreeManagerProps {
  degrees: Degree[];
  onAddDegree: (degree: Degree) => void;
  onUpdateDegree: (degree: Degree) => void;
  onDeleteDegree: (id: string) => void;
}

const DegreeManager: React.FC<DegreeManagerProps> = ({ degrees, onAddDegree, onUpdateDegree, onDeleteDegree }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingDegree, setEditingDegree] = useState<Degree | null>(null);
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingDegree) {
      onUpdateDegree({ ...editingDegree, name });
    } else {
      onAddDegree({ id: `D-${Date.now()}`, name });
    }
    closeModal();
  };

  const openEdit = (d: Degree) => {
    setEditingDegree(d);
    setName(d.name);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingDegree(null);
    setName('');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Academic Degrees</h2>
          <p className="text-sm text-slate-500 font-medium">Manage the library of medical and professional credentials</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="px-6 py-3 bg-slate-900 dark:bg-blue-600 hover:bg-black text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl active:scale-95 flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          Add New Degree
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {degrees.map(d => (
          <div key={d.id} className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 p-6 flex justify-between items-center group hover:shadow-xl transition-all">
             <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Credential ID: {d.id}</p>
                <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">{d.name}</h3>
             </div>
             <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEdit(d)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all">
                   <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                </button>
                <button onClick={() => onDeleteDegree(d.id)} className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all">
                   <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                </button>
             </div>
          </div>
        ))}
        {degrees.length === 0 && (
           <div className="col-span-full py-24 text-center opacity-20">
              <p className="text-xl font-black uppercase tracking-widest">Library is empty</p>
           </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
           <div className="bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-between items-center">
                 <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight uppercase">
                    {editingDegree ? 'Edit Degree Title' : 'Register New Degree'}
                 </h3>
                 <button onClick={closeModal} className="p-2 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                 </button>
              </div>
              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                 <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Degree Name / Qualification</label>
                    <input 
                      required 
                      autoFocus
                      type="text" 
                      placeholder="e.g. MBBS, FCPS (Surgery)" 
                      className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 font-black text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 uppercase"
                      value={name}
                      onChange={e => setName(e.target.value)}
                    />
                 </div>
                 <button type="submit" className="w-full py-5 bg-slate-900 dark:bg-blue-600 text-white rounded-[24px] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-black dark:hover:bg-blue-700 transition-all active:scale-[0.98]">
                    {editingDegree ? 'Update Library Entry' : 'Add to Library'}
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default DegreeManager;