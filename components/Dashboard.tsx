
import React, { useMemo, useState, useEffect } from 'react';
import { Bill, Patient, Commission, HospitalConfig, AdmittedPatient, Room } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area, ComposedChart, 
  PieChart, Pie, Cell, Legend
} from 'recharts';

interface DashboardProps {
  bills: Bill[];
  patients: Patient[];
  commissions: Commission[];
  admissions: AdmittedPatient[];
  rooms: Room[];
  hospitalConfig?: HospitalConfig;
  theme: 'light' | 'dark';
  currentUser?: { name: string };
}

const Dashboard: React.FC<DashboardProps> = ({ 
  bills, 
  patients, 
  commissions, 
  admissions,
  rooms,
  hospitalConfig, 
  theme,
  currentUser
}) => {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const currency = hospitalConfig?.currencySymbol || 'Tk'; 
  const timeZone = hospitalConfig?.timeZone || 'UTC';

  // Greeting Logic
  const greeting = useMemo(() => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }, [currentTime]);

  const setRangeShortcut = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  const localizedTime = useMemo(() => {
    try {
      const timeFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
      });
      const dateFormatter = new Intl.DateTimeFormat('en-GB', {
        timeZone, day: '2-digit', month: 'short', year: 'numeric'
      });
      return {
        date: dateFormatter.format(currentTime),
        time: timeFormatter.format(currentTime)
      };
    } catch (e) {
      return { date: currentTime.toLocaleDateString(), time: currentTime.toLocaleTimeString() };
    }
  }, [currentTime, timeZone]);

  const stats = useMemo(() => {
    // Total Revenue based on creation date range
    const revenueBills = bills.filter(bill => {
      const billDate = bill.date.split('T')[0];
      return (startDate ? billDate >= startDate : true) && (endDate ? billDate <= endDate : true);
    });
    const totalRevenue = revenueBills.reduce((acc, bill) => acc + (bill.totalAmount - bill.discount), 0);

    // Total Collection based on payment date range
    const totalCollected = bills.reduce((acc, bill) => {
      const filteredPayments = (bill.payments || []).filter(p => {
        const pDate = p.date.split('T')[0];
        return (startDate ? pDate >= startDate : true) && (endDate ? pDate <= endDate : true);
      });
      
      const sum = filteredPayments.reduce((s, p) => s + p.amount, 0);

      // Legacy fallback
      let legacy = 0;
      if (!bill.payments || bill.payments.length === 0) {
        const bDate = bill.date.split('T')[0];
        if ((startDate ? bDate >= startDate : true) && (endDate ? bDate <= endDate : true)) {
          legacy = bill.paidAmount;
        }
      }
      return acc + sum + legacy;
    }, 0);

    const totalDue = bills.reduce((acc, bill) => acc + bill.dueAmount, 0);
    const activeInpatients = admissions.filter(a => a.status === 'admitted').length;
    const occupiedRooms = rooms.filter(r => r.status === 'Occupied').length;
    
    return {
      totalRevenue,
      totalCollected,
      totalDue,
      patientCount: patients.length,
      activeInpatients,
      occupancyRate: rooms.length > 0 ? Math.round((occupiedRooms / rooms.length) * 100) : 0
    };
  }, [bills, patients.length, admissions, rooms, startDate, endDate]);

  const trajectoryData = useMemo(() => {
    const grouped: Record<string, { name: string, collection: number, due: number }> = {};
    
    // Track collection by payment date
    bills.forEach(bill => {
      if (bill.payments && bill.payments.length > 0) {
        bill.payments.forEach(p => {
          const day = new Date(p.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
          if (!grouped[day]) grouped[day] = { name: day, collection: 0, due: 0 };
          grouped[day].collection += p.amount;
        });
      } else {
        // Legacy fallback using bill creation date
        const day = new Date(bill.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
        if (!grouped[day]) grouped[day] = { name: day, collection: 0, due: 0 };
        grouped[day].collection += bill.paidAmount;
      }
    });

    // Also track due balances for trajectory visual
    bills.forEach(bill => {
       const day = new Date(bill.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
       if (grouped[day]) grouped[day].due += bill.dueAmount;
    });

    return Object.values(grouped).sort((a,b) => new Date(a.name).getTime() - new Date(b.name).getTime()).slice(-20);
  }, [bills]);

  const revenueByCategory = useMemo(() => {
    const categories: Record<string, number> = {};
    bills.forEach(b => {
      const bDate = b.date.split('T')[0];
      if ((startDate ? bDate >= startDate : true) && (endDate ? bDate <= endDate : true)) {
        const type = b.type || 'General';
        categories[type] = (categories[type] || 0) + (b.totalAmount - b.discount);
      }
    });
    const colors = ['#2563eb', '#7c3aed', '#db2777', '#ea580c', '#16a34a', '#0891b2'];
    return Object.entries(categories).map(([name, value], idx) => ({
      name,
      value,
      color: colors[idx % colors.length]
    }));
  }, [bills, startDate, endDate]);

  const highPriorityDues = useMemo(() => {
    return [...bills]
      .filter(b => b.dueAmount > 500)
      .sort((a, b) => b.dueAmount - a.dueAmount)
      .slice(0, 4);
  }, [bills]);

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-slate-900 rounded-[48px] p-8 md:p-12 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-600/20 to-transparent"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
          <div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-2">
              {greeting}, <span className="text-blue-400">{currentUser?.name?.split(' ')[0] || 'Admin'}</span>
            </h1>
            <p className="text-slate-400 font-medium text-lg">Hospital Clinical & Financial Performance Overview</p>
            <div className="flex flex-wrap gap-3 mt-6">
              <button onClick={() => setRangeShortcut(1)} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-black uppercase tracking-widest transition-all">Today</button>
              <button onClick={() => setRangeShortcut(7)} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-black uppercase tracking-widest transition-all">Last 7 Days</button>
              <button onClick={() => setRangeShortcut(30)} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-black uppercase tracking-widest transition-all">Monthly</button>
              <button onClick={() => {setStartDate(''); setEndDate('');}} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg">Clear Filters</button>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] p-6 flex items-center gap-8 shadow-2xl">
            <div className="text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">System Time</p>
              <p className="text-2xl font-black tabular-nums">{localizedTime.time}</p>
            </div>
            <div className="w-px h-10 bg-white/10"></div>
            <div className="text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Current Date</p>
              <p className="text-xl font-black">{localizedTime.date}</p>
            </div>
          </div>
        </div>
      </section>

      {/* TOP METRICS GRID */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Net Revenue', value: stats.totalRevenue, sub: 'Total Invoiced', color: 'bg-blue-600', icon: '💰' },
          { label: 'Settlement Sum', value: stats.totalCollected, sub: 'Actual Cash Collected', color: 'bg-emerald-500', icon: '📥' },
          { label: 'Aged Dues', value: stats.totalDue, sub: 'Uncollected Funds', color: 'bg-rose-500', icon: '📉' },
          { label: 'Occupancy', value: `${stats.occupancyRate}%`, sub: 'Bed Capacity Used', color: 'bg-indigo-500', icon: '🛌' },
        ].map((m, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 rounded-[32px] p-8 border border-slate-100 dark:border-slate-800 shadow-sm group hover:shadow-xl transition-all relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 text-7xl opacity-[0.03] group-hover:opacity-[0.08] transition-opacity rotate-12">{m.icon}</div>
            <div className="flex flex-col justify-between h-full relative z-10">
              <div>
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">{m.label}</span>
                <p className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tighter mt-1">
                  {typeof m.value === 'number' ? m.value.toLocaleString() : m.value}
                  {typeof m.value === 'number' && i < 3 && <span className="text-sm font-bold text-slate-400 ml-1">{currency}</span>}
                </p>
              </div>
              <div className="mt-6 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase">{m.sub}</span>
                <div className={`w-8 h-1.5 rounded-full ${m.color} opacity-20`}></div>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* CHARTS GRID */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Trajectory Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[40px] p-8 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col h-[500px]">
          <div className="flex justify-between items-center mb-8">
             <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest flex items-center gap-3">
               <div className="w-2 h-6 bg-blue-600 rounded-full"></div>
               Financial Velocity
             </h3>
             <div className="flex items-center gap-4 text-[10px] font-black uppercase">
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div> Collection</div>
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div> Outstanding</div>
             </div>
          </div>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trajectoryData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorColl" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/><stop offset="95%" stopColor="#2563eb" stopOpacity={0}/></linearGradient>
                  <linearGradient id="colorDue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#1e293b' : '#f1f5f9'} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: '900'}} dy={15} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: '900'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '24px', backgroundColor: theme === 'dark' ? '#0f172a' : '#fff', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', padding: '20px' }}
                  itemStyle={{ fontWeight: '900', textTransform: 'uppercase', fontSize: '10px' }}
                />
                <Area type="monotone" dataKey="collection" stroke="#2563eb" strokeWidth={4} fillOpacity={1} fill="url(#colorColl)" />
                <Area type="monotone" dataKey="due" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorDue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Mix Chart */}
        <div className="bg-white dark:bg-slate-900 rounded-[40px] p-8 border border-slate-100 dark:border-slate-800 shadow-sm h-[500px] flex flex-col">
          <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest flex items-center gap-3 mb-8">
            <div className="w-2 h-6 bg-purple-600 rounded-full"></div>
            Source Mix
          </h3>
          <div className="flex-1 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={revenueByCategory}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {revenueByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '24px', backgroundColor: '#0f172a', border: 'none', color: '#fff' }}
                  itemStyle={{ color: '#fff', fontSize: '11px', fontWeight: '900' }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Summary */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aggregate</p>
               <p className="text-xl font-black text-slate-900 dark:text-white">Revenue</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
             {revenueByCategory.map((cat, i) => (
               <div key={i} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }}></div>
                  <span className="text-[10px] font-black text-slate-500 uppercase truncate">{cat.name}</span>
               </div>
             ))}
          </div>
        </div>
      </section>

      {/* FEEDS SECTION */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Live Transaction Feed */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[40px] p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
           <div className="flex justify-between items-center mb-8">
              <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest flex items-center gap-3">
                <div className="w-2 h-6 bg-emerald-500 rounded-full"></div>
                Live Transaction Stream
              </h3>
              <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 text-[10px] font-black uppercase rounded-full">Real-time</span>
           </div>
           <div className="space-y-4">
              {bills.slice(-5).reverse().map((b, i) => (
                <div key={i} className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800/50 rounded-3xl hover:scale-[1.01] transition-all group">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-700 shadow-sm flex items-center justify-center font-black text-slate-400 group-hover:text-blue-600 transition-colors">
                         {b.type.charAt(0)}
                      </div>
                      <div>
                         <p className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">{b.walkInName || patients.find(p => p.id === b.patientId)?.name || 'Guest'}</p>
                         <p className="text-[10px] font-bold text-slate-400 uppercase">{b.type} • {new Date(b.date).toLocaleDateString()}</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-lg font-black text-slate-900 dark:text-white tabular-nums">{b.paidAmount.toLocaleString()} <span className="text-[10px] opacity-40">{currency}</span></p>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${b.dueAmount > 0 ? 'text-amber-600 bg-amber-50' : 'text-emerald-600 bg-emerald-50'}`}>
                         {b.dueAmount > 0 ? 'Partial Settlement' : 'Full Payment'}
                      </span>
                   </div>
                </div>
              ))}
           </div>
        </div>

        {/* Priority Dues & Alerts */}
        <div className="bg-slate-900 rounded-[40px] p-8 text-white shadow-2xl flex flex-col">
           <h3 className="text-lg font-black uppercase tracking-widest flex items-center gap-3 mb-8">
              <div className="w-2 h-6 bg-rose-500 rounded-full animate-pulse"></div>
              Urgent Recoverables
           </h3>
           <div className="flex-1 space-y-6">
              {highPriorityDues.length > 0 ? highPriorityDues.map((b, i) => (
                <div key={i} className="relative pl-6 before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:bg-rose-500/30 before:rounded-full">
                   <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">Invoice: {b.id}</p>
                   <div className="flex justify-between items-end">
                      <div>
                         <p className="text-sm font-black uppercase truncate max-w-[140px]">{b.walkInName || patients.find(p => p.id === b.patientId)?.name || 'Unknown'}</p>
                         <p className="text-[10px] font-bold text-slate-500">{new Date(b.date).toLocaleDateString()}</p>
                      </div>
                      <p className="text-xl font-black text-white">{b.dueAmount.toLocaleString()} <span className="text-[10px] opacity-40">{currency}</span></p>
                   </div>
                </div>
              )) : (
                <div className="flex flex-col items-center justify-center py-20 opacity-20 text-center">
                   <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-4"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                   <p className="text-sm font-black uppercase tracking-widest">No Critical Dues</p>
                </div>
              )}
           </div>
           
           <div className="mt-8 p-6 bg-white/5 rounded-3xl border border-white/5">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Facility Intensity</p>
              <div className="flex items-center gap-4">
                 <div className="flex-1 h-3 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${stats.occupancyRate}%` }}></div>
                 </div>
                 <span className="text-lg font-black">{stats.occupancyRate}%</span>
              </div>
           </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
