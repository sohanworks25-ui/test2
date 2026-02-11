
import React, { useState, useMemo } from 'react';
import { Patient, Bill, AdmittedPatient, HospitalConfig } from '../types';

interface PatientHistoryViewerProps {
  patient: Patient;
  bills: Bill[];
  admissions: AdmittedPatient[];
  hospitalConfig: HospitalConfig;
  onBack: () => void;
}

const PatientHistoryViewer: React.FC<PatientHistoryViewerProps> = ({ patient, bills, admissions, hospitalConfig, onBack }) => {
  const [activeTab, setActiveTab] = useState<'timeline' | 'invoices' | 'stays'>('timeline');
  const [expandedBillId, setExpandedBillId] = useState<string | null>(null);
  const currency = hospitalConfig.currencySymbol || 'Tk';

  const financials = useMemo(() => {
    const totalBilling = bills.reduce((acc, b) => acc + (b.totalAmount - b.discount), 0);
    const totalPaid = bills.reduce((acc, b) => acc + b.paidAmount, 0);
    const totalDue = bills.reduce((acc, b) => acc + b.dueAmount, 0);
    return { totalBilling, totalPaid, totalDue };
  }, [bills]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const timelineItems = useMemo(() => {
    const items: { date: string, type: 'Reg' | 'Bill' | 'Admission' | 'Discharge', title: string, sub: string, amount?: number }[] = [
      { date: patient.regDate, type: 'Reg', title: 'System Registration', sub: 'Patient profile initialized' }
    ];

    bills.forEach(b => {
      items.push({ 
        date: b.date, 
        type: 'Bill', 
        title: `Invoice Generated: ${b.id}`, 
        sub: `${b.items.length} items • ${b.type}`, 
        amount: b.totalAmount - b.discount 
      });
    });

    admissions.forEach(a => {
      items.push({ 
        date: a.admissionDate, 
        type: 'Admission', 
        title: 'Hospital Admission', 
        sub: `Room ${a.roomNumber} • Bed ${a.bedNumber}` 
      });
      if (a.dischargeDate) {
        items.push({ 
          date: a.dischargeDate, 
          type: 'Discharge', 
          title: 'Patient Discharge', 
          sub: `Stay completed for Case: ${a.id}` 
        });
      }
    });

    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [patient, bills, admissions]);

  const toggleBillExpansion = (id: string) => {
    setExpandedBillId(expandedBillId === id ? null : id);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      {/* HEADER NAV */}
      <div className="flex items-center gap-4 no-print">
        <button 
          onClick={onBack}
          className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 text-slate-400 hover:text-blue-600 transition-all shadow-sm hover:shadow-md"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Clinical Case File</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Institutional Medical Archives</p>
        </div>
      </div>

      {/* PATIENT PROFILE BANNER */}
      <div className="bg-slate-900 dark:bg-slate-950 rounded-[48px] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 blur-[120px] -mr-48 -mt-48"></div>
        <div className="flex flex-col md:flex-row gap-10 items-center relative z-10">
          <div className="w-32 h-32 rounded-[40px] bg-gradient-to-br from-blue-500 to-indigo-700 flex items-center justify-center text-5xl font-black shadow-2xl border-4 border-white/10 shrink-0">
             {patient.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 text-center md:text-left space-y-4">
             <div>
                <h3 className="text-3xl md:text-5xl font-black tracking-tighter uppercase leading-none">{patient.name}</h3>
                <div className="flex flex-wrap justify-center md:justify-start items-center gap-3 mt-4">
                   <span className="px-4 py-1.5 bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10">MRN: {patient.id}</span>
                   <span className="px-4 py-1.5 bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10">{patient.sex} • {patient.age}Y</span>
                   <span className="px-4 py-1.5 bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10">Mobile: {patient.mobile}</span>
                   <span className="px-4 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">Joined: {formatDate(patient.regDate)}</span>
                </div>
             </div>
             {patient.address && <p className="text-slate-400 text-sm font-medium">{patient.address}</p>}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-1 gap-4 shrink-0">
             <div className="p-6 bg-white/5 rounded-3xl border border-white/5 backdrop-blur-md text-right min-w-[180px]">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Life-time Revenue</p>
                <p className="text-2xl font-black tabular-nums">{financials.totalBilling.toLocaleString()} <span className="text-xs opacity-40">{currency}</span></p>
             </div>
             <div className="p-6 bg-rose-500 rounded-3xl text-right min-w-[180px] shadow-xl shadow-rose-900/40">
                <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-1">Pending Balance</p>
                <p className="text-2xl font-black tabular-nums">{financials.totalDue.toLocaleString()} <span className="text-xs opacity-60">{currency}</span></p>
             </div>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-2 p-1.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm w-fit mx-auto md:mx-0 no-print">
         <button onClick={() => setActiveTab('timeline')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'timeline' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>Activity Timeline</button>
         <button onClick={() => setActiveTab('invoices')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'invoices' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>Billing Ledger</button>
         <button onClick={() => setActiveTab('stays')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'stays' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>Clinical Stays</button>
      </div>

      {/* TAB CONTENT */}
      <div className="animate-in slide-in-from-bottom-2 duration-500">
         {activeTab === 'timeline' && (
            <div className="relative pl-10 md:pl-20 space-y-12 before:absolute before:left-[19px] md:before:left-[29px] before:top-4 before:bottom-4 before:w-1 before:bg-slate-100 dark:before:bg-slate-800 before:rounded-full">
               {timelineItems.map((item, i) => (
                  <div key={i} className="relative group">
                     <div className={`absolute -left-[30px] md:-left-[40px] top-1 w-10 h-10 rounded-2xl border-4 border-slate-50 dark:border-slate-950 flex items-center justify-center z-10 shadow-sm transition-transform group-hover:scale-110 ${
                        item.type === 'Reg' ? 'bg-indigo-500' : 
                        item.type === 'Bill' ? 'bg-blue-600' : 
                        item.type === 'Admission' ? 'bg-rose-500' : 'bg-emerald-500'
                     }`}>
                        {item.type === 'Reg' && <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg>}
                        {item.type === 'Bill' && <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/><line x1="7" x2="7" y1="15" y2="15"/><line x1="12" x2="12" y1="15" y2="15"/></svg>}
                        {item.type === 'Admission' && <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>}
                        {item.type === 'Discharge' && <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="m12 13 4-4"/><path d="m12 13-4-4"/><path d="M12 13V3"/></svg>}
                     </div>
                     <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all max-w-2xl">
                        <div className="flex justify-between items-start mb-2">
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(item.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                           {item.amount !== undefined && <span className="text-sm font-black text-slate-800 dark:text-slate-100">{item.amount.toLocaleString()} {currency}</span>}
                        </div>
                        <h4 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight uppercase">{item.title}</h4>
                        <p className="text-sm text-slate-500 font-medium italic">{item.sub}</p>
                     </div>
                  </div>
               ))}
            </div>
         )}

         {activeTab === 'invoices' && (
            <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
               <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left">
                     <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                        <tr>
                           <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Invoice / Date</th>
                           <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                           <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Items</th>
                           <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Net Bill</th>
                           <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Remaining</th>
                           <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                        {bills.map(b => (
                           <React.Fragment key={b.id}>
                             <tr 
                                onClick={() => toggleBillExpansion(b.id)}
                                className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                             >
                                <td className="px-6 py-4">
                                   <p className="font-mono font-black text-blue-600 text-xs group-hover:underline">{b.id}</p>
                                   <p className="text-[10px] font-bold text-slate-400 uppercase">{new Date(b.date).toLocaleDateString()}</p>
                                </td>
                                <td className="px-6 py-4"><span className="text-[10px] font-black uppercase text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">{b.type}</span></td>
                                <td className="px-6 py-4">
                                   <p className="text-xs font-bold text-slate-600 dark:text-slate-400">{b.items.length} Clinical Items</p>
                                </td>
                                <td className="px-6 py-4 text-right font-black text-slate-700 dark:text-slate-300">{(b.totalAmount - b.discount).toLocaleString()}</td>
                                <td className="px-6 py-4 text-right font-black text-rose-600">{b.dueAmount.toLocaleString()}</td>
                                <td className="px-6 py-4 text-center">
                                   <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full ${b.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                      {b.status}
                                   </span>
                                </td>
                             </tr>
                             {expandedBillId === b.id && (
                                <tr className="bg-slate-50 dark:bg-slate-950/50 border-x-4 border-blue-600/20">
                                   <td colSpan={6} className="px-10 py-6">
                                      <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                                         <h5 className="text-[10px] font-black uppercase tracking-widest text-blue-500 flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                            Service Breakdown for {b.id}
                                         </h5>
                                         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                            {b.items.map((item, idx) => (
                                               <div key={idx} className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm flex justify-between items-center">
                                                  <div>
                                                     <p className="text-[10px] font-black uppercase text-slate-800 dark:text-slate-200 truncate max-w-[120px]">{item.name}</p>
                                                     <p className="text-[9px] font-bold text-slate-400">Qty: {item.qty} • Rate: {item.price}</p>
                                                  </div>
                                                  <span className="text-[11px] font-black text-slate-900 dark:text-white">{item.total.toLocaleString()}</span>
                                               </div>
                                            ))}
                                         </div>
                                         <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-800">
                                            <p className="text-[10px] font-black text-slate-400 uppercase">Author: {b.authorName || 'System'}</p>
                                            <div className="flex gap-4">
                                               <p className="text-[10px] font-black text-slate-500 uppercase">Discount: <span className="text-rose-500">{b.discount.toLocaleString()}</span></p>
                                               <p className="text-[10px] font-black text-slate-500 uppercase">Paid: <span className="text-emerald-500">{b.paidAmount.toLocaleString()}</span></p>
                                            </div>
                                         </div>
                                      </div>
                                   </td>
                                </tr>
                             )}
                           </React.Fragment>
                        ))}
                        {bills.length === 0 && (
                           <tr><td colSpan={6} className="py-24 text-center opacity-30 text-xs font-black uppercase tracking-widest">No matching invoices found for this patient MRN</td></tr>
                        )}
                     </tbody>
                  </table>
               </div>
            </div>
         )}

         {activeTab === 'stays' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {admissions.map(a => (
                  <div key={a.id} className="bg-white dark:bg-slate-900 rounded-[32px] p-8 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                     <div className={`absolute top-0 left-0 w-full h-2 ${a.status === 'admitted' ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
                     <div className="flex justify-between items-start mb-6">
                        <div>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Case Ref: {a.id}</p>
                           <h4 className="text-xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">Room {a.roomNumber} (Bed {a.bedNumber})</h4>
                        </div>
                        <span className={`px-4 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest ${a.status === 'admitted' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>
                           {a.status}
                        </span>
                     </div>

                     <div className="grid grid-cols-2 gap-6 py-6 border-y border-slate-50 dark:border-slate-800">
                        <div>
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Stay Period</p>
                           <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{new Date(a.admissionDate).toLocaleDateString()} - {a.dischargeDate ? new Date(a.dischargeDate).toLocaleDateString() : 'Active'}</p>
                        </div>
                        <div className="text-right">
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Guardian</p>
                           <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{a.guardianName || 'N/A'}</p>
                        </div>
                     </div>

                     <div className="mt-6">
                        <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-2">Admission Diagnosis</p>
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                           "{a.admissionDiagnosis || 'No diagnosis recorded for this case.'}"
                        </p>
                     </div>
                  </div>
               ))}
               {admissions.length === 0 && (
                  <div className="col-span-full py-32 flex flex-col items-center justify-center opacity-20">
                     <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-4"><path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/></svg>
                     <p className="text-lg font-black uppercase tracking-widest">No Stay History Available</p>
                  </div>
               )}
            </div>
         )}
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/10 rounded-3xl p-6 border border-amber-100 dark:border-amber-800/30 flex gap-4 items-center">
         <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-800/20 flex items-center justify-center text-amber-600 shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
         </div>
         <p className="text-[10px] text-amber-700 dark:text-amber-500 font-bold leading-relaxed uppercase tracking-wide">
            Administrative Archive: Historical data is immutable within this view. To correct billing or admission errors, use the main management modules and the transaction will be reflected here upon ledger synchronization.
         </p>
      </div>
    </div>
  );
};

export default PatientHistoryViewer;
