import React, { useState, useMemo } from 'react';
import { AdmittedPatient, Patient, Bill, HospitalConfig, User } from '../types';

interface DischargeHistoryProps {
  admissions: AdmittedPatient[];
  patients: Patient[];
  bills: Bill[];
  hospitalConfig: HospitalConfig;
  staff: User[];
}

const DischargeHistory: React.FC<DischargeHistoryProps> = ({ admissions, patients, bills, hospitalConfig, staff }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const currency = hospitalConfig.currencySymbol || 'Tk';

  const dischargedAdmissions = useMemo(() => {
    return admissions
      .filter(adm => adm.status === 'discharged')
      .filter(adm => {
        const p = patients.find(pat => pat.id === adm.patientId);
        const name = p?.name.toLowerCase() || '';
        const q = searchQuery.toLowerCase();
        return name.includes(q) || adm.patientId.toLowerCase().includes(q);
      })
      .sort((a, b) => new Date(b.dischargeDate || '').getTime() - new Date(a.dischargeDate || '').getTime());
  }, [admissions, patients, searchQuery]);

  const getAdmissionFinancials = (patientId: string) => {
    const pBills = bills.filter(b => b.patientId === patientId);
    const total = pBills.reduce((acc, b) => acc + (b.totalAmount - b.discount), 0);
    return { total };
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="m22 13-3-3-3 3"/><path d="m19 10 3 3"/></svg>
           </div>
           <div>
              <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight uppercase">Discharge Archive</h2>
              <p className="text-sm text-slate-500 font-medium italic">Audit history of completed clinical stays</p>
           </div>
        </div>
      </header>

      <div className="bg-white dark:bg-slate-900 p-4 rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="relative group">
          <input 
            type="text" 
            placeholder="Search by name or clinical MRN..." 
            className="w-full pl-12 pr-4 py-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-none font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm dark:text-white"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-slate-900 border-b border-slate-800">
              <tr>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Clinical Subject</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Assignment Location</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Audit Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {dischargedAdmissions.map(adm => {
                const p = patients.find(pat => pat.id === adm.patientId);
                const financials = getAdmissionFinancials(adm.patientId);
                
                return (
                  <tr key={adm.id}>
                    <td className="px-8 py-5">
                      <p className="font-black text-slate-800 dark:text-slate-100 text-sm uppercase tracking-tight">{p?.name || 'Released Patient'}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-black text-blue-600 font-mono uppercase tracking-tighter bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded">MRN: {adm.patientId}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">• Closed {new Date(adm.dischargeDate || '').toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                       <p className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-tight">Room {adm.roomNumber}</p>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bed Identifier {adm.bedNumber}</p>
                    </td>
                    <td className="px-8 py-5 text-right">
                       <p className="text-lg font-black text-slate-900 dark:text-white tracking-tighter tabular-nums">
                          {financials.total.toLocaleString()} <span className="text-[10px] uppercase opacity-40 font-bold">{currency}</span>
                       </p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DischargeHistory;