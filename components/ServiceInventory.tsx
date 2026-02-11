import React, { useState, useMemo } from 'react';
import { ServiceItem, User, UserRole, HospitalConfig, ServiceCategory } from '../types';

interface ServiceInventoryProps {
  services: ServiceItem[];
  categories: ServiceCategory[];
  onAddService: (service: ServiceItem) => void;
  onUpdateService: (service: ServiceItem) => void;
  onDeleteService: (id: string) => void;
  onAddCategory: (cat: ServiceCategory) => void;
  onUpdateCategory: (cat: ServiceCategory) => void;
  onDeleteCategory: (id: string) => void;
  currentUser: User;
  hospitalConfig: HospitalConfig;
}

const ServiceInventory: React.FC<ServiceInventoryProps> = ({ 
  services, 
  categories,
  onAddService, 
  onUpdateService, 
  onDeleteService, 
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  currentUser, 
  hospitalConfig 
}) => {
  const [activeMenu, setActiveMenu] = useState<'list' | 'categories'>('list');
  const [showModal, setShowModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null);
  
  // Filtering States
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilterCategory, setActiveFilterCategory] = useState<string>('All');

  const [formData, setFormData] = useState<Partial<ServiceItem>>({
    name: '',
    category: categories[0]?.name || '',
    price: 0,
    commissionRate: 0
  });

  const [newCatName, setNewCatName] = useState('');

  const currency = hospitalConfig.currencySymbol || 'Tk';
  const isAdmin = currentUser.role === UserRole.SUPER_ADMIN || currentUser.role === UserRole.ADMIN;

  // Filter Logic
  const filteredServices = useMemo(() => {
    return services.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeFilterCategory === 'All' || s.category === activeFilterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [services, searchQuery, activeFilterCategory]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingService) {
      onUpdateService({
        ...editingService,
        name: formData.name || '',
        category: formData.category || categories[0]?.name || '',
        price: Number(formData.price) || 0,
        commissionRate: Number(formData.commissionRate) || 0
      });
    } else {
      const newService: ServiceItem = {
        id: `S-${Date.now()}`,
        name: formData.name || '',
        category: formData.category || categories[0]?.name || '',
        price: Number(formData.price) || 0,
        commissionRate: Number(formData.commissionRate) || 0
      };
      onAddService(newService);
    }
    closeModal();
  };

  const handleCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newCatName.trim();
    if (!trimmedName) return;
    
    const exists = categories.some(c => 
      c.name.toLowerCase() === trimmedName.toLowerCase() && 
      (editingCategory ? c.id !== editingCategory.id : true)
    );
    
    if (exists) {
      alert("Error: This category name already exists.");
      return;
    }

    if (editingCategory) {
      onUpdateCategory({
        ...editingCategory,
        name: trimmedName
      });
    } else {
      onAddCategory({
        id: `CAT-${Date.now()}`,
        name: trimmedName
      });
    }
    
    closeCategoryModal();
  };

  const openEditCategory = (cat: ServiceCategory) => {
    setEditingCategory(cat);
    setNewCatName(cat.name);
    setShowCategoryModal(true);
  };

  const closeCategoryModal = () => {
    setShowCategoryModal(false);
    setEditingCategory(null);
    setNewCatName('');
  };

  const openEdit = (service: ServiceItem) => {
    setEditingService(service);
    setFormData(service);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingService(null);
    setFormData({ name: '', category: categories[0]?.name || '', price: 0, commissionRate: 0 });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* HEADER AREA */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight uppercase">Service Catalog</h2>
          <p className="text-sm text-slate-500 font-medium">Standardized pricing and commission configuration</p>
        </div>
        <div className="flex w-full lg:w-auto gap-3">
          <button 
            onClick={() => { setEditingCategory(null); setNewCatName(''); setShowCategoryModal(true); }}
            className="flex-1 lg:flex-none bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-blue-600 text-slate-600 dark:text-slate-400 hover:text-blue-600 px-6 py-4 rounded-[20px] transition-all flex items-center justify-center gap-3 font-bold uppercase tracking-widest text-[10px]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
            Add Category
          </button>
          <button 
            onClick={() => { setEditingService(null); setFormData({ name: '', category: categories[0]?.name || '', price: 0, commissionRate: 0 }); setShowModal(true); }}
            className="flex-1 lg:flex-none bg-slate-900 dark:bg-blue-600 hover:bg-black dark:hover:bg-blue-700 text-white px-8 py-4 rounded-[20px] transition-all flex items-center justify-center gap-3 shadow-2xl shadow-slate-900/10 active:scale-95 font-bold uppercase tracking-widest text-[10px]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
            Register Service
          </button>
        </div>
      </div>

      {/* TABS MENU */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 no-print">
         <button 
            onClick={() => setActiveMenu('list')}
            className={`px-8 py-4 text-[10px] font-black uppercase tracking-widest transition-all relative ${activeMenu === 'list' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
         >
            Service Directory
            {activeMenu === 'list' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full"></div>}
         </button>
         <button 
            onClick={() => setActiveMenu('categories')}
            className={`px-8 py-4 text-[10px] font-black uppercase tracking-widest transition-all relative ${activeMenu === 'categories' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
         >
            Inventory Groups
            {activeMenu === 'categories' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full"></div>}
         </button>
      </div>

      {activeMenu === 'list' ? (
        <div className="space-y-6">
          {/* FILTER CONTROLS */}
          <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm p-4 md:p-6 space-y-6">
            <div className="flex flex-col md:flex-row gap-4">
               <div className="relative flex-1">
                 <input 
                   type="text" 
                   placeholder="Search by service name..." 
                   className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 font-bold outline-none ring-2 ring-transparent focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                   value={searchQuery}
                   onChange={e => setSearchQuery(e.target.value)}
                 />
                 <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
               </div>
               
               <div className="flex flex-wrap items-center gap-2">
                 <button 
                   onClick={() => setActiveFilterCategory('All')}
                   className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 flex items-center gap-2 ${activeFilterCategory === 'All' ? 'bg-blue-600 text-white border-blue-600 shadow-lg' : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-50 dark:border-slate-800 hover:border-slate-200'}`}
                 >
                   All
                   <span className={`px-1.5 py-0.5 rounded-md text-[8px] ${activeFilterCategory === 'All' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>{services.length}</span>
                 </button>
                 {categories.map(cat => {
                   const count = services.filter(s => s.category === cat.name).length;
                   return (
                     <button 
                       key={cat.id}
                       onClick={() => setActiveFilterCategory(cat.name)}
                       className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 flex items-center gap-2 ${activeFilterCategory === cat.name ? 'bg-blue-600 text-white border-blue-600 shadow-lg' : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-50 dark:border-slate-800 hover:border-slate-200'}`}
                     >
                       {cat.name}
                       <span className={`px-1.5 py-0.5 rounded-md text-[8px] ${activeFilterCategory === cat.name ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>{count}</span>
                     </button>
                   );
                 })}
               </div>
            </div>
          </div>

          {/* SERVICE TABLE */}
          <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left min-w-[800px]">
                <thead className="bg-slate-900 border-b border-slate-800">
                  <tr>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Service Group</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Clinical Description</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Unit Price</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Incentive %</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Audit Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {filteredServices.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/80 transition-colors group">
                      <td className="px-8 py-5">
                        <span className="text-[9px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                          {s.category}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <p className="font-black text-slate-800 dark:text-slate-100 text-sm uppercase tracking-tight">{s.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">UID: {s.id}</p>
                      </td>
                      <td className="px-8 py-5 text-center">
                        <p className="text-sm font-black text-slate-900 dark:text-slate-100">{s.price.toLocaleString()} <span className="text-[10px] text-slate-400">{currency}</span></p>
                      </td>
                      <td className="px-8 py-5 text-center">
                        <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full text-xs font-black">{s.commissionRate}%</span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => openEdit(s)}
                            className="p-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl transition-all active:scale-90"
                            title="Modify Specification"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                          </button>
                          {isAdmin && (
                            <button 
                              onClick={() => onDeleteService(s.id)}
                              className="p-3 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-500 rounded-2xl transition-all active:scale-90"
                              title="Purge Service"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredServices.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-32 text-center">
                        <div className="flex flex-col items-center justify-center opacity-20">
                          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-4"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 7h10"/><path d="M7 12h10"/><path d="M7 17h10"/></svg>
                          <p className="text-xl font-black uppercase tracking-[0.2em] text-slate-800 dark:text-slate-100">Catalog Result Empty</p>
                          <p className="text-sm font-bold uppercase mt-2 italic text-slate-500">Try adjusting your search or category filters</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* DEDICATED CATEGORY MANAGEMENT MENU VIEW */
        <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm p-8 md:p-12 animate-fade-in max-w-4xl mx-auto w-full">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
              <div>
                <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight uppercase">Group Management</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Define clinical groups for institutional billing</p>
              </div>
              <button 
                onClick={() => { setEditingCategory(null); setNewCatName(''); setShowCategoryModal(true); }}
                className="bg-blue-600 text-white px-8 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-900/20 active:scale-95 flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                New Group
              </button>
           </div>
           
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {categories.map(cat => {
                const count = services.filter(s => s.category === cat.name).length;
                return (
                  <div key={cat.id} className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 group hover:border-blue-200 dark:hover:border-blue-900/50 transition-all">
                     <div>
                        <span className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight block">{cat.name}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{count} Linked Services</span>
                     </div>
                     <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => openEditCategory(cat)}
                          className="p-3 text-slate-400 hover:text-blue-500 transition-all active:scale-90 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800"
                          title="Rename Group"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                        </button>
                        <button 
                          onClick={() => onDeleteCategory(cat.id)}
                          className="p-3 text-slate-400 hover:text-rose-500 transition-all active:scale-90 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800"
                          title="Purge Category"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                        </button>
                     </div>
                  </div>
                );
              })}
           </div>
           
           <div className="p-6 bg-amber-50 dark:bg-amber-900/10 rounded-3xl border border-amber-100 dark:border-amber-800/50 flex gap-4 mt-12 items-center">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-800/20 flex items-center justify-center text-amber-600 shrink-0">
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              </div>
              <p className="text-[10px] text-amber-700 dark:text-amber-500 font-bold leading-relaxed italic uppercase tracking-tight">System Policy: Renaming a group updates all linked services. Categories actively assigned to services cannot be deleted. Reassign services to purge a specific group.</p>
           </div>
        </div>
      )}

      {/* SERVICE REGISTRATION MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[500] flex items-center justify-center p-2 md:p-4 overflow-y-auto custom-scrollbar">
          <div className="bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 my-auto border border-white/20 dark:border-slate-800">
            <div className="p-6 md:p-10 bg-slate-900 border-b border-white/5 flex justify-between items-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[60px] -mr-16 -mt-16"></div>
              <div className="relative z-10">
                <h3 className="text-2xl font-black text-white tracking-tight">{editingService ? 'Modify Specification' : 'Register New Service'}</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Institutional Pricing Protocol</p>
              </div>
              <button onClick={closeModal} className="relative z-10 w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-2xl text-slate-400 hover:text-white transition-all border border-white/10">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 md:p-10 space-y-8 bg-white dark:bg-slate-900">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                <div className="md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">Clinical Identification</label>
                  <input 
                    required 
                    type="text" 
                    className="w-full px-6 py-4 rounded-[20px] bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none font-black text-slate-800 dark:text-slate-100 transition-all text-sm placeholder:text-slate-300"
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    placeholder="e.g. ULTRA SONOGRAM (ABDOMEN)" 
                  />
                </div>
                
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">Inventory Category</label>
                  <div className="flex gap-2">
                    <select 
                      required
                      className="flex-1 px-6 py-4 rounded-[20px] bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 focus:border-blue-500 outline-none font-black text-slate-700 dark:text-slate-200 text-sm appearance-none cursor-pointer transition-all"
                      value={formData.category} 
                      onChange={e => setFormData({...formData, category: e.target.value})}
                    >
                      <option value="">Select Category...</option>
                      {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                    </select>
                    <button 
                      type="button"
                      onClick={() => { setEditingCategory(null); setNewCatName(''); setShowCategoryModal(true); }}
                      className="p-4 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-[20px] text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all shadow-sm"
                      title="Add New Category"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">Rate ({currency})</label>
                    <input 
                      required 
                      type="number" 
                      className="w-full px-6 py-4 rounded-[20px] bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 focus:border-emerald-500 outline-none font-black text-slate-900 dark:text-slate-100 text-lg transition-all"
                      value={formData.price || ''} 
                      onChange={e => setFormData({...formData, price: Number(e.target.value)})} 
                      placeholder="0.00"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">Incentive %</label>
                    <input 
                      required 
                      type="number" 
                      max="100"
                      className="w-full px-6 py-4 rounded-[20px] bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 focus:border-blue-500 outline-none font-black text-blue-600 dark:text-blue-400 text-lg transition-all"
                      value={formData.commissionRate || ''} 
                      onChange={e => setFormData({...formData, commissionRate: Number(e.target.value)})} 
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-900 rounded-[32px] text-white flex flex-col sm:flex-row justify-between items-center gap-6 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[40px] -mr-16 -mt-16"></div>
                <div className="relative z-10 text-center sm:text-left">
                   <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] mb-1">Fee Calculation Preview</p>
                   <p className="text-xs font-bold text-slate-300">Doctor's Incentive: <span className="text-emerald-400 font-black tracking-widest">{( (formData.price || 0) * (formData.commissionRate || 0) / 100).toLocaleString()} {currency}</span></p>
                </div>
                <div className="relative z-10 flex gap-4 w-full sm:w-auto">
                  <button type="button" onClick={closeModal} className="flex-1 sm:flex-none px-6 py-4 rounded-2xl border border-white/10 text-slate-400 font-bold hover:bg-white/5 transition-all text-[10px] uppercase tracking-widest">Abort</button>
                  <button type="submit" className="flex-1 sm:flex-none px-8 py-4 rounded-2xl bg-white text-slate-900 font-black shadow-xl transition-all active:scale-95 text-[10px] uppercase tracking-widest">
                    {editingService ? 'Commit Changes' : 'Execute Registration'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CATEGORY MODAL */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[600] flex items-center justify-center p-4">
           <div className="bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-white/10 dark:border-slate-800">
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-between items-center">
                 <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight uppercase">
                   {editingCategory ? 'Modify Service Group' : 'New Service Group'}
                 </h3>
                 <button onClick={closeCategoryModal} className="p-2 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                 </button>
              </div>
              <form onSubmit={handleCategorySubmit} className="p-8 space-y-6 bg-white dark:bg-slate-900">
                 <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Group Title</label>
                    <input 
                      required 
                      autoFocus
                      type="text" 
                      placeholder="e.g. Cardiology, Hematology" 
                      className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 font-black text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 uppercase"
                      value={newCatName}
                      onChange={e => setNewCatName(e.target.value)}
                    />
                 </div>
                 <button type="submit" className="w-full py-5 bg-slate-900 dark:bg-blue-600 text-white rounded-[24px] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-black dark:hover:bg-blue-700 transition-all active:scale-[0.98]">
                    {editingCategory ? 'Update Group Title' : 'Initialize Group'}
                 </button>
                 <button type="button" onClick={closeCategoryModal} className="w-full text-slate-400 font-bold py-2 hover:text-slate-600 transition-all uppercase tracking-widest text-[10px]">Cancel</button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default ServiceInventory;