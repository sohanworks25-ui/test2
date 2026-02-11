
import React, { useMemo, useState } from 'react';
import { Bill, Expense, HospitalConfig } from '../types';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Bar, ComposedChart, 
  Line 
} from 'recharts';

interface MonthlyAuditProps {
  bills: Bill[];
  expenses: Expense[];
  hospitalConfig: HospitalConfig;
}

const MonthlyAudit: React.FC<MonthlyAuditProps> = ({ bills, expenses, hospitalConfig }) => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | 'All'>('All');
  const currency = hospitalConfig.currencySymbol || 'Tk';

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const yearsSet = new Set<number>();
    for (let i = currentYear - 5; i <= currentYear + 5; i++) {
      yearsSet.add(i);
    }
    bills.forEach(b => yearsSet.add(new Date(b.date).getFullYear()));
    expenses.forEach(e => yearsSet.add(new Date(e.date).getFullYear()));
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [bills, expenses]);

  const monthsList = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];

  const fullYearLedger = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => ({
      index: i,
      name: new Date(0, i).toLocaleString('default', { month: 'short' }),
      fullName: monthsList[i],
      billing: 0,
      collected: 0,
      due: 0,
      expenses: 0,
    }));

    bills.forEach(b => {
      const d = new Date(b.date);
      // Revenue (Billing) follows the invoice creation date
      if (d.getFullYear() === selectedYear) {
        const m = d.getMonth();
        months[m].billing += (b.totalAmount - b.discount);
      }

      // Collected follows the payment date
      if (b.payments && b.payments.length > 0) {
        b.payments.forEach(p => {
          const pd = new Date(p.date);
          if (pd.getFullYear() === selectedYear) {
            months[pd.getMonth()].collected += p.amount;
          }
        });
      } else {
        // Legacy fallback
        if (d.getFullYear() === selectedYear) {
          months[d.getMonth()].collected += b.paidAmount;
        }
      }
    });

    expenses.forEach(e => {
      const d = new Date(e.date);
      if (d.getFullYear() === selectedYear) {
        const m = d.getMonth();
        months[m].expenses += e.amount;
      }
    });

    return months;
  }, [bills, expenses, selectedYear]);

  const filteredLedger = useMemo(() => {
    if (selectedMonth === 'All') return fullYearLedger;
    return fullYearLedger.filter(m => m.index === selectedMonth);
  }, [fullYearLedger, selectedMonth]);

  const periodTotals = useMemo(() => {
    return filteredLedger.reduce((acc, m) => ({
      billing: acc.billing + m.billing,
      collected: acc.collected + m.collected,
      due: acc.due + m.due,
      expenses: acc.expenses + m.expenses
    }), { billing: 0, collected: 0, due: 0, expenses: 0 });
  }, [filteredLedger]);

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight uppercase">Fiscal Audit Report</h2>
          <p className="text-sm text-slate-500 font-medium italic">Comprehensive annual financial summary</p>
        </div>
        <div className="flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="flex items-center px-4 border-r dark:border-slate-800">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">Year</span>
            <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="bg-transparent font-black text-blue-600 outline-none py-2.5">
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="flex items-center px-4">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">Calendar</span>
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value === 'All' ? 'All' : Number(e.target.value))} className="bg-transparent font-black text-slate-600 dark:text-slate-300 outline-none py-2.5">
              <option value="All">Full Year</option>
              {monthsList.map((m, idx) => <option key={idx} value={idx}>{m}</option>)}
            </select>
          </div>
        </div>
      </header>

      <section className="bg-white dark:bg-slate-900 rounded-[32px] p-8 border border-slate-100 dark:border-slate-800 shadow-sm h-[400px]">
        <div className="flex justify-between items-center mb-6">
           <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Velocity Dashboard ({selectedYear})</h3>
        </div>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={fullYearLedger} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="collected" name="Cash Collection" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
              <Line type="monotone" dataKey="expenses" name="Expenditure" stroke="#f43f5e" strokeWidth={2} dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="bg-white dark:bg-slate-900 rounded-[40px] p-10 border border-slate-100 dark:border-slate-800 shadow-sm">
           <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
              {[
                { label: 'Gross Revenue', value: periodTotals.billing, color: 'text-slate-900 dark:text-white' },
                { label: 'Net Collection', value: periodTotals.collected, color: 'text-emerald-600' },
                { label: 'Outflow (Exp)', value: periodTotals.expenses, color: 'text-rose-600' },
                { label: 'Cash Balance', value: periodTotals.collected - periodTotals.expenses, color: 'text-blue-600' },
              ].map((card, i) => (
                <div key={i} className="p-6 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-3xl">
                   <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{card.label}</p>
                   <p className={`text-xl font-black tabular-nums ${card.color}`}>{card.value.toLocaleString()} <span className="text-[10px] opacity-40 font-bold">{currency}</span></p>
                </div>
              ))}
           </div>

           <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800">
                       <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-500">Period</th>
                       <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-right text-slate-500">Revenue</th>
                       <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-right text-slate-500">Collected</th>
                       <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-right text-slate-500">Expenses</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y dark:divide-slate-800">
                    {filteredLedger.map(m => (
                        <tr key={m.name} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                             <td className="px-4 py-4 text-[10px] font-black uppercase dark:text-slate-200">{m.fullName}</td>
                             <td className="px-4 py-4 text-right text-[10px] font-bold dark:text-white">{m.billing.toLocaleString()}</td>
                             <td className="px-4 py-4 text-right text-[10px] font-black text-emerald-600">{m.collected.toLocaleString()}</td>
                             <td className="px-4 py-4 text-right text-[10px] font-bold text-rose-500">{m.expenses.toLocaleString()}</td>
                        </tr>
                    ))}
                 </tbody>
              </table>
           </div>
      </div>
    </div>
  );
};

export default MonthlyAudit;
