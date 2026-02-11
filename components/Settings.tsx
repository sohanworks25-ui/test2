
import React, { useState, useRef } from 'react';
import { HospitalConfig, UserRole } from '../types';

interface SettingsProps {
  config: HospitalConfig;
  onUpdateConfig: (config: HospitalConfig) => void;
  currentUserRole?: UserRole;
}

const Settings: React.FC<SettingsProps> = ({ config, onUpdateConfig, currentUserRole }) => {
  const [formData, setFormData] = useState<HospitalConfig>(config);
  const [isSaved, setIsSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currencies = [
    { label: 'Tk (Bangladeshi Taka)', value: 'Tk' },
    { label: '৳ (Bengali Symbol)', value: '৳' },
    { label: '$ (US Dollar)', value: '$' },
    { label: '₹ (Indian Rupee)', value: '₹' },
    { label: '€ (Euro)', value: '€' },
  ];

  const dateFormats = [
    { label: 'DD/MM/YYYY (e.g. 31/12/2024)', value: 'DD/MM/YYYY' },
    { label: 'MM/DD/YYYY (e.g. 12/31/2024)', value: 'MM/DD/YYYY' },
    { label: 'YYYY-MM-DD (ISO)', value: 'YYYY-MM-DD' },
  ];

  const invoiceDateFormats = [
    { label: 'No Date part (0001)', value: 'none' },
    { label: 'YYYYMM (202405-0001)', value: 'YYYYMM' },
    { label: 'YYYYMMDD (20240520-0001)', value: 'YYYYMMDD' },
    { label: 'YYMM (2405-0001)', value: 'YYMM' },
    { label: 'YYMMDD (240520-0001)', value: 'YYMMDD' },
  ];

  const timeZones = [
    { label: 'UTC-12:00 (International Date Line West)', value: 'Etc/GMT+12' },
    { label: 'UTC-11:00 (Midway Island)', value: 'Etc/GMT+11' },
    { label: 'UTC-10:00 (Hawaii)', value: 'Pacific/Honolulu' },
    { label: 'UTC-09:00 (Alaska)', value: 'America/Anchorage' },
    { label: 'UTC-08:00 (Pacific Time)', value: 'America/Los_Angeles' },
    { label: 'UTC-07:00 (Mountain Time)', value: 'America/Denver' },
    { label: 'UTC-06:00 (Central Time)', value: 'America/Chicago' },
    { label: 'UTC-05:00 (Eastern Time)', value: 'America/New_York' },
    { label: 'UTC-04:00 (Atlantic Time)', value: 'America/Halifax' },
    { label: 'UTC-03:00 (Buenos Aires)', value: 'America/Argentina/Buenos_Aires' },
    { label: 'UTC-02:00 (Mid-Atlantic)', value: 'Etc/GMT+2' },
    { label: 'UTC-01:00 (Azores)', value: 'Atlantic/Azores' },
    { label: 'UTC+00:00 (London, GMT)', value: 'UTC' },
    { label: 'UTC+01:00 (Berlin, Paris)', value: 'Europe/Berlin' },
    { label: 'UTC+02:00 (Cairo, Jerusalem)', value: 'Africa/Cairo' },
    { label: 'UTC+03:00 (Moscow, Riyadh)', value: 'Europe/Moscow' },
    { label: 'UTC+04:00 (Abu Dhabi, Baku)', value: 'Asia/Dubai' },
    { label: 'UTC+05:00 (Islamabad, Karachi)', value: 'Asia/Karachi' },
    { label: 'UTC+05:30 (India, Sri Lanka)', value: 'Asia/Kolkata' },
    { label: 'UTC+06:00 (Dhaka, Astana)', value: 'Asia/Dhaka' },
    { label: 'UTC+07:00 (Bangkok, Jakarta)', value: 'Asia/Bangkok' },
    { label: 'UTC+08:00 (Beijing, Singapore)', value: 'Asia/Shanghai' },
    { label: 'UTC+09:00 (Tokyo, Seoul)', value: 'Asia/Tokyo' },
    { label: 'UTC+09:30 (Adelaide)', value: 'Australia/Adelaide' },
    { label: 'UTC+10:00 (Sydney, Guam)', value: 'Australia/Sydney' },
    { label: 'UTC+11:00 (Solomon Islands)', value: 'Pacific/Guadalcanal' },
    { label: 'UTC+12:00 (Auckland, Fiji)', value: 'Pacific/Auckland' },
    { label: 'UTC+13:00 (Tonga)', value: 'Pacific/Tongatapu' },
    { label: 'UTC+14:00 (Line Islands)', value: 'Pacific/Kiritimati' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateConfig(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2000000) { 
        alert("File is too large.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, logo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setFormData(prev => ({ ...prev, logo: undefined }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      <header>
        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">System Configuration</h2>
        <p className="text-sm text-slate-500 font-medium">Manage hospital identity and system preferences</p>
      </header>

      <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm p-8 md:p-12 max-w-6xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* INSTITUTIONAL IDENTITY */}
            <div className="space-y-10">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-600 flex items-center gap-3">
                <span className="w-8 h-px bg-blue-600"></span> Institutional Identity
              </h3>

              <div className="space-y-4">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Brand Logo</label>
                 <div className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-[32px] border-2 border-dashed border-slate-200 dark:border-slate-700">
                    <div className="relative">
                       <div className="w-24 h-24 rounded-[28px] bg-white dark:bg-slate-900 shadow-lg flex items-center justify-center overflow-hidden border border-slate-100 dark:border-slate-800">
                          {formData.logo ? (
                             <img src={formData.logo} alt="Hospital Logo" className="w-full h-full object-contain" />
                          ) : (
                             <span className="text-2xl font-black text-slate-300 italic tracking-tighter">SH</span>
                          )}
                       </div>
                       {formData.logo && (
                          <button type="button" onClick={removeLogo} className="absolute -top-2 -right-2 w-8 h-8 bg-rose-600 text-white rounded-full flex items-center justify-center shadow-lg"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>
                       )}
                    </div>
                    <div className="flex-1 space-y-3">
                       <input type="file" ref={fileInputRef} onChange={handleLogoUpload} accept="image/*" className="hidden" />
                       <button type="button" onClick={() => fileInputRef.current?.click()} className="px-6 py-2.5 bg-slate-900 dark:bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest">Change Image</button>
                       <p className="text-[9px] text-slate-400 font-bold uppercase">PNG or JPG. Max 2MB.</p>
                    </div>
                 </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Hospital Name</label>
                  <input required type="text" className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none font-bold text-slate-700 dark:text-slate-100 transition-all focus:border-blue-500" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Slogan</label>
                  <input type="text" className="text-sm w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none font-bold text-slate-700 dark:text-slate-100 transition-all focus:border-blue-500" value={formData.tagline} onChange={e => setFormData({...formData, tagline: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Official Contact Phone</label>
                  <input required type="tel" className="text-sm w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none font-bold text-slate-700 dark:text-slate-100 transition-all focus:border-blue-500" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Address</label>
                  <textarea required rows={2} className="text-sm w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none font-bold text-slate-700 dark:text-slate-100 resize-none transition-all focus:border-blue-500" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                </div>
              </div>
            </div>

            <div className="space-y-12">
              {/* GLOBAL PREFERENCES */}
              <div className="space-y-6">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600 flex items-center gap-3">
                  <span className="w-8 h-px bg-indigo-600"></span> Global Preferences
                </h3>
                <div className="p-8 bg-slate-50 dark:bg-slate-800 rounded-[32px] border border-slate-200 dark:border-slate-700 space-y-6 shadow-inner">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Currency Symbol</label>
                    <select className="w-full px-5 py-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none font-bold text-sm" value={formData.currencySymbol} onChange={e => setFormData({...formData, currencySymbol: e.target.value})}>
                      {currencies.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Date Format</label>
                      <select className="w-full px-5 py-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none font-bold text-sm" value={formData.dateFormat} onChange={e => setFormData({...formData, dateFormat: e.target.value})}>
                        {dateFormats.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                      </select>
                  </div>
                  <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Time Zone</label>
                      <select className="w-full px-5 py-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none font-bold text-sm" value={formData.timeZone} onChange={e => setFormData({...formData, timeZone: e.target.value})}>
                        {timeZones.map(tz => <option key={tz.value} value={tz.value}>{tz.label}</option>)}
                      </select>
                  </div>
                </div>
              </div>

              {/* BILLING ARCHITECTURE */}
              <div className="space-y-6">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600 flex items-center gap-3">
                  <span className="w-8 h-px bg-emerald-600"></span> Billing & Financial Control
                </h3>
                <div className="p-8 bg-slate-50 dark:bg-slate-800 rounded-[32px] border border-slate-200 dark:border-slate-700 space-y-6 shadow-inner">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Invoice Prefix</label>
                    <input type="text" placeholder="e.g. INV, HMS" className="w-full px-5 py-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none font-black text-sm uppercase transition-all focus:border-emerald-500" value={formData.invoiceIdPrefix} onChange={e => setFormData({...formData, invoiceIdPrefix: e.target.value.toUpperCase()})} />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-6">
                    <div className="col-span-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Date Part</label>
                      <select className="w-full px-5 py-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none font-bold text-xs" value={formData.invoiceIdDateFormat} onChange={e => setFormData({...formData, invoiceIdDateFormat: e.target.value as any})}>
                        {invoiceDateFormats.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                      </select>
                    </div>
                    <div className="col-span-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Padding</label>
                      <input type="number" min="1" max="10" className="w-full px-5 py-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none font-black text-sm transition-all focus:border-emerald-500" value={formData.invoiceIdPadding} onChange={e => setFormData({...formData, invoiceIdPadding: Number(e.target.value)})} />
                    </div>
                    <div className="col-span-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Separator</label>
                      <input type="text" placeholder="-" className="w-full px-5 py-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none font-black text-sm transition-all focus:border-emerald-500" value={formData.invoiceIdSeparator || ''} onChange={e => setFormData({...formData, invoiceIdSeparator: e.target.value})} />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Live ID Format Preview</p>
                    <div className="bg-slate-900 rounded-xl p-4 flex items-center justify-center">
                       <code className="text-emerald-400 font-mono text-sm tracking-widest">
                          {[
                            formData.invoiceIdPrefix, 
                            formData.invoiceIdDateFormat !== 'none' ? '20240520' : '', 
                            '1'.padStart(formData.invoiceIdPadding || 4, '0')
                          ].filter(Boolean).join(formData.invoiceIdSeparator || '')}
                       </code>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ACTION FOOTER */}
          <div className="pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex-1">
               {isSaved && (
                 <div className="flex items-center gap-3 text-emerald-600 font-black uppercase text-[10px] tracking-widest animate-fade-in">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></div>
                    Configuration synchronized successfully
                 </div>
               )}
            </div>
            <button type="submit" className="w-full sm:w-auto px-16 py-5 bg-slate-900 dark:bg-blue-600 text-white rounded-3xl font-black text-lg shadow-2xl hover:bg-black transition-all active:scale-[0.98] uppercase tracking-widest">
               Deploy System Updates
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;
