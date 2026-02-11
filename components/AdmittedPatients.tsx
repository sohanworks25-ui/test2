
import React, { useState, useMemo } from 'react';
import { Patient, AdmittedPatient, User, Bill, HospitalConfig, Room, Professional } from '../types';

interface AdmittedPatientsProps {
  patients: Patient[];
  admissions: AdmittedPatient[];
  professionals: Professional[];
  bills: Bill[];
  rooms: Room[];
  hospitalConfig: HospitalConfig;
  onAddAdmission: (admission: AdmittedPatient) => void;
  onUpdateAdmission: (admission: AdmittedPatient) => void;
  onDeleteAdmission: (id: string) => void;
  onUpdateRoom: (room: Room) => void;
  currentUser: User;
  onGoToBilling: (patientId: string) => void;
  onGoToDues: (patientId: string) => void;
}

const AdmittedPatients: React.FC<AdmittedPatientsProps> = ({ 
  patients, 
  admissions, 
  professionals, 
  bills,
  rooms,
  hospitalConfig,
  onAddAdmission, 
  onUpdateAdmission, 
  onUpdateRoom,
  onGoToDues
}) => {
  const [showModal, setShowModal] = useState(false);
  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [editingAdmission, setEditingAdmission] = useState<AdmittedPatient | null>(null);
  const [targetAdmission, setTargetAdmission] = useState<AdmittedPatient | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [formData, setFormData] = useState<Partial<AdmittedPatient>>({
    patientId: '',
    roomNumber: '',
    bedNumber: '',
    doctorInChargeId: '',
    notes: '',
    guardianName: '',
    guardianPhone: '',
    guardianRelation: '',
    bloodGroup: '',
    admissionDiagnosis: '',
    allergies: ''
  });

  const hospitalDoctors = useMemo(() => professionals.filter(p => p.category === 'Hospital'), [professionals]);
  
  const activeAdmissions = useMemo(() => {
    return admissions
      .filter(a => a.status === 'admitted')
      .filter(a => {
        const p = patients.find(pat => pat.id === a.patientId);
        const name = p?.name.toLowerCase() || '';
        const q = searchQuery.toLowerCase();
        return name.includes(q) || a.patientId.toLowerCase().includes(q) || a.roomNumber.toLowerCase().includes(q);
      })
      .sort((a, b) => new Date(b.admissionDate).getTime() - new Date(a.admissionDate).getTime());
  }, [admissions, patients, searchQuery]);

  const availableRooms = useMemo(() => {
    return rooms.filter(r => 
      r.status === 'Available' || 
      (editingAdmission && r.number === editingAdmission.roomNumber)
    );
  }, [rooms, editingAdmission]);

  const handleAdmission = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedRoom = rooms.find(r => r.number === formData.roomNumber);

    if (editingAdmission) {
      if (editingAdmission.roomNumber !== formData.roomNumber) {
        const oldRoom = rooms.find(r => r.number === editingAdmission.roomNumber);
        if (oldRoom) onUpdateRoom({ ...oldRoom, status: 'Available' });
        if (selectedRoom) onUpdateRoom({ ...selectedRoom, status: 'Occupied' });
      }
      onUpdateAdmission({ ...editingAdmission, ...formData } as AdmittedPatient);
    } else {
      const newAdmission: AdmittedPatient = {
        id: `ADM-${Date.now()}`,
        patientId: formData.patientId || '',
        admissionDate: new Date().toISOString(),
        roomNumber: formData.roomNumber || '',
        bedNumber: formData.bedNumber || '',
        doctorInChargeId: formData.doctorInChargeId || '',
        status: 'admitted',
        notes: formData.notes,
        guardianName: formData.guardianName,
        guardianPhone: formData.guardianPhone,
        guardianRelation: formData.guardianRelation,
        bloodGroup: formData.bloodGroup,
        admissionDiagnosis: formData.admissionDiagnosis,
        allergies: formData.allergies
      };
      onAddAdmission(newAdmission);
      if (selectedRoom) onUpdateRoom({ ...selectedRoom, status: 'Occupied' });
    }
    closeModal();
  };

  const initiateRelease = (adm: AdmittedPatient) => {
    setTargetAdmission(adm);
    setShowReleaseModal(true);
  };

  const executeFinalRelease = () => {
    if (!targetAdmission) return;

    onUpdateAdmission({
      ...targetAdmission,
      status: 'discharged',
      dischargeDate: new Date().toISOString()
    });

    const room = rooms.find(r => r.number === targetAdmission.roomNumber);
    if (room) {
      onUpdateRoom({ ...room, status: 'Available' });
    }
    
    setShowReleaseModal(false);
    setTargetAdmission(null);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingAdmission(null);
    setFormData({ 
      patientId: '', roomNumber: '', bedNumber: '', doctorInChargeId: '', notes: '',
      guardianName: '', guardianPhone: '', guardianRelation: '', bloodGroup: '',
      admissionDiagnosis: '', allergies: ''
    });
  };

  const openEdit = (adm: AdmittedPatient) => {
    setEditingAdmission(adm);
    setFormData(adm);
    setShowModal(true);
  };

  const calculateDays = (dateStr: string) => {
    const start = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return diff === 0 ? 'Intake Today' : `${diff} Day${diff > 1 ? 's' : ''} in Ward`;
  };

  const releaseDetails = useMemo(() => {
    if (!targetAdmission) return null;
    const p = patients.find(pat => pat.id === targetAdmission.patientId);
    const pBills = bills.filter(b => b.patientId === targetAdmission.patientId);
    const totalDue = pBills.reduce((acc, b) => acc + b.dueAmount, 0);
    return { patient: p, totalDue };
  }, [targetAdmission, patients, bills]);

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8">
        <div className="flex items-center gap-5">
           <div className="w-16 h-16 bg-slate-900 dark:bg-blue-600 rounded-[22px] flex items-center justify-center text-white shadow-2xl">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/></svg>
           </div>
           <div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Inpatient Command</h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-sm italic">Monitoring {activeAdmissions.length} active clinical stays</p>
           </div>
        </div>

        <div className="flex flex-wrap gap-4 w-full xl:w-auto no-print">
          <div className="relative flex-1 xl:w-96 group">
            <input 
              type="text" 
              placeholder="Filter by MRN, Name, or Room..." 
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all text-sm shadow-sm"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="group bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-[22px] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-blue-600/20 transition-all active:scale-95 flex items-center justify-center gap-3"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="group-hover:rotate-90 transition-transform"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
            Admit
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {activeAdmissions.map(adm => {
          const p = patients.find(pat => pat.id === adm.patientId);
          const doctor = hospitalDoctors.find(d => d.id === adm.doctorInChargeId);
          const patientBills = bills.filter(b => b.patientId === adm.patientId);
          const totalDue = patientBills.reduce((acc, b) => acc + b.dueAmount, 0);
          
          return (
            <div key={adm.id} className="group relative bg-white dark:bg-slate-900 rounded-[45px] p-8 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-blue-600/5 blur-[80px] -mr-20 -mt-20 group-hover:bg-blue-600/10 transition-colors duration-700"></div>
              
              <div className="flex justify-between items-start mb-8 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-[24px] bg-slate-900 flex items-center justify-center font-black text-2xl text-blue-400 shadow-xl uppercase transition-transform group-hover:scale-105 duration-500">
                    {p?.name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-tight">{p?.name || 'Unknown Patient'}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-black font-mono text-blue-500 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded uppercase">MRN: {adm.patientId}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{p?.sex} • {p?.age}Y</span>
                    </div>
                  </div>
                </div>
                {totalDue > 0 && (
                   <div className="bg-rose-50 dark:bg-rose-900/20 px-3 py-1.5 rounded-xl border border-rose-100 dark:border-rose-800 flex flex-col items-end">
                      <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest">Pending Due</span>
                      <span className="text-xs font-black text-rose-600 tabular-nums">{totalDue.toLocaleString()} {hospitalConfig.currencySymbol}</span>
                   </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6 pt-6 border-t border-slate-50 dark:border-slate-800 relative z-10">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-3xl border border-slate-100 dark:border-slate-700">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Ward Location</p>
                  <p className="text-sm font-black text-slate-800 dark:text-slate-100">Room {adm.roomNumber}</p>
                  <p className="text-[10px] font-bold text-blue-500 uppercase">Bed {adm.bedNumber}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-3xl border border-slate-100 dark:border-slate-700 text-right">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Stay Duration</p>
                  <p className="text-sm font-black text-slate-800 dark:text-slate-100">{calculateDays(adm.admissionDate)}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Since {new Date(adm.admissionDate).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="bg-slate-900 rounded-[30px] p-5 mb-8 relative z-10 overflow-hidden group/phys">
                 <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/10 blur-[40px] -mr-12 -mt-12 group-hover/phys:bg-blue-600/20 transition-colors"></div>
                 <div className="relative z-10">
                    <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                       <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse"></div>
                       Attending Physician
                    </p>
                    <p className="text-sm font-black text-white uppercase tracking-tight truncate">{doctor?.name || 'Unassigned Internal Staff'}</p>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">{doctor?.degree || 'Medical Unit'}</p>
                 </div>
              </div>

              <div className="mt-auto grid grid-cols-2 gap-3 pt-6 border-t border-slate-50 dark:border-slate-800 relative z-10">
                <button 
                  onClick={() => openEdit(adm)}
                  className="py-4 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 hover:border-blue-500 text-slate-400 hover:text-blue-600 rounded-2xl font-black text-[10px] uppercase tracking-[0.15em] transition-all flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                  Edit File
                </button>
                <button 
                  onClick={() => initiateRelease(adm)}
                  className={`py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.15em] transition-all flex items-center justify-center gap-2 shadow-xl ${totalDue > 0 ? 'bg-rose-100 text-rose-600 border-2 border-rose-200 hover:bg-rose-200' : 'bg-slate-900 dark:bg-blue-600 text-white hover:bg-black dark:hover:bg-blue-500 shadow-slate-900/10'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                  {totalDue > 0 ? 'Pending Dues' : 'Release'}
                </button>
              </div>
            </div>
          );
        })}
        
        {activeAdmissions.length === 0 && (
          <div className="col-span-full py-40 flex flex-col items-center justify-center opacity-20 text-center scale-110">
            <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-8 text-slate-300"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
            <p className="text-3xl font-black uppercase tracking-[0.2em] text-slate-800 dark:text-white">Ward Capacity Empty</p>
            <p className="text-sm font-bold mt-4 uppercase tracking-[0.3em] italic text-slate-500">All clinical beds are currently sanitized and available</p>
          </div>
        )}
      </div>

      {showReleaseModal && targetAdmission && releaseDetails && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-[600] flex items-center justify-center p-4">
           <div className="bg-white dark:bg-slate-900 rounded-[50px] shadow-[0_0_100px_-20px_rgba(0,0,0,0.5)] w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20 dark:border-slate-800">
              
              <div className={`h-2 w-full ${releaseDetails.totalDue > 0 ? 'bg-rose-600' : 'bg-emerald-500'}`}></div>

              <div className="p-10 text-center">
                 <div className={`w-24 h-24 rounded-[35px] flex items-center justify-center mx-auto mb-8 shadow-inner ${releaseDetails.totalDue > 0 ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600'}`}>
                    {releaseDetails.totalDue > 0 ? (
                       <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="animate-bounce"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    ) : (
                       <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="animate-pulse"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    )}
                 </div>

                 {releaseDetails.totalDue > 0 ? (
                    <>
                       <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase mb-4 leading-tight">Settlement Required</h3>
                       <p className="text-slate-500 dark:text-slate-400 font-bold text-sm leading-relaxed mb-10">
                          Patient <span className="text-slate-900 dark:text-white uppercase font-black">{releaseDetails.patient?.name}</span> has an outstanding due of <span className="text-rose-600 font-black">{releaseDetails.totalDue.toLocaleString()} {hospitalConfig.currencySymbol}</span>. Please collect this amount before authorizing discharge.
                       </p>
                       <div className="flex flex-col gap-3">
                          <button 
                             onClick={() => { setShowReleaseModal(false); onGoToDues(targetAdmission.patientId); }}
                             className="w-full bg-slate-900 dark:bg-blue-600 text-white py-5 rounded-[24px] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-black transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                          >
                             Collect Due
                          </button>
                          <button 
                             onClick={() => setShowReleaseModal(false)}
                             className="w-full py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-600 transition-colors"
                          >
                             Cancel
                          </button>
                       </div>
                    </>
                 ) : (
                    <>
                       <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase mb-4 leading-tight">Authorize Discharge</h3>
                       <p className="text-slate-500 dark:text-slate-400 font-bold text-sm leading-relaxed mb-10">
                          Are you sure you wish to release <span className="text-slate-900 dark:text-white uppercase font-black">{releaseDetails.patient?.name}</span>? This will free up <span className="text-blue-600 font-black">Room {targetAdmission.roomNumber}</span>.
                       </p>
                       <div className="flex flex-col gap-3">
                          <button 
                             onClick={executeFinalRelease}
                             className="w-full bg-emerald-600 text-white py-5 rounded-[24px] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-emerald-700 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                          >
                             Confirm
                          </button>
                          <button 
                             onClick={() => setShowReleaseModal(false)}
                             className="w-full py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-600 transition-colors"
                          >
                             Cancel
                          </button>
                       </div>
                    </>
                 )}
              </div>
           </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[500] flex items-center justify-center p-4 overflow-y-auto">
           <div className="bg-white dark:bg-slate-900 rounded-[50px] shadow-2xl w-full max-w-4xl overflow-hidden animate-slide-up border border-white/20 dark:border-slate-800 my-auto">
              <div className="p-12 bg-slate-900 border-b border-white/5 flex justify-between items-center relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 blur-[120px] -mr-40 -mt-40"></div>
                 <div className="relative z-10">
                    <h3 className="text-4xl font-black text-white tracking-tight uppercase">
                       {editingAdmission ? 'Update Case Record' : 'Institutional Intake'}
                    </h3>
                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.5em] mt-3">Advanced Ward Management System</p>
                 </div>
                 <button onClick={closeModal} className="relative z-10 w-16 h-16 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-[25px] text-slate-400 hover:text-white transition-all border border-white/10 group">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="group-hover:rotate-90 transition-transform"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                 </button>
              </div>

              <form onSubmit={handleAdmission} className="p-12 space-y-16 max-h-[70vh] overflow-y-auto custom-scrollbar">
                 <div className="space-y-8">
                    <h4 className="text-[11px] font-black text-blue-600 uppercase tracking-[0.3em] flex items-center gap-4">
                       <div className="p-2 bg-blue-600/10 rounded-xl"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
                       Case Assignments
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Patient Search (MRN)</label>
                          <select required className="w-full px-8 py-5 rounded-[22px] bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 font-black text-slate-800 dark:text-white outline-none focus:border-blue-500 appearance-none cursor-pointer text-sm" 
                             value={formData.patientId} onChange={e => setFormData({...formData, patientId: e.target.value})}>
                            <option value="">Select Clinical Profile...</option>
                            {patients.map(p => <option key={p.id} value={p.id}>{p.name} (ID: {p.id})</option>)}
                          </select>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Lead Physician</label>
                          <select required className="w-full px-8 py-5 rounded-[22px] bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 font-black text-slate-800 dark:text-white outline-none focus:border-blue-500 appearance-none cursor-pointer text-sm" 
                             value={formData.doctorInChargeId} onChange={e => setFormData({...formData, doctorInChargeId: e.target.value})}>
                            <option value="">Search Consultants...</option>
                            {hospitalDoctors.map(d => <option key={d.id} value={d.id}>{d.name} ({d.degree})</option>)}
                          </select>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-8">
                    <h4 className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.3em] flex items-center gap-4">
                       <div className="p-2 bg-indigo-600/10 rounded-xl"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2c-2 0-3 1-3 3s1 3 3 3 3-1 3-3-1-3-3-3z"/><path d="M3 14v5a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5"/><path d="M3 11h18"/><path d="M3 7v7"/><path d="M21 7v7"/></svg></div>
                       Clinical Location
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Room / Cabin</label>
                          <select required className="w-full px-8 py-5 rounded-[22px] bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 font-black text-slate-800 dark:text-white outline-none focus:border-indigo-500 appearance-none cursor-pointer text-sm" 
                             value={formData.roomNumber} onChange={e => setFormData({...formData, roomNumber: e.target.value})}>
                            <option value="">Available Wards...</option>
                            {availableRooms.map(r => <option key={r.id} value={r.number}>Room {r.number} ({r.type})</option>)}
                          </select>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Bed UID</label>
                          <input required type="text" className="w-full px-8 py-5 rounded-[22px] bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 font-black text-slate-800 dark:text-white outline-none focus:border-indigo-500 text-sm" 
                             placeholder="e.g. Bed-04" value={formData.bedNumber} onChange={e => setFormData({...formData, bedNumber: e.target.value})} />
                       </div>
                    </div>
                 </div>

                 <div className="space-y-8">
                    <h4 className="text-[11px] font-black text-rose-600 uppercase tracking-[0.3em] flex items-center gap-4">
                       <div className="p-2 bg-rose-600/10 rounded-xl"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m16 2 4 4-4 4"/><path d="m8 22-4-4 4-4"/><path d="M4 18h11a5 5 0 0 0 5-5v-1"/><path d="M20 6H9a5 5 0 0 0-5 5v1"/></svg></div>
                       Clinical Observations
                    </h4>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Admission Diagnosis / Note</label>
                       <textarea rows={4} className="w-full px-8 py-6 rounded-[35px] bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 font-bold text-slate-800 dark:text-white outline-none focus:border-rose-500 resize-none transition-all placeholder:text-slate-300" 
                          placeholder="Provide primary clinical findings for admission..." value={formData.admissionDiagnosis} onChange={e => setFormData({...formData, admissionDiagnosis: e.target.value})} />
                    </div>
                 </div>

                 <div className="flex flex-col sm:flex-row gap-4 pt-8">
                    <button type="button" onClick={closeModal} className="flex-1 px-10 py-6 rounded-[30px] border-2 border-slate-100 text-slate-400 font-black uppercase tracking-widest text-[11px] hover:bg-slate-50 transition-all">Cancel</button>
                    <button type="submit" className="flex-[2] bg-slate-900 dark:bg-blue-600 text-white py-6 rounded-[30px] font-black text-[12px] uppercase tracking-[0.4em] shadow-2xl hover:bg-black dark:hover:bg-blue-700 transition-all active:scale-[0.98]">
                       {editingAdmission ? 'Apply Case Updates' : 'Admit'}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdmittedPatients;
