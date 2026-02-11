import React, { useState, useMemo } from 'react';
import { Patient, User, UserRole, Bill, AdmittedPatient, HospitalConfig } from '../types';
import PatientHistoryViewer from './PatientHistoryViewer';
import { storageService } from '../services/storageService';

interface PatientManagerProps {
  patients: Patient[];
  bills: Bill[];
  admissions: AdmittedPatient[];
  hospitalConfig: HospitalConfig;
  onAddPatient: (patient: Patient) => void;
  onUpdatePatient: (patient: Patient) => void;
  onDeletePatient: (id: string) => void;
  currentUser: User;
}

const PatientManager: React.FC<PatientManagerProps> = ({ 
  patients, bills, admissions, hospitalConfig, onAddPatient, onUpdatePatient, onDeletePatient, currentUser 
}) => {
  const [showModal, setShowModal] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('grid');
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [viewHistoryPatientId, setViewHistoryPatientId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [formData, setFormData] = useState<Partial<Patient>>({
    name: '', age: 0, sex: 'Male', mobile: '', address: '', followUpDate: '', followUpReason: ''
  });

  const isAdmin = currentUser.role === UserRole.SUPER_ADMIN || currentUser.role === UserRole.ADMIN;

  const filteredPatients = useMemo(() => {
    return patients.filter(p => {
      const q = searchQuery.toLowerCase();
      const matchesText = p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || p.mobile.includes(searchQuery);
      if (!matchesText) return false;
      const regDateStr = p.regDate.split('T')[0];
      if (startDate && regDateStr < startDate) return false;
      if (endDate && regDateStr > endDate) return false;
      return true;
    }).sort((a, b) => new Date(b.regDate).getTime() - new Date(a.regDate).getTime());
  }, [patients, searchQuery, startDate, endDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPatient) {
      onUpdatePatient({ ...editingPatient, ...formData, age: Number(formData.age) || 0 } as Patient);
    } else {
      onAddPatient({
        id: storageService.generatePatientId(patients),
        name: formData.name || '',
        age: Number(formData.age) || 0,
        sex: formData.sex as any,
        mobile: formData.mobile || '',
        address: formData.address,
        regDate: new Date().toISOString(),
        history: [],
        followUpDate: formData.followUpDate,
        followUpReason: formData.followUpReason
      });
    }
    closeModal();
  };

  const closeModal = () => {
    setShowModal(false); setEditingPatient(null);
    setFormData({ name: '', age: 0, sex: 'Male', mobile: '', address: '', followUpDate: '', followUpReason: '' });
  };

  if (viewHistoryPatientId) {
    const p = patients.find(pat => pat.id === viewHistoryPatientId);
    if (p) return <PatientHistoryViewer patient={p} bills={bills.filter(b => b.patientId === p.id)} admissions={admissions.filter(a => a.patientId === p.id)} hospitalConfig={hospitalConfig} onBack={() => setViewHistoryPatientId(null)} />;
  }

  return (
    <div className="space-y-4 animate-fade-in pb-10">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 px-1">
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Patient Directory</h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none">Chronological Clinical Archives</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="flex bg-white dark:bg-slate-900 rounded-xl p-1 border dark:border-slate-800 shadow-sm no-print">
             <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400'}`}><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg></button>
             <button onClick={() => setViewMode('table')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400'}`}><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></svg></button>
          </div>
          <button onClick={() => setShowModal(true)} className="flex-1 sm:flex-none bg-slate-900 dark:bg-blue-600 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center justify-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
            Register Profile
          </button>
        </div>
      </header>

      <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row gap-3 no-print">
         <div className="flex-1 relative">
            <input type="text" placeholder="Registry Search (Name/MRN/Mobile)..." className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border-none font-bold outline-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-blue-500/50 transition-all dark:text-white text-[11px]" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
         </div>
         <div className="flex items-center gap-2">
            <div className="flex gap-1 bg-slate-50 dark:bg-slate-800 p-1 rounded-xl ring-1 ring-slate-200 dark:ring-slate-700">
               <span className="text-[8px] font-black text-slate-400 uppercase ml-2 leading-8">From</span>
               <input type="date" className="bg-transparent border-none font-bold text-[10px] dark:text-white outline-none w-24" value={startDate} onChange={e => setStartDate(e.target.value)} />
               <span className="text-[8px] font-black text-slate-400 uppercase leading-8">To</span>
               <input type="date" className="bg-transparent border-none font-bold text-[10px] dark:text-white outline-none w-24 border-l dark:border-slate-700 pl-1" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
         </div>
      </div>

      {viewMode === 'table' ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left min-w-[700px]">
              <thead className="bg-slate-900">
                <tr>
                  <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">MRN</th>
                  <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Subject Name</th>
                  <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Demographics</th>
                  <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Reg Date</th>
                  <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {filteredPatients.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group">
                    <td className="px-4 py-2 font-mono text-[10px] font-black text-blue-600">{p.id}</td>
                    <td className="px-4 py-2 font-black text-slate-800 dark:text-slate-200 uppercase text-[10px] tracking-tight">{p.name}</td>
                    <td className="px-4 py-2 text-[10px] font-bold text-slate-500">{p.age}Y • {p.sex}</td>
                    <td className="px-4 py-2 text-[9px] font-black text-slate-400 uppercase">{new Date(p.regDate).toLocaleDateString()}</td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button onClick={() => setViewHistoryPatientId(p.id)} className="p-1.5 text-slate-400 hover:text-indigo-600 transition-all" title="View Archives"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></button>
                        <button onClick={() => { setEditingPatient(p); setFormData(p); setShowModal(true); }} className="p-1.5 text-slate-400 hover:text-blue-600 transition-all"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg></button>
                        {isAdmin && <button onClick={() => onDeletePatient(p.id)} className="p-1.5 text-slate-400 hover:text-rose-500 transition-all"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg></button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
           {filteredPatients.map(p => (
             <div key={p.id} className="patient-card group hover:border-blue-500 transition-all cursor-pointer overflow-hidden relative" onClick={() => setViewHistoryPatientId(p.id)}>
                <div className="absolute top-0 right-0 w-12 h-12 bg-blue-600/5 blur-xl -mr-6 -mt-6"></div>
                <div className="flex flex-col h-full space-y-3">
                   <div className="flex justify-between items-start">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center font-black text-blue-400 text-sm">{p.name.charAt(0)}</div>
                      <span className="text-[8px] font-mono font-black text-slate-400 uppercase tracking-tighter">MRN: {p.id}</span>
                   </div>
                   <div className="flex-1">
                      <h3 className="text-[11px] font-black text-slate-800 dark:text-white uppercase truncate tracking-tight">{p.name}</h3>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">{p.sex} • {p.age}Y • {p.mobile}</p>
                   </div>
                   <div className="pt-2 border-t border-slate-50 dark:border-slate-800 flex justify-between items-center no-print">
                      <span className="text-[8px] font-black text-slate-400 uppercase">{new Date(p.regDate).toLocaleDateString()}</span>
                      <div className="flex gap-1">
                         <button onClick={(e) => { e.stopPropagation(); setEditingPatient(p); setFormData(p); setShowModal(true); }} className="p-1 text-slate-400 hover:text-blue-600 transition-all"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg></button>
                      </div>
                   </div>
                </div>
             </div>
           ))}
        </div>
      )}

      {/* REGISTRATION MODAL - DENSE */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-[1000] flex items-center justify-center p-2 no-print overflow-hidden">
          <div className="bg-white dark:bg-slate-900 rounded-[24px] shadow-2xl w-full max-w-lg h-full md:h-auto md:max-h-[90vh] overflow-hidden flex flex-col animate-slide-up border border-white/5 relative">
            <div className="px-5 py-3 border-b dark:border-slate-800 flex justify-between items-center bg-slate-900 text-white">
              <div><h3 className="text-[12px] font-black uppercase tracking-tight">{editingPatient ? 'Update Profile' : 'New Inpatient Registry'}</h3><p className="text-[8px] font-bold text-blue-400 uppercase tracking-widest mt-0.5">Clinical Record Entry</p></div>
              <button onClick={closeModal} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-rose-600 border border-white/10 transition-all"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 space-y-5 overflow-y-auto custom-scrollbar flex-1">
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Legal Name</label>
                  <input required type="text" className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border-none font-black text-slate-800 dark:text-white outline-none text-[11px] uppercase" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="FULL NAME..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Age (Y)</label>
                    <input required type="number" className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border-none font-black text-[11px]" value={formData.age || ''} onChange={e => setFormData({...formData, age: Number(e.target.value)})} placeholder="0" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Biological Sex</label>
                    <select className="w-full px-2 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border-none font-black text-[11px]" value={formData.sex} onChange={e => setFormData({...formData, sex: e.target.value as any})}><option>Male</option><option>Female</option><option>Other</option></select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Primary Mobile</label>
                  <input required type="tel" className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border-none font-black text-[11px]" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} placeholder="+8801..." />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Current Address</label>
                  <textarea rows={2} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border-none font-bold text-[10px] resize-none" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="RESIDENTIAL DETAILS..." />
                </div>
              </div>
              <div className="pt-3 border-t dark:border-slate-800 flex gap-3">
                 <button type="button" onClick={closeModal} className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 font-black uppercase text-[9px] tracking-widest">Abort</button>
                 <button type="submit" className="flex-[1.5] bg-blue-600 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg">Commit Registry</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientManager;