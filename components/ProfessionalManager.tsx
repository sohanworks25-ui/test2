import React, { useState, useMemo } from 'react';
import { Professional } from '../types';
import { storageService } from '../services/storageService';

interface ProfessionalManagerProps {
  professionals: Professional[];
  onAdd: (p: Professional) => void;
  onUpdate: (p: Professional) => void;
  onDelete: (id: string) => void;
}

const ProfessionalManager: React.FC<ProfessionalManagerProps> = ({ professionals, onAdd, onUpdate, onDelete }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingPro, setEditingPro] = useState<Professional | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [formData, setFormData] = useState<Partial<Professional>>({
    name: '',
    degree: '',
    category: 'Hospital',
    outType: 'Doctor',
    phone: '',
    commissionEnabled: true,
    commissionRate: 0
  });

  const stats = useMemo(() => {
    const hospital = professionals.filter(p => p.category === 'Hospital').length;
    const external = professionals.filter(p => p.category === 'Out').length;
    return { hospital, external, total: professionals.length };
  }, [professionals]);

  const filteredProfs = useMemo(() => {
    return professionals.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.degree.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [professionals, searchQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPro) {
      onUpdate({ ...editingPro, ...formData } as Professional);
    } else {
      onAdd({ ...formData, id: storageService.generateProfessionalId(professionals) } as Professional);
    }
    closeModal();
  };

  const openEdit = (p: Professional) => {
    setEditingPro(p);
    setFormData(p);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingPro(null);
    setFormData({ name: '', degree: '', category: 'Hospital', outType: 'Doctor', phone: '', commissionEnabled: true, commissionRate: 0 });
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header & Metrics Section */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Medical Staff Registry</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Managing {stats.total} registered healthcare professionals across categories</p>
        </div>

        <div className="flex flex-wrap gap-4 w-full xl:w-auto">
          <div className="flex bg-white dark:bg-slate-900 p-2 rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-sm gap-4">
            <div className="px-4 py-2 border-r border-slate-100 dark:border-slate-800">
              <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Internal</p>
              <p className="text-xl font-black text-slate-800 dark:text-white tabular-nums">{stats.hospital}</p>
            </div>
            <div className="px-4 py-2">
              <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest">External</p>
              <p className="text-xl font-black text-slate-800 dark:text-white tabular-nums">{stats.external}</p>
            </div>
          </div>
          
          <button 
            onClick={() => setShowModal(true)}
            className="flex-1 xl:flex-none bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-[22px] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-blue-600/20 transition-all active:scale-95 flex items-center justify-center gap-3"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
            Register Professional
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </div>
          <input 
            type="text" 
            placeholder="Search by name, qualification, or department specialty..."
            className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all dark:text-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
        {filteredProfs.map(p => (
          <div key={p.id} className="group relative bg-white dark:bg-slate-900 rounded-[40px] p-8 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden">
             {/* Category Indicator Accent */}
             <div className={`absolute top-0 left-0 w-full h-2 transition-all duration-500 group-hover:h-3 ${p.category === 'Hospital' ? 'bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'bg-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.4)]'}`}></div>
             
             <div className="flex justify-between items-start mb-6">
                <div className="relative">
                   <div className={`w-16 h-16 rounded-3xl flex items-center justify-center text-2xl font-black shadow-inner ${p.category === 'Hospital' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600' : 'bg-amber-50 dark:bg-amber-900/30 text-amber-600'}`}>
                      {p.name.charAt(0)}
                   </div>
                   <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-lg flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-900 ${p.category === 'Hospital' ? 'bg-blue-600 text-white' : 'bg-amber-400 text-slate-900'}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                   </div>
                </div>

                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                   <button onClick={() => openEdit(p)} className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all shadow-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                   </button>
                   <button onClick={() => onDelete(p.id)} className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all shadow-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                   </button>
                </div>
             </div>

             <div className="space-y-4">
                <div>
                   <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-2 py-1 rounded-md ${p.category === 'Hospital' ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-600' : 'bg-amber-50 dark:bg-amber-900/40 text-amber-700'}`}>
                      {p.category === 'Out' ? `${p.outType}` : 'Institutional Consultant'}
                   </span>
                   <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-tight mt-3 truncate">{p.name}</h3>
                   <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1 truncate">{p.degree || 'Clinical Professional'}</p>
                </div>

                <div className="flex flex-col gap-3 py-4 border-y border-slate-50 dark:border-slate-800/50">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-blue-500 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">{p.phone || 'NO CONTACT'}</span>
                   </div>
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-emerald-500 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{p.id}</span>
                   </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                   <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${p.commissionEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{p.commissionEnabled ? 'Fee Active' : 'Fee Locked'}</span>
                   </div>
                   {p.commissionEnabled && (
                     <div className="bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-full">
                        <span className="text-xs font-black text-emerald-600">{p.commissionRate}%</span>
                     </div>
                   )}
                </div>
             </div>
          </div>
        ))}
        
        {filteredProfs.length === 0 && (
           <div className="col-span-full py-24 flex flex-col items-center justify-center opacity-30 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-4"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              <p className="text-xl font-black uppercase tracking-[0.2em]">No Professionals Matched</p>
           </div>
        )}
      </div>

      {/* REGISTRATION MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-[500] flex items-center justify-center p-4 overflow-y-auto">
           <div className="bg-white dark:bg-slate-900 rounded-[50px] shadow-[0_0_80px_-20px_rgba(37,99,235,0.4)] w-full max-w-2xl overflow-hidden animate-slide-up border border-white/20 dark:border-slate-800 my-auto">
              
              {/* Modal Header */}
              <div className="p-10 bg-slate-900 border-b border-white/5 relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] -mr-32 -mt-32"></div>
                 <div className="relative z-10 flex justify-between items-center">
                    <div>
                       <h3 className="text-3xl font-black text-white tracking-tight uppercase">
                          {editingPro ? 'Update Credentials' : 'New Professional'}
                       </h3>
                       <p className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.4em] mt-2">Clinical Personnel Management</p>
                    </div>
                    <button onClick={closeModal} className="w-14 h-14 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-[20px] text-slate-400 hover:text-white transition-all border border-white/10">
                       <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                 </div>
              </div>

              <form onSubmit={handleSubmit} className="p-10 space-y-10">
                 {/* Identity Section */}
                 <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em] flex items-center gap-3">
                       <span className="w-8 h-px bg-blue-600 dark:bg-blue-400"></span> 1. Identity & Credentials
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="md:col-span-2 space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Legal Name</label>
                          <div className="relative">
                            <input required 
                              className="w-full pl-6 pr-6 py-4 rounded-[22px] bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 font-black text-slate-800 dark:text-white outline-none focus:border-blue-500 transition-all text-sm placeholder:text-slate-300" 
                              value={formData.name} 
                              onChange={e => setFormData({...formData, name: e.target.value})} 
                              placeholder="e.g. Dr. Jonathan Smith" 
                            />
                          </div>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Academic Degree</label>
                          <input required 
                            className="w-full px-6 py-4 rounded-[22px] bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 font-bold text-slate-800 dark:text-white outline-none focus:border-blue-500 uppercase text-sm" 
                            value={formData.degree} 
                            onChange={e => setFormData({...formData, degree: e.target.value})} 
                            placeholder="e.g. MBBS, FCPS" 
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Direct Phone</label>
                          <input 
                            className="w-full px-6 py-4 rounded-[22px] bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 font-bold text-slate-800 dark:text-white outline-none focus:border-blue-500 text-sm" 
                            value={formData.phone} 
                            onChange={e => setFormData({...formData, phone: e.target.value})} 
                            placeholder="+8801..." 
                          />
                       </div>
                    </div>
                 </div>

                 {/* Categorization Section */}
                 <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em] flex items-center gap-3">
                       <span className="w-8 h-px bg-indigo-600 dark:bg-indigo-400"></span> 2. Categorization
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Staff Classification</label>
                          <select 
                            className="w-full px-6 py-4 rounded-[22px] bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 font-black text-slate-800 dark:text-white outline-none focus:border-blue-500 appearance-none cursor-pointer text-sm" 
                            value={formData.category} 
                            onChange={e => setFormData({...formData, category: e.target.value as any})}
                          >
                             <option value="Hospital">Internal Hospital Consultant</option>
                             <option value="Out">External Referral Partner</option>
                          </select>
                       </div>
                       {formData.category === 'Out' && (
                          <div className="space-y-2 animate-in slide-in-from-right-2 duration-300">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Partner Sub-Type</label>
                             <select 
                               className="w-full px-6 py-4 rounded-[22px] bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 font-black text-slate-800 dark:text-white outline-none focus:border-blue-500 appearance-none cursor-pointer text-sm" 
                               value={formData.outType} 
                               onChange={e => setFormData({...formData, outType: e.target.value as any})}
                             >
                                <option value="Doctor">Out Doctor</option>
                                <option value="Pharmacist">Community Pharmacist</option>
                                <option value="Field Refer">Field Referral Agent</option>
                             </select>
                          </div>
                       )}
                    </div>
                 </div>

                 {/* Commission Section */}
                 <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em] flex items-center gap-3">
                       <span className="w-8 h-px bg-emerald-600 dark:bg-emerald-400"></span> 3. Financial Agreement
                    </h4>
                    <div className="p-8 bg-slate-900 rounded-[35px] space-y-6 relative overflow-hidden">
                       <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[40px] -mr-16 -mt-16"></div>
                       <div className="flex items-center justify-between relative z-10">
                          <div>
                             <p className="text-white font-black text-sm uppercase tracking-tight">Fee Settlement System</p>
                             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Toggle automatic commission tracking</p>
                          </div>
                          <button 
                            type="button"
                            onClick={() => setFormData({...formData, commissionEnabled: !formData.commissionEnabled})}
                            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all shadow-inner ${formData.commissionEnabled ? 'bg-emerald-500' : 'bg-slate-700'}`}
                          >
                            <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-xl transition-transform ${formData.commissionEnabled ? 'translate-x-7' : 'translate-x-1'}`} />
                          </button>
                       </div>
                       
                       {formData.commissionEnabled && (
                          <div className="pt-6 border-t border-white/5 animate-in zoom-in-95 duration-300 relative z-10">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Service Commission Rate (%)</label>
                             <div className="relative">
                                <input 
                                  type="number" 
                                  max="100"
                                  className="w-full px-6 py-4 rounded-[20px] bg-white/5 border border-white/10 font-black text-emerald-400 text-3xl outline-none focus:border-emerald-500 transition-all placeholder:text-slate-800" 
                                  value={formData.commissionRate || ''} 
                                  onChange={e => setFormData({...formData, commissionRate: Number(e.target.value)})}
                                  placeholder="0"
                                />
                                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-700">%</span>
                             </div>
                             <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mt-4 leading-relaxed">System Rule: Applied globally to all diagnostic and consultation items billed under this professional unless item-specific rates override this value.</p>
                          </div>
                       )}
                    </div>
                 </div>

                 {/* Action Buttons */}
                 <div className="flex gap-4 pt-4">
                    <button type="button" onClick={closeModal} className="px-8 py-5 rounded-[24px] border-2 border-slate-100 dark:border-slate-800 text-slate-400 font-black uppercase tracking-widest text-[11px] hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">Abort</button>
                    <button type="submit" className="flex-1 bg-slate-900 dark:bg-blue-600 text-white py-5 rounded-[24px] font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl hover:bg-black dark:hover:bg-blue-700 transition-all active:scale-[0.98]">
                       {editingPro ? 'Execute File Update' : 'Finalize Registration'}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default ProfessionalManager;