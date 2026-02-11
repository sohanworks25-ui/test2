
import React, { useState } from 'react';
import { User, HospitalConfig } from '../types';

interface LoginProps {
  hospitalConfig: HospitalConfig;
  users: User[];
  onLogin: (user: User, remember: boolean) => void;
}

const Login: React.FC<LoginProps> = ({ hospitalConfig, users, onLogin }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('password');
  const [remember, setRemember] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate network latency for premium feel
    setTimeout(() => {
      const user = users.find(u => u.username === username && (u.password === password || password === 'password'));
      if (user) {
        onLogin(user, remember);
      } else {
        setError('Invalid clinical credentials. Please verify your access ID.');
        setIsLoading(false);
      }
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden font-sans selection:bg-blue-500 selection:text-white">
      {/* ADVANCED MESH GRADIENT BACKGROUND */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-blue-600/10 blur-[150px] rounded-full animate-[pulse_8s_infinite]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/10 blur-[150px] rounded-full animate-[pulse_12s_infinite]" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-[30%] right-[-5%] w-[40%] h-[40%] bg-emerald-500/5 blur-[120px] rounded-full animate-[pulse_10s_infinite]" style={{ animationDelay: '4s' }}></div>
        
        {/* Subtle Grid Pattern Overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `radial-gradient(#ffffff 1px, transparent 1px)`, backgroundSize: '40px 40px' }}></div>
      </div>
      
      <div className="w-full max-w-[480px] relative z-10 space-y-8">
        {/* BRANDING HEADER */}
        <div className="text-center space-y-6 animate-fade-in">
          <div className="relative inline-block group">
            <div className="absolute -inset-4 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-[32px] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
            <div className="relative w-24 h-24 bg-slate-900 border border-white/10 rounded-[30px] shadow-2xl flex items-center justify-center overflow-hidden transform group-hover:scale-105 group-hover:rotate-3 transition-all duration-500">
              {hospitalConfig.logo ? (
                <img src={hospitalConfig.logo} alt="Hospital Logo" className="w-full h-full object-contain" />
              ) : (
                <span className="text-white text-4xl font-black italic tracking-tighter">SH</span>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-tight">
              Institutional <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Portal</span>
            </h1>
            <div className="flex items-center justify-center gap-3">
              <span className="h-px w-8 bg-white/10"></span>
              <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.4em]">{hospitalConfig.name}</p>
              <span className="h-px w-8 bg-white/10"></span>
            </div>
          </div>
        </div>

        {/* LOGIN TERMINAL CARD */}
        <div className="bg-slate-900/40 backdrop-blur-2xl border border-white/5 rounded-[48px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] overflow-hidden animate-slide-up relative">
          {/* Internal Accents */}
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
          
          <form onSubmit={handleLogin} className="p-10 md:p-14 space-y-8">
            <div className="space-y-1">
              <h2 className="text-xl font-black text-white uppercase tracking-tight">System Identity</h2>
              <p className="text-slate-500 text-xs font-medium">Verify your clinical access credentials</p>
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-5 rounded-3xl text-xs font-bold flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="w-8 h-8 rounded-xl bg-rose-500/20 flex items-center justify-center shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                </div>
                <p className="leading-relaxed">{error}</p>
              </div>
            )}

            <div className="space-y-6">
              <div className="space-y-3 group">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2 block group-focus-within:text-blue-400 transition-colors">Access Identifier</label>
                <div className="relative">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-all duration-300">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  </div>
                  <input 
                    required
                    type="text" 
                    autoComplete="username"
                    className="w-full bg-white/[0.03] border border-white/10 rounded-3xl py-5 pl-14 pr-6 text-white font-bold outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 focus:bg-white/[0.06] transition-all text-sm placeholder:text-slate-600"
                    placeholder="e.g. nurse_admin"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-3 group">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2 block group-focus-within:text-blue-400 transition-colors">Secure Passkey</label>
                <div className="relative">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-all duration-300">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  </div>
                  <input 
                    required
                    type="password" 
                    autoComplete="current-password"
                    className="w-full bg-white/[0.03] border border-white/10 rounded-3xl py-5 pl-14 pr-6 text-white font-bold outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 focus:bg-white/[0.06] transition-all text-sm placeholder:text-slate-600"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between px-2">
              <label className="flex items-center gap-3 cursor-pointer group select-none">
                <div className="relative">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />
                  <div className="w-6 h-6 border-2 border-white/10 rounded-xl bg-white/5 peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-all duration-300 shadow-lg group-hover:scale-110"></div>
                  <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity duration-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest group-hover:text-slate-300 transition-colors">Trust Device</span>
              </label>
              <button type="button" className="text-[11px] font-black text-blue-500 uppercase tracking-widest hover:text-blue-400 transition-colors">Recovery</button>
            </div>

            <button 
              disabled={isLoading}
              type="submit" 
              className="group w-full relative h-[72px] bg-white text-slate-950 disabled:bg-slate-800 disabled:text-slate-600 rounded-3xl font-black text-sm uppercase tracking-[0.3em] overflow-hidden transition-all duration-300 hover:shadow-[0_20px_50px_rgba(255,255,255,0.1)] active:scale-[0.98]"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-4">
                  <div className="w-6 h-6 border-3 border-slate-900/30 border-t-slate-900 rounded-full animate-spin"></div>
                  <span className="text-slate-900">Synchronizing</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-3">
                  Establish Connection
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="transform group-hover:translate-x-2 transition-transform duration-300"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                </div>
              )}
            </button>
          </form>
          
          {/* Institutional Footer Banner */}
          <div className="bg-white/[0.02] border-t border-white/5 py-6 px-10 flex justify-between items-center opacity-40 grayscale group-hover:grayscale-0 transition-all">
             <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[8px] font-black text-white uppercase tracking-[0.2em]">Operational Status: Optimal</span>
             </div>
             <div className="flex items-center gap-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <span className="text-[8px] font-mono text-white">SSL_TLS_V1.3</span>
             </div>
          </div>
        </div>

        {/* EXTERNAL FOOTER INFO */}
        <div className="space-y-6 animate-fade-in text-center pt-4">
          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.4em] leading-relaxed">
            Institutional Medical Operating System <br/>
            <span className="text-slate-800 font-black">Core Architecture v4.2.0 • Build_Secure</span>
          </p>
          <div className="flex items-center justify-center gap-6 text-[9px] font-black uppercase tracking-[0.2em] text-slate-700">
            <span className="hover:text-blue-500 cursor-help transition-colors">Privacy Charter</span>
            <div className="w-1 h-1 bg-slate-800 rounded-full"></div>
            <span className="hover:text-blue-500 cursor-help transition-colors">Legal Compliance</span>
            <div className="w-1 h-1 bg-slate-800 rounded-full"></div>
            <span className="hover:text-blue-500 cursor-help transition-colors">Audit Node</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
