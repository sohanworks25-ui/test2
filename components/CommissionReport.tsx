import React, { useState, useMemo } from 'react';
import { Commission, Bill, HospitalConfig, Patient, Professional } from '../types';

interface CommissionReportProps {
  commissions: Commission[];
  staff: Professional[];
  bills: Bill[];
  patients: Patient[];
  hospitalConfig: HospitalConfig;
}

const CommissionReport: React.FC<CommissionReportProps> = ({ commissions, staff, bills, patients, hospitalConfig }) => {
  const [filterDoctor, setFilterDoctor] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const currency = hospitalConfig.currencySymbol || 'Tk';

  const commissionDetails = useMemo(() => {
    return commissions.map(c => {
      const doctor = staff.find(s => s.id === c.staffId);
      const bill = bills.find(b => b.id === c.billId);
      const patient = bill?.patientId ? patients.find(p => p.id === bill.patientId) : null;
      const pName = bill?.walkInName || patient?.name || 'Walk-in / Unknown';

      return {
        ...c,
        doctorName: doctor?.name || 'Deleted Professional',
        doctorRate: doctor?.commissionRate || 0,
        patientName: pName,
        billNet: (bill?.totalAmount || 0) - (bill?.discount || 0),
        billStatus: bill?.status || 'due',
        author: bill?.authorName || 'System'
      };
    });
  }, [commissions, staff, bills, patients]);

  const filteredCommissions = useMemo(() => {
    return commissionDetails.filter(c => {
      const commDateStr = c.date.split('T')[0];
      const matchesRange = commDateStr >= startDate && commDateStr <= endDate;
      if (!matchesRange) return false;
      if (filterDoctor && c.staffId !== filterDoctor) return false;
      if (statusFilter !== 'All') {
        if (statusFilter === 'paid' && c.billStatus !== 'paid') return false;
        if (statusFilter === 'due' && c.billStatus === 'paid') return false; 
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matches = c.patientName.toLowerCase().includes(q) || 
                        c.doctorName.toLowerCase().includes(q) || 
                        c.billId.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [commissionDetails, filterDoctor, statusFilter, searchQuery, startDate, endDate]);

  const totalCommissions = useMemo(() => filteredCommissions.reduce((acc, c) => acc + c.amount, 0), [filteredCommissions]);
  const totalInvoiced = useMemo(() => filteredCommissions.reduce((acc, c) => acc + c.billNet, 0), [filteredCommissions]);

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight uppercase">Commission Ledger</h2>
          <p className="text-sm text-slate-500 font-medium">Generate financial settlement statements for partners</p>
        </div>
      </header>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2 space-y-1">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Quick Search</label>
             <input type="text" placeholder="Patient, Doctor, or Invoice..." className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm dark:text-white" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
          <div className="space-y-1">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Status</label>
             <select className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:text-white" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option value="All">All Transactions</option><option value="paid">Paid</option><option value="due">Due</option></select>
          </div>
          <div className="space-y-1">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Partner</label>
             <select className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:text-white" value={filterDoctor} onChange={e => setFilterDoctor(e.target.value)}><option value="">Consolidated</option>{staff.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[40px] p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
           <div className="flex justify-between items-start border-b-2 border-slate-900 dark:border-slate-700 pb-6 mb-8">
              <div className="flex items-center gap-6">
                 <div className="w-16 h-16 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black italic text-2xl uppercase">SH</div>
                 <div><h1 className="text-2xl font-black uppercase leading-none mb-1 text-slate-800 dark:text-white">{hospitalConfig.name}</h1><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{hospitalConfig.tagline}</p></div>
              </div>
              <div className="text-right"><h2 className="text-sm font-black uppercase text-blue-700 dark:text-blue-400 underline underline-offset-4">Settlement Statement</h2><p className="text-[10px] font-bold text-slate-900 dark:text-slate-300 uppercase">FY: {new Date().getFullYear()}</p></div>
           </div>

           <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl"><p className="text-[8px] font-black text-slate-400 uppercase mb-1">Invoiced</p><p className="text-sm font-black dark:text-white">{totalInvoiced.toLocaleString()}</p></div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"><p className="text-[8px] font-black text-blue-600 dark:text-blue-400 uppercase mb-1">Payable</p><p className="text-sm font-black text-blue-800 dark:text-blue-300">{totalCommissions.toLocaleString()} {currency}</p></div>
              <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl"><p className="text-[8px] font-black text-slate-400 uppercase mb-1">Entry Count</p><p className="text-sm font-black dark:text-white">{filteredCommissions.length}</p></div>
           </div>

           <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                  <thead><tr className="bg-slate-50 dark:bg-slate-800"><th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-500">Professional</th><th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-500">Invoice</th><th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-right text-slate-500">Settlement</th></tr></thead>
                  <tbody className="divide-y dark:divide-slate-800">
                     {filteredCommissions.map(c => (
                        <tr key={c.id}><td className="px-4 py-3 text-[10px] font-black uppercase dark:text-slate-200">{c.doctorName}</td><td className="px-4 py-3 text-[10px] font-mono dark:text-slate-400">{c.billId}</td><td className="px-4 py-3 text-right text-[11px] font-black dark:text-white">{c.amount.toLocaleString()}</td></tr>
                     ))}
                  </tbody>
                  <tfoot><tr className="bg-slate-50 dark:bg-slate-800 font-black"><td className="px-4 py-5 text-[11px] uppercase dark:text-slate-300" colSpan={2}>Aggregate Liability</td><td className="px-4 py-5 text-right text-lg tabular-nums dark:text-white">{totalCommissions.toLocaleString()} <span className="text-[10px]">{currency}</span></td></tr></tfoot>
               </table>
           </div>
      </div>
    </div>
  );
};

export default CommissionReport;