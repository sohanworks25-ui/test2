import React, { useState, useMemo } from 'react';
import { Room, HospitalConfig, User, UserRole } from '../types';

interface RoomManagementProps {
  rooms: Room[];
  hospitalConfig: HospitalConfig;
  currentUser: User;
  onAddRoom: (room: Room) => void;
  onUpdateRoom: (room: Room) => void;
  onDeleteRoom: (id: string) => void;
}

const RoomManagement: React.FC<RoomManagementProps> = ({ rooms, hospitalConfig, currentUser, onAddRoom, onUpdateRoom, onDeleteRoom }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState<Partial<Room>>({
    number: '',
    type: 'General',
    pricePerDay: 0,
    floor: '',
    status: 'Available'
  });

  const currency = hospitalConfig.currencySymbol || 'Tk';
  const isAdmin = currentUser.role === UserRole.SUPER_ADMIN || currentUser.role === UserRole.ADMIN;

  const filteredRooms = useMemo(() => {
    return rooms.filter(r => 
      r.number.toLowerCase().includes(searchQuery.toLowerCase()) || 
      r.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.floor.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [rooms, searchQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRoom) {
      onUpdateRoom({ ...editingRoom, ...formData } as Room);
    } else {
      const newRoom: Room = {
        id: `RM-${Date.now()}`,
        number: formData.number || '',
        type: formData.type as any,
        pricePerDay: Number(formData.pricePerDay) || 0,
        floor: formData.floor || '',
        status: formData.status as any
      };
      onAddRoom(newRoom);
    }
    closeModal();
  };

  const openEdit = (room: Room) => {
    setEditingRoom(room);
    setFormData(room);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingRoom(null);
    setFormData({ number: '', type: 'General', pricePerDay: 0, floor: '', status: 'Available' });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Room Management</h2>
          <p className="text-sm text-slate-500 font-medium">Configure hospital wards, cabins, and bed pricing</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="px-6 py-3 bg-slate-900 hover:bg-black text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl active:scale-95 flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          Add Room
        </button>
      </header>

      <div className="bg-white p-4 rounded-[24px] border border-slate-100 shadow-sm flex items-center gap-4">
        <div className="relative flex-1">
          <input 
            type="text" 
            placeholder="Filter by room number, type, or floor..." 
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-100 font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredRooms.map(room => (
          <div key={room.id} className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-6 space-y-4 hover:shadow-xl transition-all group relative overflow-hidden">
             <div className="flex justify-between items-start">
                <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                  room.status === 'Available' ? 'bg-emerald-50 text-emerald-600' : 
                  room.status === 'Occupied' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-400'
                }`}>
                  {room.status}
                </div>
                <div className="flex gap-2 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                   <button onClick={() => openEdit(room)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg></button>
                   {isAdmin && (
                     <button onClick={() => onDeleteRoom(room.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg></button>
                   )}
                </div>
             </div>
             <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{room.floor}</p>
                <h3 className="text-2xl font-black text-slate-800 leading-tight">Room {room.number}</h3>
                <p className="text-xs font-bold text-blue-600 uppercase tracking-tight">{room.type}</p>
             </div>
             <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rate Per Day</span>
                <span className="text-lg font-black text-slate-900">{room.pricePerDay.toLocaleString()} {currency}</span>
             </div>
          </div>
        ))}
        {filteredRooms.length === 0 && (
          <div className="col-span-full py-24 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
             <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300"><path d="M3 14v5a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5"/><path d="M3 11h18"/><path d="M3 7v7"/><path d="M21 7v7"/></svg></div>
             <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">No matching rooms found</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
           <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-8 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                 <h3 className="text-2xl font-black text-slate-800 tracking-tight">{editingRoom ? 'Update Room Detail' : 'Register Hospital Room'}</h3>
                 <button onClick={closeModal} className="p-2 rounded-2xl hover:bg-slate-200 transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                 </button>
              </div>
              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                 <div className="grid grid-cols-2 gap-6">
                    <div className="col-span-2 sm:col-span-1">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Room Number / ID</label>
                       <input 
                         required 
                         type="text" 
                         placeholder="e.g. 101"
                         className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-slate-100 font-bold outline-none focus:border-blue-500"
                         value={formData.number}
                         onChange={e => setFormData({...formData, number: e.target.value})}
                       />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Room Type</label>
                       <select 
                         required 
                         className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-slate-100 font-bold outline-none focus:border-blue-500"
                         value={formData.type}
                         onChange={e => setFormData({...formData, type: e.target.value as any})}
                       >
                         <option value="General">General Ward</option>
                         <option value="Cabin">Private Cabin</option>
                         <option value="AC Cabin">Deluxe AC Cabin</option>
                         <option value="ICU">ICU Unit</option>
                         <option value="NICU">NICU Unit</option>
                         <option value="Emergency">Emergency Bed</option>
                       </select>
                    </div>
                    <div>
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Daily Rent ({currency})</label>
                       <input 
                         required 
                         type="number" 
                         placeholder="0.00"
                         className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-slate-100 font-black text-slate-800 outline-none focus:border-blue-500"
                         value={formData.pricePerDay || ''}
                         onChange={e => setFormData({...formData, pricePerDay: Number(e.target.value)})}
                       />
                    </div>
                    <div>
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Floor / Wing</label>
                       <input 
                         required 
                         type="text" 
                         placeholder="e.g. 2nd Floor"
                         className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-slate-100 font-bold outline-none focus:border-blue-500"
                         value={formData.floor}
                         onChange={e => setFormData({...formData, floor: e.target.value})}
                       />
                    </div>
                    <div className="col-span-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Availability Status</label>
                       <div className="grid grid-cols-3 gap-2">
                          {['Available', 'Occupied', 'Maintenance'].map(s => (
                             <button 
                               key={s}
                               type="button"
                               onClick={() => setFormData({...formData, status: s as any})}
                               className={`py-3 rounded-xl border-2 font-black text-[10px] uppercase tracking-widest transition-all ${formData.status === s ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
                             >
                               {s}
                             </button>
                          ))}
                       </div>
                    </div>
                 </div>
                 <button type="submit" className="w-full py-5 bg-blue-600 text-white rounded-[24px] font-black text-sm uppercase tracking-[0.2em] shadow-2xl hover:bg-blue-700 transition-all active:scale-[0.98]">
                    {editingRoom ? 'Apply Updates' : 'Confirm Registration'}
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default RoomManagement;