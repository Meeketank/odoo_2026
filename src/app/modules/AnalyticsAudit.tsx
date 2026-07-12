import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  PieChart, 
  ArrowUpRight, 
  ArrowDownRight,
  Download,
  Calendar,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileText,
  ShieldCheck,
  CheckCircle,
  HelpCircle,
  FileSpreadsheet
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  PieChart as RePieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { 
  subscribeAudits, 
  subscribeDiscrepancies, 
  subscribeAssets, 
  subscribeBookings,
  verifyAssetInAudit, 
  resolveDiscrepancy,
  AuditCampaign, 
  Discrepancy, 
  Asset,
  Booking
} from '../services/firebaseService';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Fixed color constants for categories
const CATEGORY_COLORS: Record<string, string> = {
  Computing: '#714B67',
  Mobile: '#00A09D',
  Furniture: '#E97C2E',
  Peripherals: '#875A7B',
  Media: '#1E293B',
  Default: '#64748B'
};

export const ReportsAnalytics = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    const unsubAssets = subscribeAssets(setAssets);
    const unsubBookings = subscribeBookings(setBookings);
    return () => {
      unsubAssets();
      unsubBookings();
    };
  }, []);

  // 1. Calculate PIE DATA: Distribution of assets by category
  const getPieData = () => {
    const counts: Record<string, number> = {};
    assets.forEach(a => {
      counts[a.category] = (counts[a.category] || 0) + 1;
    });

    const categories = Object.keys(counts);
    if (categories.length === 0) {
      return [{ name: 'None', value: 1, color: '#e2e8f0' }];
    }

    return categories.map(cat => ({
      name: cat,
      value: counts[cat],
      color: CATEGORY_COLORS[cat] || CATEGORY_COLORS.Default
    }));
  };

  const pieData = getPieData();

  // 2. Calculate AREA DATA: Growth or purchase timeline
  const getAreaData = () => {
    // We mock acquisition trends based on purchase dates or default back to standard intervals
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
    const counts = [1, 2, 4, 3, 5, 4, 6]; // default purchase pattern
    
    // Attempt to map real values
    const dataMap: Record<string, number> = {
      '01': 1, '02': 2, '03': 1, '04': 2, '05': 1, '06': 2, '07': 3
    };

    assets.forEach(a => {
      if (a.purchaseDate) {
        const monthPart = a.purchaseDate.split('-')[1];
        if (monthPart && dataMap[monthPart] !== undefined) {
          dataMap[monthPart] += 1;
        }
      }
    });

    return [
      { name: 'Jan', value: dataMap['01'] || 1 },
      { name: 'Feb', value: dataMap['02'] || 2 },
      { name: 'Mar', value: dataMap['03'] || 1 },
      { name: 'Apr', value: dataMap['04'] || 2 },
      { name: 'May', value: dataMap['05'] || 1 },
      { name: 'Jun', value: dataMap['06'] || 2 },
      { name: 'Jul', value: dataMap['07'] || 3 },
    ];
  };

  const areaData = getAreaData();

  // 3. Overall Stats
  const totalCost = assets.reduce((acc, a) => acc + (a.cost || 0), 0);
  const avgHealth = assets.length > 0 ? Math.round(assets.reduce((acc, a) => acc + a.health, 0) / assets.length) : 100;
  
  // Utilization rate: percentage of allocated assets vs total assets
  const allocatedCount = assets.filter(a => a.status === 'Allocated').length;
  const utilizationRate = assets.length > 0 ? Math.round((allocatedCount / assets.length) * 100) : 0;

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">Intelligence & Analytics</h1>
          <p className="text-muted-foreground mt-1 text-sm">Deep operational insights, utilization trends and predictive modeling.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
         {[
           { label: 'Active Asset Utilization', value: `${utilizationRate}%`, trend: +4, pos: true, color: 'bg-primary/10', iconColor: 'text-primary' },
           { label: 'Asset Purchase Capital', value: `$${totalCost.toLocaleString()}`, trend: +12, pos: true, color: 'bg-teal-50', iconColor: 'text-teal-600' },
           { label: 'Fleet Health Average', value: `${avgHealth}%`, trend: -2, pos: false, color: 'bg-orange-50', iconColor: 'text-orange-600' },
         ].map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-[24px] border border-border shadow-sm flex items-center justify-between">
               <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                  <h3 className="text-3xl font-extrabold mt-1.5 text-slate-800">{stat.value}</h3>
                  <div className={cn(
                    "flex items-center gap-1 text-[10px] font-bold mt-2",
                    stat.pos ? "text-green-600" : "text-red-600"
                  )}>
                    {stat.pos ? <TrendingUp className="w-3 h-3" /> : <TrendingUp className="w-3 h-3 rotate-180" />}
                    {stat.trend > 0 ? '+' : ''}{stat.trend}% vs last month
                  </div>
               </div>
               <div className={cn("p-4 rounded-2xl", stat.color)}>
                  {i === 0 ? <PieChart className={cn("w-8 h-8", stat.iconColor)} /> : 
                   i === 1 ? <BarChart3 className={cn("w-8 h-8", stat.iconColor)} /> : 
                   <Clock className={cn("w-8 h-8", stat.iconColor)} />}
               </div>
            </div>
         ))}
      </div>

      {/* Chart Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-left">
         {/* Line Area Chart */}
         <div className="bg-white rounded-[32px] border border-border p-8 shadow-sm">
            <div className="flex justify-between items-center mb-8">
               <h3 className="font-extrabold text-lg text-slate-800">Asset Procurement Trend</h3>
               <button className="p-2 hover:bg-slate-100 rounded-xl"><Filter className="w-4 h-4 text-muted-foreground" /></button>
            </div>
            <div className="h-[300px]">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={areaData}>
                     <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#714B67" stopOpacity={0.2}/>
                           <stop offset="95%" stopColor="#714B67" stopOpacity={0}/>
                        </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f3f5" />
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#6c757d' }} dy={10} />
                     <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#6c757d' }} />
                     <Tooltip 
                        contentStyle={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #dee2e6', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                        itemStyle={{ color: '#714B67', fontWeight: 700 }}
                     />
                     <Area type="monotone" dataKey="value" stroke="#714B67" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* Pie Chart */}
         <div className="bg-white rounded-[32px] border border-border p-8 shadow-sm relative">
            <div className="flex justify-between items-center mb-8">
               <h3 className="font-extrabold text-lg text-slate-800">Distribution by Category</h3>
               <div className="flex gap-3">
                  {pieData.slice(0, 3).map((p, idx) => (
                    <div key={idx} className="flex items-center gap-1">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }}></div>
                      <span className="text-[9px] font-black text-muted-foreground uppercase">{p.name}</span>
                    </div>
                  ))}
               </div>
            </div>
            
            <div className="h-[300px] flex items-center justify-center">
               <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                     <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="value"
                     >
                        {pieData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                     </Pie>
                     <Tooltip />
                  </RePieChart>
               </ResponsiveContainer>
               
               <div className="absolute flex flex-col items-center">
                  <span className="text-3xl font-black text-slate-800">{assets.length}</span>
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total Assets</span>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export const AuditCompliance = () => {
   const [audits, setAudits] = useState<AuditCampaign[]>([]);
   const [discrepancies, setDiscrepancies] = useState<Discrepancy[]>([]);
   const [assets, setAssets] = useState<Asset[]>([]);
   
   // Audit Action state
   const [showAuditAction, setShowAuditAction] = useState<AuditCampaign | null>(null);
   const [assetToVerify, setAssetToVerify] = useState('');
   const [deptMatch, setDeptMatch] = useState(true);
   const [sigPresent, setSigPresent] = useState(true);

   // Discrepancy Action state
   const [activeDisc, setActiveDisc] = useState<Discrepancy | null>(null);
   const [resolutionText, setResolutionText] = useState('');

   useEffect(() => {
      const unsubAudits = subscribeAudits(setAudits);
      const unsubDiscrepancies = subscribeDiscrepancies(setDiscrepancies);
      const unsubAssets = subscribeAssets(setAssets);
      return () => {
         unsubAudits();
         unsubDiscrepancies();
         unsubAssets();
      };
   }, []);

   const handleVerifySubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!showAuditAction || !assetToVerify) return;

      const targetAsset = assets.find(a => a.tag === assetToVerify || a.id === assetToVerify);
      if (!targetAsset) {
         alert("Asset Tag/ID not found in active directory.");
         return;
      }

      await verifyAssetInAudit(
         showAuditAction.id, 
         targetAsset.id, 
         deptMatch, 
         sigPresent, 
         'Alex Sterling'
      );

      setAssetToVerify('');
      setDeptMatch(true);
      setSigPresent(true);
   };

   const handleResolveDiscrepancy = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!activeDisc || !resolutionText) return;

      await resolveDiscrepancy(activeDisc.id, resolutionText, 'Alex Sterling');
      setActiveDisc(null);
      setResolutionText('');
   };

   // Compliance Score: Percentage of resolved discrepancies + high health assets
   const activeDiscrepancies = discrepancies.filter(d => d.status === 'Open');
   const accuracyRate = assets.length > 0 
     ? Math.round(((assets.length - activeDiscrepancies.length) / assets.length) * 100) 
     : 100;
   
   const complianceScore = Math.max(50, accuracyRate);

   return (
      <div className="p-8 space-y-8 animate-in slide-in-from-top-4 duration-500 text-left">
         {/* Header */}
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
               <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">Audit & Compliance</h1>
               <p className="text-muted-foreground mt-1 text-sm">Structured verification cycles and governance monitoring.</p>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Active Audit Campaigns */}
            <div className="lg:col-span-2 space-y-6">
               <h3 className="font-extrabold text-lg text-slate-800 px-2">Active Audit Campaigns</h3>
               
               {audits.map((audit) => (
                  <div key={audit.id} className="bg-white p-6 rounded-[32px] border border-border shadow-sm hover:shadow-md transition-all group">
                     <div className="flex justify-between items-start mb-6">
                        <div>
                           <h4 className="font-extrabold text-xl text-slate-800 group-hover:text-primary transition-colors leading-tight">{audit.title}</h4>
                           <div className="flex items-center gap-4 mt-3">
                              <span className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                                <FileText className="w-4 h-4" /> {audit.totalItems} Items
                              </span>
                              <span className="flex items-center gap-1.5 text-xs font-bold text-green-600">
                                <CheckCircle2 className="w-4 h-4" /> {audit.verifiedItems} Verified
                              </span>
                           </div>
                        </div>
                        <span className={cn(
                           "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border",
                           audit.status === 'Closing Soon' ? "bg-red-50 text-red-700 border-red-200" : 
                           audit.status === 'Completed' ? "bg-green-50 text-green-700 border-green-200" : "bg-primary/10 text-primary border-primary/20"
                        )}>{audit.status}</span>
                     </div>
                     
                     <div className="space-y-2.5">
                        <div className="flex justify-between text-xs font-bold text-slate-700">
                           <span>Completion Progress</span>
                           <span>{audit.progress}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                           <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${audit.progress}%` }}
                              transition={{ duration: 1 }}
                              className="h-full bg-primary rounded-full"
                           />
                        </div>
                     </div>
                     
                     <div className="mt-8 pt-4 border-t border-border flex justify-between items-center">
                        <span className="text-[10px] text-muted-foreground font-bold uppercase">Campaign ID: {audit.id}</span>
                        {audit.status !== 'Completed' && (
                          <button 
                            onClick={() => setShowAuditAction(audit)}
                            className="px-5 py-2.5 bg-primary text-white text-xs font-black rounded-xl hover:bg-slate-800 transition-all uppercase tracking-wider"
                          >
                             Verify Asset Slot
                          </button>
                        )}
                     </div>
                  </div>
               ))}
            </div>

            {/* Compliance Scores */}
            <div className="space-y-6">
               <h3 className="font-extrabold text-lg text-slate-800 px-2">Compliance Scoreboard</h3>
               
               <div className="bg-slate-900 rounded-[32px] p-8 text-white relative overflow-hidden group">
                  <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl group-hover:bg-primary/40 transition-all"></div>
                  <div className="relative z-10">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Org Health Index</p>
                     <h2 className="text-6xl font-black mt-3 leading-none">{complianceScore}<span className="text-2xl text-slate-500">.0</span></h2>
                     
                     <div className="mt-8 space-y-4">
                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/10 text-xs">
                           <span className="font-medium">Device Accuracy Rate</span>
                           <span className="font-bold text-green-400">{accuracyRate}%</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/10 text-xs">
                           <span className="font-medium">Active Discrepancies</span>
                           <span className={cn("font-bold", activeDiscrepancies.length > 0 ? "text-orange-400" : "text-green-400")}>
                             {activeDiscrepancies.length} issues
                           </span>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Discrepancy Queue list */}
               <div className="bg-white border border-border rounded-[32px] p-6 shadow-sm">
                  <h4 className="font-extrabold text-slate-800 mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-500" /> Discrepancy Log Queue
                  </h4>
                  
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                     {activeDiscrepancies.map((item) => (
                        <div 
                          key={item.id} 
                          onClick={() => setActiveDisc(item)}
                          className="p-3 bg-red-50/50 rounded-2xl border border-red-100 hover:bg-red-50 transition-all cursor-pointer text-left"
                        >
                           <div className="flex justify-between">
                              <p className="text-xs font-black text-slate-800">{item.assetName}</p>
                              <span className="text-[8px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded uppercase">
                                {item.issueType}
                              </span>
                           </div>
                           <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">{item.description}</p>
                           <div className="mt-3 flex justify-between items-center text-[9px] text-slate-400 font-bold">
                              <span>Reported: {item.reportedAt}</span>
                              <span className="text-primary uppercase">Resolve →</span>
                           </div>
                        </div>
                     ))}
                     {activeDiscrepancies.length === 0 && (
                       <p className="text-xs text-muted-foreground text-center py-4">No active discrepancies. Compliance verified.</p>
                     )}
                  </div>
               </div>
            </div>
         </div>

         {/* ========================================== */}
         {/* 🔎 COLLABORATIVE AUDIT INPUT FORM */}
         {/* ========================================== */}
         <AnimatePresence>
            {showAuditAction && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowAuditAction(null)} />
                
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative z-10 border border-border space-y-6"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9px] font-black bg-primary/10 text-primary px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                         Asset Verification
                      </span>
                      <h3 className="text-xl font-black text-slate-900 mt-2">{showAuditAction.title}</h3>
                    </div>
                    <button onClick={() => setShowAuditAction(null)} className="p-1 hover:bg-slate-100 rounded-full">
                      <Plus className="w-5 h-5 rotate-45" />
                    </button>
                  </div>

                  <form onSubmit={handleVerifySubmit} className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest font-black">Scan Asset Tag / ID</label>
                      <input 
                        type="text" 
                        required
                        value={assetToVerify}
                        onChange={(e) => setAssetToVerify(e.target.value)}
                        placeholder="E.g. AST-2024-001"
                        className="w-full bg-slate-50 border border-border rounded-xl px-4 py-2.5 mt-2 outline-none focus:ring-2 focus:ring-primary/20 text-sm font-medium"
                      />
                    </div>

                    <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-border text-xs">
                      <p className="font-extrabold text-slate-700 mb-2">Audit Compliance Rules</p>
                      
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600">Location matches registry</span>
                        <input 
                          type="checkbox" 
                          checked={deptMatch}
                          onChange={(e) => setDeptMatch(e.target.checked)}
                          className="w-4 h-4 rounded text-primary focus:ring-primary/20"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600">Employee signature present</span>
                        <input 
                          type="checkbox" 
                          checked={sigPresent}
                          onChange={(e) => setSigPresent(e.target.checked)}
                          className="w-4 h-4 rounded text-primary focus:ring-primary/20"
                        />
                      </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                      <button 
                        type="button" 
                        onClick={() => setShowAuditAction(null)}
                        className="flex-1 py-3 bg-slate-100 rounded-xl text-xs font-black uppercase"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        className="flex-1 py-3 bg-primary text-white rounded-xl text-xs font-black uppercase shadow-lg shadow-primary/25"
                      >
                        Verify Asset
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
         </AnimatePresence>

         {/* ========================================== */}
         {/* ⚖️ RESOLVE DISCREPANCY FORM */}
         {/* ========================================== */}
         <AnimatePresence>
            {activeDisc && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setActiveDisc(null)} />
                
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative z-10 border border-border space-y-6"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9px] font-black bg-red-100 text-red-700 px-2 py-0.5 rounded-full uppercase tracking-wider">
                         Resolve Audit Issue
                      </span>
                      <h3 className="text-xl font-black text-slate-900 mt-2">{activeDisc.assetName}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">Discrepancy: {activeDisc.issueType}</p>
                    </div>
                    <button onClick={() => setActiveDisc(null)} className="p-1 hover:bg-slate-100 rounded-full">
                      <Plus className="w-5 h-5 rotate-45" />
                    </button>
                  </div>

                  <div className="p-4 bg-red-50/50 border border-red-100 rounded-2xl text-xs text-slate-700 leading-relaxed font-medium">
                     <p className="font-extrabold text-red-700 mb-1">Issue Details:</p>
                     "{activeDisc.description}"
                  </div>

                  <form onSubmit={handleResolveDiscrepancy} className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest font-black">Resolution Comments</label>
                      <textarea 
                        required
                        rows={2}
                        value={resolutionText}
                        onChange={(e) => setResolutionText(e.target.value)}
                        placeholder="Detail corrective actions, employee signatures obtained, or device adjustments..."
                        className="w-full bg-slate-50 border border-border rounded-xl px-4 py-2 mt-2 outline-none focus:ring-2 focus:ring-primary/20 text-sm font-medium"
                      />
                    </div>

                    <div className="pt-4 flex gap-3">
                      <button 
                        type="button" 
                        onClick={() => setActiveDisc(null)}
                        className="flex-1 py-3 bg-slate-100 rounded-xl text-xs font-black uppercase"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        className="flex-1 py-3 bg-green-600 text-white rounded-xl text-xs font-black uppercase shadow-lg shadow-green-600/25"
                      >
                        Resolve Discrepancy
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
