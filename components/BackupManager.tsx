import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { HospitalConfig } from '../types';

declare global {
  interface Window {
    google: any;
    gapi: any;
  }
}

const BackupManager: React.FC = () => {
  const [mode, setMode] = useState<'full' | 'daily' | 'range'>('full');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' | 'info' } | null>(null);

  // Google Drive State
  const [hospitalConfig, setHospitalConfig] = useState<HospitalConfig>(storageService.getHospitalConfig());
  const [tokenResponse, setTokenResponse] = useState<any>(null);
  const [isGapiLoaded, setIsGapiLoaded] = useState(false);
  const [isSyncingDrive, setIsSyncingDrive] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);

  useEffect(() => {
    const initGapi = () => {
      if (window.gapi) {
        window.gapi.load('client', async () => {
          setIsGapiLoaded(true);
        });
      }
    };
    initGapi();
  }, []);

  const handleDriveAuth = () => {
    if (!hospitalConfig.googleClientId) {
      setMessage({ text: "Google Client ID is missing. Please configure it in Service Credentials.", type: 'error' });
      setShowCredentials(true);
      return;
    }

    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: hospitalConfig.googleClientId,
        scope: 'https://www.googleapis.com/auth/drive.file',
        callback: (response: any) => {
          if (response.error) {
            setMessage({ text: "Authentication failed: " + response.error, type: 'error' });
          } else {
            setTokenResponse(response);
            setMessage({ text: "Google account successfully linked for this session.", type: 'success' });
          }
        },
      });
      client.requestAccessToken();
    } catch (err) {
      setMessage({ text: "OAuth2 client initialization failed. Check your Client ID.", type: 'error' });
    }
  };

  // Fix: made generateBackupData async and awaited all storageService.get* calls
  const generateBackupData = async (exportMode: string, sDate?: string, eDate?: string) => {
    // Fix: fetch data from storage service using await
    const [patients, bills, services, users, commissions, expenses] = await Promise.all([
      storageService.getPatients(),
      storageService.getBills(),
      storageService.getServices(),
      storageService.getUsers(),
      storageService.getCommissions(),
      storageService.getExpenses(),
    ]);

    const data = {
      patients,
      bills,
      services,
      users,
      commissions,
      expenses,
      config: storageService.getHospitalConfig(),
      exportInfo: {
        timestamp: new Date().toISOString(),
        mode: exportMode,
        range: exportMode === 'daily' ? sDate : (exportMode === 'range' ? `${sDate} to ${eDate}` : 'all')
      }
    };

    if (exportMode === 'daily' || exportMode === 'range') {
      const start = exportMode === 'daily' ? sDate! : sDate!;
      const end = exportMode === 'daily' ? sDate! : eDate!;

      // Fix: Filter operations on the actual arrays retrieved after await
      data.bills = data.bills.filter(b => b.date.split('T')[0] >= start && b.date.split('T')[0] <= end);
      data.commissions = data.commissions.filter(c => c.date.split('T')[0] >= start && c.date.split('T')[0] <= end);
      data.expenses = data.expenses.filter(e => e.date >= start && e.date <= end);
      data.patients = data.patients.filter(p => p.regDate.split('T')[0] >= start && p.regDate.split('T')[0] <= end);
    }
    return data;
  };

  const uploadToDrive = async () => {
    if (!tokenResponse) {
      handleDriveAuth();
      return;
    }

    setIsSyncingDrive(true);
    setMessage({ text: "Contacting Google Drive API...", type: 'info' });

    try {
      // Fix: await the async generateBackupData call
      const backupData = await generateBackupData('full');
      const fileName = `sohanhms_full_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      
      const metadata = {
        name: fileName,
        mimeType: 'application/json',
      };

      const file = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', file);

      const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: new Headers({ 'Authorization': 'Bearer ' + tokenResponse.access_token }),
        body: form,
      });

      if (!response.ok) throw new Error("Upload failed");

      const updatedConfig = { ...hospitalConfig, lastAutoBackup: new Date().toISOString() };
      storageService.saveHospitalConfig(updatedConfig);
      setHospitalConfig(updatedConfig);

      setMessage({ text: "Snapshot successfully pushed to Google Drive.", type: 'success' });
    } catch (err) {
      console.error(err);
      setMessage({ text: "Failed to upload. Your session might have expired.", type: 'error' });
      setTokenResponse(null);
    } finally {
      setIsSyncingDrive(false);
    }
  };

  // Fix: made handleExport async to await generateBackupData
  const handleExport = async () => {
    setIsExporting(true);
    setMessage(null);
    try {
      // Fix: await the data generation
      const data = await generateBackupData(mode, mode === 'daily' ? date : startDate, endDate);
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sohanhms_${mode}_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setMessage({ text: 'Local archive file downloaded successfully.', type: 'success' });
    } catch (err) {
      setMessage({ text: 'Internal error generating local backup.', type: 'error' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const inputElement = e.target; // Capture target to reset later
    if (!window.confirm("CRITICAL WARNING: This will merge external records into your current local database. Duplicate IDs will be ignored. Proceed?")) return;

    setIsImporting(true);
    const reader = new FileReader();
    // Fix: made reader.onload async to await storageService.get* calls
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (!json.bills || !json.patients) throw new Error("File format mismatch.");

        // Fix: fetch current arrays using await before merging and saving
        if (json.patients) {
            const current = await storageService.getPatients();
            storageService.savePatients([...current, ...json.patients.filter((p: any) => !current.find(cp => cp.id === p.id))]);
        }
        if (json.bills) {
            const current = await storageService.getBills();
            storageService.saveBills([...current, ...json.bills.filter((b: any) => !current.find(cb => cb.id === b.id))]);
        }
        if (json.services) {
            const current = await storageService.getServices();
            storageService.saveServices([...current, ...json.services.filter((s: any) => !current.find(cs => cs.id === s.id))]);
        }
        if (json.users) {
            const current = await storageService.getUsers();
            storageService.saveUsers([...current, ...json.users.filter((u: any) => !current.find(cu => cu.id === u.id))]);
        }
        if (json.commissions) {
            const current = await storageService.getCommissions();
            storageService.saveCommissions([...current, ...json.commissions.filter((c: any) => !current.find(cc => cc.id === c.id))]);
        }
        if (json.expenses) {
            const current = await storageService.getExpenses();
            storageService.saveExpenses([...current, ...json.expenses.filter((ex: any) => !current.find(cex => cex.id === ex.id))]);
        }

        setMessage({ text: 'Restoration successful. System reloading...', type: 'success' });
        setTimeout(() => window.location.reload(), 1200);
      } catch (err) {
        setMessage({ text: 'Restore aborted: ' + (err as Error).message, type: 'error' });
      } finally {
        setIsImporting(false);
        inputElement.value = '';
      }
    };
    reader.readAsText(file);
  };

  const updateConfig = (key: keyof HospitalConfig, val: any) => {
    const updated = { ...hospitalConfig, [key]: val };
    setHospitalConfig(updated);
    storageService.saveHospitalConfig(updated);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Data Integrity Control</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Cloud synchronization and local disaster recovery management.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/10 rounded-full border border-emerald-100 dark:border-emerald-800/50">
           <div className={`w-2 h-2 rounded-full ${isSyncingDrive ? 'bg-blue-500 animate-ping' : 'bg-emerald-500'}`}></div>
           <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">
              {tokenResponse ? 'Cloud Active' : 'Cloud Standby'}
           </span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Google Drive Advanced Integration Card */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-[32px] p-8 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
           <div className="space-y-6">
              <div className="flex justify-between items-start">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center">
                       <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600"><path d="M12 2v20"/><path d="m17 17-5 5-5-5"/><path d="M4.93 4.93A10 10 0 0 1 12 2"/></svg>
                    </div>
                    <div>
                       <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">Google Cloud</h3>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Enterprise Sync</p>
                    </div>
                 </div>
                 <button 
                   onClick={() => setShowCredentials(!showCredentials)}
                   className={`p-2 rounded-xl transition-all ${showCredentials ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-slate-600'}`}
                   title="Configuration Settings"
                 >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                 </button>
              </div>

              {showCredentials && (
                <div className="p-5 bg-slate-950 rounded-[24px] space-y-4 border border-slate-800 animate-in fade-in slide-in-from-top-2">
                   <div className="flex justify-between items-center">
                     <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Service Credentials</h4>
                     <button onClick={() => setShowCredentials(false)} className="text-[10px] text-slate-600 font-bold hover:text-white uppercase">Close</button>
                   </div>
                   <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Client ID</label>
                        <input 
                          type="password" 
                          placeholder="xxxxxxxxxx-apps.googleusercontent.com"
                          className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold outline-none text-white focus:border-emerald-500 transition-all"
                          value={hospitalConfig.googleClientId || ''}
                          onChange={e => updateConfig('googleClientId', e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">API Key (Optional)</label>
                        <input 
                          type="password" 
                          placeholder="Enter restricted API Key"
                          className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold outline-none text-white focus:border-emerald-500 transition-all"
                          value={hospitalConfig.googleApiKey || ''}
                          onChange={e => updateConfig('googleApiKey', e.target.value)}
                        />
                      </div>
                   </div>
                   <p className="text-[9px] text-slate-500 leading-tight italic">Credentials are stored locally in your browser and never shared with HMS servers.</p>
                </div>
              )}

              <div className="p-5 bg-slate-50 dark:bg-slate-800 rounded-3xl space-y-4 border border-slate-100 dark:border-slate-700">
                 <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-tighter">Automated Daily Sync</span>
                    <button 
                      onClick={() => updateConfig('autoBackupEnabled', !hospitalConfig.autoBackupEnabled)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all shadow-inner ${hospitalConfig.autoBackupEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform ${hospitalConfig.autoBackupEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                 </div>
                 {hospitalConfig.lastAutoBackup ? (
                    <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Last Cloud Sync</span>
                       <span className="text-[10px] font-black text-slate-700 dark:text-slate-200">{new Date(hospitalConfig.lastAutoBackup).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    </div>
                 ) : (
                    <p className="text-[9px] text-slate-400 uppercase font-bold text-center">No successful cloud sync recorded yet.</p>
                 )}
              </div>

              <div className="space-y-4 pt-4">
                 {!tokenResponse ? (
                   <button onClick={handleDriveAuth} className="w-full py-4 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl font-black text-sm hover:bg-black dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-slate-900/20">
                     <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                     Link Google Session
                   </button>
                 ) : (
                   <div className="flex flex-col gap-3 animate-in zoom-in-95">
                      <button onClick={uploadToDrive} disabled={isSyncingDrive} className="w-full py-5 bg-emerald-600 text-white rounded-[24px] font-black text-sm uppercase tracking-widest shadow-2xl shadow-emerald-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3">
                        {isSyncingDrive ? <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div> : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                            Execute Cloud Push
                          </>
                        )}
                      </button>
                      <button onClick={() => setTokenResponse(null)} className="text-[10px] font-black text-slate-400 uppercase hover:text-rose-500 tracking-widest transition-colors">Terminate Link</button>
                   </div>
                 )}
              </div>
           </div>
        </div>

        {/* Local Archive Management Card */}
        <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 border border-slate-100 dark:border-slate-800 shadow-sm space-y-8 flex flex-col justify-between">
           <div className="space-y-6">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                 </div>
                 <div>
                    <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">Local Archive</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Manual Snapshots</p>
                 </div>
              </div>

              <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                <button onClick={() => setMode('full')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${mode === 'full' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Full DB</button>
                <button onClick={() => setMode('daily')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${mode === 'daily' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Daily</button>
                <button onClick={() => setMode('range')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${mode === 'range' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Range</button>
              </div>

              <div className="animate-in slide-in-from-bottom-2 duration-300">
                {mode === 'daily' && (
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Target Date</label>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 font-bold outline-none dark:text-white text-sm" />
                  </div>
                )}
                {mode === 'range' && (
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Start</label>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 font-bold outline-none dark:text-white text-sm" />
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">End</label>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 font-bold outline-none dark:text-white text-sm" />
                     </div>
                  </div>
                )}
                {mode === 'full' && (
                  <div className="p-6 bg-blue-50/50 dark:bg-blue-900/10 rounded-3xl border border-blue-100 dark:border-blue-800/30 text-center">
                     <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase leading-relaxed tracking-tighter">This will package all hospital history, user credentials, and service settings into a single JSON file.</p>
                  </div>
                )}
              </div>
           </div>

           <button onClick={handleExport} disabled={isExporting} className="w-full py-5 bg-slate-900 dark:bg-slate-800 text-white rounded-[24px] font-black text-sm uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all active:scale-[0.98]">
             {isExporting ? 'Packaging Archive...' : 'Generate Snapshot'}
           </button>
        </div>

        {/* Restoration & Merge Interface */}
        <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 border border-slate-100 dark:border-slate-800 shadow-sm space-y-8">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/20 rounded-2xl flex items-center justify-center text-rose-600">
                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
              </div>
              <div>
                 <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">Restore DB</h3>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Merge Protocol</p>
              </div>
           </div>

           <div className="p-8 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[32px] flex flex-col items-center justify-center text-center space-y-4 hover:border-blue-400 dark:hover:border-blue-500 transition-all relative overflow-hidden group cursor-pointer">
              <input type="file" accept=".json" onChange={handleImport} disabled={isImporting} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300 dark:text-slate-600"><path d="M12 2v20"/><path d="m17 17-5 5-5-5"/><path d="M4.93 4.93A10 10 0 0 1 12 2"/></svg>
              </div>
              <div>
                 <p className="text-sm font-black text-slate-700 dark:text-slate-300">Deploy .json package</p>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Restore existing data</p>
              </div>
              {isImporting && (
                <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-20">
                   <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
           </div>

           {message && (
             <div className={`p-5 rounded-[24px] flex items-center gap-4 border animate-in slide-in-from-bottom-2 ${
               message.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800 text-emerald-600' : 
               message.type === 'info' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800 text-blue-600' :
               'bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-800 text-rose-600'
             }`}>
                <div className={`w-2 h-2 rounded-full shrink-0 ${message.type === 'success' ? 'bg-emerald-500' : message.type === 'info' ? 'bg-blue-500' : 'bg-rose-500'} animate-pulse`}></div>
                <p className="text-[11px] font-black uppercase leading-tight tracking-tighter">{message.text}</p>
             </div>
           )}
        </div>
      </div>

      <div className="bg-slate-900 dark:bg-slate-950 p-8 rounded-[32px] text-white relative group overflow-hidden shadow-2xl">
         <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-600/10 blur-[120px] -mr-32 -mt-32 group-hover:scale-125 transition-transform"></div>
         <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <h4 className="text-sm font-black uppercase tracking-[0.2em] text-emerald-400">Automated Resilience Protocol</h4>
         </div>
         <p className="text-xs text-slate-400 leading-relaxed max-w-3xl relative z-10 font-medium">
           Sohan's Hospital Management uses an incremental sync mechanism. When "Automated Daily Sync" is enabled, the system performs a non-blocking cloud push during your first administrative session every 24 hours. To ensure reliability, keep your Google Client ID restricted to this domain and enable the <span className="text-white italic">Drive.file</span> scope.
         </p>
      </div>
    </div>
  );
};

export default BackupManager;