
import React, { useState, useEffect, useCallback } from 'react';
import { User, UserRole, Patient, Bill, ServiceItem, Commission, HospitalConfig, Expense, TrashItem, AdmittedPatient, Room, ServiceCategory, Professional, PaymentRecord } from './types';
import { storageService, KEYS } from './services/storageService';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import PatientManager from './components/PatientManager';
import BillingManager from './components/BillingManager';
import ServiceInventory from './components/ServiceInventory';
import UserManager from './components/UserManager';
import ProfessionalManager from './components/ProfessionalManager';
import Settings from './components/Settings';
import CommissionReport from './components/CommissionReport';
import UserProfile from './components/UserProfile';
import DailySummary from './components/DailySummary';
import DueHistory from './components/DueHistory';
import BackupManager from './components/BackupManager';
import RecycleBin from './components/RecycleBin';
import MonthlyAudit from './components/MonthlyAudit';
import AdmittedPatients from './components/AdmittedPatients';
import RoomManagement from './components/RoomManagement';
import DischargeHistory from './components/DischargeHistory';
import Login from './components/Login';
import ConfirmModal from './components/ConfirmModal';

storageService.init();

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => storageService.getCurrentSession());
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(storageService.getTheme());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const [patients, setPatients] = useState<Patient[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [trash, setTrash] = useState<TrashItem[]>([]);
  const [admissions, setAdmissions] = useState<AdmittedPatient[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [hospitalConfig, setHospitalConfig] = useState<HospitalConfig>(storageService.getHospitalConfig());
  const [duesSearchTerm, setDuesSearchTerm] = useState('');

  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  // Reset dues search when navigating away from dues tab
  useEffect(() => {
    if (activeTab !== 'dues') {
      setDuesSearchTerm('');
    }
  }, [activeTab]);

  // Handle Connectivity State
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const triggerConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmState({ isOpen: true, title, message, onConfirm });
  };

  const loadData = useCallback(async () => {
    const config = storageService.getHospitalConfig();
    setHospitalConfig(config);

    const [u, p, s, c, b, e, com, t, adm, rm, pro] = await Promise.all([
      storageService.getUsers(),
      storageService.getPatients(),
      storageService.getServices(),
      storageService.getServiceCategories(),
      storageService.getBills(),
      storageService.getExpenses(),
      storageService.getCommissions(),
      storageService.getTrash(),
      storageService.getAdmissions(),
      storageService.getRooms(),
      storageService.getProfessionals()
    ]);

    setUsers(u); setPatients(p); setServices(s); setServiceCategories(c);
    setBills(b); setExpenses(e); setCommissions(com); setTrash(t);
    setAdmissions(adm); setRooms(rm); setProfessionals(pro);
    
    setCurrentUser(storageService.getCurrentSession());
    setTheme(storageService.getTheme());
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const moveToTrash = (type: TrashItem['type'], originalId: string, name: string, data: any) => {
    const newItem: TrashItem = {
      id: `TRASH-${Date.now()}`,
      originalId,
      type,
      name,
      data,
      deletedAt: new Date().toISOString()
    };
    const updatedTrash = [newItem, ...trash];
    setTrash(updatedTrash);
    storageService.saveTrash(updatedTrash);
  };

  const handleRestore = (item: TrashItem) => {
    if (item.type === 'Patient') {
      const updated = [...patients, item.data];
      setPatients(updated);
      storageService.savePatients(updated);
    } else if (item.type === 'Bill') {
      const updated = [...bills, item.data];
      setBills(updated);
      storageService.saveBills(updated);
    } else if (item.type === 'Service') {
      const updated = [...services, item.data];
      setServices(updated);
      storageService.saveServices(updated);
    } else if (item.type === 'User') {
      const updated = [...users, item.data];
      setUsers(updated);
      storageService.saveUsers(updated);
    } else if (item.type === 'Professional') {
      const updated = [...professionals, item.data];
      setProfessionals(updated);
      storageService.saveProfessionals(updated);
    } else if (item.type === 'Room') {
      const updated = [...rooms, item.data];
      setRooms(updated);
      storageService.saveRooms(updated);
    } else if (item.type === 'Admission') {
      const updated = [...admissions, item.data];
      setAdmissions(updated);
      storageService.saveAdmissions(updated);
    }
    const updatedTrash = trash.filter(t => t.id !== item.id);
    setTrash(updatedTrash);
    storageService.saveTrash(updatedTrash);
  };

  const handlePermanentDelete = (id: string) => {
    const updatedTrash = trash.filter(t => t.id !== id);
    setTrash(updatedTrash);
    storageService.saveTrash(updatedTrash);
  };

  const handleEmptyTrash = () => {
    setTrash([]);
    storageService.saveTrash([]);
  };

  useEffect(() => {
    if (!currentUser) return;
    const handleUserActivity = () => storageService.updateSessionActivity();
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === KEYS.SESSION) {
        const updated = storageService.getCurrentSession();
        if (!updated) setCurrentUser(null);
        else if (updated.id !== currentUser.id) setCurrentUser(updated);
      }
    };
    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('keypress', handleUserActivity);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keypress', handleUserActivity);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [currentUser]);

  const calculateAndSyncCommission = (bill: Bill, currentComms: Commission[]): Commission[] => {
    let filteredComms = currentComms.filter(c => c.billId !== bill.id);
    if (bill.referringDoctorId) {
      const pro = professionals.find(p => p.id === bill.referringDoctorId);
      if (pro && pro.commissionEnabled) {
        let amount = 0;
        bill.items.forEach(item => { amount += (item.total * (item.commissionRate || 0)) / 100; });
        if (amount === 0 && pro.commissionRate) {
          amount = ((bill.totalAmount - bill.discount) * pro.commissionRate) / 100;
        }
        if (amount > 0) {
          filteredComms.push({ id: `C-${Date.now()}`, billId: bill.id, staffId: pro.id, amount, date: bill.date, type: 'Referral', calculationMethod: 'Item-Based' });
        }
      }
    }
    return filteredComms;
  };

  const handleLogin = (user: User, remember: boolean) => {
    storageService.login(user, remember);
    setCurrentUser(user);
  };

  const handleLogout = () => {
    storageService.logout();
    setCurrentUser(null);
  };

  const handleUpdateRoom = (r: Room) => {
    const updated = rooms.map(item => item.id === r.id ? r : item);
    setRooms(updated);
    storageService.saveRooms(updated);
  };

  const handleGoToDues = (patientId: string) => {
    setDuesSearchTerm(patientId);
    setActiveTab('dues');
  };

  if (!currentUser) {
    return <Login hospitalConfig={hospitalConfig} users={users} onLogin={handleLogin} />;
  }

  return (
    <div className={`min-h-screen flex ${theme === 'dark' ? 'bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-900'}`}>
      <Sidebar currentUser={currentUser} activeTab={activeTab} setActiveTab={setActiveTab} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} onLogout={handleLogout} theme={theme} toggleTheme={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')} hospitalConfig={hospitalConfig} />
      <main className="flex-1 lg:ml-64 p-4 md:p-8 w-full">
        <div className="max-w-7xl mx-auto">
          {/* Offline Notice Banner */}
          {!isOnline && (
            <div className="mb-6 animate-slide-up no-print">
               <div className="bg-amber-500 text-white px-6 py-3 rounded-2xl flex items-center justify-between shadow-lg shadow-amber-500/20">
                  <div className="flex items-center gap-3">
                     <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M1 1l22 22"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/><path d="M10.71 5.05A16 16 0 0 1 22.58 9"/><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><path d="M12 20h.01"/></svg>
                     <span className="font-black text-xs uppercase tracking-widest">Offline Workspace: Local Data Access Only</span>
                  </div>
                  <span className="text-[10px] font-bold opacity-80 uppercase italic">Changes will sync once online</span>
               </div>
            </div>
          )}

          {activeTab === 'dashboard' && <Dashboard bills={bills} patients={patients} commissions={commissions} admissions={admissions} rooms={rooms} hospitalConfig={hospitalConfig} theme={theme} currentUser={currentUser} />}
          
          {activeTab === 'professionals' && <ProfessionalManager professionals={professionals} 
            onAdd={p => { const updated = [...professionals, p]; setProfessionals(updated); storageService.saveProfessionals(updated); }} 
            onUpdate={p => { const updated = professionals.map(item => item.id === p.id ? p : item); setProfessionals(updated); storageService.saveProfessionals(updated); }} 
            onDelete={id => triggerConfirm("Wait a second!", "Move this professional to Recycle Bin?", () => { 
              const item = professionals.find(p => p.id === id);
              if(item) moveToTrash('Professional', id, item.name, item);
              const updated = professionals.filter(p => p.id !== id); 
              setProfessionals(updated); 
              storageService.saveProfessionals(updated); 
              setConfirmState(p => ({...p, isOpen: false})); 
            })} 
          />}
          
          {activeTab === 'billing' && <BillingManager patients={patients} services={services} professionals={professionals} bills={bills} currentUser={currentUser} 
            onGenerateBill={b => { const updated = [...bills, b]; setBills(updated); storageService.saveBills(updated); setCommissions(prev => { const synced = calculateAndSyncCommission(b, prev); storageService.saveCommissions(synced); return synced; }); }} 
            onUpdateBill={b => { const updated = bills.map(item => item.id === b.id ? b : item); setBills(updated); storageService.saveBills(updated); }} 
            onDeleteBill={id => triggerConfirm("Wait a second!", "Move this invoice to Recycle Bin?", () => { 
              const item = bills.find(b => b.id === id);
              if(item) moveToTrash('Bill', id, `Invoice: ${id}`, item);
              const updated = bills.filter(b => b.id !== id); 
              setBills(updated); 
              storageService.saveBills(updated); 
              setConfirmState(p => ({...p, isOpen: false})); 
            })} 
            onReceiveDue={() => {}} hospitalConfig={hospitalConfig} 
          />}
          
          {activeTab === 'admitted' && <AdmittedPatients patients={patients} admissions={admissions} professionals={professionals} bills={bills} rooms={rooms} hospitalConfig={hospitalConfig} 
            onAddAdmission={a => { const updated = [a, ...admissions]; setAdmissions(updated); storageService.saveAdmissions(updated); }} 
            onUpdateAdmission={a => { const updated = admissions.map(item => item.id === a.id ? a : item); setAdmissions(updated); storageService.saveAdmissions(updated); }} 
            onDeleteAdmission={id => triggerConfirm("Wait a second!", "Move this admission file to Recycle Bin?", () => { 
              const item = admissions.find(a => a.id === id);
              const p = patients.find(pat => pat.id === item?.patientId);
              if(item) moveToTrash('Admission', id, `Stay: ${p?.name || id}`, item);
              const updated = admissions.filter(a => a.id !== id); 
              setAdmissions(updated); 
              storageService.saveAdmissions(updated); 
              setConfirmState(p => ({...p, isOpen: false})); 
            })} 
            currentUser={currentUser} onGoToBilling={() => setActiveTab('billing')} onUpdateRoom={handleUpdateRoom} onGoToDues={handleGoToDues}
          />}
          
          {activeTab === 'patients' && <PatientManager patients={patients} bills={bills} admissions={admissions} hospitalConfig={hospitalConfig} 
            onAddPatient={p => { const updated = [...patients, p]; setPatients(updated); storageService.savePatients(updated); }} 
            onUpdatePatient={p => { const updated = patients.map(item => item.id === p.id ? p : item); setPatients(updated); storageService.savePatients(updated); }} 
            onDeletePatient={id => triggerConfirm("Wait a second!", "Move this patient record to Recycle Bin?", () => { 
              const item = patients.find(p => p.id === id);
              if(item) moveToTrash('Patient', id, item.name, item);
              const updated = patients.filter(p => p.id !== id); 
              setPatients(updated); 
              storageService.savePatients(updated); 
              setConfirmState(p => ({...p, isOpen: false})); 
            })} 
            currentUser={currentUser} 
          />}
          
          {activeTab === 'users' && <UserManager users={users} 
            onAddUser={u => { const updated = [...users, u]; setUsers(updated); storageService.saveUsers(updated); }} 
            onUpdateUser={u => { const updated = users.map(item => item.id === u.id ? u : item); setUsers(updated); storageService.saveUsers(updated); }} 
            onDeleteUser={id => triggerConfirm("Wait a second!", "Move this staff account to Recycle Bin?", () => { 
              const item = users.find(u => u.id === id);
              if(item) moveToTrash('User', id, item.name, item);
              const updated = users.filter(u => u.id !== id); 
              setUsers(updated); 
              storageService.saveUsers(updated); 
              setConfirmState(p => ({...p, isOpen: false})); 
            })} 
            currentUser={currentUser} 
          />}
          
          {activeTab === 'commissions' && <CommissionReport commissions={commissions} staff={professionals} bills={bills} patients={patients} hospitalConfig={hospitalConfig} />}
          
          {activeTab === 'daily-summary' && <DailySummary bills={bills} expenses={expenses} commissions={commissions} patients={patients} staff={users} 
            onAddExpense={e => { const updated = [...expenses, e]; setExpenses(updated); storageService.saveExpenses(updated); }} 
            onUpdateExpense={e => { const updated = expenses.map(item => item.id === e.id ? e : item); setExpenses(updated); storageService.saveExpenses(updated); }} 
            onDeleteExpense={id => triggerConfirm("Wait a second!", "Delete this expense record permanently?", () => { 
              const updated = expenses.filter(e => e.id !== id); 
              setExpenses(updated); 
              storageService.saveExpenses(updated); 
              setConfirmState(p => ({...p, isOpen: false})); 
            })} 
            currentUser={currentUser} hospitalConfig={hospitalConfig} 
          />}
          
          {activeTab === 'rooms' && <RoomManagement rooms={rooms} hospitalConfig={hospitalConfig} currentUser={currentUser} 
            onAddRoom={r => { const updated = [...rooms, r]; setRooms(updated); storageService.saveRooms(updated); }} 
            onUpdateRoom={handleUpdateRoom} 
            onDeleteRoom={id => triggerConfirm("Wait a second!", "Move this room to Recycle Bin?", () => { 
              const item = rooms.find(r => r.id === id);
              if(item) moveToTrash('Room', id, `Room ${item.number}`, item);
              const updated = rooms.filter(r => r.id !== id); 
              setRooms(updated); 
              storageService.saveRooms(updated); 
              setConfirmState(p => ({...p, isOpen: false})); 
            })} 
          />}
          
          {activeTab === 'services' && <ServiceInventory categories={serviceCategories} services={services} 
            onAddService={s => { const updated = [...services, s]; setServices(updated); storageService.saveServices(updated); }} 
            onUpdateService={s => { const updated = services.map(item => item.id === s.id ? s : item); setServices(updated); storageService.saveServices(updated); }} 
            onDeleteService={id => triggerConfirm("Wait a second!", "Move this service to Recycle Bin?", () => { 
              const item = services.find(s => s.id === id);
              if(item) moveToTrash('Service', id, item.name, item);
              const updated = services.filter(s => s.id !== id); 
              setServices(updated); 
              storageService.saveServices(updated); 
              setConfirmState(p => ({...p, isOpen: false})); 
            })} 
            onAddCategory={c => { const updated = [...serviceCategories, c]; setServiceCategories(updated); storageService.saveServiceCategories(updated); }} 
            onUpdateCategory={c => { const updated = serviceCategories.map(item => item.id === c.id ? c : item); setServiceCategories(updated); storageService.saveServiceCategories(updated); }} 
            onDeleteCategory={id => triggerConfirm("Wait a second!", "Delete this category permanently?", () => { 
              const updated = serviceCategories.filter(c => c.id !== id); 
              setServiceCategories(updated); 
              storageService.saveServiceCategories(updated); 
              setConfirmState(p => ({...p, isOpen: false})); 
            })} 
            currentUser={currentUser} hospitalConfig={hospitalConfig} 
          />}
          
          {activeTab === 'settings' && <Settings config={hospitalConfig} onUpdateConfig={c => { setHospitalConfig(c); storageService.saveHospitalConfig(c); }} currentUserRole={currentUser.role} />}
          {activeTab === 'profile' && <UserProfile currentUser={currentUser} onUpdateProfile={u => { const updated = users.map(item => item.id === u.id ? u : item); setUsers(updated); storageService.saveUsers(updated); setCurrentUser(u); storageService.login(u); }} />}
          {activeTab === 'backup' && <BackupManager />}
          {activeTab === 'trash' && <RecycleBin trash={trash} onRestore={handleRestore} onPermanentDelete={handlePermanentDelete} onEmptyTrash={handleEmptyTrash} />}
          {activeTab === 'monthly-audit' && <MonthlyAudit bills={bills} expenses={expenses} hospitalConfig={hospitalConfig} />}
          {activeTab === 'discharged' && < DischargeHistory admissions={admissions} patients={patients} bills={bills} hospitalConfig={hospitalConfig} staff={users} />}
          {activeTab === 'dues' && <DueHistory bills={bills} patients={patients} professionals={professionals} hospitalConfig={hospitalConfig} staff={users} admissions={admissions} initialSearch={duesSearchTerm} onReceiveDue={(billId, amount, discount) => {
              const updatedBills: Bill[] = bills.map(b => {
                  if (b.id === billId) {
                      const newPaid = b.paidAmount + amount;
                      const newDue = Math.max(0, b.dueAmount - amount - (discount || 0));
                      const newDiscount = b.discount + (discount || 0);
                      const status: 'paid' | 'partial' = newDue <= 0 ? 'paid' : 'partial';
                      
                      const newPayment: PaymentRecord = {
                        id: `PAY-${Date.now()}`,
                        date: new Date().toISOString(),
                        amount: amount,
                        method: b.paymentMethod || 'Cash',
                        note: 'Due Collection'
                      };

                      return { 
                        ...b, 
                        paidAmount: newPaid, 
                        dueAmount: newDue, 
                        discount: newDiscount, 
                        status,
                        payments: [...(b.payments || []), newPayment]
                      };
                  }
                  return b;
              });
              setBills(updatedBills);
              storageService.saveBills(updatedBills);
          }} />}
        </div>
      </main>
      <ConfirmModal isOpen={confirmState.isOpen} title={confirmState.title} message={confirmState.message} onConfirm={confirmState.onConfirm} onCancel={() => setConfirmState(p => ({...p, isOpen: false}))} />
    </div>
  );
};

export default App;
