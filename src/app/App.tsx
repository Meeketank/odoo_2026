import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  UserPlus, 
  Calendar, 
  Settings, 
  BarChart3, 
  ClipboardCheck, 
  Bell, 
  History, 
  Users, 
  Building2, 
  ShieldCheck,
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Maximize2,
  Command,
  HelpCircle,
  TrendingUp,
  ArrowUpRight,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Clock,
  Briefcase,
  Layers,
  ChevronRightSquare,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Firebase & Service Imports
import { APP_CONFIG } from './firebase';
import { 
  subscribeAssets, 
  subscribeBookings, 
  subscribeMaintenance, 
  subscribeAudits, 
  subscribeDiscrepancies, 
  subscribeEmployees, 
  subscribeDepartments, 
  subscribeNotifications, 
  subscribeLogs,
  subscribeTransferRequests,
  allocateAsset,
  returnAsset,
  createBooking,
  createMaintenanceTicket,
  resolveDiscrepancy,
  markNotificationRead,
  clearAllNotifications,
  addEmployee,
  addDepartment,
  Asset,
  Booking,
  MaintenanceTicket,
  AuditCampaign,
  Discrepancy,
  Employee,
  Department,
  SystemNotification,
  ActivityLog,
  TransferRequest
} from './services/firebaseService';

// Modules
import { AssetManagement } from './modules/AssetManagement';
import { AssetAllocation } from './modules/AssetAllocation';
import { ResourceBooking, MaintenanceWorkflow } from './modules/ResourceMaintenance';
import { ReportsAnalytics, AuditCompliance } from './modules/AnalyticsAudit';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Navigation Layout Settings ---
type NavItem = {
  id: string;
  label: string;
  icon: React.ElementType;
};

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'assets', label: 'Assets', icon: Package },
  { id: 'allocation', label: 'Asset Allocation', icon: Layers },
  { id: 'booking', label: 'Resource Booking', icon: Calendar },
  { id: 'maintenance', label: 'Maintenance', icon: Settings },
  { id: 'audit', label: 'Audit', icon: ClipboardCheck },
  { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
  { id: 'logs', label: 'Activity Logs', icon: History },
  { id: 'departments', label: 'Departments', icon: Building2 },
  { id: 'employees', label: 'Employees', icon: Users },
  { id: 'administration', label: 'Administration', icon: ShieldCheck },
  { id: 'settings', label: 'Settings', icon: HelpCircle },
];

export default function App() {
  const [collapsed, setCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState('dashboard');
  
  // Real-time states
  const [assets, setAssets] = useState<Asset[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [audits, setAudits] = useState<AuditCampaign[]>([]);
  const [discrepancies, setDiscrepancies] = useState<Discrepancy[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);

  // UI overlays
  const [showNotificationDrawer, setShowNotificationDrawer] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showAIInsights, setShowAIInsights] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');
  const [fabOpen, setFabOpen] = useState(false);
  
  // Directory addition states
  const [showAddEmpModal, setShowAddEmpModal] = useState(false);
  const [empName, setEmpName] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [empDept, setEmpDept] = useState('Product Design');
  const [empRole, setEmpRole] = useState('Staff Engineer');
  
  const [showAddDeptModal, setShowAddDeptModal] = useState(false);
  const [deptName, setDeptName] = useState('');
  const [deptManager, setDeptManager] = useState('');
  const [deptBudget, setDeptBudget] = useState(100000);

  // Dark mode state
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [activeOrg, setActiveOrg] = useState('Global HQ');
  const [transfers, setTransfers] = useState<TransferRequest[]>([]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Keyboard listener for command palette (Ctrl+K) & navigation shortcuts
  useEffect(() => {
    let lastKey = '';
    const handleKeyDown = (e: KeyboardEvent) => {
      // Command Palette (Ctrl+K)
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(prev => !prev);
        return;
      }
      
      // Sequence navigator: e.g. Press 'g' then 'd' for dashboard
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return; // Ignore inside input fields
      }

      if (lastKey === 'g') {
        const keyMap: Record<string, string> = {
          d: 'dashboard',
          a: 'assets',
          l: 'allocation',
          b: 'booking',
          m: 'maintenance',
          u: 'audit',
          r: 'reports',
          o: 'logs',
          t: 'departments',
          e: 'employees',
          n: 'administration',
          s: 'settings'
        };
        const targetView = keyMap[e.key.toLowerCase()];
        if (targetView) {
          e.preventDefault();
          setActiveItem(targetView);
        }
        lastKey = '';
      } else if (e.key.toLowerCase() === 'g') {
        lastKey = 'g';
        // Clear sequence after 1s
        setTimeout(() => {
          lastKey = '';
        }, 1000);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Listen to Firestore real-time updates
  useEffect(() => {
    const unsubAssets = subscribeAssets(setAssets);
    const unsubBookings = subscribeBookings(setBookings);
    const unsubMaintenance = subscribeMaintenance(setTickets);
    const unsubAudits = subscribeAudits(setAudits);
    const unsubDiscrepancies = subscribeDiscrepancies(setDiscrepancies);
    const unsubEmployees = subscribeEmployees(setEmployees);
    const unsubDepartments = subscribeDepartments(setDepartments);
    const unsubNotifications = subscribeNotifications(setNotifications);
    const unsubLogs = subscribeLogs(setLogs);
    const unsubTransfers = subscribeTransferRequests(setTransfers);

    return () => {
      unsubAssets();
      unsubBookings();
      unsubMaintenance();
      unsubAudits();
      unsubDiscrepancies();
      unsubEmployees();
      unsubDepartments();
      unsubNotifications();
      unsubLogs();
      unsubTransfers();
    };
  }, []);

  // Sync title text
  useEffect(() => {
    document.title = `${APP_CONFIG.appName} | Enterprise Operations Center`;
  }, []);

  // Dynamic calculations for Dashboard KPIs
  const totalAssets = assets.length;
  const assetsOnline = assets.filter(a => a.status === 'Available' || a.status === 'Allocated').length;
  const activeIncidents = tickets.filter(t => t.status !== 'resolved' && t.status !== 'closed').length;
  const averageHealth = totalAssets > 0 
    ? Math.round(assets.reduce((acc, a) => acc + a.health, 0) / totalAssets) 
    : 100;

  // AI Operation Summary Engine (telemetry summaries)
  const getAISummary = () => {
    const underutilized = assets.filter(a => a.utilizationScore < 30 && a.status === 'Available');
    const maintenanceRisk = assets.filter(a => a.health < 60 && a.status !== 'Maintenance');
    const openDiscrepancies = discrepancies.filter(d => d.status === 'Open');
    
    return {
      underutilizedCount: underutilized.length,
      maintenanceRiskCount: maintenanceRisk.length,
      discrepancyCount: openDiscrepancies.length,
      recommendations: [
        underutilized.length > 0 ? `Reallocate ${underutilized.length} idle assets (e.g. ${underutilized[0]?.name}) to optimize capital expenditure.` : null,
        maintenanceRisk.length > 0 ? `Schedule preventive service for "${maintenanceRisk[0]?.name}" (Health: ${maintenanceRisk[0]?.health}%) immediately.` : null,
        openDiscrepancies.length > 0 ? `${openDiscrepancies.length} active audit issues are pending signature or verification.` : null,
      ].filter(Boolean) as string[]
    };
  };

  const aiInsights = getAISummary();

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empName || !empEmail) return;
    await addEmployee({
      name: empName,
      email: empEmail,
      department: empDept,
      role: empRole,
      status: 'Active',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${empName}`
    });
    setEmpName('');
    setEmpEmail('');
    setShowAddEmpModal(false);
  };

  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptName || !deptManager) return;
    await addDepartment({
      name: deptName,
      manager: deptManager,
      budget: Number(deptBudget)
    });
    setDeptName('');
    setDeptManager('');
    setDeptBudget(100000);
    setShowAddDeptModal(false);
  };

  // Render contents of each tab
  const renderContent = () => {
    switch (activeItem) {
      case 'dashboard': 
        const totalCostSum = assets.reduce((acc, a) => acc + (a.cost || 0), 0);
        const availCount = assets.filter(a => a.status === 'Available').length;
        const allocCount = assets.filter(a => a.status === 'Allocated').length;
        const maintCount = tickets.filter(t => t.status !== 'resolved' && t.status !== 'closed').length;
        const activeBookingsCount = bookings.filter(b => b.date === '2026-07-12').length;
        const pendingTransfersCount = transfers.filter(t => t.status === 'Pending Approval').length;

        // Health Gauge calculations
        const radiusGauge = 50;
        const circGauge = 2 * Math.PI * radiusGauge;
        const offsetGauge = circGauge - (89 / 100) * circGauge;

        return (
          <div className="p-8 space-y-8 animate-in fade-in duration-500 text-left">
            {/* Dashboard Hero Section */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white dark:bg-slate-900 border border-border dark:border-slate-800 rounded-[28px] p-8 shadow-sm">
              <div>
                <span className="px-2.5 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-wider rounded-lg">Operational Command</span>
                <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white mt-2">Good Morning, Meeket</h1>
                <p className="text-muted-foreground text-sm mt-1 leading-relaxed">
                  Welcome back. Here's today's operational overview of your enterprise assets and resources.
                </p>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <button onClick={() => setActiveItem('assets')} className="px-4 py-2.5 bg-primary hover:bg-[#62405B] text-white rounded-xl text-xs font-bold uppercase transition-all shadow-md">
                  Register Asset
                </button>
                <button onClick={() => setActiveItem('booking')} className="px-4 py-2.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase transition-all">
                  Book Resource
                </button>
                <button onClick={() => { setActiveItem('maintenance'); }} className="px-4 py-2.5 border border-border dark:border-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold uppercase transition-all">
                  Raise Maintenance
                </button>
                <button onClick={() => setActiveItem('audit')} className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold uppercase transition-all">
                  Create Audit
                </button>
              </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-5">
              <KPICard title="Assets Available" value={availCount} trend={+8} icon={Package} subtitle="Ready to deploy" color="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20" sparklinePoints="0 15, 10 10, 20 22, 30 5, 40 18, 50 10, 60 12, 70 4, 80 15, 90 2" />
              <KPICard title="Assets Allocated" value={allocCount} trend={+14} icon={Users} subtitle="Active handovers" color="text-blue-600 bg-blue-50 dark:bg-blue-950/20" sparklinePoints="0 20, 10 15, 20 18, 30 12, 40 8, 50 14, 60 10, 70 8, 80 5, 90 2" />
              <KPICard title="Maintenance Today" value={maintCount} trend={-3} icon={Settings} subtitle="Active tickets" color="text-orange-600 bg-orange-50 dark:bg-orange-950/20" sparklinePoints="0 5, 10 8, 20 2, 30 15, 40 12, 50 20, 60 14, 70 18, 80 22, 90 19" />
              <KPICard title="Active Bookings" value={activeBookingsCount} trend={+12} icon={Calendar} subtitle="For today" color="text-indigo-600 bg-indigo-50 dark:bg-indigo-950/20" sparklinePoints="0 18, 10 20, 20 15, 30 19, 40 10, 50 12, 60 5, 70 10, 80 4, 90 6" />
              <KPICard title="Upcoming Returns" value={3} trend={0} icon={History} subtitle="In next 48h" color="text-purple-600 bg-purple-50 dark:bg-purple-950/20" sparklinePoints="0 10, 10 12, 20 8, 30 14, 40 10, 50 12, 60 10, 70 14, 80 10, 90 12" />
              <KPICard title="Pending Transfers" value={pendingTransfersCount} trend={+2} icon={Layers} subtitle="Awaiting approvals" color="text-amber-600 bg-amber-50 dark:bg-amber-950/20" sparklinePoints="0 2, 10 5, 20 4, 30 12, 40 10, 50 18, 60 15, 70 20, 80 18, 90 22" />
            </div>

            {/* Health Score Circular Gauge & Executive Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Circular Gauge Card */}
              <div className="bg-white dark:bg-slate-900 border border-border dark:border-slate-800 rounded-[32px] p-8 shadow-sm flex flex-col justify-between items-center text-center">
                <div className="text-left w-full">
                  <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-800 dark:text-slate-200">Organization Health Score</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Overall operational integrity index</p>
                </div>

                <div className="relative my-6 flex items-center justify-center">
                  <svg className="w-36 h-36 transform -rotate-90">
                    <circle cx="72" cy="72" r={radiusGauge} stroke="#e2e8f0" strokeWidth="12" fill="transparent" className="dark:stroke-slate-800" />
                    <motion.circle 
                      cx="72" cy="72" r={radiusGauge} stroke="#16A34A" strokeWidth="12" fill="transparent"
                      strokeDasharray={circGauge}
                      initial={{ strokeDashoffset: circGauge }}
                      animate={{ strokeDashoffset: offsetGauge }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-4xl font-black text-slate-800 dark:text-white leading-none">89%</span>
                    <span className="text-[10px] text-green-600 font-bold uppercase tracking-wider mt-1">Healthy</span>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground font-medium leading-relaxed">
                  "Based on asset availability, maintenance backlog, overdue returns, and audit completion."
                </div>
              </div>

              {/* Executive Insights Panel */}
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-border dark:border-slate-800 rounded-[32px] p-8 shadow-sm space-y-6">
                <div>
                  <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-800 dark:text-slate-200">Executive Insights</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Automated anomalies & intelligence markers</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { text: '4 laptops have been idle for over 90 days.', type: 'warning', icon: AlertTriangle, bg: 'bg-orange-50 border-orange-100 text-orange-800 dark:bg-orange-950/10 dark:border-orange-900/30 dark:text-orange-300' },
                    { text: 'Engineering department has the highest utilization.', type: 'info', icon: BarChart3, bg: 'bg-indigo-50 border-indigo-100 text-indigo-800 dark:bg-indigo-950/10 dark:border-indigo-900/30 dark:text-indigo-300' },
                    { text: 'Maintenance requests increased by 12%.', type: 'warning', icon: Settings, bg: 'bg-red-50 border-red-100 text-red-800 dark:bg-red-950/10 dark:border-red-900/30 dark:text-red-300' },
                    { text: 'Meeting Room B is booked 96% of the time.', type: 'success', icon: CheckCircle, bg: 'bg-emerald-50 border-emerald-100 text-emerald-800 dark:bg-emerald-950/10 dark:border-emerald-900/30 dark:text-emerald-300' },
                    { text: '6 assets are overdue for return.', type: 'warning', icon: AlertCircle, bg: 'bg-amber-50 border-amber-100 text-amber-800 dark:bg-amber-950/10 dark:border-amber-900/30 dark:text-amber-300' }
                  ].map((insight, idx) => (
                    <div key={idx} className={cn("p-4 border rounded-2xl flex items-start gap-2.5 text-xs font-semibold leading-normal", insight.bg, idx === 4 ? "md:col-span-2" : "")}>
                      <insight.icon className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{insight.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick action Floating button (rendered separately at root of return layout) */}
          </div>
        );
      case 'assets': 
        return <AssetManagement />;
      case 'allocation': 
        return <AssetAllocation />;
      case 'booking': 
        return <ResourceBooking />;
      case 'maintenance': 
        return <MaintenanceWorkflow />;
      case 'audit': 
        return <AuditCompliance />;
      case 'reports': 
        return <ReportsAnalytics />;
      case 'employees':
        return (
          <div className="p-8 space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight">Employee Directory</h1>
                <p className="text-muted-foreground">Manage roles, departments and resource access allocations.</p>
              </div>
              <button 
                onClick={() => setShowAddEmpModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Plus className="w-4 h-4" /> Add Employee
              </button>
            </div>
            
            <div className="bg-white rounded-[24px] border border-border overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Employee</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Email</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Department</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Role</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {employees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 flex items-center gap-3">
                        <img src={emp.avatar} alt="" className="w-8 h-8 rounded-full border border-border" />
                        <span className="font-bold text-sm text-slate-800">{emp.name}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{emp.email}</td>
                      <td className="px-6 py-4 text-sm font-semibold">{emp.department}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{emp.role}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">{emp.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'departments':
        return (
          <div className="p-8 space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight">Departments</h1>
                <p className="text-muted-foreground">Analyze budgets, asset overheads and departmental health scores.</p>
              </div>
              <button 
                onClick={() => setShowAddDeptModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Plus className="w-4 h-4" /> Add Department
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {departments.map((dept) => (
                <div key={dept.id} className="bg-white border border-border rounded-[28px] p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-black text-xl text-slate-800">{dept.name}</h3>
                      <span className="px-2.5 py-1 bg-teal-50 text-teal-700 text-xs font-black uppercase rounded-lg">
                        Health: {dept.efficiencyScore}%
                      </span>
                    </div>
                    <div className="space-y-2 mt-4 text-xs font-bold text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Manager:</span>
                        <span className="text-slate-700">{dept.manager}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Allocated Budget:</span>
                        <span className="text-slate-700">${dept.budget.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-medium">Assets tracked:</span>
                    <span className="font-bold text-slate-800">{dept.assetCount || assets.filter(a => a.department === dept.name).length} items</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'logs':
        return (
          <div className="p-8 space-y-8 animate-in fade-in duration-500">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">Audit Trail & Logs</h1>
              <p className="text-muted-foreground font-medium">A permanent transaction log of all asset changes, maintenance tasks, and bookings.</p>
            </div>
            <div className="bg-white rounded-[32px] border border-border p-6 shadow-sm">
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {logs.map((log) => (
                  <div key={log.id} className="p-4 bg-muted/40 hover:bg-slate-50 border border-border rounded-[20px] transition-all flex items-start gap-4">
                    <div className="p-2.5 bg-white border border-border rounded-xl shrink-0">
                      <History className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <p className="font-bold text-slate-900 text-sm">{log.action}</p>
                        <span className="text-[10px] text-muted-foreground font-medium">{log.time}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{log.details}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold uppercase">By: {log.user}</span>
                        <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold uppercase">{log.category}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 'administration':
        return (
          <div className="p-8 space-y-8 animate-in fade-in duration-500 text-left">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">System Administration</h1>
              <p className="text-muted-foreground mt-1">Configure user roles, governance policies, and asset categories.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Role Matrix */}
              <div className="bg-white rounded-[32px] border border-border p-8 shadow-sm space-y-6">
                <h3 className="font-extrabold text-base text-slate-800">Role-Based Access Control (RBAC)</h3>
                <div className="space-y-4">
                  {[
                    { role: 'IT Administrator', desc: 'Full write/read, database migrations, configuration.', rules: ['Create/Delete Assets', 'Manage Budget', 'Audit Signing'] },
                    { role: 'Asset Manager', desc: 'Approve transfers, assign hardware, register new devices.', rules: ['Create Assets', 'Request Transfer', 'Trigger Maintenance'] },
                    { role: 'Service Technician', desc: 'Update maintenance Kanban, log repairs, adjust health scores.', rules: ['Update Kanban', 'Complete Repair'] },
                    { role: 'Standard Employee', desc: 'View allocated hardware, self-certify audit logs.', rules: ['View Personal Assets', 'Raise Service Request'] }
                  ].map((rule, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 border border-border rounded-2xl space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-black text-sm text-slate-800">{rule.role}</span>
                        <span className="text-[9px] font-black uppercase text-primary bg-primary/10 px-2 py-0.5 rounded-md">Policy Active</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-normal">{rule.desc}</p>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {rule.rules.map((tag, i) => (
                          <span key={i} className="text-[9px] font-bold bg-white border border-border px-2 py-0.5 rounded-full text-slate-600">{tag}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Approval Rules & Categories */}
              <div className="space-y-8">
                <div className="bg-white rounded-[32px] border border-border p-8 shadow-sm space-y-6">
                  <h3 className="font-extrabold text-base text-slate-800">Governance Approval Rules</h3>
                  <div className="space-y-4 text-xs font-semibold text-slate-600">
                    <div className="flex justify-between items-center pb-3 border-b border-border">
                      <div>
                        <p className="font-black text-slate-800 text-sm">High Value Threshold</p>
                        <p className="text-[10px] text-muted-foreground font-medium mt-0.5">Dual manager approvals required above this amount</p>
                      </div>
                      <span className="text-sm font-bold text-slate-800">$1,500</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-border">
                      <div>
                        <p className="font-black text-slate-800 text-sm">Automated Lockdown</p>
                        <p className="text-[10px] text-muted-foreground font-medium mt-0.5">Disable allocation if device health drops below</p>
                      </div>
                      <span className="text-sm font-bold text-red-600">50% Health</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-black text-slate-800 text-sm">Audit Grace Period</p>
                        <p className="text-[10px] text-muted-foreground font-medium mt-0.5">Days allowed to verify active audit discrepancies</p>
                      </div>
                      <span className="text-sm font-bold text-slate-800">7 Days</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-[32px] border border-border p-8 shadow-sm space-y-6">
                  <h3 className="font-extrabold text-base text-slate-800">Asset Categories Manager</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { cat: 'Computing', count: 120, color: 'border-l-4 border-l-[#714B67]' },
                      { cat: 'Peripherals', count: 85, color: 'border-l-4 border-l-[#875A7B]' },
                      { cat: 'Mobile Devices', count: 42, color: 'border-l-4 border-l-[#00A09D]' },
                      { cat: 'Office Furniture', count: 64, color: 'border-l-4 border-l-[#E97C2E]' },
                    ].map((c, i) => (
                      <div key={i} className={cn("p-4 bg-slate-50 border border-border rounded-2xl flex justify-between items-center", c.color)}>
                        <span className="font-black text-xs text-slate-800">{c.cat}</span>
                        <span className="text-[10px] bg-white border border-border px-2 py-0.5 rounded-full font-bold text-muted-foreground">{c.count} items</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="p-8 space-y-8 animate-in fade-in duration-500 text-left">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">Global Configuration</h1>
              <p className="text-muted-foreground mt-1">Manage system preferences, metadata configurations, and shortcuts keys.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Preferences */}
              <div className="bg-white rounded-[32px] border border-border p-8 shadow-sm space-y-6 lg:col-span-2">
                <h3 className="font-extrabold text-base text-slate-800">System Preferences</h3>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-border">
                    <div>
                      <p className="font-black text-slate-800 text-sm">Theme Mode</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Toggle light or dark interface styling options.</p>
                    </div>
                    <button 
                      onClick={() => setDarkMode(!darkMode)}
                      className={cn(
                        "w-12 h-6 rounded-full p-1 transition-all duration-300",
                        darkMode ? "bg-primary flex justify-end" : "bg-slate-300 flex justify-start"
                      )}
                    >
                      <span className="w-4 h-4 rounded-full bg-white shadow"></span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between pb-4 border-b border-border">
                    <div>
                      <p className="font-black text-slate-800 text-sm">Real-time DB Sync</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Listen to Firestore sockets for instant ledger updates.</p>
                    </div>
                    <span className="px-3 py-1 bg-green-50 text-green-700 text-[10px] font-black uppercase rounded-lg border border-green-200 shadow-sm animate-pulse">Sync Active</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-black text-slate-800 text-sm">Email Reminders</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Send alerts for overdue returns and urgent maintenance tickets.</p>
                    </div>
                    <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-primary focus:ring-primary/20 border-border" />
                  </div>
                </div>
              </div>

              {/* Keyboard Shortcuts list */}
              <div className="bg-white rounded-[32px] border border-border p-8 shadow-sm space-y-6">
                <div>
                  <h3 className="font-extrabold text-base text-slate-800">System Keyboard Navigator</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Press keys in sequence to navigate instant views</p>
                </div>
                
                <div className="space-y-3">
                  {[
                    { keys: 'Ctrl + K', label: 'Command Search' },
                    { keys: 'g then d', label: 'Dashboard' },
                    { keys: 'g then a', label: 'Asset Directory' },
                    { keys: 'g then l', label: 'Asset Allocation' },
                    { keys: 'g then b', label: 'Resource Calendar' },
                    { keys: 'g then m', label: 'Maintenance Kanban' },
                    { keys: 'g then u', label: 'Audit Compliance' },
                    { keys: 'g then r', label: 'Analytics' },
                    { keys: 'g then o', label: 'Activity Logs' },
                    { keys: 'g then t', label: 'Departments' },
                    { keys: 'g then e', label: 'Employees' },
                    { keys: 'g then n', label: 'Administration' },
                    { keys: 'g then s', label: 'Settings Panel' },
                  ].map((shortcut, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs font-bold">
                      <span className="text-slate-600">{shortcut.label}</span>
                      <kbd className="px-2 py-1 bg-slate-100 border border-border rounded-lg text-[10px] font-mono text-slate-500 shadow-sm">{shortcut.keys}</kbd>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-background font-inter selection:bg-primary selection:text-white">
      {/* Sidebar Layout */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 80 : 280 }}
        className="h-screen bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col sticky top-0 z-50 overflow-hidden shrink-0"
      >
        <div className="p-6 flex items-center justify-between mb-4">
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center gap-3"
              >
                <div className="w-9 h-9 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                  <Package className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="font-black text-xl tracking-tighter uppercase italic">{APP_CONFIG.appName}</span>
              </motion.div>
            )}
          </AnimatePresence>
          {collapsed && (
             <div className="w-9 h-9 bg-primary rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-primary/20">
               <Package className="w-5 h-5 text-primary-foreground" />
             </div>
          )}
        </div>

        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto scrollbar-hide py-2">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveItem(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl transition-all duration-300 group relative text-left",
                activeItem === item.id 
                  ? "bg-primary text-primary-foreground shadow-xl shadow-primary/25 translate-x-1" 
                  : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground hover:translate-x-1"
              )}
            >
              <item.icon className={cn("w-5 h-5 shrink-0 transition-transform duration-300", activeItem === item.id ? "scale-110" : "group-hover:scale-110")} />
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="font-bold text-sm tracking-tight"
                >
                  {item.label}
                </motion.span>
              )}
              {collapsed && (
                <div className="absolute left-full ml-6 px-3 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-50 shadow-2xl translate-x-[-10px] group-hover:translate-x-0">
                  {item.label}
                </div>
              )}
              {activeItem === item.id && (
                <motion.div layoutId="activeNav" className="absolute right-2 w-1.5 h-1.5 bg-white rounded-full shadow-sm" />
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-sidebar-border bg-[#111827] flex flex-col gap-2">
          {/* User profile & actions */}
          {!collapsed && (
            <div className="flex items-center justify-between px-2 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
              <div className="flex items-center gap-2">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alex" alt="" className="w-8 h-8 rounded-full border border-slate-700" />
                <div className="text-left">
                  <p className="text-xs font-black text-white leading-none">Alex Sterling</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">Admin</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => setDarkMode(!darkMode)} className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors" title="Toggle Theme">
                  <Sparkles className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => { if (confirm("Log out?")) window.location.reload(); }} className="p-1 hover:bg-slate-800 rounded text-red-400 hover:text-red-300 transition-colors" title="Logout">
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {collapsed && (
            <div className="flex flex-col items-center gap-2 py-1 bg-slate-900 border border-slate-800 rounded-xl">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alex" alt="" className="w-6 h-6 rounded-full" />
              <button onClick={() => setDarkMode(!darkMode)} className="p-1 text-slate-400 hover:text-white" title="Toggle Theme">
                <Sparkles className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-2xl text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all group"
          >
            {collapsed ? <ChevronRight className="w-5 h-5 mx-auto transition-transform group-hover:scale-125" /> : (
              <>
                <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                <span className="font-bold text-xs uppercase tracking-widest text-left">Collapse System</span>
              </>
            )}
          </button>
        </div>
      </motion.aside>

      {/* Main Panel */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden dark:bg-slate-950">
        {/* Top Navbar */}
        <header className="h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-border dark:border-slate-800 px-8 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-6 flex-1">
            {/* Organization Switcher & Breadcrumbs */}
            <div className="flex items-center gap-3">
              <Building2 className="w-4 h-4 text-primary shrink-0" />
              <select 
                value={activeOrg} 
                onChange={(e) => setActiveOrg(e.target.value)}
                className="bg-transparent border-0 focus:ring-0 text-slate-800 dark:text-slate-200 text-xs font-extrabold uppercase tracking-wider outline-none cursor-pointer hover:text-primary transition-colors"
              >
                <option value="Global HQ">Global HQ</option>
                <option value="North Region Ops">North Region Ops</option>
                <option value="Europe Supply Chain">Europe Supply Chain</option>
              </select>
            </div>
            
            <div className="h-4 w-px bg-border dark:bg-slate-800 hidden sm:block"></div>

            <div className="hidden sm:flex items-center gap-2 text-xs font-black uppercase tracking-wider text-muted-foreground">
               <span>{APP_CONFIG.appName}</span> 
               <ChevronRight className="w-3 h-3 text-slate-300" /> 
               <span className="text-primary italic">{activeItem}</span>
            </div>
            
            <div className="h-4 w-px bg-border dark:bg-slate-800 hidden lg:block"></div>

            <span className="hidden lg:inline text-xs font-black text-slate-500 uppercase tracking-widest">
              Sun, July 12, 2026
            </span>
          </div>

          <div className="flex items-center gap-2 lg:gap-4">
            {/* Quick Search trigger */}
            <div 
              onClick={() => setShowCommandPalette(true)}
              className="relative w-44 lg:w-60 group hidden md:block cursor-pointer shrink-0"
            >
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
              <div className="w-full bg-slate-50 dark:bg-slate-800 border border-border dark:border-slate-700 rounded-xl py-2 pl-9 pr-10 text-xs font-medium text-muted-foreground text-left flex items-center justify-between">
                <span>Search...</span>
                <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-900 border border-border dark:border-slate-800 rounded text-[9px] font-mono shadow-sm">Ctrl+K</kbd>
              </div>
            </div>

            {/* Quick Add Actions */}
            <div className="relative group">
              <button className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-[#62405B] text-white rounded-xl text-xs font-bold uppercase transition-all shadow-sm">
                <Plus className="w-3.5 h-3.5" /> Quick Add
              </button>
              <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-900 border border-border dark:border-slate-800 rounded-2xl shadow-xl py-2 invisible group-hover:visible hover:visible opacity-0 group-hover:opacity-100 hover:opacity-100 transition-all duration-200 z-50 text-left">
                <button onClick={() => { setActiveItem('assets'); }} className="w-full px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2">
                  <Package className="w-3.5 h-3.5 text-primary" /> Register Asset
                </button>
                <button onClick={() => { setActiveItem('booking'); }} className="w-full px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-indigo-500" /> Book Resource
                </button>
                <button onClick={() => { setActiveItem('maintenance'); }} className="w-full px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2">
                  <Settings className="w-3.5 h-3.5 text-orange-500" /> Raise Maintenance
                </button>
                <button onClick={() => { setActiveItem('audit'); }} className="w-full px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2">
                  <ClipboardCheck className="w-3.5 h-3.5 text-teal-500" /> Create Audit
                </button>
              </div>
            </div>

            <div className="h-6 w-px bg-border dark:bg-slate-800 mx-1"></div>

            {/* Bell trigger */}
            <button 
              onClick={() => setShowNotificationDrawer(true)}
              className="p-2 text-muted-foreground hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all relative group"
            >
              <Bell className="w-4 h-4 group-hover:rotate-12 transition-transform" />
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full border border-white shadow-sm ring-2 ring-destructive/10 animate-pulse"></span>
              )}
            </button>

            {/* AI Summary trigger */}
            <button 
              onClick={() => setShowAIInsights(true)}
              className="p-2 text-muted-foreground hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all group"
            >
              <Sparkles className="w-4 h-4 text-indigo-500 group-hover:scale-110 transition-transform" />
            </button>
            
            <div className="h-6 w-px bg-border dark:bg-slate-800 mx-1"></div>

            {/* User profile details */}
            <div className="flex items-center gap-2.5 pl-1.5">
              <div className="text-right hidden xl:block">
                <p className="text-xs font-black text-slate-800 dark:text-slate-200 leading-none">Alex Sterling</p>
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1">IT Architect</p>
              </div>
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="w-9 h-9 rounded-xl bg-accent border border-border dark:border-slate-700 shadow-sm flex items-center justify-center overflow-hidden cursor-pointer"
              >
                 <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alex" alt="User avatar" />
              </motion.div>
            </div>
          </div>
        </header>

        {/* Scrollable Work area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth bg-[#f8f9fa] dark:bg-slate-950">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeItem}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* ========================================== */}
      {/* 🛎️ NOTIFICATIONS DRAWER */}
      {/* ========================================== */}
      <AnimatePresence>
        {showNotificationDrawer && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNotificationDrawer(false)}
              className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 20 }}
              className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col p-6 border-l border-border"
            >
              <div className="flex justify-between items-center pb-4 border-b border-border">
                <div>
                  <h3 className="font-black text-xl text-slate-800">Notifications</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Real-time enterprise alerts</p>
                </div>
                <button 
                  onClick={() => setShowNotificationDrawer(false)}
                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-500"
                >
                  <Plus className="w-5 h-5 rotate-45" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 py-4 pr-1">
                {notifications.map((noti) => (
                  <div 
                    key={noti.id} 
                    onClick={async () => {
                      await markNotificationRead(noti.id);
                    }}
                    className={cn(
                      "p-4 border rounded-2xl transition-all cursor-pointer flex gap-3",
                      noti.read ? "bg-slate-50/50 border-slate-100 opacity-60" : "bg-white border-primary/20 shadow-md shadow-primary/5 hover:translate-x-1"
                    )}
                  >
                    <div className="mt-0.5">
                      {noti.type === 'warning' ? <AlertCircle className="w-4 h-4 text-orange-500" /> :
                       noti.type === 'success' ? <CheckCircle className="w-4 h-4 text-green-500" /> :
                       <Bell className="w-4 h-4 text-primary" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-800">{noti.title}</h4>
                      <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{noti.description}</p>
                      <span className="text-[9px] text-slate-400 font-bold block mt-2">{noti.time}</span>
                    </div>
                  </div>
                ))}
                {notifications.length === 0 && (
                  <div className="text-center py-16 space-y-3">
                    <Bell className="w-10 h-10 text-muted-foreground/30 mx-auto" />
                    <p className="text-sm text-muted-foreground font-bold">Clear desk! No active alerts.</p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-border flex gap-3">
                <button 
                  onClick={async () => {
                    await clearAllNotifications();
                  }}
                  className="flex-1 py-3 text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold uppercase tracking-wider"
                >
                  Clear All
                </button>
                <button 
                  onClick={() => setShowNotificationDrawer(false)}
                  className="flex-1 py-3 text-xs bg-primary text-white rounded-xl font-bold uppercase tracking-wider"
                >
                  Close Panel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================== */}
      {/* 🔍 COMMAND PALETTE (CTRL+K) */}
      {/* ========================================== */}
      <AnimatePresence>
        {showCommandPalette && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCommandPalette(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="relative w-full max-w-xl bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-border overflow-hidden flex flex-col"
            >
              <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
                <Search className="w-5 h-5 text-muted-foreground" />
                <input 
                  type="text" 
                  autoFocus
                  value={commandQuery}
                  onChange={(e) => setCommandQuery(e.target.value)}
                  placeholder="Search assets, teams, commands..." 
                  className="w-full bg-transparent text-slate-800 text-base outline-none font-medium"
                />
                <button 
                  onClick={() => setShowCommandPalette(false)}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-[10px] font-black uppercase text-muted-foreground rounded-lg"
                >
                  ESC
                </button>
              </div>

              <div className="p-3 max-h-[300px] overflow-y-auto space-y-2">
                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-wider px-3 py-1">Quick Links</p>
                {[
                  { label: 'Register Asset Profile', target: 'assets', icon: Plus },
                  { label: 'Schedule Resource Reservation', target: 'booking', icon: Calendar },
                  { label: 'Kanban Maintenance Pipeline', target: 'maintenance', icon: Settings },
                  { label: 'Audit Verification Workspace', target: 'audit', icon: ClipboardCheck },
                  { label: 'Organization Employees', target: 'employees', icon: Users },
                  { label: 'Budget Department Overviews', target: 'departments', icon: Building2 },
                ].filter(cmd => cmd.label.toLowerCase().includes(commandQuery.toLowerCase())).map((cmd, idx) => (
                  <button 
                    key={idx}
                    onClick={() => {
                      setActiveItem(cmd.target);
                      setShowCommandPalette(false);
                      setCommandQuery('');
                    }}
                    className="w-full p-3 hover:bg-primary/5 hover:text-primary rounded-xl transition-all text-left text-sm font-bold flex items-center gap-3 text-slate-700"
                  >
                    <cmd.icon className="w-4 h-4" /> {cmd.label}
                  </button>
                ))}

                {/* Filter Asset search list in Ctrl+K */}
                {assets.length > 0 && (
                  <>
                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-wider px-3 py-1 mt-2">Assets Registry Match</p>
                    {assets.filter(a => a.name.toLowerCase().includes(commandQuery.toLowerCase()) || a.tag.toLowerCase().includes(commandQuery.toLowerCase())).slice(0, 4).map((asset) => (
                      <button 
                        key={asset.id}
                        onClick={() => {
                          setActiveItem('assets');
                          setShowCommandPalette(false);
                          setCommandQuery('');
                        }}
                        className="w-full p-3 hover:bg-primary/5 hover:text-primary rounded-xl transition-all text-left text-xs font-bold flex justify-between items-center text-slate-700"
                      >
                        <span className="flex items-center gap-2">
                          <Package className="w-3.5 h-3.5" /> {asset.name}
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground">{asset.tag}</span>
                      </button>
                    ))}
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================== */}
      {/* 🔮 AI OPERATIONS SUMMARY OVERLAY */}
      {/* ========================================== */}
      <AnimatePresence>
        {showAIInsights && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAIInsights(false)}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-2xl rounded-[32px] border border-border overflow-hidden shadow-2xl p-8 space-y-6"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-violet-100 rounded-2xl"><Sparkles className="w-6 h-6 text-violet-600 animate-pulse" /></div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900">AI Operation Assistant</h3>
                    <p className="text-xs text-muted-foreground">Automated resource analytics summary</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowAIInsights(false)}
                  className="p-1 hover:bg-slate-100 rounded-full text-slate-500"
                >
                  <Plus className="w-5 h-5 rotate-45" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-2">
                <div className="p-4 bg-red-50 rounded-2xl border border-red-100 text-center">
                  <AlertTriangle className="w-6 h-6 text-red-600 mx-auto mb-2" />
                  <p className="text-[10px] text-red-600 font-bold uppercase">Maintenance Risk</p>
                  <h4 className="text-2xl font-black text-red-700 mt-1">{aiInsights.maintenanceRiskCount}</h4>
                </div>
                <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 text-center">
                  <Clock className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                  <p className="text-[10px] text-orange-600 font-bold uppercase">Underutilized</p>
                  <h4 className="text-2xl font-black text-orange-700 mt-1">{aiInsights.underutilizedCount}</h4>
                </div>
                <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 text-center">
                  <ShieldCheck className="w-6 h-6 text-indigo-600 mx-auto mb-2" />
                  <p className="text-[10px] text-indigo-600 font-bold uppercase">Audit Issues</p>
                  <h4 className="text-2xl font-black text-indigo-700 mt-1">{aiInsights.discrepancyCount}</h4>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-sm text-slate-800">Operational Anomaly & Actions Recommendation</h4>
                <div className="space-y-3">
                  {aiInsights.recommendations.map((rec, i) => (
                    <div key={i} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-start gap-3">
                      <ArrowRight className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" />
                      <p className="text-xs text-slate-600 font-medium leading-relaxed">{rec}</p>
                    </div>
                  ))}
                  {aiInsights.recommendations.length === 0 && (
                    <p className="text-xs text-muted-foreground">All systems are operational. No alerts detected.</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button 
                  onClick={() => setShowAIInsights(false)}
                  className="px-6 py-3.5 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:scale-105 active:scale-95 transition-all"
                >
                  Acknowledge Report
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================== */}
      {/* 👥 ADD EMPLOYEE MODAL */}
      {/* ========================================== */}
      <AnimatePresence>
        {showAddEmpModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowAddEmpModal(false)} />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative z-10 border border-border"
            >
              <h3 className="text-2xl font-black text-slate-900 mb-6">Add New Employee</h3>
              <form onSubmit={handleAddEmployee} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Full Name</label>
                  <input 
                    type="text" 
                    required 
                    value={empName}
                    onChange={(e) => setEmpName(e.target.value)}
                    className="w-full bg-slate-50 border border-border rounded-xl px-4 py-2.5 mt-2 outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium"
                    placeholder="E.g. Sarah Jenkins"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Email Address</label>
                  <input 
                    type="email" 
                    required 
                    value={empEmail}
                    onChange={(e) => setEmpEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-border rounded-xl px-4 py-2.5 mt-2 outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium"
                    placeholder="E.g. s.jenkins@company.com"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Department</label>
                    <select 
                      value={empDept}
                      onChange={(e) => setEmpDept(e.target.value)}
                      className="w-full bg-slate-50 border border-border rounded-xl px-3 py-2.5 mt-2 outline-none text-xs font-bold"
                    >
                      {departments.map(d => (
                        <option key={d.id} value={d.name}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Role Title</label>
                    <input 
                      type="text" 
                      required 
                      value={empRole}
                      onChange={(e) => setEmpRole(e.target.value)}
                      className="w-full bg-slate-50 border border-border rounded-xl px-4 py-2.5 mt-2 outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium"
                      placeholder="E.g. Lead Designer"
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setShowAddEmpModal(false)}
                    className="flex-1 py-3 text-xs bg-slate-100 rounded-xl font-bold uppercase"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 text-xs bg-primary text-white rounded-xl font-bold uppercase shadow-lg shadow-primary/25"
                  >
                    Add Employee
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================== */}
      {/* 🏢 ADD DEPARTMENT MODAL */}
      {/* ========================================== */}
      <AnimatePresence>
        {showAddDeptModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowAddDeptModal(false)} />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative z-10 border border-border"
            >
              <h3 className="text-2xl font-black text-slate-900 mb-6">Add New Department</h3>
              <form onSubmit={handleAddDepartment} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Department Name</label>
                  <input 
                    type="text" 
                    required 
                    value={deptName}
                    onChange={(e) => setDeptName(e.target.value)}
                    className="w-full bg-slate-50 border border-border rounded-xl px-4 py-2.5 mt-2 outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium"
                    placeholder="E.g. Logistics"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Department Manager</label>
                  <input 
                    type="text" 
                    required 
                    value={deptManager}
                    onChange={(e) => setDeptManager(e.target.value)}
                    className="w-full bg-slate-50 border border-border rounded-xl px-4 py-2.5 mt-2 outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium"
                    placeholder="E.g. James Wilson"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Annual Budget ($)</label>
                  <input 
                    type="number" 
                    required 
                    value={deptBudget}
                    onChange={(e) => setDeptBudget(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-border rounded-xl px-4 py-2.5 mt-2 outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium"
                    placeholder="E.g. 150000"
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setShowAddDeptModal(false)}
                    className="flex-1 py-3 text-xs bg-slate-100 rounded-xl font-bold uppercase"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 text-xs bg-primary text-white rounded-xl font-bold uppercase shadow-lg shadow-primary/25"
                  >
                    Add Department
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 🟢 FLOATING ACTION BUTTON (FAB) */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="relative">
          <AnimatePresence>
            {fabOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 20 }}
                className="absolute bottom-16 right-0 bg-white dark:bg-slate-900 border border-border dark:border-slate-800 rounded-2xl shadow-2xl py-3 w-52 space-y-1 flex flex-col text-left"
              >
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest px-4 pb-2 border-b border-border dark:border-slate-800">Quick Actions</p>
                <button
                  onClick={() => { setActiveItem('assets'); setFabOpen(false); }}
                  className="w-full px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2.5 transition-colors"
                >
                  <Package className="w-4 h-4 text-primary" /> Register Asset
                </button>
                <button
                  onClick={() => { setActiveItem('booking'); setFabOpen(false); }}
                  className="w-full px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2.5 transition-colors"
                >
                  <Calendar className="w-4 h-4 text-indigo-500" /> Book Resource
                </button>
                <button
                  onClick={() => { setActiveItem('allocation'); setFabOpen(false); }}
                  className="w-full px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2.5 transition-colors"
                >
                  <Layers className="w-4 h-4 text-amber-500" /> Allocate Asset
                </button>
                <button
                  onClick={() => { setActiveItem('maintenance'); setFabOpen(false); }}
                  className="w-full px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2.5 transition-colors"
                >
                  <Settings className="w-4 h-4 text-orange-500" /> Maintenance Request
                </button>
                <button
                  onClick={() => { setActiveItem('audit'); setFabOpen(false); }}
                  className="w-full px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2.5 transition-colors"
                >
                  <ClipboardCheck className="w-4 h-4 text-teal-500" /> Audit Cycle
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={() => setFabOpen(!fabOpen)}
            className="w-14 h-14 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
            title="Expand Actions"
          >
            <Plus className={cn("w-6 h-6 transition-transform duration-300", fabOpen ? "rotate-45" : "")} />
          </button>
        </div>
      </div>
    </div>
  );
}

// KPI Card Sub-Component
const KPICard = ({ title, value, trend, icon: Icon, color, subtitle }: any) => (
  <motion.div 
    whileHover={{ y: -6, scale: 1.02 }}
    className="bg-white p-7 rounded-[32px] border border-border shadow-sm hover:shadow-2xl hover:shadow-primary/5 transition-all group cursor-default flex flex-col justify-between"
  >
    <div>
      <div className="flex justify-between items-start mb-6">
        <div className={cn("p-4 rounded-[22px] shadow-lg shadow-black/5 group-hover:scale-110 transition-transform duration-500", color)}>
          <Icon className="w-7 h-7 text-white" />
        </div>
        <div className={cn(
          "text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 uppercase tracking-tighter",
          trend > 0 ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"
        )}>
          {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </div>
      </div>
      <div>
        <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em]">{title}</p>
        <h3 className="text-4xl font-black mt-2 tracking-tighter text-slate-800">{value}</h3>
      </div>
    </div>
    
    <div className="mt-6 pt-4 border-t border-border flex justify-between items-center">
       <span className="text-[10px] text-muted-foreground/60 font-bold uppercase">{subtitle}</span>
       <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
    </div>
  </motion.div>
);
