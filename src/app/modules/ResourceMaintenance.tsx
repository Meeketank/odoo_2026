import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  Users, 
  MapPin,
  ArrowUpRight,
  MoreHorizontal,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  CalendarDays,
  User,
  Wrench,
  ChevronRightSquare,
  CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { 
  subscribeBookings, 
  subscribeMaintenance, 
  subscribeAssets, 
  subscribeEmployees, 
  createBooking, 
  cancelBooking, 
  updateMaintenanceStatus,
  updateBookingTime,
  Booking, 
  MaintenanceTicket, 
  Asset, 
  Employee 
} from '../services/firebaseService';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = Array.from({ length: 9 }, (_, i) => i + 9); // 9 AM to 5 PM

export const ResourceBooking = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedDate, setSelectedDate] = useState('2026-07-12');
  const [calView, setCalView] = useState<'day' | 'week' | 'month' | 'timeline'>('day');
  
  // Create Booking Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [resourceName, setResourceName] = useState('Conference Room 1');
  const [resourceId, setResourceId] = useState('room-conf-1');
  const [empName, setEmpName] = useState('');
  const [startTime, setStartTime] = useState('10:00');
  const [duration, setDuration] = useState(1);
  const [color, setColor] = useState('bg-primary');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const unsubBookings = subscribeBookings(setBookings);
    const unsubAssets = subscribeAssets(setAssets);
    const unsubEmployees = subscribeEmployees(setEmployees);
    return () => {
      unsubAssets();
      unsubEmployees();
      unsubBookings();
    };
  }, []);

  // Filter bookable assets: Cannot book assets in Maintenance or Retired status
  const bookableAssets = assets.filter(a => a.status !== 'Maintenance' && a.status !== 'Retired');

  // Hardcoded rooms + dynamically fetched bookable devices
  const bookingResources = [
    { id: 'room-conf-1', name: 'Conference Room 1', type: 'Room' },
    { id: 'room-board-a', name: 'Boardroom A', type: 'Room' },
    { id: 'room-studio-x', name: 'Studio X', type: 'Room' },
    ...bookableAssets.map(a => ({ id: a.id, name: `${a.name} [${a.tag}]`, type: 'Device' }))
  ];

  const handleResourceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const rId = e.target.value;
    const r = bookingResources.find(item => item.id === rId);
    if (r) {
      setResourceId(rId);
      setResourceName(r.name);
    }
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!title || !empName) return;

    try {
      await createBooking({
        title,
        resource: resourceName,
        resourceId,
        employee: empName,
        date: selectedDate,
        startTime,
        duration: Number(duration),
        color
      }, 'Alex Sterling');

      // Reset Form
      setTitle('');
      setShowAddModal(false);
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const handleCancelBooking = async (id: string, bTitle: string) => {
    if (confirm(`Are you sure you want to cancel the booking for "${bTitle}"?`)) {
      await cancelBooking(id, bTitle, 'Alex Sterling');
    }
  };

  const handleBookingDrop = async (e: React.DragEvent, hour: number) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    if (!id) return;
    try {
      await updateBookingTime(id, `${hour}:00`, 'Alex Sterling');
    } catch(err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 text-left">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">Resource Scheduling</h1>
          <p className="text-muted-foreground mt-1 text-sm">Schedule and manage meeting rooms, vehicles, and shared equipment.</p>
        </div>
        
        {/* Calendar View Switcher */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-slate-100 p-1 rounded-xl flex gap-1 border border-border">
            {(['day', 'week', 'month', 'timeline'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setCalView(mode)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all",
                  calView === mode ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
                )}
              >
                {mode}
              </button>
            ))}
          </div>

          <input 
            type="date" 
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-white border border-border rounded-xl text-xs font-bold px-4 py-2.5 outline-none"
          />
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground rounded-xl font-semibold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4" /> New Booking
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Side Info Panel */}
        <div className="space-y-6">
           {/* Date card */}
           <div className="bg-white rounded-[24px] border border-border p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4 border-b border-border pb-3">
                 <CalendarDays className="w-5 h-5 text-primary" />
                 <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-800">Selected Schedule</h3>
              </div>
              <p className="text-sm font-bold text-slate-700">Date: {selectedDate}</p>
              <p className="text-xs text-muted-foreground mt-2">All times listed in Eastern Standard Time. Drag and drop booking cards to adjust slots.</p>
           </div>

           {/* AI Predictor card */}
           <div className="bg-gradient-to-br from-indigo-950 to-slate-950 rounded-[24px] p-6 text-white shadow-xl space-y-4">
              <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                 <AlertCircle className="w-5 h-5 text-indigo-400 animate-pulse" />
                 <h3 className="font-extrabold text-sm uppercase tracking-wider">AI Failure Predictor</h3>
              </div>
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-1">
                  <div className="flex justify-between font-bold">
                    <span className="text-red-400">Meeting Room B AC</span>
                    <span>94% Risk</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal">Thermal overload pattern detected. High failure likelihood next 15 days.</p>
                </div>
                <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-1">
                  <div className="flex justify-between font-bold">
                    <span className="text-orange-400">ThinkPad Tag #042</span>
                    <span>72% Risk</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal">Battery cycle health degraded below 50%. Maintenance recommended.</p>
                </div>
              </div>
           </div>

           {/* Bookable Hardware list */}
           <div className="bg-white rounded-[24px] border border-border p-6 shadow-sm">
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-800 mb-4">Bookable Hardware</h3>
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                 {bookableAssets.map((res, i) => (
                   <div key={i} className="p-3 bg-muted/50 border border-border rounded-xl flex items-center justify-between">
                      <div>
                         <p className="text-xs font-bold text-slate-800">{res.name}</p>
                         <p className="text-[9px] text-muted-foreground mt-0.5 uppercase">{res.category} • {res.tag}</p>
                      </div>
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-sm"></span>
                   </div>
                 ))}
                 {bookableAssets.length === 0 && (
                   <p className="text-xs text-muted-foreground">No bookable devices available.</p>
                 )}
              </div>
           </div>
        </div>

        {/* Schedule Grid Area */}
        <div className="lg:col-span-3">
          {calView === 'day' && (
            <div className="bg-white rounded-[32px] border border-border shadow-sm overflow-hidden">
               <div className="grid grid-cols-[100px_1fr] border-b border-border bg-muted/30">
                  <div className="p-4 border-r border-border text-[10px] font-bold uppercase text-muted-foreground tracking-widest flex items-center justify-center">Time</div>
                  <div className="p-4 text-[10px] font-bold uppercase text-muted-foreground tracking-widest flex items-center px-8">Schedule Overview • {selectedDate}</div>
               </div>
               
               <div className="relative">
                  {HOURS.map((hour) => {
                     const activeBookings = bookings.filter(b => b.date === selectedDate && parseInt(b.startTime) === hour);
                     
                     return (
                       <div 
                         key={hour} 
                         onDragOver={(e) => e.preventDefault()}
                         onDrop={(e) => handleBookingDrop(e, hour)}
                         className="grid grid-cols-[100px_1fr] border-b border-border min-h-[110px] group"
                       >
                          <div className="p-4 border-r border-border flex flex-col items-center justify-start group-hover:bg-muted/30 transition-colors">
                             <span className="text-sm font-bold text-slate-800">{hour}:00</span>
                             <span className="text-[10px] text-muted-foreground uppercase font-bold">{hour >= 12 ? 'PM' : 'AM'}</span>
                          </div>
                          
                          <div className="relative p-2 h-full bg-white group-hover:bg-slate-50/50 transition-colors flex flex-col gap-2">
                             {activeBookings.map(booking => (
                               <motion.div 
                                 key={booking.id}
                                 draggable
                                 onDragStart={(e) => {
                                   e.dataTransfer.setData('text/plain', booking.id);
                                 }}
                                 initial={{ opacity: 0, scale: 0.95 }}
                                 animate={{ opacity: 1, scale: 1 }}
                                 className={cn(
                                   "p-4 rounded-[20px] shadow-lg text-white group/booking flex flex-col justify-between cursor-move active:scale-95 transition-transform",
                                   booking.color
                                 )}
                                 style={{ minHeight: `calc(${booking.duration} * 90px - 12px)` }}
                               >
                                  <div className="flex justify-between items-start">
                                     <div>
                                        <div className="flex items-center gap-2 mb-1 opacity-80">
                                           <Clock className="w-3.5 h-3.5" />
                                           <span className="text-[9px] font-black uppercase tracking-wider">{booking.startTime} - {parseInt(booking.startTime) + booking.duration}:00</span>
                                        </div>
                                        <h4 className="font-extrabold text-base leading-tight">{booking.title}</h4>
                                        <div className="flex items-center gap-2 mt-2 opacity-90">
                                           <MapPin className="w-3 h-3" />
                                           <span className="text-xs font-semibold">{booking.resource}</span>
                                        </div>
                                     </div>
                                     <button 
                                       onClick={() => handleCancelBooking(booking.id, booking.title)}
                                       className="p-2 bg-white/20 rounded-xl hover:bg-white/30 transition-colors"
                                       title="Cancel Reservation"
                                     >
                                        <ChevronRight className="w-4 h-4 rotate-45" />
                                     </button>
                                  </div>
                                  
                                  <div className="mt-4 flex items-center justify-between pt-2 border-t border-white/10">
                                     <div className="flex items-center gap-1.5">
                                        <User className="w-3.5 h-3.5" />
                                        <span className="text-xs font-bold">{booking.employee}</span>
                                     </div>
                                     <span className="text-[9px] font-black bg-white/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                        Live Verified
                                     </span>
                                  </div>
                               </motion.div>
                             ))}
                          </div>
                       </div>
                     );
                  })}
               </div>
            </div>
          )}

          {calView === 'week' && (
            <div className="grid grid-cols-7 gap-4 bg-white p-6 border border-border rounded-[32px] shadow-sm">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
                const targetDayDate = `2026-07-${12 + i - 6}`; // week around 12th
                const weekBookings = bookings.filter(b => b.date === targetDayDate);
                return (
                  <div key={day} className="space-y-4">
                    <div className="text-center p-2 border-b border-border bg-slate-50 rounded-xl">
                      <p className="text-xs font-black text-slate-800">{day}</p>
                      <p className="text-[10px] text-muted-foreground">{12 + i - 6} Jul</p>
                    </div>
                    <div className="space-y-2 min-h-[300px]">
                      {weekBookings.map(b => (
                        <div key={b.id} className={cn("p-2 text-left rounded-lg text-white text-[10px] font-semibold leading-snug", b.color)}>
                          <p className="font-extrabold truncate">{b.title}</p>
                          <p className="opacity-80 truncate">{b.resource}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {calView === 'month' && (
            <div className="bg-white p-6 border border-border rounded-[32px] shadow-sm">
              <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-3 mb-3">
                <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
              </div>
              <div className="grid grid-cols-7 gap-2.5">
                {Array.from({ length: 31 }, (_, idx) => {
                  const dayNum = idx + 1;
                  const dateStr = `2026-07-${dayNum < 10 ? '0' + dayNum : dayNum}`;
                  const dayBookings = bookings.filter(b => b.date === dateStr);
                  return (
                    <div key={idx} className="border border-border rounded-xl p-2 min-h-[75px] hover:bg-slate-50 flex flex-col justify-between text-left">
                      <span className="text-xs font-bold text-slate-700">{dayNum}</span>
                      <div className="space-y-1">
                        {dayBookings.slice(0, 2).map(b => (
                          <div key={b.id} className="w-1.5 h-1.5 rounded-full bg-primary inline-block mr-1" title={b.title}></div>
                        ))}
                        {dayBookings.length > 0 && (
                          <p className="text-[9px] text-slate-500 font-bold leading-none">{dayBookings.length} bookings</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {calView === 'timeline' && (
            <div className="bg-white border border-border rounded-[32px] shadow-sm overflow-hidden">
              <div className="grid grid-cols-[200px_1fr] border-b border-border bg-slate-50 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                <div className="p-4 border-r border-border">Resource Room/Asset</div>
                <div className="grid grid-cols-8 p-4">
                  {HOURS.slice(0, 8).map(h => <span key={h}>{h}:00</span>)}
                </div>
              </div>
              <div className="divide-y divide-border">
                {bookingResources.slice(0, 6).map((res) => (
                  <div key={res.id} className="grid grid-cols-[200px_1fr]">
                    <div className="p-4 border-r border-border text-xs font-extrabold text-slate-800 text-left bg-slate-50/20">{res.name}</div>
                    <div className="grid grid-cols-8 p-2 relative h-full">
                      {HOURS.slice(0, 8).map((hour) => {
                        const hasBooking = bookings.find(b => b.resourceId === res.id && b.date === selectedDate && parseInt(b.startTime) === hour);
                        return (
                          <div key={hour} className="border-r border-dashed border-slate-100 min-h-[50px] relative p-1 flex items-center">
                            {hasBooking && (
                              <div className={cn("absolute inset-1 rounded-lg text-[9px] text-white font-bold p-1 text-left select-none overflow-hidden", hasBooking.color)}>
                                <p className="truncate">{hasBooking.title}</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================== */}
      {/* 📅 NEW BOOKING DRAW (MODAL) */}
      {/* ========================================== */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative z-10 border border-border space-y-6 text-left"
            >
              <div>
                <h3 className="text-2xl font-black text-slate-900">New Reservation</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Overlap conflict checking active in real-time.</p>
              </div>

              {errorMessage && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-xs text-red-600 font-bold">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleCreateBooking} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Meeting Title</label>
                  <input 
                    type="text" 
                    required 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="E.g. Project Alignment Session"
                    className="w-full bg-slate-50 border border-border rounded-xl px-4 py-2.5 mt-2 outline-none focus:ring-2 focus:ring-primary/20 text-sm font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Resource</label>
                    <select
                      value={resourceId}
                      onChange={handleResourceChange}
                      className="w-full bg-slate-50 border border-border rounded-xl px-3 py-2.5 mt-2 outline-none text-xs font-bold"
                    >
                      {bookingResources.map(res => (
                        <option key={res.id} value={res.id}>
                          [{res.type}] {res.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Reserved For</label>
                    <select
                      required
                      value={empName}
                      onChange={(e) => setEmpName(e.target.value)}
                      className="w-full bg-slate-50 border border-border rounded-xl px-3 py-2.5 mt-2 outline-none text-xs font-bold"
                    >
                      <option value="">Select Employee...</option>
                      {employees.map(e => <option key={e.id} value={e.name}>{e.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Date</label>
                    <input 
                      type="date" 
                      required
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full bg-slate-50 border border-border rounded-xl px-3 py-2 mt-2 outline-none text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Start Time</label>
                    <select
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full bg-slate-50 border border-border rounded-xl px-3 py-2.5 mt-2 outline-none text-xs font-bold"
                    >
                      {HOURS.map(h => <option key={h} value={`${h}:00`}>{h}:00</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Duration (Hrs)</label>
                    <select
                      value={duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-border rounded-xl px-3 py-2.5 mt-2 outline-none text-xs font-bold"
                    >
                      <option value="1">1 Hour</option>
                      <option value="2">2 Hours</option>
                      <option value="3">3 Hours</option>
                      <option value="4">4 Hours</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Card Theme</label>
                  <div className="flex gap-2 mt-2">
                    {[
                      { key: 'bg-primary', color: 'bg-[#714B67]' },
                      { key: 'bg-[#00A09D]', color: 'bg-[#00A09D]' },
                      { key: 'bg-[#E97C2E]', color: 'bg-[#E97C2E]' },
                      { key: 'bg-slate-800', color: 'bg-slate-800' }
                    ].map(theme => (
                      <button 
                        key={theme.key}
                        type="button"
                        onClick={() => setColor(theme.key)}
                        className={cn(
                          "w-6 h-6 rounded-full border-2",
                          color === theme.key ? "border-slate-800 scale-110" : "border-transparent"
                        )}
                      >
                        <div className={cn("w-full h-full rounded-full", theme.color)}></div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-3 bg-slate-100 rounded-xl text-xs font-black uppercase text-slate-800"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 bg-primary text-white rounded-xl text-xs font-black uppercase shadow-lg shadow-primary/20"
                  >
                    Confirm Booking
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const MaintenanceWorkflow = () => {
   const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
   const [employees, setEmployees] = useState<Employee[]>([]);
   
   // Card flyout detail menu
   const [activeTicket, setActiveTicket] = useState<MaintenanceTicket | null>(null);
   const [assignTech, setAssignTech] = useState('');

   useEffect(() => {
      const unsubMaintenance = subscribeMaintenance(setTickets);
      const unsubEmployees = subscribeEmployees(setEmployees);
      return () => {
         unsubMaintenance();
         unsubEmployees();
      };
   }, []);

   const handleStatusTransition = async (id: string, nextStatus: MaintenanceTicket['status'], tech: string) => {
      const activeTech = tech || 'Unassigned';
      await updateMaintenanceStatus(id, nextStatus, activeTech, 'Alex Sterling');
      setActiveTicket(null);
   };

   // Column mappings
   const COLUMNS = [
     { id: 'pending', title: 'Pending Approval' },
     { id: 'assigned', title: 'Technician Assigned' },
     { id: 'in_progress', title: 'In Progress' },
     { id: 'testing', title: 'Quality Testing' },
     { id: 'resolved', title: 'Resolved' },
     { id: 'closed', title: 'Closed' }
   ];

   return (
      <div className="p-8 space-y-8 animate-in slide-in-from-right-4 duration-500">
         {/* Header */}
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
            <div>
               <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">Maintenance Pipeline</h1>
               <p className="text-muted-foreground mt-1 text-sm">Track asset repairs, service requests, and quality assurance workflows.</p>
            </div>
         </div>

         {/* Pipeline Column grid */}
         <div className="flex gap-6 overflow-x-auto pb-8 text-left scrollbar-thin">
            {COLUMNS.map(column => {
               const columnItems = tickets.filter(t => t.status === column.id);
               
               return (
                  <div 
                    key={column.id} 
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      const id = e.dataTransfer.getData('text/plain');
                      if (id) {
                        handleStatusTransition(id, column.id as any, 'Unassigned');
                      }
                    }}
                    className="min-w-[280px] w-[300px] flex flex-col gap-4 bg-slate-50/50 p-4 rounded-3xl border border-border shrink-0"
                  >
                     <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-2">
                           <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-700">{column.title}</h3>
                           <span className="bg-white border border-border text-slate-800 text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">
                             {columnItems.length}
                           </span>
                        </div>
                     </div>

                     <div className="flex-1 space-y-4 overflow-y-auto max-h-[50vh]">
                        {columnItems.map(item => {
                           const sla = (() => {
                             if (item.status === 'resolved' || item.status === 'closed') {
                               return { text: 'SLA Met', expired: false, color: 'text-green-700 bg-green-50 border-green-100' };
                             }
                             const createdTime = item.createdAt ? new Date(item.createdAt).getTime() : Date.now() - 3600000;
                             const elapsedHours = (Date.now() - createdTime) / 3600000;
                             
                             let targetHours = 72;
                             if (item.priority === 'Critical') targetHours = 4;
                             else if (item.priority === 'High') targetHours = 24;
                             else if (item.priority === 'Medium') targetHours = 72;
                             else if (item.priority === 'Low') targetHours = 168;
                             
                             const remainingHours = targetHours - elapsedHours;
                             if (remainingHours <= 0) {
                               return { text: `Overdue by ${Math.abs(Math.round(remainingHours))}h`, expired: true, color: 'text-red-700 bg-red-50 border-red-100 animate-pulse' };
                             } else {
                               return { text: `${Math.round(remainingHours)}h remaining`, expired: false, color: 'text-slate-700 bg-slate-50 border-slate-100' };
                             }
                           })();

                           return (
                             <motion.div 
                               key={item.id}
                               draggable
                               onDragStart={(e) => {
                                 e.dataTransfer.setData('text/plain', item.id);
                               }}
                               whileHover={{ y: -4, scale: 1.02 }}
                               onClick={() => {
                                 setActiveTicket(item);
                                 setAssignTech(item.technician !== 'Unassigned' ? item.technician : '');
                               }}
                               className="bg-white p-5 rounded-[24px] border border-border shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all cursor-grab active:cursor-grabbing group"
                             >
                                <div className="flex justify-between items-start mb-3">
                                   <span className={cn(
                                      "text-[9px] px-2 py-0.5 rounded-full font-black uppercase border",
                                      item.priority === 'Critical' ? "bg-red-50 text-red-700 border-red-200" : 
                                      item.priority === 'High' ? "bg-orange-50 text-orange-700 border-orange-200" : "bg-blue-50 text-blue-700 border-blue-200"
                                   )}>{item.priority}</span>
                                   <span className="text-[10px] text-muted-foreground font-mono font-bold">{item.id}</span>
                                </div>
                                
                                <h4 className="font-black text-slate-800 group-hover:text-primary transition-colors leading-tight">{item.assetName}</h4>
                                <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                                   <AlertCircle className="w-3.5 h-3.5 shrink-0 text-muted-foreground/60" /> Tag: {item.tag}
                                </p>
                                
                                <div className="mt-4 flex items-center justify-between">
                                  <span className={cn("text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border", sla.color)}>
                                    {sla.text}
                                  </span>
                                </div>
                                
                                <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                                   <div className="flex items-center gap-2">
                                      <div className="w-6 h-6 rounded-full bg-accent border border-border overflow-hidden">
                                         <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${item.technician}`} alt="" />
                                      </div>
                                      <span className="text-[10px] font-black text-slate-700">{item.technician}</span>
                                   </div>
                                   <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-bold">
                                      <Clock className="w-3 h-3" /> {item.age}
                                   </div>
                                </div>
                             </motion.div>
                           );
                        })}
                     </div>
                  </div>
               );
            })}
         </div>

         {/* ========================================== */}
         {/* 🛠️ MAINTENANCE TICKET ACTIONS PANEL */}
         {/* ========================================== */}
         <AnimatePresence>
            {activeTicket && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setActiveTicket(null)} />
                
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative z-10 border border-border space-y-6 text-left"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9px] font-black bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full uppercase tracking-wider">
                         Status Manager
                      </span>
                      <h3 className="text-2xl font-black text-slate-900 mt-2">{activeTicket.assetName}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">Ticket ID: {activeTicket.id} • Tag: {activeTicket.tag}</p>
                    </div>
                    <button 
                      onClick={() => setActiveTicket(null)}
                      className="p-1 hover:bg-slate-100 rounded-full text-slate-500"
                    >
                      <Plus className="w-5 h-5 rotate-45" />
                    </button>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-border text-xs text-slate-600 leading-relaxed font-medium">
                     <p className="font-extrabold text-slate-800 mb-1">Issue Description:</p>
                     "{activeTicket.description}"
                  </div>

                  {/* Assign Tech Select */}
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest font-black">Assign Technician</label>
                    <select
                      value={assignTech}
                      onChange={(e) => setAssignTech(e.target.value)}
                      className="w-full bg-slate-50 border border-border rounded-xl px-3 py-2.5 mt-2 outline-none text-xs font-bold"
                    >
                      <option value="">Unassigned</option>
                      {employees.map(e => <option key={e.id} value={e.name}>{e.name} ({e.role})</option>)}
                    </select>
                  </div>

                  {/* Action transitions */}
                  <div className="space-y-2">
                     <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest font-black">Transition Pipeline Column</p>
                     
                     <div className="grid grid-cols-2 gap-2 pt-1">
                        {COLUMNS.filter(c => c.id !== activeTicket.status).map(col => (
                           <button 
                             key={col.id}
                             onClick={() => handleStatusTransition(activeTicket.id, col.id as any, assignTech)}
                             className={cn(
                               "py-2.5 px-3 rounded-xl border text-[10px] font-black uppercase text-center transition-all",
                               col.id === 'resolved' || col.id === 'closed' 
                                 ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100" 
                                 : "bg-slate-50 text-slate-700 border-border hover:bg-slate-100"
                             )}
                           >
                              {col.title}
                           </button>
                        ))}
                     </div>
                  </div>
                </motion.div>
              </div>
            )}
         </AnimatePresence>
      </div>
   );
};
