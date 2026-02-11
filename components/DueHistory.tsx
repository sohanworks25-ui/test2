
import React, { useState, useMemo, useEffect } from 'react';
import { Bill, Patient, HospitalConfig, User, AdmittedPatient, Professional } from '../types';

interface DueHistoryProps {
  bills: Bill[];
  patients: Patient[];
  hospitalConfig: HospitalConfig;
  staff: User[];
  professionals: Professional[]; 
  admissions: AdmittedPatient[];
  initialSearch?: string;
  onReceiveDue: (billId: string, amount: number, discount?: number) => void;
}

const DueHistory: React.FC<DueHistoryProps> = ({ bills, patients, hospitalConfig, staff, professionals, admissions, initialSearch, onReceiveDue }) => {
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState(initialSearch || '');
  const [categoryFilter, setCategoryFilter] = useState<'All' | 'Admitted' | 'Released' | 'OPD'>('All');
  const [payAmount, setPayAmount] = useState<number>(0);
  const [extraDiscount, setExtraDiscount] = useState<number>(0);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedBillForPreview, setSelectedBillForPreview] = useState<Bill | null>(null);

  const currency = hospitalConfig.currencySymbol || 'Tk';

  useEffect(() => {
    setSearchQuery(initialSearch || '');
  }, [initialSearch]);

  const getPatientStatus = (patientId?: string) => {
    if (!patientId) return 'OPD';
    const patientAdmissions = admissions.filter(a => a.patientId === patientId);
    if (patientAdmissions.length === 0) return 'OPD';
    
    const latest = patientAdmissions.sort((a, b) => new Date(b.admissionDate).getTime() - new Date(a.admissionDate).getTime())[0];
    return latest.status === 'admitted' ? 'Admitted' : 'Released';
  };

  const filteredDues = useMemo(() => {
    return bills.filter(b => {
      // Must have a due balance
      if (b.dueAmount <= 0) return false;

      // Date range filtering
      const bDate = b.date.split('T')[0];
      const matchesRange = bDate >= startDate && bDate <= endDate;
      if (!matchesRange) return false;

      // Patient/Doctor search filtering
      const p = b.patientId ? patients.find(pat => pat.id === b.patientId) : null;
      const refDoc = professionals.find(pro => pro.id === b.referringDoctorId);
      const patientName = (b.walkInName || p?.name || '').toLowerCase();
      const doctorName = (refDoc?.name || '').toLowerCase();
      const patientId = (b.patientId || '').toLowerCase();
      const invoiceId = b.id.toLowerCase();
      
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        patientName.includes(q) || 
        doctorName.includes(q) || 
        invoiceId.includes(q) || 
        patientId.includes(q);
        
      if (!matchesSearch) return false;

      // Category filtering (Released vs Admitted vs OPD)
      const status = getPatientStatus(b.patientId);
      if (categoryFilter !== 'All' && status !== categoryFilter) return false;

      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [bills, patients, professionals, admissions, startDate, endDate, searchQuery, categoryFilter]);

  const totalOutstanding = useMemo(() => filteredDues.reduce((acc, b) => acc + b.dueAmount, 0), [filteredDues]);

  const projection = useMemo(() => {
    if (!selectedBill) return { remaining: 0, status: 'unpaid' };
    const remaining = Math.max(0, selectedBill.dueAmount - payAmount - extraDiscount);
    return {
      remaining,
      isFullySettled: remaining === 0,
      totalReduction: payAmount + extraDiscount
    };
  }, [selectedBill, payAmount, extraDiscount]);

  const handleCollect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBill) return;
    onReceiveDue(selectedBill.id, payAmount, extraDiscount);
    setSelectedBill(null);
    setPayAmount(0);
    setExtraDiscount(0);
  };

  const openPreview = (bill: Bill) => {
    setSelectedBillForPreview(bill);
    setShowPreview(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 no-print">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white tracking-tight uppercase">Enhanced Due Ledger</h2>
          <p className="text-sm text-slate-500 font-medium italic">Clinical Settlement Matrix & Debt Recovery</p>
        </div>
        <div className="bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-xl flex flex-col justify-center">
             <p className="text-[10px] font-black uppercase opacity-60 mb-1 leading-none tracking-widest">Aggregate Outstanding</p>
             <p className="text-2xl font-black tracking-tighter leading-none">{totalOutstanding.toLocaleString()} {currency}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6 no-print">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Search Input */}
          <div className="md:col-span-4 relative group">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Lookup Registry</label>
             <div className="relative">
                <input type="text" className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:text-white"
                  placeholder="Subject, MRN, or Doctor..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
             </div>
          </div>

          {/* Category Filter */}
          <div className="md:col-span-4">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1 mb-2">Subject Status</label>
             <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                {(['All', 'Admitted', 'Released', 'OPD'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${categoryFilter === cat ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-400'}`}
                  >
                    {cat}
                  </button>
                ))}
             </div>
          </div>

          {/* Date Filter */}
          <div className="md:col-span-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1 mb-2">From</label>
            <input type="date" className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none font-bold dark:text-white outline-none focus:ring-2 focus:ring-blue-500" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1 mb-2">To</label>
            <input type="date" className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none font-bold dark:text-white outline-none focus:ring-2 focus:ring-blue-500" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="no-print">
        <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
           <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left min-w-[900px]">
                 <thead className="bg-slate-50 dark:bg-slate-800/50 border-b dark:border-slate-800">
                    <tr>
                       <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Invoice / Date</th>
                       <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Subject Profile</th>
                       <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Clinical Status</th>
                       <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right text-rose-600">Balance Due</th>
                       <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    {filteredDues.map(b => {
                      const status = getPatientStatus(b.patientId);
                      return (
                        <tr key={b.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                           <td className="px-6 py-4">
                              <p className="text-xs font-black text-slate-700 dark:text-slate-300 font-mono uppercase">{b.id}</p>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{new Date(b.date).toLocaleDateString()}</span>
                           </td>
                           <td className="px-6 py-4">
                              <p className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase">{b.walkInName || patients.find(pat => pat.id === b.patientId)?.name || 'Unknown Subject'}</p>
                              <div className="flex items-center gap-2">
                                {b.patientId && <span className="text-[9px] font-mono font-black text-blue-500 bg-blue-50 dark:bg-blue-900/30 px-1 rounded">MRN: {b.patientId}</span>}
                                <p className="text-[9px] font-bold text-slate-400 uppercase truncate max-w-[150px]">Ref: {professionals.find(d => d.id === b.referringDoctorId)?.name || 'Direct'}</p>
                              </div>
                           </td>
                           <td className="px-6 py-4">
                              <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                                status === 'Released' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                status === 'Admitted' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                                'bg-slate-100 text-slate-500 border border-slate-200'
                              }`}>
                                {status === 'Released' ? 'Released / Discharged' : status}
                              </span>
                           </td>
                           <td className="px-6 py-4 text-right"><p className="text-lg font-black text-rose-600 tracking-tighter tabular-nums">{b.dueAmount.toLocaleString()} <span className="text-[10px] opacity-40">{currency}</span></p></td>
                           <td className="px-6 py-4 text-right">
                              <div className="flex justify-end items-center gap-2">
                                 <button onClick={() => openPreview(b)} className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all" title="View Document"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg></button>
                                 <button onClick={() => { setSelectedBill(b); setPayAmount(b.dueAmount); setExtraDiscount(0); }} className="px-4 py-2.5 bg-slate-900 dark:bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-md active:scale-95">Collect</button>
                              </div>
                           </td>
                        </tr>
                      );
                    })}
                    {filteredDues.length === 0 && (
                      <tr><td colSpan={5} className="py-24 text-center opacity-30 text-sm font-black uppercase tracking-[0.2em]">No Matching Receivables Recorded</td></tr>
                    )}
                 </tbody>
              </table>
           </div>
        </div>
      </div>

      {selectedBill && (
         <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[500] flex items-center justify-center p-4 no-print overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 rounded-[50px] shadow-[0_0_100px_-20px_rgba(0,0,0,0.5)] w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20 dark:border-slate-800 my-auto">
               <div className="p-10 bg-slate-900 border-b border-white/5 flex justify-between items-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] -mr-32 -mt-32"></div>
                  <div className="relative z-10">
                    <h3 className="text-3xl font-black text-white uppercase tracking-tight">Collect Payment</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em] mt-2">Protocol: {selectedBill.id}</p>
                  </div>
                  <button onClick={() => setSelectedBill(null)} className="relative z-10 w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-[20px] text-slate-400 hover:text-white transition-all border border-white/10">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                  </button>
               </div>

               <div className="p-10 space-y-10">
                  <div className="grid grid-cols-2 gap-4">
                     <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-[30px] border border-slate-100 dark:border-slate-700">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Unpaid Balance</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">{selectedBill.dueAmount.toLocaleString()} <span className="text-xs opacity-40">{currency}</span></p>
                     </div>
                     <div className={`p-6 rounded-[30px] border-2 transition-all duration-500 ${projection.isFullySettled ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-600' : 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800 text-rose-600'}`}>
                        <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${projection.isFullySettled ? 'text-emerald-500' : 'text-rose-500'}`}>Remaining Due</p>
                        <p className="text-2xl font-black tabular-nums">{projection.remaining.toLocaleString()} <span className="text-xs opacity-40">{currency}</span></p>
                     </div>
                  </div>

                  <form onSubmit={handleCollect} className="space-y-8">
                     <div className="space-y-6">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 block">Collection Amount</label>
                           <div className="relative group">
                              <div className="absolute left-6 top-1/2 -translate-y-1/2 text-emerald-500 font-black text-lg">{currency}</div>
                              <input 
                                 required 
                                 type="number" 
                                 max={selectedBill.dueAmount - extraDiscount}
                                 className="w-full pl-14 pr-8 py-5 rounded-[25px] bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 outline-none font-black text-slate-900 dark:text-white text-2xl transition-all"
                                 value={payAmount || ''} 
                                 onChange={e => setPayAmount(Math.min(selectedBill.dueAmount - extraDiscount, Number(e.target.value)))} 
                              />
                           </div>
                        </div>

                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 block">Waiver / Adjustment</label>
                           <div className="relative">
                              <div className="absolute left-6 top-1/2 -translate-y-1/2 text-rose-500 font-black text-lg">{currency}</div>
                              <input 
                                 type="number" 
                                 max={selectedBill.dueAmount - payAmount}
                                 className="w-full pl-14 pr-8 py-4 rounded-[22px] bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 focus:border-rose-500 outline-none font-black text-rose-500 text-lg transition-all"
                                 value={extraDiscount || ''} 
                                 onChange={e => setExtraDiscount(Math.min(selectedBill.dueAmount - payAmount, Number(e.target.value)))} 
                              />
                           </div>
                        </div>
                     </div>

                     <div className="pt-6 border-t border-slate-50 dark:border-slate-800 flex flex-col sm:flex-row gap-4">
                        <button type="button" onClick={() => setSelectedBill(null)} className="flex-1 py-5 rounded-[24px] border-2 border-slate-100 dark:border-slate-800 text-slate-400 font-black uppercase tracking-widest text-[11px] hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">Abort</button>
                        <button type="submit" className={`flex-[1.5] py-5 rounded-[24px] font-black text-[12px] uppercase tracking-[0.3em] shadow-2xl transition-all active:scale-[0.98] ${projection.isFullySettled ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-900/20' : 'bg-slate-900 dark:bg-blue-600 text-white hover:bg-black dark:hover:bg-blue-500 shadow-slate-900/20'}`}>
                           {projection.isFullySettled ? 'Finalize Full Settlement' : 'Process Collection'}
                        </button>
                     </div>
                  </form>
               </div>
            </div>
         </div>
      )}

      {showPreview && selectedBillForPreview && (
         <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[1000] flex items-center justify-center p-2 no-print overflow-y-auto">
            <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-[600px] overflow-hidden flex flex-col my-auto border border-white/20">
               <div className="p-4 md:p-6 bg-slate-900 flex justify-between items-center text-white shrink-0">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black text-xs">A5</div>
                     <div><h4 className="font-black text-sm uppercase tracking-tight">Invoice Print</h4><p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">{selectedBillForPreview.id}</p></div>
                  </div>
                  <div className="flex items-center gap-2">
                     <button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg active:scale-95"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg> Print</button>
                     <button onClick={() => { setShowPreview(false); setSelectedBillForPreview(null); }} className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>
                  </div>
               </div>
               <div className="flex-1 bg-slate-100 flex items-center justify-center p-4 md:p-8 overflow-y-auto custom-scrollbar">
                  <div id="invoice-printable" className="bg-white text-slate-900 shadow-2xl p-[15mm] invoice-a5-layout relative">
                     <div className="flex justify-between items-start border-b-[1.5pt] border-slate-900 pb-6 mb-8">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black italic text-xl uppercase">{hospitalConfig.logo ? <img src={hospitalConfig.logo} alt="L" className="w-full h-full object-contain" /> : 'SH'}</div>
                           <div>
                              <h1 className="text-lg font-black uppercase tracking-tight leading-none">{hospitalConfig.name}</h1>
                              <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1">{hospitalConfig.tagline}</p>
                              <p className="text-[8px] font-medium text-slate-400 mt-0.5 max-w-[200px] leading-tight uppercase tracking-tighter">{hospitalConfig.address}</p>
                           </div>
                        </div>
                        <div className="text-right">
                           <h2 className="text-[10px] font-black uppercase text-blue-600 tracking-[0.2em] mb-3">Due Invoice</h2>
                           <p className="text-[8px] font-black text-slate-400 uppercase">No: <span className="text-slate-900 font-mono text-[10px]">{selectedBillForPreview.id}</span></p>
                           <p className="text-[8px] font-bold text-slate-500">Date: {new Date(selectedBillForPreview.date).toLocaleDateString()}</p>
                        </div>
                     </div>
                     <div className="grid grid-cols-2 gap-8 mb-8 py-4 px-5 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="space-y-1">
                           <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Patient Profile</p>
                           <h3 className="text-sm font-black uppercase tracking-tight truncate">{selectedBillForPreview.walkInName || patients.find(p => p.id === selectedBillForPreview.patientId)?.name || 'Guest Patient'}</h3>
                           <p className="text-[9px] font-bold text-slate-600 uppercase">{selectedBillForPreview.walkInAge || patients.find(p => p.id === selectedBillForPreview.patientId)?.age}Y • {selectedBillForPreview.walkInSex || patients.find(p => p.id === selectedBillForPreview.patientId)?.sex} • MRN: {selectedBillForPreview.patientId || 'N/A'}</p>
                        </div>
                        <div className="text-right space-y-1">
                           <p className="text-[7px] font-black uppercase text-slate-400 mt-1">Status: <span className="text-emerald-600">{getPatientStatus(selectedBillForPreview.patientId)}</span></p>
                           <p className="text-[8px] font-bold text-slate-600 uppercase">Phone: {selectedBillForPreview.walkInMobile || patients.find(p => p.id === selectedBillForPreview.patientId)?.mobile || 'N/A'}</p>
                        </div>
                     </div>
                     <div className="min-h-[60mm]">
                        <table className="w-full text-left">
                           <thead><tr className="border-b-[1pt] border-slate-900"><th className="py-2 text-[8px] font-black uppercase tracking-widest">Service</th><th className="py-2 text-[8px] font-black uppercase tracking-widest text-center">Qty</th><th className="py-2 text-[8px] font-black uppercase tracking-widest text-right">Total</th></tr></thead>
                           <tbody className="divide-y divide-slate-100">
                              {selectedBillForPreview.items.map((item, idx) => (<tr key={idx}><td className="py-3 font-black uppercase text-[10px] text-slate-800">{item.name}</td><td className="py-3 text-center text-[10px] font-bold text-slate-500">{item.qty}</td><td className="py-3 text-right font-black text-[10px] tabular-nums">{item.total.toLocaleString()}</td></tr>))}
                           </tbody>
                        </table>
                     </div>
                     <div className="flex justify-end pt-6">
                        <div className="w-[60mm] space-y-2">
                           <div className="flex justify-between items-center text-slate-500"><span className="text-[8px] font-black uppercase tracking-widest">Gross Total</span><span className="text-[10px] font-bold">{selectedBillForPreview.totalAmount.toLocaleString()}</span></div>
                           <div className="flex justify-between items-center text-rose-500"><span className="text-[8px] font-black uppercase tracking-widest">Waivers</span><span className="text-[10px] font-black">- {selectedBillForPreview.discount.toLocaleString()}</span></div>
                           <div className="flex justify-between items-center border-t border-slate-900 pt-3 mt-1"><span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Net Paid</span><span className="text-sm font-black tabular-nums text-slate-900">{selectedBillForPreview.paidAmount.toLocaleString()} {currency}</span></div>
                           {selectedBillForPreview.dueAmount > 0 && (<div className="flex justify-between items-center text-rose-600 px-1 pt-1"><span className="text-[8px] font-black uppercase tracking-widest">Remaining</span><span className="text-[11px] font-black">{selectedBillForPreview.dueAmount.toLocaleString()}</span></div>)}
                        </div>
                     </div>
                     <div className="pt-16 grid grid-cols-2 gap-10"><div className="border-t border-slate-100 pt-2 text-center"><p className="text-[7px] font-black uppercase text-slate-400 tracking-widest">Accountant</p></div><div className="border-t border-slate-900 pt-2 text-center"><p className="text-[7px] font-black uppercase text-slate-900 tracking-widest">Authorized Signature</p></div></div>
                  </div>
               </div>
            </div>
         </div>
      )}

      <style>{`
        .invoice-a5-layout { width: 148mm; min-height: 210mm; margin: 0 auto; }
        @media screen and (max-width: 640px) { .invoice-a5-layout { width: 100%; min-height: auto; padding: 20px !important; } }
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
          .text-emerald-600 { color: #10b981 !important; }
        }
      `}</style>
    </div>
  );
};

export default DueHistory;
