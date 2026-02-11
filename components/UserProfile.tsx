import React, { useState, useMemo } from 'react';
import { User, UserRole } from '../types';

interface UserProfileProps {
  currentUser: User;
  onUpdateProfile: (updatedUser: User) => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ currentUser, onUpdateProfile }) => {
  const [formData, setFormData] = useState({
    name: currentUser.name,
    username: currentUser.username,
    email: currentUser.email,
    currentPassword: '',
    newPassword: '',
    confirmPassword: [] as string[] | string // Handle as string for UI
  });
  // Fix type alignment for confirmPassword if needed but keeping logic simple
  const [confirmPasswordStr, setConfirmPasswordStr] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState('');

  // Strictly only SUPER_ADMIN and ADMIN can change usernames
  const isPrivilegedAdmin = currentUser.role === UserRole.SUPER_ADMIN || currentUser.role === UserRole.ADMIN;

  const passwordStrength = useMemo(() => {
    const password = formData.newPassword;
    if (!password) return { score: 0, label: '', color: 'bg-slate-200' };

    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    switch (score) {
      case 0:
      case 1:
        return { score: 1, label: 'Weak', color: 'bg-rose-500' };
      case 2:
        return { score: 2, label: 'Fair', color: 'bg-amber-500' };
      case 3:
        return { score: 3, label: 'Good', color: 'bg-blue-500' };
      case 4:
        return { score: 4, label: 'Strong', color: 'bg-emerald-500' };
      default:
        return { score: 0, label: '', color: 'bg-slate-200' };
    }
  }, [formData.newPassword]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Verification Logic
    if (formData.newPassword && formData.newPassword !== confirmPasswordStr) {
      setError('New passwords do not match');
      return;
    }

    if (formData.currentPassword && formData.currentPassword !== (currentUser.password || 'password')) {
      setError('Current password verification failed');
      return;
    }

    const updatedUser: User = {
      ...currentUser,
      name: formData.name,
      // Security: Force original username if not a privileged admin, even if data was tampered with in state
      username: isPrivilegedAdmin ? formData.username : currentUser.username,
      email: formData.email,
      password: formData.newPassword || currentUser.password || 'password'
    };

    onUpdateProfile(updatedUser);
    setIsSaved(true);
    setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '' }));
    setConfirmPasswordStr('');
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">My Account</h2>
        <p className="text-sm text-slate-500 font-medium">Manage your personal profile and security credentials</p>
      </header>

      <div className="max-w-4xl bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-8 md:p-12">
          <form onSubmit={handleSubmit} className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* Account Details */}
              <div className="space-y-6">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-600 flex items-center gap-2">
                  <span className="w-4 h-px bg-blue-600"></span> Profile Information
                </h3>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Display Name</label>
                  <input 
                    required 
                    type="text" 
                    className="w-full px-5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700 dark:text-slate-100"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Email Address</label>
                  <input 
                    required 
                    type="email" 
                    className="w-full px-5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700 dark:text-slate-100"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                </div>

                <div className="pt-4 p-5 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Access Level</p>
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg">
                         <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                      </div>
                      <div>
                         <p className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-tighter">{currentUser.role.replace('_', ' ')}</p>
                         <p className="text-[10px] font-bold text-slate-500">Authorized Personnel</p>
                      </div>
                   </div>
                </div>
              </div>

              {/* Security Section */}
              <div className="space-y-6">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-rose-600 flex items-center gap-2">
                  <span className="w-4 h-px bg-rose-600"></span> Security & Credentials
                </h3>

                <div className="space-y-2">
                  <label className={`text-[10px] font-black uppercase tracking-widest pl-1 ${!isPrivilegedAdmin ? 'text-slate-300 dark:text-slate-700' : 'text-slate-400'}`}>
                    Username (Login ID) {!isPrivilegedAdmin && '• Locked'}
                  </label>
                  <input 
                    required 
                    type="text" 
                    disabled={!isPrivilegedAdmin}
                    className={`w-full px-5 py-3 rounded-2xl border outline-none font-bold transition-all ${!isPrivilegedAdmin ? 'bg-slate-100 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-rose-500 text-slate-700 dark:text-slate-100'}`}
                    value={formData.username}
                    onChange={e => setFormData({...formData, username: e.target.value})}
                  />
                  {!isPrivilegedAdmin && <p className="text-[9px] text-slate-400 italic pl-1">Only Administrators can modify login IDs.</p>}
                </div>

                <div className="space-y-2 pt-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Verify Current Password</label>
                  <input 
                    type="password" 
                    placeholder="Required to save changes"
                    className="w-full px-5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700 dark:text-slate-100"
                    value={formData.currentPassword}
                    onChange={e => setFormData({...formData, currentPassword: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 pt-2">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 text-rose-500">New Password</label>
                    <input 
                      type="password" 
                      placeholder="Leave blank to keep current"
                      className="w-full px-5 py-3 rounded-2xl bg-rose-50/30 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30 focus:ring-2 focus:ring-rose-500 outline-none font-bold text-slate-700 dark:text-slate-100"
                      value={formData.newPassword}
                      onChange={e => setFormData({...formData, newPassword: e.target.value})}
                    />
                    
                    {/* Password Strength Indicator */}
                    {formData.newPassword && (
                      <div className="space-y-1.5 px-1 animate-fade-in">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Strength: <span className={passwordStrength.label === 'Strong' ? 'text-emerald-500' : passwordStrength.label === 'Weak' ? 'text-rose-500' : 'text-slate-600 dark:text-slate-400'}>{passwordStrength.label}</span></span>
                        </div>
                        <div className="flex gap-1 h-1">
                          {[1, 2, 3, 4].map((step) => (
                            <div 
                              key={step} 
                              className={`flex-1 rounded-full transition-all duration-500 ${step <= passwordStrength.score ? passwordStrength.color : 'bg-slate-100 dark:bg-slate-800'}`} 
                            />
                          ))}
                        </div>
                        <p className="text-[8px] text-slate-400 font-bold uppercase leading-none mt-1">Use 8+ chars with Uppercase, Numbers & Symbols</p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Confirm New Password</label>
                    <input 
                      type="password" 
                      className="w-full px-5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-rose-500 outline-none font-bold text-slate-700 dark:text-slate-100"
                      value={confirmPasswordStr}
                      onChange={e => setConfirmPasswordStr(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6">
               <div className="flex-1">
                  {error && (
                    <p className="text-rose-500 font-bold text-sm flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
                       <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                       {error}
                    </p>
                  )}
                  {isSaved && (
                    <p className="text-emerald-600 font-bold text-sm flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
                       <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                       Account credentials updated successfully!
                    </p>
                  )}
               </div>
               <button type="submit" className="w-full sm:w-auto px-10 py-5 bg-slate-900 dark:bg-blue-600 hover:bg-black dark:hover:bg-blue-700 text-white rounded-3xl font-black text-lg transition-all active:scale-95 shadow-2xl uppercase tracking-widest">
                  Save Changes
               </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;