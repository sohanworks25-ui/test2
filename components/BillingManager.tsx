
import React, { useState, useMemo, useEffect } from 'react';
import { Bill, Patient, ServiceItem, User, UserRole, BillItem, HospitalConfig, InvoiceType, PaymentMethod, Professional, PaymentRecord } from '../types';
import { storageService } from '../services/storageService';

interface BillingManagerProps {
  patients: Patient[];
  services: ServiceItem[];
  professionals: Professional[];
  bills: Bill[];
  currentUser: User;
  onGenerateBill: (bill: Bill) => void;
  onUpdateBill: (bill: Bill) => void;
  onDeleteBill: (id: string) => void;
  onReceiveDue: (billId: string, amount: number, discount?: number) => void;
  hospitalConfig: HospitalConfig;
}

const BillingManager: React.FC<BillingManagerProps> = ({ 
  patients, 
  services, 
  professionals, 
  bills, 
  currentUser, 
  onGenerateBill, 
  onUpdateBill, 
  onDeleteBill, 
  hospitalConfig 
}) => {
  const [showBillCreator, setShowBillCreator] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [isWalkIn, setIsWalkIn] = useState(true);
  const [serviceSearch, setServiceSearch] = useState('');
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState('All');
  
  const [selectedBillForPreview, setSelectedBillForPreview] = useState<Bill | null>(null);
  const [invoiceType, setInvoiceType] = useState<InvoiceType>('General');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [walkInName, setWalkInName] = useState('');
  const [walkInMobile, setWalkInMobile] = useState('');
  const [walkInAge, setWalkInAge] = useState<number>(0);
  const [walkInSex, setWalkInSex] = useState<'Male' | 'Female' | 'Other'>('Male');
  
  const [referringDoctorId, setReferringDoctorId] = useState('');
  const [consultantDoctorId, setConsultantDoctorId] = useState('');
  
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [discountInput, setDiscountInput] = useState(0);
  const [advanceReceived, setAdvanceReceived] = useState(0);

  const currency = hospitalConfig.currencySymbol || 'Tk';
  const isAdmin = currentUser.role === UserRole.SUPER_ADMIN || currentUser.role === UserRole.ADMIN;

  const currentInvoiceId = useMemo(() => {
    if (isEditing) return isEditing;
    return storageService.generateInvoiceId(bills);
  }, [bills, isEditing, showBillCreator]);

  const filteredBills = useMemo(() => {
    return bills.filter(b => {
      const bDate = b.date.split('T')[0];
      if (bDate < startDate || bDate > endDate) return false;
      if (statusFilter !== 'All' && b.status !== statusFilter) return false;
      if (invoiceSearch) {
        const q = invoiceSearch.toLowerCase();
        const p = patients.find(pat => pat.id === b.patientId);
        const match = (b.walkInName || p?.name || '').toLowerCase().includes(q) || b.id.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [bills, invoiceSearch, statusFilter, patients, startDate, endDate]);

  const resetForm = () => {
    setIsEditing(null); setBillItems([]); setDiscountInput(0); setAdvanceReceived(0);
    setReferringDoctorId(''); setConsultantDoctorId(''); setSelectedPatientId('');
    setWalkInName(''); setWalkInMobile(''); setWalkInAge(0); setWalkInSex('Male');
    setIsWalkIn(true); setInvoiceType('General'); setActiveCategory('All');
  };

  const openEditMode = (bill: Bill) => {
    setIsEditing(bill.id);
    setInvoiceType(bill.type);
    setIsWalkIn(!bill.patientId);
    setSelectedPatientId(bill.patientId || '');
    setWalkInName(bill.walkInName || '');
    setWalkInMobile(bill.walkInMobile || '');
    setWalkInAge(bill.walkInAge || 0);
    setWalkInSex(bill.walkInSex || 'Male');
    setReferringDoctorId(bill.referringDoctorId || '');
    setConsultantDoctorId(bill.consultantDoctorId || '');
    setBillItems(bill.items);
    setDiscountInput(bill.discount);
    setAdvanceReceived(bill.paidAmount);
    setPaymentMethod(bill.paymentMethod || 'Cash');
    setShowBillCreator(true);
  };

  const handleSaveBill = (e: React.FormEvent) => {
    e.preventDefault();
    if (billItems.length === 0) { alert("Institutional Error: Clinical selection required."); return; }
    
    const finalId = currentInvoiceId;
    if (!isEditing && bills.find(b => b.id === finalId)) {
        alert(`Registry Conflict: Auto-generated ID ${finalId} already exists. Please verify your system settings.`);
        return;
    }

    const gross = billItems.reduce((acc, item) => acc + item.total, 0);
    const net = gross - discountInput;
    const due = Math.max(0, net - advanceReceived);
    const status = due <= 0 ? 'paid' : (advanceReceived > 0 ? 'partial' : 'due');

    // Create payment history entry
    const billDate = isEditing ? bills.find(b => b.id === isEditing)?.date || new Date().toISOString() : new Date().toISOString();
    const payments: PaymentRecord[] = [];
    if (advanceReceived > 0) {
      payments.push({
        id: `PAY-${Date.now()}`,
        date: billDate,
        amount: advanceReceived,
        method: paymentMethod,
        note: isEditing ? 'Revised Advance' : 'Initial Payment'
      });
    }

    const billData: Bill = {
      id: finalId,
      type: invoiceType,
      patientId: isWalkIn ? undefined : selectedPatientId,
      walkInName: isWalkIn ? walkInName : undefined,
      walkInMobile: isWalkIn ? walkInMobile : undefined,
      walkInAge: isWalkIn ? walkInAge : undefined,
      walkInSex: isWalkIn ? walkInSex : undefined,
      referringDoctorId,
      consultantDoctorId,
      items: billItems,
      totalAmount: gross,
      discount: discountInput,
      paidAmount: advanceReceived,
      dueAmount: due,
      paymentMethod,
      payments,
      date: billDate,
      status,
      authorUsername: currentUser.username,
      authorName: currentUser.name
    };

    if (isEditing) onUpdateBill(billData); else onGenerateBill(billData);
    setSelectedBillForPreview(billData);
    setShowBillCreator(false);
    setShowPreview(true);
    resetForm();
  };

  const addServiceToBill = (service: ServiceItem) => {
    const existing = billItems.find(item => item.serviceId === service.id);
    if (existing) return;
    
    setBillItems([...billItems, { 
      id: `BI-${Date.now()}`, 
      serviceId: service.id, 
      name: service.name, 
      qty: 1, 
      price: service.price, 
      total: service.price, 
      commissionRate: service.commissionRate || 0 
    }]);
  };

  const removeServiceFromBill = (serviceId: string) => {
    setBillItems(prev => prev.filter(item => item.serviceId !== serviceId));
  };

  const filteredServices = useMemo(() => {
    return services.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(serviceSearch.toLowerCase());
      const matchesCat = activeCategory === 'All' || s.category === activeCategory;
      return matchesSearch && matchesCat;
    });
  }, [services, serviceSearch, activeCategory]);

  const billTotals = useMemo(() => {
    const gross = billItems.reduce((acc, i) => acc + i.total, 0);
    const net = gross - discountInput;
    return { gross, net, due: Math.max(0, net - advanceReceived) };
  }, [billItems, discountInput, advanceReceived]);

  const categories = useMemo(() => ['All', ...new Set(services.map(s => s.category))], [services]);

  return (
    <div className="space-y-4 animate-fade-in pb-10">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 no-print px-1">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Billing Control</h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none">Enterprise Financial Operating Console</p>
        </div>
        <button onClick={() => { resetForm(); setShowBillCreator(true); }} className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          Initialize Protocol
        </button>
      </header>

      <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row gap-3 no-print">
         <div className="flex-1 relative">
            <input type="text" placeholder="Audit History Lookup (Name/Protocol ID)..." className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border-none font-bold outline-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-blue-500/50 transition-all dark:text-white text-[11px]" value={invoiceSearch} onChange={e => setInvoiceSearch(e.target.value)} />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
         </div>
         <div className="flex items-center gap-2">
            <div className="flex gap-1 bg-slate-50 dark:bg-slate-800 p-1 rounded-xl ring-1 ring-slate-200 dark:ring-slate-700">
              <input type="date" className="bg-transparent border-none font-bold text-[10px] dark:text-white outline-none w-24" value={startDate} onChange={e => setStartDate(e.target.value)} />
              <input type="date" className="bg-transparent border-none font-bold text-[10px] dark:text-white outline-none w-24 border-l dark:border-slate-700 pl-1" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
            <select className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border-none font-black text-[9px] uppercase tracking-widest dark:text-white outline-none ring-1 ring-slate-200 dark:ring-slate-700" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
               <option value="All">All Protocols</option>
               <option value="paid">Settled</option>
               <option value="partial">Partial</option>
               <option value="due">Outstanding</option>
            </select>
         </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden no-print">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left min-w-[700px]">
            <thead className="bg-slate-900 text-slate-400">
              <tr>
                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400">Node ID</th>
                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400">Clinical Case / Referral</th>
                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-right text-slate-400">Net Settlement</th>
                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-center text-slate-400">Status</th>
                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-right text-slate-400">Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {filteredBills.map(b => (
                <tr key={b.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group">
                  <td className="px-4 py-2.5 font-mono text-[10px] font-black text-blue-600 uppercase">{b.id}</td>
                  <td className="px-4 py-2.5">
                    <p className="font-black text-slate-800 dark:text-slate-200 uppercase text-[10px] leading-tight">{b.walkInName || patients.find(p => p.id === b.patientId)?.name || 'Guest Subject'}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[8px] text-slate-400 font-bold uppercase">{new Date(b.date).toLocaleDateString()}</span>
                        {b.referringDoctorId && <span className="text-[8px] font-black text-blue-500 uppercase bg-blue-50 dark:bg-blue-900/30 px-1 rounded truncate max-w-[120px]">Ref: {professionals.find(p => p.id === b.referringDoctorId)?.name}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right font-black text-[12px] tabular-nums text-slate-700 dark:text-slate-300">{(b.totalAmount - b.discount).toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${b.status === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20' : 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/20'}`}>{b.status}</span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex justify-end gap-1.5">
                       <button onClick={() => { setSelectedBillForPreview(b); setShowPreview(true); }} className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg></button>
                       <button onClick={() => openEditMode(b)} className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg></button>
                       {isAdmin && <button onClick={() => onDeleteBill(b.id)} className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showBillCreator && (
         <div className="fixed inset-0 bg-slate-950/98 backdrop-blur-3xl z-[1000] flex items-center justify-center p-0 md:p-1 no-print overflow-hidden">
            <div className="bg-white dark:bg-slate-900 md:rounded-[24px] shadow-[0_0_100px_rgba(0,0,0,0.5)] w-full h-full md:h-[98vh] md:max-w-[1550px] overflow-hidden flex flex-col animate-slide-up border border-white/5">
               <div className="px-5 py-3 border-b dark:border-slate-800 flex justify-between items-center bg-slate-900 text-white shrink-0 relative z-20">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-black">
                       <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M9 12h6"/><path d="M9 16h6"/></svg>
                    </div>
                    <div>
                      <h3 className="text-[12px] font-black uppercase tracking-tight leading-none">{isEditing ? 'MODIFY PROTOCOL' : 'NEW BILLING PROTOCOL'}</h3>
                      <p className="text-[8px] font-bold text-blue-400 uppercase tracking-[0.4em] mt-1">SYSTEM_HMS_CORE_V4.2 • {currentUser.name}</p>
                    </div>
                  </div>
                  <button onClick={() => { setShowBillCreator(false); resetForm(); }} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-rose-600 transition-all border border-white/10 group">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                  </button>
               </div>
               
               <div className="flex-1 overflow-hidden flex flex-col lg:flex-row bg-slate-50 dark:bg-slate-950">
                  <div className="w-full lg:w-[450px] flex flex-col h-full border-r dark:border-slate-800 bg-white dark:bg-slate-900/50">
                     <div className="p-3 space-y-2.5 shrink-0 bg-white dark:bg-slate-900 border-b dark:border-slate-800">
                        <div className="relative group">
                           <input type="text" placeholder="Access Service Matrix..." className="w-full pl-8 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-blue-500 font-bold text-[10px] outline-none shadow-inner transition-all dark:text-white" value={serviceSearch} onChange={e => setServiceSearch(e.target.value)} />
                           <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-all" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                        </div>
                        <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar">
                           {categories.map(cat => (
                              <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all border shrink-0 ${activeCategory === cat ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-100 dark:border-slate-700'}`}>{cat}</button>
                           ))}
                        </div>
                     </div>
                     <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                           {filteredServices.map(s => (
                              <button key={s.id} type="button" onClick={() => addServiceToBill(s)} className="p-3 flex flex-col justify-between rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-blue-500 hover:shadow-lg transition-all text-left group min-h-[85px] relative overflow-hidden">
                                 <div className="mb-2 relative z-10">
                                    <span className="text-[7px] font-black text-blue-500 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded uppercase tracking-tighter">{s.category}</span>
                                    <h4 className="text-[10px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight mt-1.5 leading-tight line-clamp-2">{s.name}</h4>
                                 </div>
                                 <div className="flex justify-between items-center pt-2 border-t border-slate-50 dark:border-slate-700/50">
                                    <p className="text-[11px] font-black tabular-nums">{s.price.toLocaleString()} <span className="text-[7px] text-slate-400 uppercase">{currency}</span></p>
                                    <div className="w-5 h-5 bg-blue-600 text-white rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M5 12h14"/><path d="M12 5v14"/></svg></div>
                                 </div>
                              </button>
                           ))}
                        </div>
                     </div>
                  </div>

                  <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 border-r dark:border-slate-800">
                     <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
                        <section className="space-y-3">
                           <div className="flex justify-between items-center px-1">
                              <h4 className="text-[9px] font-black text-blue-600 uppercase tracking-[0.4em] flex items-center gap-3">
                                 <span className="w-6 h-px bg-blue-600"></span> Node Identification
                              </h4>
                           </div>
                           <div className="bg-white dark:bg-slate-900 p-5 rounded-[28px] border border-slate-100 dark:border-slate-800 space-y-4 shadow-sm">
                              <div className="space-y-1">
                                 <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1 leading-none">Invoice Reference ID</label>
                                 <div className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-transparent font-mono font-black text-[11px] uppercase text-slate-500 shadow-inner">
                                    {currentInvoiceId}
                                 </div>
                                 <p className="text-[7px] text-slate-400 italic ml-1 uppercase">Controlled via system configuration.</p>
                              </div>

                              <div className="flex gap-1 p-1 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 shadow-inner mt-4">
                                 <button type="button" onClick={() => setIsWalkIn(true)} className={`flex-1 py-1.5 rounded-lg font-black text-[8px] uppercase transition-all ${isWalkIn ? 'bg-slate-900 text-white' : 'text-slate-400'}`}>Casualty</button>
                                 <button type="button" onClick={() => setIsWalkIn(false)} className={`flex-1 py-1.5 rounded-lg font-black text-[8px] uppercase transition-all ${!isWalkIn ? 'bg-slate-900 text-white' : 'text-slate-400'}`}>MRN Registry</button>
                              </div>

                              {isWalkIn ? (
                                 <div className="space-y-3 animate-in fade-in duration-300">
                                    <div className="space-y-1">
                                       <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1 leading-none">Full Legal Name</label>
                                       <input required className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-black text-slate-800 dark:text-white outline-none focus:border-blue-500 text-[11px] uppercase shadow-inner" placeholder="IDENTIFICATION NAME..." value={walkInName} onChange={e => setWalkInName(e.target.value)} />
                                    </div>
                                    <div className="grid grid-cols-3 gap-3">
                                       <div className="space-y-1">
                                          <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1 leading-none">Age (Yrs)</label>
                                          <input type="number" className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-black text-[11px] outline-none shadow-inner" value={walkInAge || ''} onChange={e => setWalkInAge(Number(e.target.value))} placeholder="0" />
                                       </div>
                                       <div className="space-y-1">
                                          <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1 leading-none">Gender</label>
                                          <select className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-black text-[11px] outline-none cursor-pointer shadow-inner" value={walkInSex} onChange={e => setWalkInSex(e.target.value as any)}><option>Male</option><option>Female</option><option>Other</option></select>
                                       </div>
                                       <div className="space-y-1">
                                          <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1 leading-none">Contact</label>
                                          <input className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-black text-[11px] outline-none shadow-inner" placeholder="+880..." value={walkInMobile} onChange={e => setWalkInMobile(e.target.value)} />
                                       </div>
                                    </div>
                                 </div>
                              ) : (
                                 <div className="space-y-1 animate-in fade-in duration-300 py-1">
                                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1 leading-none">Registered Subject (Query MRN)</label>
                                    <select required className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-black text-[11px] appearance-none cursor-pointer shadow-inner" value={selectedPatientId} onChange={e => setSelectedPatientId(e.target.value)}>
                                       <option value="">Search MRN Registry...</option>
                                       {patients.map(p => <option key={p.id} value={p.id}>{p.name} [ID: {p.id}]</option>)}
                                    </select>
                                 </div>
                              )}
                           </div>
                        </section>

                        <section className="space-y-3">
                           <h4 className="text-[9px] font-black text-indigo-600 uppercase tracking-[0.4em] flex items-center gap-3">
                              <span className="w-6 h-px bg-indigo-600"></span> Clinical Assignment (Doctors)
                           </h4>
                           <div className="bg-white dark:bg-slate-900 p-5 rounded-[28px] border border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4 shadow-sm">
                              <div className="space-y-1">
                                 <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1 leading-none">Referring Doctor / Unit</label>
                                 <select className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-black text-[11px] truncate outline-none cursor-pointer shadow-inner" value={referringDoctorId} onChange={e => setReferringDoctorId(e.target.value)}>
                                    <option value="">Search Referral Network...</option>
                                    {professionals.map(p => <option key={p.id} value={p.id}>{p.name} ({p.degree || 'External'})</option>)}
                                 </select>
                              </div>
                              <div className="space-y-1">
                                 <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1 leading-none">Attending Consultant</label>
                                 <select className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-black text-[11px] truncate outline-none cursor-pointer shadow-inner" value={consultantDoctorId} onChange={e => setConsultantDoctorId(e.target.value)}>
                                    <option value="">Search Internal Staff...</option>
                                    {professionals.filter(p => p.category === 'Hospital').map(p => <option key={p.id} value={p.id}>{p.name} ({p.degree})</option>)}
                                 </select>
                              </div>
                           </div>
                        </section>

                        <section className="space-y-3">
                           <div className="flex justify-between items-center px-1">
                              <h4 className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.4em] flex items-center gap-3">
                                 <span className="w-6 h-px bg-emerald-600"></span> Clinical Basket
                              </h4>
                              {billItems.length > 0 && <button type="button" onClick={() => setBillItems([])} className="text-[8px] font-black text-rose-500 uppercase px-2 py-0.5 rounded-lg hover:bg-rose-50 transition-all">Flush Basket</button>}
                           </div>
                           <div className="max-h-[220px] overflow-y-auto custom-scrollbar space-y-1.5 pr-1">
                              {billItems.length === 0 ? (
                                 <div className="py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[30px] text-center opacity-30"><p className="text-[10px] font-black uppercase tracking-[0.3em]">No Selection Recorded</p></div>
                              ) : (
                                 billItems.map(item => (
                                    <div key={item.serviceId} className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between group shadow-sm transition-all hover:border-blue-200">
                                       <div className="flex-1 overflow-hidden pr-3">
                                          <p className="text-[11px] font-black text-slate-800 dark:text-slate-100 uppercase truncate leading-none">{item.name}</p>
                                          <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase tracking-widest leading-none">Rate: {item.price.toLocaleString()} • QTY: {item.qty}</p>
                                       </div>
                                       <div className="flex items-center gap-4 shrink-0">
                                          <p className="text-[12px] font-black text-slate-900 dark:text-white tabular-nums">{item.total.toLocaleString()}</p>
                                          <button type="button" onClick={() => removeServiceFromBill(item.serviceId)} className="p-2 text-rose-300 hover:text-rose-600 transition-all"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>
                                       </div>
                                    </div>
                                 ))
                              )}
                           </div>
                        </section>
                     </div>
                  </div>

                  <div className="w-full lg:w-[420px] flex flex-col h-full bg-slate-900 relative shadow-2xl overflow-hidden border-l border-white/5">
                     <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                        <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em] leading-none mb-6">Financial Telemetry</h4>
                        <div className="space-y-5">
                           <div className="bg-white/5 rounded-[32px] p-6 border border-white/5 flex justify-between items-center shadow-inner relative overflow-hidden">
                              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/5 blur-3xl"></div>
                              <div>
                                 <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Gross Liability</p>
                                 <h2 className="text-3xl font-black text-white tabular-nums tracking-tighter">{billTotals.gross.toLocaleString()} <span className="text-xs opacity-30 font-bold ml-1">{currency}</span></h2>
                              </div>
                              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-blue-500"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                              </div>
                           </div>
                           <div className="space-y-2">
                              <label className="text-[9px] font-black text-rose-400 uppercase tracking-[0.2em] ml-2 leading-none">Adjustment / Discount</label>
                              <div className="relative">
                                 <div className="absolute left-6 top-1/2 -translate-y-1/2 text-rose-500 font-black text-sm">{currency}</div>
                                 <input type="number" className="w-full pl-14 pr-8 py-4 rounded-[22px] bg-white/5 border border-white/10 text-rose-500 font-black text-xl outline-none focus:ring-4 focus:ring-rose-500/10 transition-all placeholder:text-slate-800 shadow-inner" value={discountInput || ''} onChange={e => setDiscountInput(Number(e.target.value))} placeholder="0" />
                              </div>
                           </div>
                           <div className="space-y-2">
                              <label className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.2em] ml-2 leading-none">Advance Settlement</label>
                              <div className="relative">
                                 <div className="absolute left-6 top-1/2 -translate-y-1/2 text-emerald-500 font-black text-sm">{currency}</div>
                                 <input type="number" className="w-full pl-14 pr-8 py-5 rounded-[22px] bg-white/5 border border-white/10 text-emerald-400 font-black text-2xl outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all placeholder:text-slate-800 shadow-inner" value={advanceReceived || ''} onChange={e => setAdvanceReceived(Number(e.target.value))} placeholder="0" />
                              </div>
                           </div>
                           <div className={`p-6 rounded-[32px] border-2 transition-all duration-700 flex flex-col relative overflow-hidden ${billTotals.due > 0 ? 'bg-rose-500/10 border-rose-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
                              <div className="flex justify-between items-end relative z-10">
                                 <div>
                                    <p className={`text-[9px] font-black uppercase tracking-widest leading-none mb-1 ${billTotals.due > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>Protocol Balance</p>
                                    <p className={`text-4xl font-black tabular-nums tracking-tighter ${billTotals.due > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>{billTotals.due.toLocaleString()}</p>
                                 </div>
                                 <div className="text-right">
                                    <select className="bg-transparent text-white font-black text-[10px] uppercase outline-none cursor-pointer hover:text-blue-400 transition-colors" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as any)}>
                                       <option className="text-slate-900" value="Cash">Cash Settlement</option>
                                       <option className="text-slate-900" value="Card">Card Terminal</option>
                                       <option className="text-slate-900" value="Mobile Banking">Digital Wallet</option>
                                    </select>
                                 </div>
                              </div>
                              <div className={`absolute -bottom-10 -right-10 w-32 h-32 blur-3xl opacity-20 ${billTotals.due > 0 ? 'bg-rose-500' : 'bg-emerald-500'}`}></div>
                           </div>
                        </div>
                     </div>
                     <div className="shrink-0 p-6 border-t border-white/5 bg-slate-900/80 backdrop-blur-xl z-30 shadow-[0_-20px_50px_rgba(0,0,0,0.4)]">
                        <button type="button" onClick={handleSaveBill} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-[12px] uppercase tracking-[0.4em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3 border border-white/10 group">
                           {isEditing ? 'COMMIT UPDATES' : 'FINALIZE PROTOCOL'}
                           <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" className="group-hover:translate-x-2 transition-transform duration-500"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                        </button>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      )}

      {showPreview && selectedBillForPreview && (
         <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[1100] flex items-center justify-center p-2 no-print overflow-y-auto">
            <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-[600px] overflow-hidden flex flex-col my-auto border border-white/20">
               <div className="p-4 bg-slate-900 flex justify-between items-center text-white shrink-0">
                  <div className="flex items-center gap-3">
                     <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-black text-[10px] shadow-lg">A5</div>
                     <div><h4 className="font-black text-xs uppercase tracking-tight">Medical Invoice</h4><p className="text-[7px] font-bold text-slate-500 uppercase tracking-widest">{selectedBillForPreview.id}</p></div>
                  </div>
                  <div className="flex items-center gap-2">
                     <button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 px-5 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all flex items-center gap-2 shadow-xl active:scale-95"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg> PRINT</button>
                     <button onClick={() => { setShowPreview(false); setSelectedBillForPreview(null); }} className="p-2.5 bg-white/5 hover:bg-rose-600 rounded-xl transition-all"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>
                  </div>
               </div>

               <div className="flex-1 bg-slate-100 flex items-center justify-center p-4 overflow-y-auto custom-scrollbar">
                  <div id="invoice-printable" className="bg-white text-slate-900 shadow-2xl p-[12mm] invoice-a5-layout relative">
                     <div className="flex justify-between items-start border-b-[1pt] border-slate-900 pb-4 mb-6">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-slate-900 text-white rounded-lg flex items-center justify-center font-black italic text-lg uppercase">{hospitalConfig.logo ? <img src={hospitalConfig.logo} className="w-full h-full object-contain" /> : 'SH'}</div>
                           <div>
                              <h1 className="text-sm font-black uppercase tracking-tight leading-none">{hospitalConfig.name}</h1>
                              <p className="text-[7px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 leading-none">{hospitalConfig.tagline}</p>
                              <p className="text-[6px] font-medium text-slate-400 mt-1 max-w-[150px] leading-tight uppercase tracking-tighter">{hospitalConfig.address}</p>
                              <p className="text-[6px] font-black text-slate-500 mt-0.5 uppercase tracking-tighter">Phone: {hospitalConfig.phone}</p>
                           </div>
                        </div>
                        <div className="text-right">
                           <h2 className="text-[9px] font-black uppercase text-blue-600 tracking-[0.2em] mb-1">Invoice</h2>
                           <p className="text-[7px] font-black text-slate-400 uppercase tracking-tighter leading-none">NO: <span className="text-slate-900">{selectedBillForPreview.id}</span></p>
                           <p className="text-[7px] font-bold text-slate-500 leading-none">{new Date(selectedBillForPreview.date).toLocaleDateString()}</p>
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-6 mb-6 py-3 px-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="space-y-0.5">
                           <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Clinical Subject</p>
                           <h3 className="text-[11px] font-black uppercase truncate">{selectedBillForPreview.walkInName || patients.find(p => p.id === selectedBillForPreview.patientId)?.name || 'Guest Patient'}</h3>
                           <p className="text-[8px] font-bold text-slate-600 uppercase leading-none">{selectedBillForPreview.walkInAge || patients.find(p => p.id === selectedBillForPreview.patientId)?.age}Y • {selectedBillForPreview.walkInSex || patients.find(p => p.id === selectedBillForPreview.patientId)?.sex} {selectedBillForPreview.patientId && ` • MRN:${selectedBillForPreview.patientId}`}</p>
                           <p className="text-[8px] font-bold text-slate-600 uppercase leading-none mt-1">Phone: <span className="text-slate-700">{selectedBillForPreview.walkInMobile || patients.find(p => p.id === selectedBillForPreview.patientId)?.mobile || 'NOT RECORDED'}</span></p>
                        </div>
                        <div className="text-right space-y-0.5">
                           {selectedBillForPreview.referringDoctorId && (
                             <p className="text-[7px] font-black uppercase text-slate-400 mt-1">Ref: <span className="text-slate-700">{professionals.find(p => p.id === selectedBillForPreview.referringDoctorId)?.name}</span></p>
                           )}
                           {selectedBillForPreview.consultantDoctorId && (
                             <p className="text-[7px] font-black uppercase text-slate-400 mt-0.5">Con: <span className="text-slate-700">{professionals.find(p => p.id === selectedBillForPreview.consultantDoctorId)?.name}</span></p>
                           )}
                        </div>
                     </div>

                     <div className="min-h-[50mm]">
                        <table className="w-full text-left">
                           <thead><tr className="border-b-[0.5pt] border-slate-900"><th className="py-1.5 text-[7px] font-black uppercase tracking-widest">Clinical Service</th><th className="py-1.5 text-[7px] font-black uppercase tracking-widest text-center">Qty</th><th className="py-1.5 text-[7px] font-black uppercase tracking-widest text-right">Aggregate</th></tr></thead>
                           <tbody className="divide-y divide-slate-100">
                              {selectedBillForPreview.items.map((item, idx) => (<tr key={idx}><td className="py-2 font-black uppercase text-[9px] text-slate-800 leading-none">{item.name}</td><td className="py-2 text-center text-[9px] font-bold text-slate-500">{item.qty}</td><td className="py-2 text-right font-black text-[9px] tabular-nums">{item.total.toLocaleString()}</td></tr>))}
                           </tbody>
                        </table>
                     </div>

                     <div className="flex justify-end pt-4 border-t border-slate-100">
                        <div className="w-[50mm] space-y-1.5">
                           <div className="flex justify-between text-slate-500"><span className="text-[7px] font-black uppercase tracking-widest">Gross Total</span><span className="text-[9px] font-bold">{selectedBillForPreview.totalAmount.toLocaleString()}</span></div>
                           <div className="flex justify-between text-rose-500"><span className="text-[7px] font-black uppercase tracking-widest">Adjustments</span><span className="text-[9px] font-black">-{selectedBillForPreview.discount.toLocaleString()}</span></div>
                           <div className="flex justify-between items-center border-t border-slate-900 pt-2 mt-1"><span className="text-[7px] font-black uppercase tracking-widest text-slate-500">Net Paid</span><span className="text-[11px] font-black tabular-nums text-slate-900">{selectedBillForPreview.paidAmount.toLocaleString()} {currency}</span></div>
                           {selectedBillForPreview.dueAmount > 0 && (<div className="flex justify-between items-center text-rose-600 px-1 pt-0.5"><span className="text-[7px] font-black uppercase tracking-widest">Protocol Balance</span><span className="text-[10px] font-black">{selectedBillForPreview.dueAmount.toLocaleString()}</span></div>)}
                        </div>
                     </div>

                     <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-4">
                        <div className="flex flex-col justify-end">
                            <div className="border-t border-slate-900 pt-1 text-center"><p className="text-[6px] font-black uppercase text-slate-900 tracking-widest">Authorized Signature</p></div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      )}

      <style>{`
        .invoice-a5-layout { width: 148mm; min-height: 210mm; margin: 0 auto; }
        @media screen and (max-width: 640px) { .invoice-a5-layout { width: 100%; min-height: auto; padding: 15px !important; } }
        @media print {
          @page { size: A5; margin: 0; }
          body * { visibility: hidden; background: white !important; }
          #invoice-printable, #invoice-printable * { visibility: visible; }
          #invoice-printable { position: absolute; left: 0; top: 0; width: 148mm !important; height: 210mm !important; padding: 10mm !important; margin: 0 !important; box-shadow: none !important; border: none !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .bg-slate-50 { background-color: #f8fafc !important; }
          .bg-slate-900 { background-color: #0f172a !important; }
          .text-white { color: white !important; }
          .text-blue-600 { color: #2563eb !important; }
          .text-rose-600 { color: #e11d48 !important; }
        }
      `}</style>
    </div>
  );
};

export default BillingManager;
