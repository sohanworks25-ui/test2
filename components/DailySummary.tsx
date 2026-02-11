import React, { useState, useMemo } from 'react';
import { Bill, Expense, User, HospitalConfig, Commission, Patient } from '../types';

interface DailySummaryProps {
  bills: Bill[];
  expenses: Expense[];
  commissions: Commission[];
  patients: Patient[];
  staff: User[];
  onAddExpense: (expense: Expense) => void;
  onUpdateExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
  currentUser: User;
  hospitalConfig: HospitalConfig;
}

const DailySummary: React.FC<DailySummaryProps> = ({ bills, expenses, commissions, patients, staff, onAddExpense, onUpdateExpense, onDeleteExpense, currentUser, hospitalConfig }) => {
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [expenseData, setExpenseData] = useState({ description: '', amount: 0, category: 'General' });

  const currency = hospitalConfig.currencySymbol || 'Tk';

  const filteredBills = useMemo(() => {
    return bills.filter(b => {
      const date = b.date.split('T')[0];
      return date >= startDate && date <= endDate;
    });
  }, [bills, startDate, endDate]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => e.date >= startDate && e.date <= endDate);
  }, [expenses, startDate, endDate]);

  const incomeStats = useMemo(() => {
    let advanceCollection = 0;
    let dueCollection = 0;
    let receivablesToday = 0;

    bills.forEach(bill => {
      const bCreatedDate = bill.date.split('T')[0];
      const isBillFromToday = bCreatedDate >= startDate && bCreatedDate <= endDate;
      
      const inRangePayments = (bill.payments || []).filter(p => {
        const pDate = p.date.split('T')[0];
        return pDate >= startDate && pDate <= endDate;
      });
      
      const sumInRange = inRangePayments.reduce((sum, p) => sum + p.amount, 0);

      if (isBillFromToday) {
        advanceCollection += sumInRange;
        receivablesToday += bill.dueAmount;
        if (!bill.payments || bill.payments.length === 0) {
          advanceCollection += bill.paidAmount;
        }
      } else {
        dueCollection += sumInRange;
      }
    });

    return { 
      advanceCollection, 
      dueCollection, 
      totalCollection: advanceCollection + dueCollection,
      receivablesToday 
    };
  }, [bills, startDate, endDate]);

  const dailyTotalExpenses = useMemo(() => filteredExpenses.reduce((acc, e) => acc + e.amount, 0), [filteredExpenses]);
  const cashBalance = incomeStats.totalCollection - dailyTotalExpenses;

  const itemCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredBills.forEach(bill => {
      bill.items.forEach(item => {
        counts[item.name] = (counts[item.name] || 0) + item.qty;
      });
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [filteredBills]);

  const handleSubmitExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseData.description || expenseData.amount <= 0) return;

    if (editingExpenseId) {
       const original = expenses.find(ex => ex.id === editingExpenseId);
       onUpdateExpense({
         id: editingExpenseId,
         description: expenseData.description,
         amount: expenseData.amount,
         category: expenseData.category,
         date: original?.date || startDate,
         recordedBy: original?.recordedBy || currentUser.name
       });
    } else {
       onAddExpense({
         id: `EX-${Date.now()}`,
         description: expenseData.description,
         amount: expenseData.amount,
         category: expenseData.category,
         date: new Date().toISOString().split('T')[0],
         recordedBy: currentUser.name
       });
    }
    closeModal();
  };

  const openEdit = (e: Expense) => {
    setEditingExpenseId(e.id);
    setExpenseData({ description: e.description, amount: e.amount, category: e.category });
    setShowExpenseModal(true);
  };

  const closeModal = () => {
    setShowExpenseModal(false);
    setEditingExpenseId(null);
    setExpenseData({ description: '', amount: 0, category: 'General' });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      {/* ON-SCREEN DASHBOARD HEADER */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 no-print">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight leading-none">Fiscal Ledger</h2>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-2 leading-none">Institutional Cash Flow Auditing</p>
        </div>
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 w-full xl:w-auto">
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
             <div className="flex items-center gap-2 px-3 border-r dark:border-slate-800">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Start</span>
                <input type="date" className="text-xs font-bold outline-none dark:bg-slate-900 dark:text-white bg-transparent w-full sm:w-auto" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
             </div>
             <div className="flex items-center gap-2 px-3">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">End</span>
                <input type="date" className="text-xs font-bold outline-none dark:bg-slate-900 dark:text-white bg-transparent w-full sm:w-auto" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
             </div>
          </div>
          <button 
              onClick={handlePrint}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95"
          >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>
              Print A4 Audit
          </button>
        </div>
      </div>

      {/* DASHBOARD GRID CONTENT */}
      <div className="space-y-6 no-print">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[35px] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between overflow-hidden relative group">
             <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full -mr-16 -mt-16"></div>
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] relative z-10">Period Collection</span>
             <p className="text-4xl font-black text-emerald-600 mt-3 relative z-10 tracking-tighter">{incomeStats.totalCollection.toLocaleString()} <span className="text-xs font-bold text-slate-400">{currency}</span></p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[35px] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between overflow-hidden relative group">
             <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 blur-3xl rounded-full -mr-16 -mt-16"></div>
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] relative z-10">Period Outflow</span>
             <p className="text-4xl font-black text-rose-600 mt-3 relative z-10 tracking-tighter">{dailyTotalExpenses.toLocaleString()} <span className="text-xs font-bold text-slate-400">{currency}</span></p>
          </div>
          <div className={`sm:col-span-2 lg:col-span-1 p-8 rounded-[35px] border shadow-xl text-white flex flex-col justify-between relative overflow-hidden transition-all duration-500 group ${cashBalance >= 0 ? 'bg-slate-900 border-slate-900' : 'bg-rose-600 border-rose-600'}`}>
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full -mr-16 -mt-16 group-hover:scale-125 transition-transform"></div>
             <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 relative z-10">Net Audit Balance</span>
             <p className="text-4xl font-black mt-3 relative z-10 tracking-tighter">{cashBalance.toLocaleString()} <span className="text-xs font-bold opacity-40">{currency}</span></p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* COLLECTION MIX CARD */}
          <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-8 border-b dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-inner">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              </div>
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Distribution Mix</h3>
            </div>
            <div className="p-8 space-y-6">
               <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-slate-50 dark:bg-slate-800/50 rounded-[28px] border border-slate-100 dark:border-slate-700 gap-2">
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Advance collection</p>
                        <p className="text-[9px] font-bold text-slate-500 uppercase italic">(New patient settlements)</p>
                     </div>
                     <p className="text-xl font-black text-emerald-600 tabular-nums">{incomeStats.advanceCollection.toLocaleString()} <span className="text-xs opacity-40">{currency}</span></p>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-slate-50 dark:bg-slate-800/50 rounded-[28px] border border-slate-100 dark:border-slate-700 gap-2">
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Due collection</p>
                        <p className="text-[9px] font-bold text-slate-500 uppercase italic">(Historical debt recovery)</p>
                     </div>
                     <p className="text-xl font-black text-emerald-600 tabular-nums">{incomeStats.dueCollection.toLocaleString()} <span className="text-xs opacity-40">{currency}</span></p>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-rose-50/50 dark:bg-rose-900/10 rounded-[28px] border border-rose-100 dark:border-rose-900/20 gap-2">
                     <div>
                        <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">Dues Generated</p>
                        <p className="text-[9px] font-bold text-rose-400 uppercase italic">(New uncollected liability)</p>
                     </div>
                     <p className="text-xl font-black text-rose-600 tabular-nums">{incomeStats.receivablesToday.toLocaleString()} <span className="text-xs opacity-40">{currency}</span></p>
                  </div>
               </div>
               <div className="pt-6 border-t dark:border-slate-800 flex justify-between items-center px-2">
                  <p className="text-[12px] font-black text-slate-500 uppercase tracking-[0.25em]">Period Cash Flow</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white underline underline-offset-8 decoration-emerald-500 decoration-4">{incomeStats.totalCollection.toLocaleString()} {currency}</p>
               </div>
            </div>
          </div>

          {/* SERVICE VOLUME CARD */}
          <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-8 border-b dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 shadow-inner">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22v-7"/><path d="M9 18l3 3 3-3"/><path d="m5 13 2-2 3 3 5-5 4 4"/></svg>
              </div>
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Service Audit</h3>
            </div>
            <div className="overflow-y-auto max-h-[440px] custom-scrollbar flex-1">
              <table className="w-full text-left">
                <thead className="bg-white dark:bg-slate-900 border-b dark:border-slate-800 sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Clinical Service</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Volume</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-slate-800">
                  {itemCounts.map(([name, count]) => (
                    <tr key={name} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-8 py-5 font-bold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-tight">{name}</td>
                      <td className="px-8 py-5 text-center">
                        <span className="px-4 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl text-[11px] font-black shadow-sm">{count}</span>
                      </td>
                    </tr>
                  ))}
                  {itemCounts.length === 0 && (
                    <tr><td colSpan={2} className="py-24 text-center text-[10px] font-black uppercase text-slate-300 tracking-[0.4em]">Registry Empty</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* EXPENDITURE AUDIT - WIDE */}
          <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col lg:col-span-2">
            <div className="p-8 border-b dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center bg-slate-50/50 dark:bg-slate-800/50 gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 shadow-inner">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                </div>
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Expenditure audit</h3>
              </div>
              <button onClick={() => setShowExpenseModal(true)} className="w-full sm:w-auto px-8 py-4 bg-slate-900 dark:bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl hover:bg-black transition-all active:scale-95">Record Outflow</button>
            </div>
            <div className="overflow-y-auto max-h-[500px] custom-scrollbar">
              <table className="w-full text-left">
                <thead className="bg-white dark:bg-slate-900 border-b dark:border-slate-800 sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Narration / Category</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Settlement</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-slate-800">
                  {filteredExpenses.map(e => (
                    <tr key={e.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-8 py-5 font-bold text-slate-700 dark:text-slate-300 text-xs">
                        <div className="flex flex-col">
                           <span className="uppercase tracking-tight text-sm font-black">{e.description}</span>
                           <span className="text-[9px] uppercase tracking-widest text-slate-400 mt-1 font-bold">{e.category}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                         <div className="flex items-center justify-end gap-5">
                           <span className="font-black text-slate-900 dark:text-white text-base tabular-nums">{e.amount.toLocaleString()} {currency}</span>
                           <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity no-print">
                              <button onClick={() => openEdit(e)} className="p-3 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-2xl transition-all active:scale-90" title="Edit Record">
                                 <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                              </button>
                              <button onClick={() => onDeleteExpense(e.id)} className="p-3 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-2xl transition-all active:scale-90" title="Delete Record">
                                 <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                              </button>
                           </div>
                         </div>
                      </td>
                    </tr>
                  ))}
                  {filteredExpenses.length === 0 && (
                    <tr><td colSpan={2} className="py-24 text-center text-[10px] font-black uppercase text-slate-300 tracking-[0.4em]">No recorded expenditure</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* PRECISION A4 PRINT TEMPLATE */}
      <div id="summary-printable" className="hidden printable-only bg-white text-slate-950 p-[20mm] w-[210mm] min-h-[297mm] mx-auto shadow-none relative">
        {/* Decorative Side Accent */}
        <div className="absolute top-0 left-0 w-2 h-full bg-slate-950 opacity-[0.03]"></div>
        
        {/* Formal Header Block */}
        <div className="flex justify-between items-start border-b-[3pt] border-slate-950 pb-10 mb-12 relative z-10">
          <div className="flex items-center gap-8">
            <div className="w-20 h-20 bg-slate-950 text-white rounded-[24px] flex items-center justify-center font-black text-4xl italic shrink-0 shadow-lg">
              {hospitalConfig.logo ? <img src={hospitalConfig.logo} className="w-full h-full object-contain p-2" /> : 'SH'}
            </div>
            <div className="space-y-1.5">
              <h1 className="text-3xl font-black uppercase tracking-tighter leading-none text-slate-950">{hospitalConfig.name}</h1>
              <p className="text-[12px] font-black text-blue-700 uppercase tracking-[0.3em]">{hospitalConfig.tagline}</p>
              <div className="pt-4 space-y-0.5">
                <p className="text-[9px] font-bold text-slate-600 max-w-[350px] leading-tight uppercase tracking-tight">{hospitalConfig.address}</p>
                <p className="text-[11px] font-black text-slate-900 uppercase">Contact: {hospitalConfig.phone}</p>
              </div>
            </div>
          </div>
          <div className="text-right flex flex-col justify-between h-24">
            <div>
              <h2 className="text-2xl font-black uppercase text-blue-800 tracking-[0.15em] mb-1">Audit Summary</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Institutional Fiscal Record</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] font-black text-slate-400 uppercase">Reporting Period</p>
              <p className="text-base font-black text-slate-950 tracking-tight tabular-nums">
                {new Date(startDate).toLocaleDateString()} — {new Date(endDate).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Primary Audit Metrics */}
        <div className="grid grid-cols-2 gap-12 mb-16 relative z-10">
          {/* Collection Column */}
          <div className="space-y-8">
             <h3 className="text-[13px] font-black uppercase tracking-[0.3em] text-blue-800 border-b-2 border-blue-100 pb-3 flex items-center gap-3">
                <div className="w-2 h-5 bg-blue-800 rounded-sm"></div>
                Collection Metrics
             </h3>
             <div className="space-y-5">
                <div className="flex justify-between items-center py-3 border-b border-slate-100 px-2">
                   <div className="space-y-0.5">
                      <p className="text-[11px] font-black uppercase text-slate-800">Advance settlement</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase italic">Revenue from new intakes</p>
                   </div>
                   <span className="text-[15px] font-black tabular-nums text-slate-950">{incomeStats.advanceCollection.toLocaleString()} {currency}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-slate-100 px-2">
                   <div className="space-y-0.5">
                      <p className="text-[11px] font-black uppercase text-slate-800">Due Recovery</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase italic">Historical receivables collected</p>
                   </div>
                   <span className="text-[15px] font-black tabular-nums text-slate-950">{incomeStats.dueCollection.toLocaleString()} {currency}</span>
                </div>
                <div className="flex justify-between items-center py-5 bg-slate-100 px-6 rounded-[28px] border border-slate-200">
                   <span className="text-[12px] font-black uppercase text-slate-950 tracking-[0.2em]">Aggregate Inflow</span>
                   <span className="text-2xl font-black tabular-nums text-emerald-700 underline decoration-4 underline-offset-8">{incomeStats.totalCollection.toLocaleString()} {currency}</span>
                </div>
                <div className="flex justify-between items-center py-4 text-rose-700 px-6 border-2 border-rose-100 rounded-2xl bg-rose-50/20">
                   <div className="space-y-0.5">
                      <p className="text-[10px] font-black uppercase tracking-widest">New Uncollected Liability</p>
                      <p className="text-[8px] font-bold uppercase opacity-60 italic">Receivables created today</p>
                   </div>
                   <span className="text-[14px] font-black tabular-nums">+{incomeStats.receivablesToday.toLocaleString()}</span>
                </div>
             </div>
          </div>

          {/* Settlement Column */}
          <div className="space-y-8">
             <h3 className="text-[13px] font-black uppercase tracking-[0.3em] text-rose-800 border-b-2 border-rose-100 pb-3 flex items-center gap-3">
                <div className="w-2 h-5 bg-rose-800 rounded-sm"></div>
                Settlement Integrity
             </h3>
             <div className="space-y-5">
                <div className="flex justify-between items-center py-4 border-b border-slate-100 px-2">
                   <span className="text-[11px] font-black uppercase text-slate-600">Period Collection</span>
                   <span className="text-[15px] font-black tabular-nums text-emerald-700">{incomeStats.totalCollection.toLocaleString()} {currency}</span>
                </div>
                <div className="flex justify-between items-center py-4 border-b border-slate-100 px-2">
                   <span className="text-[11px] font-black uppercase text-slate-600">Operations Outflow</span>
                   <span className="text-[15px] font-black tabular-nums text-rose-700">({dailyTotalExpenses.toLocaleString()}) {currency}</span>
                </div>
                <div className={`flex justify-between items-center py-8 px-10 rounded-[35px] shadow-sm border-[2.5pt] ${cashBalance >= 0 ? 'bg-slate-950 text-white border-slate-950' : 'bg-rose-700 text-white border-rose-700'}`}>
                   <div className="space-y-1">
                      <span className="text-[12px] font-black uppercase tracking-[0.25em] opacity-70">Net Audit Position</span>
                      <p className="text-[9px] font-bold opacity-50 uppercase italic">Clinical Surplus Balance</p>
                   </div>
                   <span className="text-4xl font-black tabular-nums tracking-tighter">{cashBalance.toLocaleString()} {currency}</span>
                </div>
             </div>
          </div>
        </div>

        {/* Detailed Breakdown Tables */}
        <div className="space-y-16 relative z-10">
          <section className="page-break-avoid">
             <h3 className="text-[12px] font-black uppercase tracking-[0.35em] text-slate-400 mb-6 border-b border-slate-100 pb-3 px-1">Expenditure Ledger Details</h3>
             <table className="w-full text-left border-collapse rounded-3xl overflow-hidden shadow-sm">
                <thead>
                   <tr className="bg-slate-100">
                      <th className="py-5 px-8 text-[11px] font-black uppercase text-slate-600 tracking-widest">Narration / Category</th>
                      <th className="py-5 px-8 text-[11px] font-black uppercase text-slate-600 tracking-widest text-right">Settled Amount</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 border-x border-slate-100">
                   {filteredExpenses.map(e => (
                      <tr key={e.id}>
                         <td className="py-5 px-8">
                            <p className="text-[12px] font-bold uppercase text-slate-900 leading-tight">{e.description}</p>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{e.category}</p>
                         </td>
                         <td className="py-5 px-8 text-right text-[12px] font-black tabular-nums text-slate-950">{e.amount.toLocaleString()}</td>
                      </tr>
                   ))}
                   {filteredExpenses.length === 0 && (
                      <tr><td colSpan={2} className="py-20 text-center text-[11px] font-black uppercase text-slate-300 tracking-[0.4em] italic">No Transactions Logged</td></tr>
                   )}
                </tbody>
                <tfoot className="border-t-[2pt] border-slate-950 bg-slate-50">
                   <tr>
                      <td className="py-6 px-8 text-[12px] font-black uppercase tracking-[0.2em] text-slate-700">Aggregate Period Outflow</td>
                      <td className="py-6 px-8 text-right text-2xl font-black tabular-nums text-rose-700 tracking-tighter">{dailyTotalExpenses.toLocaleString()} {currency}</td>
                   </tr>
                </tfoot>
             </table>
          </section>

          <section className="page-break-avoid">
             <h3 className="text-[12px] font-black uppercase tracking-[0.35em] text-slate-400 mb-6 border-b border-slate-100 pb-3 px-1">Institutional Service Load</h3>
             <div className="grid grid-cols-2 gap-x-12 gap-y-2 bg-slate-50/50 p-8 rounded-[35px] border border-slate-100">
                {itemCounts.map(([name, count]) => (
                   <div key={name} className="flex justify-between items-center py-3 border-b border-slate-200/50">
                      <span className="text-[11px] font-bold uppercase text-slate-800 truncate max-w-[220px] tracking-tight">{name}</span>
                      <span className="text-[12px] font-black text-blue-900 bg-blue-100/50 px-4 py-1 rounded-xl tabular-nums shadow-sm">{count}</span>
                   </div>
                ))}
                {itemCounts.length === 0 && (
                    <div className="col-span-2 py-10 text-center text-[11px] font-black uppercase text-slate-300 tracking-[0.4em]">Registry Empty</div>
                )}
             </div>
          </section>
        </div>

        {/* Audit Authentication Footer */}
        <div className="mt-24 pt-20 border-t border-slate-200 grid grid-cols-2 gap-24 px-10 relative z-10">
           <div className="text-center">
              <div className="border-b-[1.5pt] border-slate-900 pb-2 mb-4 italic text-[14px] font-bold text-slate-600 h-10 flex items-end justify-center tracking-tight">
                {currentUser.name}
              </div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] mb-1">Prepared By (HMS Node)</p>
              <p className="text-[12px] font-black uppercase text-slate-900 tracking-tighter">{currentUser.role.replace('_', ' ')}</p>
           </div>
           <div className="text-center">
              <div className="border-b-[1.5pt] border-slate-900 pb-2 mb-4 h-10"></div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] mb-1">Authorized Director Signature</p>
              <p className="text-[12px] font-black uppercase text-slate-900">Hospital Control Desk</p>
           </div>
        </div>

        <div className="mt-20 text-center space-y-2 relative z-10 border-t border-slate-50 pt-8 opacity-40">
           <p className="text-[9px] font-black text-slate-950 uppercase tracking-[0.6em] leading-none">HMS_OS_AUDIT_SECURITY_CORE • {hospitalConfig.name.toUpperCase()}</p>
           <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest italic">Finalized: {new Date().toLocaleString()}</p>
        </div>
      </div>

      {/* EXPENSE MODAL */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-4 no-print">
          <div className="bg-white dark:bg-slate-900 rounded-[45px] shadow-2xl w-full max-w-md overflow-hidden p-10 space-y-8 animate-in zoom-in-95 duration-200 border border-white/10 dark:border-slate-800">
             <div className="space-y-1">
                <h3 className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter uppercase leading-none">{editingExpenseId ? 'Update Record' : 'Record Outflow'}</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Institutional Expenditure Entry</p>
             </div>
             <div className="space-y-5">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1 block">Narration</label>
                   <input required type="text" className="w-full p-5 rounded-[22px] bg-slate-50 dark:bg-slate-800 border-none font-black text-slate-800 dark:text-white outline-none focus:ring-4 focus:ring-blue-500/10 uppercase text-sm" 
                      value={expenseData.description} onChange={e => setExpenseData({...expenseData, description: e.target.value})} placeholder="PURPOSE..." />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1 block">Category</label>
                   <select className="w-full p-5 rounded-[22px] bg-slate-50 dark:bg-slate-800 border-none font-black text-slate-800 dark:text-white outline-none focus:ring-4 focus:ring-blue-500/10 text-sm appearance-none cursor-pointer"
                      value={expenseData.category} onChange={e => setExpenseData({...expenseData, category: e.target.value})}>
                      <option value="General">General Operations</option>
                      <option value="Medical">Clinical Supplies</option>
                      <option value="Maintenance">Facility Maint</option>
                      <option value="Salary">Staffing/Payroll</option>
                   </select>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1 block">Value ({currency})</label>
                   <input required type="number" className="w-full p-6 rounded-[22px] bg-slate-50 dark:bg-slate-800 border-none font-black text-2xl text-rose-600 outline-none focus:ring-4 focus:ring-rose-500/10 dark:text-white"
                      value={expenseData.amount || ''} onChange={e => setExpenseData({...expenseData, amount: Number(e.target.value)})} placeholder="0.00" />
                </div>
                <div className="pt-4 flex flex-col gap-3">
                    <button onClick={handleSubmitExpense} className="w-full bg-slate-900 dark:bg-blue-600 text-white py-6 rounded-[24px] font-black text-sm uppercase tracking-[0.3em] hover:bg-black transition-all active:scale-95 shadow-2xl">
                        {editingExpenseId ? 'Commit Update' : 'Initialize Outflow'}
                    </button>
                    <button onClick={closeModal} className="w-full text-slate-400 font-black py-2 hover:text-slate-600 transition-all uppercase tracking-widest text-[10px]">Cancel</button>
                </div>
             </div>
          </div>
        </div>
      )}

      <style>{`
        @media screen {
          .printable-only { display: none !important; }
        }
        @media print {
          @page { size: A4; margin: 0; }
          body * { visibility: hidden !important; background: white !important; }
          #summary-printable, #summary-printable * { visibility: visible !important; display: block !important; }
          #summary-printable { position: absolute; left: 0; top: 0; width: 210mm !important; height: auto !important; min-height: 297mm !important; padding: 20mm !important; margin: 0 !important; box-shadow: none !important; border: none !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; font-family: 'Inter', sans-serif !important; }
          .printable-only { display: block !important; }
          .page-break-avoid { page-break-inside: avoid !important; }
          .bg-slate-50 { background-color: #f8fafc !important; }
          .bg-slate-100 { background-color: #f1f5f9 !important; }
          .bg-slate-900 { background-color: #0f172a !important; color: white !important; }
          .bg-slate-950 { background-color: #020617 !important; color: white !important; }
          .text-emerald-700 { color: #047857 !important; }
          .text-rose-700 { color: #be123c !important; }
          .text-blue-700 { color: #1d4ed8 !important; }
          .text-blue-800 { color: #1e40af !important; }
        }
      `}</style>
    </div>
  );
};

export default DailySummary;
