import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { ROLES_CONFIG } from '../constants';

interface UserManagerProps {
  users: User[];
  onAddUser: (user: User) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (id: string) => void;
  currentUser: User;
}

const UserManager: React.FC<UserManagerProps> = ({ users, onAddUser, onUpdateUser, onDeleteUser, currentUser }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<Partial<User>>({
    name: '',
    username: '',
    email: '',
    phone: '',
    role: UserRole.RECEPTIONIST,
    status: 'active'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      onUpdateUser({ ...editingUser, ...formData } as User);
    } else {
      onAddUser({ ...formData, id: `U-${Date.now()}`, password: 'password' } as User);
    }
    closeModal();
  };

  const openEdit = (u: User) => {
    setEditingUser(u);
    setFormData(u);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setFormData({ name: '', username: '', email: '', phone: '', role: UserRole.RECEPTIONIST, status: 'active' });
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight uppercase">Staff Accounts</h2>
          <p className="text-sm text-slate-500 font-medium italic">System login credentials and role-based access control</p>
        </div>
        <button onClick={() => setShowModal(true)} className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">Register Staff</button>
      </header>

      <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-slate-950 border-b">
            <tr>
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Username</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-slate-500">{u.name.charAt(0)}</div>
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">{u.name}</p>
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md ${(ROLES_CONFIG as any)[u.role]?.color}`}>{u.role.replace('_', ' ')}</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 font-mono text-xs font-bold text-slate-500">{u.username}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(u)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg></button>
                    {u.id !== currentUser.id && <button onClick={() => onDeleteUser(u.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg></button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
           <div className="bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-8 border-b bg-slate-50 dark:bg-slate-950 flex justify-between items-center">
                 <h3 className="text-xl font-black uppercase tracking-tight">{editingUser ? 'Update Staff Account' : 'New Staff Intake'}</h3>
                 <button onClick={closeModal} className="p-2 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-all"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>
              </div>
              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                 <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Legal Name</label>
                    <input required className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 font-bold outline-none focus:border-blue-500" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                 </div>
                 <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">System Username</label>
                    <input required className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 font-bold outline-none focus:border-blue-500 font-mono" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value.toLowerCase().replace(/\s/g, '_')})} />
                 </div>
                 <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Access Role</label>
                    <select className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 font-bold outline-none" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as any})}>
                       {Object.keys(UserRole).map(role => <option key={role} value={role}>{role.replace('_', ' ')}</option>)}
                    </select>
                 </div>
                 <button type="submit" className="w-full py-5 bg-slate-900 dark:bg-blue-600 text-white rounded-[24px] font-black text-sm uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all">
                    Initialize Staff Account
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default UserManager;