
import React, { useState, useMemo } from 'react';
import { geminiService } from '../services/geminiService';

interface PathologyLabProps {
  isOnline?: boolean;
}

const PathologyLab: React.FC<PathologyLabProps> = ({ isOnline = true }) => {
  const [reportText, setReportText] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');

  const handleAIAnalyze = async () => {
    if (!reportText.trim()) return;
    if (!isOnline) {
      alert("Interpretation requires Gemini AI cloud reasoning. Please check your internet connection.");
      return;
    }
    
    setLoading(true);
    setAnalysis('');
    
    setLoadingStep('Ingesting report data...');
    setTimeout(() => setLoadingStep('Analyzing reference ranges...'), 1500);
    setTimeout(() => setLoadingStep('Generating clinical insights...'), 3500);

    const result = await geminiService.analyzeReport(reportText);
    setAnalysis(result || "Analysis failed.");
    setLoading(false);
    setLoadingStep('');
  };

  const clearForm = () => {
    setReportText('');
    setAnalysis('');
  };

  const parseInlineContent = (text: string) => {
    const boldRegex = /(\*\*.*?\*\*)/g;
    const abnormalityRegex = /(\((?:High|Low|H|L|Abnormal|Critical|Positive|Reactive)\))/gi;
    let parts = text.split(boldRegex);
    
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={`bold-${i}`} className="text-white font-black">{part.slice(2, -2)}</strong>;
      }
      let subParts = part.split(abnormalityRegex);
      return subParts.map((sp, j) => {
        if (abnormalityRegex.test(sp)) {
          return (
            <span key={`abn-${i}-${j}`} className="text-amber-400 font-black px-1.5 py-0.5 bg-amber-400/10 rounded border border-amber-400/20 mx-1 inline-block text-[10px] uppercase tracking-wider animate-pulse">
              {sp}
            </span>
          );
        }
        return sp;
      });
    });
  };

  const formattedAnalysis = useMemo(() => {
    if (!analysis) return null;
    return analysis.split('\n').map((line, i) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={i} className="h-2"></div>;

      if (trimmed.startsWith('⚠️')) {
        return (
          <div key={i} className="text-amber-400 font-bold mb-8 p-6 bg-amber-400/5 rounded-[24px] border-2 border-amber-400/20 shadow-xl shadow-amber-900/10 flex gap-4">
             <div className="shrink-0 text-xl">⚠️</div>
             <p className="text-xs uppercase tracking-wide leading-relaxed">{trimmed.replace('⚠️', '').trim()}</p>
          </div>
        );
      }

      if (trimmed.startsWith('###') || trimmed.startsWith('##')) {
        const cleanTitle = trimmed.replace(/^#+\s*/, '');
        return (
          <h4 key={i} className="text-blue-400 font-black mt-10 mb-4 text-sm uppercase tracking-[0.2em] flex items-center gap-3">
             <div className="w-8 h-px bg-blue-500/30"></div>
             {cleanTitle}
          </h4>
        );
      }

      const numberedMatch = trimmed.match(/^(\d+)\.\s*(.*)/);
      if (numberedMatch) {
        return (
          <div key={i} className="flex gap-4 mb-4 group/item">
             <span className="shrink-0 w-8 h-8 rounded-xl bg-blue-600/10 text-blue-400 flex items-center justify-center font-black text-xs border border-blue-600/20">
               {numberedMatch[1]}
             </span>
             <p className="text-slate-300 leading-relaxed text-sm pt-1">
               {parseInlineContent(numberedMatch[2])}
             </p>
          </div>
        );
      }

      if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
        const cleanBullet = trimmed.replace(/^[-*]\s*/, '');
        return (
          <div key={i} className="flex gap-3 ml-6 mb-3 group/bullet">
             <span className="text-blue-500 text-lg leading-none mt-0.5">•</span>
             <p className="text-slate-400 font-medium text-sm leading-relaxed">
               {parseInlineContent(cleanBullet)}
             </p>
          </div>
        );
      }

      return (
        <p key={i} className="mb-4 text-slate-300 leading-relaxed text-sm">
          {parseInlineContent(trimmed)}
        </p>
      );
    });
  }, [analysis]);

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Pathology Intelligence</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Enterprise-grade lab result interpretation powered by Gemini AI</p>
        </div>
        <button 
          onClick={clearForm}
          className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-rose-500 transition-colors flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
          Clear Workspace
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col h-full">
            <h3 className="font-black text-xs uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400 mb-6 flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              Report Data Input
            </h3>
            <div className="relative flex-1 group">
              <textarea 
                className="w-full h-[500px] p-6 rounded-[24px] bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 text-sm font-mono transition-all resize-none dark:text-slate-200"
                placeholder="Paste electronic medical records, lab parameters, or hand-typed results here..."
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
              ></textarea>
            </div>
            
            {!isOnline && (
              <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-center gap-3">
                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-amber-500"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                 <span className="text-[10px] font-black uppercase text-amber-700 dark:text-amber-400 tracking-widest">Interpretation Unavailable Offline</span>
              </div>
            )}

            <button 
              disabled={loading || !reportText.trim() || !isOnline}
              onClick={handleAIAnalyze}
              className="w-full mt-6 bg-slate-900 dark:bg-blue-600 hover:bg-black dark:hover:bg-blue-700 text-white font-black py-5 rounded-[24px] flex items-center justify-center gap-4 transition-all disabled:opacity-30 disabled:grayscale active:scale-[0.98] shadow-2xl shadow-slate-900/20"
            >
              {loading ? (
                <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
              )}
              <span className="uppercase tracking-widest text-sm">{loading ? 'AI Reasoning Active...' : 'Generate Insight Report'}</span>
            </button>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="bg-slate-900 dark:bg-slate-950 text-slate-100 p-8 md:p-12 rounded-[40px] shadow-2xl overflow-y-auto max-h-[700px] border border-slate-800 relative group custom-scrollbar">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full -mr-32 -mt-32"></div>
            
            <div className="flex justify-between items-center mb-10 relative z-10">
               <h3 className="font-black text-xs uppercase tracking-[0.3em] flex items-center gap-4 text-blue-400">
                 <div className="p-2 bg-blue-500/10 rounded-xl">
                   <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4"/><path d="m16.2 7.8 2.9-2.9"/><path d="M18 12h4"/><path d="m16.2 16.2 2.9 2.9"/><path d="M12 18v4"/><path d="m4.9 19.1 2.9-2.9"/><path d="M2 12h4"/><path d="m4.9 4.9 2.9 2.9"/></svg>
                 </div>
                 Clinical Insight Console
               </h3>
               {analysis && (
                 <div className="flex items-center gap-2">
                   <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
                   <span className="text-[10px] font-black uppercase text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full border border-emerald-400/20">Analysis Verified</span>
                 </div>
               )}
            </div>

            <div className="relative z-10 min-h-[300px]">
               {!analysis && !loading && (
                 <div className="flex flex-col items-center justify-center h-full py-20 opacity-20 text-center">
                   <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-6"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                   <p className="text-lg font-black uppercase tracking-widest max-w-xs mx-auto leading-tight">Awaiting clinical input for processing</p>
                 </div>
               )}
               
               {loading && (
                 <div className="space-y-8 animate-pulse pt-4">
                    <div className="space-y-4">
                      <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 w-1/3 animate-[loading_2s_infinite]"></div>
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 text-center">{loadingStep}</p>
                    </div>
                 </div>
               )}
               
               {analysis && (
                 <div className="animate-in slide-in-from-bottom-4 duration-500">
                    <div className="space-y-1">
                      {formattedAnalysis}
                    </div>
                 </div>
               )}
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
      `}</style>
    </div>
  );
};

export default PathologyLab;
