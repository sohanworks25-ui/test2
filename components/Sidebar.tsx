
import React from 'react';
import { User, UserRole, HospitalConfig } from '../types';
import { ICONS } from '../constants';

interface SidebarProps {
  currentUser: User;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onLogout: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  hospitalConfig: HospitalConfig;
}

const Sidebar: React.FC<SidebarProps> = ({ currentUser, activeTab, setActiveTab, isOpen, setIsOpen, onLogout, theme, toggleTheme, hospitalConfig }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: ICONS.Dashboard, roles: Object.values(UserRole) },
    { id: 'billing', label: 'Billing Center', icon: ICONS.Billing, roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.RECEPTIONIST, UserRole.NURSE] },
    { id: 'daily-summary', label: 'Daily Ledger', icon: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>, roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.RECEPTIONIST, UserRole.NURSE] },
    { id: 'monthly-audit', label: 'Fiscal Audit', icon: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="m9 16 2 2 4-4"/></svg>, roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER] },
    { id: 'patients', label: 'Registry', icon: ICONS.Patients, roles: Object.values(UserRole) },
    { id: 'admitted', label: 'Inpatient', icon: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/></svg>, roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.RECEPTIONIST, UserRole.NURSE] },
    { id: 'discharged', label: 'Patient Released', icon: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>, roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.RECEPTIONIST, UserRole.NURSE] },
    { id: 'dues', label: 'Due Records', icon: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/><line x1="7" x2="7" y1="15" y2="15"/><line x1="12" x2="12" y1="15" y2="15"/></svg>, roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.RECEPTIONIST, UserRole.NURSE] },
    { 
      id: 'professionals', 
      label: 'Doctor', 
      icon: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M4.8 2.3A.3.3 0 1 0 5 2h-.2ZM3.3 7h1.6m.2 0h1.6m.2 0h1.6m.2 0h1.6M12 2v8m-9 3v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M16 2v8M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4"/><circle cx="12" cy="7" r="4"/></svg>, 
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER] 
    },
    { id: 'commissions', label: 'Referral Pay', icon: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 2v20"/><path d="m17 5-5-3-5 3"/><path d="m17 19-5 3-5-3"/><rect width="20" height="12" x="2" y="6" rx="2"/></svg>, roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.RECEPTIONIST, UserRole.NURSE] },
    { id: 'services', label: 'Clinical Catalog', icon: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>, roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER] },
    { id: 'backup', label: 'Backup Engine', icon: ICONS.Backup, roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.NURSE, UserRole.MANAGER] },
    { id: 'users', label: 'User', icon: ICONS.Users, roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN] },
    { id: 'settings', label: 'Configuration', icon: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>, roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER] },
  ];

  const handleTabClick = (id: string) => { setActiveTab(id); if (window.innerWidth < 1024) setIsOpen(false); };

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setIsOpen(false)} />}
      <aside className={`w-52 bg-slate-900 text-white h-screen fixed left-0 top-0 overflow-y-auto no-print shadow-2xl z-50 transition-transform duration-300 transform ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex flex-col h-full">
          <div className="p-4 pb-1 flex justify-between items-center">
            <h1 className="text-sm font-black flex items-center gap-1.5 text-blue-400 uppercase tracking-tighter">
              <span className="w-7 h-7 bg-blue-600 text-white rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20 italic">SH</span>
              HMS_OS
            </h1>
            <button onClick={() => setIsOpen(false)} className="lg:hidden p-1 text-slate-400 hover:text-white"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>
          </div>
          <div className="px-3 py-3 mb-1 border-b border-slate-800">
            <button onClick={() => handleTabClick('profile')} className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all ${activeTab === 'profile' ? 'bg-blue-600/10' : 'hover:bg-white/5'}`}>
              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-black uppercase text-blue-500">{currentUser.name.charAt(0)}</div>
              <div className="overflow-hidden text-left"><p className="text-[10px] font-black truncate text-slate-100 uppercase">{currentUser.name}</p><p className="text-[8px] font-black text-slate-500 truncate uppercase tracking-widest">{currentUser.role.replace('_', ' ')}</p></div>
            </button>
          </div>
          <nav className="mt-1 px-3 space-y-0.5 flex-1 custom-scrollbar overflow-y-auto">
            {menuItems.filter(item => item.roles.includes(currentUser.role)).map((item) => (
              <button key={item.id} type="button" onClick={() => handleTabClick(item.id)} className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all ${activeTab === item.id ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-100 hover:bg-white/5'}`}>
                <item.icon className={`shrink-0 ${activeTab === item.id ? 'text-white' : 'text-slate-600'}`} />
                <span className="font-black text-[10px] uppercase tracking-widest">{item.label}</span>
              </button>
            ))}
          </nav>
          <div className="mt-auto p-3 border-t border-slate-800 bg-slate-950/20 space-y-0.5">
            <button onClick={toggleTheme} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-500 hover:text-blue-400 font-black text-[10px] uppercase tracking-widest transition-all">SYSTEM_MODE</button>
            <button onClick={onLogout} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-500 hover:text-rose-400 font-black text-[10px] uppercase tracking-widest transition-all">SIGN_OUT</button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
