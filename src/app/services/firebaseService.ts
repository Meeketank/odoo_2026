import { 
  collection, 
  doc, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  setDoc, 
  getDocs, 
  query, 
  where,
  orderBy,
  limit,
  writeBatch
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase';

// ============================================================================
// 📊 TYPE DEFINITIONS
// ============================================================================

export type AssetStatus = 'Available' | 'Allocated' | 'Maintenance' | 'Retired' | 'Transferred';

export interface TimelineEntry {
  state: string;
  date: string;
  user: string;
  details?: string;
}

export interface Asset {
  id: string;
  name: string;
  tag: string;
  serial: string;
  category: string;
  status: AssetStatus;
  department: string;
  employee: string;
  health: number;
  image: string;
  purchaseDate: string;
  warrantyExpiry: string;
  cost: number;
  location: string;
  utilizationScore: number;
  lifecycleTimeline: TimelineEntry[];
}

export interface Booking {
  id: string;
  title: string;
  resource: string; // The asset name or room name
  resourceId: string; // Refers to Asset.id or room ID
  employee: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  duration: number; // in hours
  color: string;
}

export interface MaintenanceTicket {
  id: string;
  assetId: string;
  assetName: string;
  tag: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'pending' | 'assigned' | 'in_progress' | 'testing' | 'resolved' | 'closed';
  technician: string;
  description: string;
  cost: number;
  age: string;
  createdAt: string;
  slaHours?: number;
  riskScore?: number;
  predictedDate?: string;
}

export interface AuditCampaign {
  id: string;
  title: string;
  progress: number;
  status: 'In Progress' | 'Closing Soon' | 'Completed';
  totalItems: number;
  verifiedItems: number;
  verifiedAssetIds: string[];
  auditor?: string;
  deadline?: string;
  complianceScore?: number;
}

export interface TransferRequest {
  id: string;
  assetId: string;
  assetName: string;
  tag: string;
  fromDepartment: string;
  toDepartment: string;
  fromEmployee: string;
  toEmployee: string;
  status: 'Pending Approval' | 'Approved' | 'Rejected';
  requestedBy: string;
  requestedAt: string;
}

export interface Discrepancy {
  id: string;
  assetId: string;
  tag: string;
  assetName: string;
  issueType: 'Location Mismatch' | 'Missing Signature' | 'Retired Status Mismatch' | 'Damaged Asset';
  description: string;
  status: 'Open' | 'Resolved';
  reportedAt: string;
  reportedBy: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  role: string;
  status: 'Active' | 'On Leave' | 'Suspended';
  avatar: string;
}

export interface Department {
  id: string;
  name: string;
  manager: string;
  budget: number;
  efficiencyScore: number;
  assetCount: number;
}

export interface SystemNotification {
  id: string;
  title: string;
  description: string;
  time: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  read: boolean;
}

export interface ActivityLog {
  id: string;
  action: string;
  details: string;
  user: string;
  time: string;
  category: 'asset' | 'booking' | 'maintenance' | 'audit' | 'system';
}

// ============================================================================
// 💾 INITIAL MOCK SEED DATA (Used for Local Fallback & Firestore First Boot)
// ============================================================================

const SEED_EMPLOYEES: Employee[] = [
  { id: 'emp-1', name: 'Sarah Jenkins', email: 's.jenkins@company.com', department: 'Product Design', role: 'Lead Designer', status: 'Active', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah' },
  { id: 'emp-2', name: 'Mark Chen', email: 'm.chen@company.com', department: 'QA Testing', role: 'Automation QA', status: 'Active', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mark' },
  { id: 'emp-3', name: 'John Doe', email: 'j.doe@company.com', department: 'Operations', role: 'Operations Mgr', status: 'Active', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John' },
  { id: 'emp-4', name: 'Emma Watson', email: 'e.watson@company.com', department: 'Marketing', role: 'Campaign Lead', status: 'Active', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma' },
  { id: 'emp-5', name: 'Alex Sterling', email: 'a.sterling@company.com', department: 'IT', role: 'IT Lead Architect', status: 'Active', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex' },
  { id: 'emp-6', name: 'Sarah Miller', email: 's.miller@company.com', department: 'IT Support', role: 'Systems Tech', status: 'Active', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Miller' },
  { id: 'emp-7', name: 'James Wilson', email: 'j.wilson@company.com', department: 'Logistics', role: 'Logistics Coord', status: 'Active', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James' },
  { id: 'emp-8', name: 'Mike Ross', email: 'm.ross@company.com', department: 'QA Testing', role: 'QA Associate', status: 'Active', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike' }
];

const SEED_DEPARTMENTS: Department[] = [
  { id: 'dept-1', name: 'Product Design', manager: 'Sarah Jenkins', budget: 120000, efficiencyScore: 96, assetCount: 15 },
  { id: 'dept-2', name: 'QA Testing', manager: 'Mark Chen', budget: 85000, efficiencyScore: 92, assetCount: 12 },
  { id: 'dept-3', name: 'Operations', manager: 'John Doe', budget: 250000, efficiencyScore: 89, assetCount: 30 },
  { id: 'dept-4', name: 'Marketing', manager: 'Emma Watson', budget: 150000, efficiencyScore: 94, assetCount: 8 },
  { id: 'dept-5', name: 'IT', manager: 'Alex Sterling', budget: 350000, efficiencyScore: 98, assetCount: 45 },
  { id: 'dept-6', name: 'Logistics', manager: 'James Wilson', budget: 95000, efficiencyScore: 87, assetCount: 14 }
];

const SEED_ASSETS: Asset[] = [
  {
    id: '1',
    name: 'MacBook Pro 16" M3 Max',
    tag: 'AST-2024-001',
    serial: 'SN-MX38902KJ',
    category: 'Computing',
    status: 'Allocated',
    department: 'Product Design',
    employee: 'Sarah Jenkins',
    health: 98,
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&h=300&fit=crop',
    purchaseDate: '2024-01-12',
    warrantyExpiry: '2027-01-12',
    cost: 3499,
    location: 'B-Block, Level 4',
    utilizationScore: 89,
    lifecycleTimeline: [
      { state: 'Purchased', date: '2024-01-12', user: 'Procurement System', details: 'Cost: $3499' },
      { state: 'Available', date: '2024-01-14', user: 'Alex Sterling', details: 'OS pre-loaded, tagged' },
      { state: 'Allocated', date: '2024-02-01', user: 'Sarah Jenkins', details: 'Assigned as primary development workstation' }
    ]
  },
  {
    id: '2',
    name: 'Dell UltraSharp 32" 4K Monitor',
    tag: 'AST-2024-042',
    serial: 'SN-DELL324K8',
    category: 'Peripherals',
    status: 'Available',
    department: 'IT',
    employee: '-',
    health: 100,
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&h=300&fit=crop',
    purchaseDate: '2024-03-10',
    warrantyExpiry: '2026-03-10',
    cost: 899,
    location: 'IT Storage, Room 102',
    utilizationScore: 22,
    lifecycleTimeline: [
      { state: 'Purchased', date: '2024-03-10', user: 'Procurement System' },
      { state: 'Available', date: '2024-03-12', user: 'Alex Sterling', details: 'Placed in IT storage rack' }
    ]
  },
  {
    id: '3',
    name: 'iPad Pro 12.9" M2',
    tag: 'AST-2024-015',
    serial: 'SN-APLIPD129',
    category: 'Mobile',
    status: 'Maintenance',
    department: 'QA Testing',
    employee: 'Mark Chen',
    health: 45,
    image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&h=300&fit=crop',
    purchaseDate: '2024-01-15',
    warrantyExpiry: '2025-01-15',
    cost: 1099,
    location: 'QA Lab A',
    utilizationScore: 78,
    lifecycleTimeline: [
      { state: 'Purchased', date: '2024-01-15', user: 'Procurement System' },
      { state: 'Available', date: '2024-01-18', user: 'Alex Sterling' },
      { state: 'Allocated', date: '2024-02-05', user: 'Mark Chen', details: 'Assigned for mobile app testbed' },
      { state: 'Maintenance', date: '2026-07-10', user: 'Mark Chen', details: 'Screen flicker and heavy battery drain reported' }
    ]
  },
  {
    id: '4',
    name: 'Herman Miller Aeron Chair',
    tag: 'AST-2024-102',
    serial: 'SN-HM-AERON-882',
    category: 'Furniture',
    status: 'Allocated',
    department: 'Operations',
    employee: 'John Doe',
    health: 92,
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500&h=300&fit=crop',
    purchaseDate: '2023-11-20',
    warrantyExpiry: '2035-11-20',
    cost: 1450,
    location: 'Headquarters, Room 302',
    utilizationScore: 95,
    lifecycleTimeline: [
      { state: 'Purchased', date: '2023-11-20', user: 'Procurement System' },
      { state: 'Allocated', date: '2023-11-22', user: 'John Doe', details: 'Office seating setup' }
    ]
  },
  {
    id: '5',
    name: 'Sony A7IV Mirrorless Camera',
    tag: 'AST-2024-088',
    serial: 'SN-SONY-74892A',
    category: 'Media',
    status: 'Transferred',
    department: 'Marketing',
    employee: 'Emma Watson',
    health: 88,
    image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500&h=300&fit=crop',
    purchaseDate: '2024-04-05',
    warrantyExpiry: '2026-04-05',
    cost: 2499,
    location: 'B-Block, Level 2 (Studio)',
    utilizationScore: 64,
    lifecycleTimeline: [
      { state: 'Purchased', date: '2024-04-05', user: 'Procurement System' },
      { state: 'Available', date: '2024-04-08', user: 'Alex Sterling' },
      { state: 'Allocated', date: '2024-04-10', user: 'Emma Watson', details: 'Social media asset creation kit' },
      { state: 'Transferred', date: '2024-06-15', user: 'Alex Sterling', details: 'Transferred from Design Dept to Marketing Dept' }
    ]
  },
  {
    id: '6',
    name: 'iPhone 15 Pro Max 512GB',
    tag: 'AST-2024-009',
    serial: 'SN-APL-IPH15PM',
    category: 'Mobile',
    status: 'Available',
    department: 'IT',
    employee: '-',
    health: 95,
    image: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=500&h=300&fit=crop',
    purchaseDate: '2023-12-01',
    warrantyExpiry: '2025-12-01',
    cost: 1399,
    location: 'IT Vault, Drawer 4',
    utilizationScore: 10,
    lifecycleTimeline: [
      { state: 'Purchased', date: '2023-12-01', user: 'Procurement System' },
      { state: 'Available', date: '2023-12-03', user: 'Alex Sterling', details: 'Stored in IT Vault' }
    ]
  }
];

const SEED_BOOKINGS: Booking[] = [
  { id: 'b-1', title: 'Team Sync - HR Dept', resource: 'Conference Room 1', resourceId: 'room-conf-1', employee: 'John Doe', date: '2026-07-12', startTime: '10:00', duration: 2, color: 'bg-primary' },
  { id: 'b-2', title: 'Client Workshop', resource: 'Boardroom A', resourceId: 'room-board-a', employee: 'Emma Watson', date: '2026-07-12', startTime: '13:00', duration: 3, color: 'bg-[#00A09D]' },
  { id: 'b-3', title: 'Photography Session', resource: 'Studio X', resourceId: 'room-studio-x', employee: 'Emma Watson', date: '2026-07-12', startTime: '11:00', duration: 1.5, color: 'bg-[#E97C2E]' },
  { id: 'b-4', title: 'Hardware Audit', resource: 'Dell UltraSharp 32" 4K Monitor', resourceId: '2', employee: 'Alex Sterling', date: '2026-07-12', startTime: '15:00', duration: 2, color: 'bg-slate-800' }
];

const SEED_MAINTENANCE: MaintenanceTicket[] = [
  { id: 'M-101', assetId: '3', assetName: 'iPad Pro 12.9" M2', tag: 'AST-2024-015', priority: 'High', status: 'pending', technician: 'Unassigned', description: 'Screen flickering under heat and heavy battery drain.', cost: 180, age: '2 hours ago', createdAt: new Date().toISOString() },
  { id: 'M-102', assetId: '4', assetName: 'Herman Miller Aeron Chair', tag: 'AST-2024-102', priority: 'Medium', status: 'assigned', technician: 'Sarah Miller', description: 'Lumbar support adjustment mesh is torn.', cost: 75, age: '1 day ago', createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 'M-103', assetId: '5', assetName: 'Sony A7IV Mirrorless Camera', tag: 'AST-2024-088', priority: 'Critical', status: 'in_progress', technician: 'Alex Sterling', description: 'Sensor has visual dust spots and shutter occasionally jams.', cost: 420, age: '3 hours ago', createdAt: new Date(Date.now() - 10800000).toISOString() }
];

const SEED_AUDITS: AuditCampaign[] = [
  { id: 'audit-1', title: 'Annual IT Infrastructure Audit 2026', progress: 75, status: 'In Progress', totalItems: 1240, verifiedItems: 930, verifiedAssetIds: ['1', '3', '5'], auditor: 'Alex Sterling', deadline: '2026-08-01', complianceScore: 92 },
  { id: 'audit-2', title: 'H1 Furniture & Fixtures Verification', progress: 32, status: 'In Progress', totalItems: 850, verifiedItems: 272, verifiedAssetIds: ['4'], auditor: 'Sarah Jenkins', deadline: '2026-09-15', complianceScore: 88 },
  { id: 'audit-3', title: 'Remote Asset Self-Certification', progress: 98, status: 'Closing Soon', totalItems: 450, verifiedItems: 441, verifiedAssetIds: ['1', '2', '3', '4', '5'], auditor: 'Mark Chen', deadline: '2026-07-20', complianceScore: 97 }
];

const SEED_TRANSFERS: TransferRequest[] = [
  {
    id: 'tr-1',
    assetId: '1',
    assetName: 'MacBook Pro 16" M3 Max',
    tag: 'AST-2024-001',
    fromDepartment: 'Product Design',
    toDepartment: 'Operations',
    fromEmployee: 'Sarah Jenkins',
    toEmployee: 'John Doe',
    status: 'Pending Approval',
    requestedBy: 'Sarah Jenkins',
    requestedAt: '2026-07-12'
  }
];

const SEED_DISCREPANCIES: Discrepancy[] = [
  { id: 'disc-1', assetId: '1', tag: 'AST-2024-001', assetName: 'MacBook Pro 16" M3 Max', issueType: 'Missing Signature', description: 'Sarah Jenkins has not electronically signed the allocation ledger.', status: 'Open', reportedAt: '2 days ago', reportedBy: 'System Auditor' },
  { id: 'disc-2', assetId: '2', tag: 'AST-2024-042', assetName: 'Dell UltraSharp 32" 4K Monitor', issueType: 'Location Mismatch', description: 'Detected at Marketing Room instead of IT Storage.', status: 'Open', reportedAt: '5 hours ago', reportedBy: 'Alex Sterling' }
];

const SEED_NOTIFICATIONS: SystemNotification[] = [
  { id: 'n-1', title: 'Urgent Service Cycle Required', description: 'iPad Pro 12.9" screen repair approved.', time: '2 mins ago', type: 'warning', read: false },
  { id: 'n-2', title: 'Asset Transfer Completed', description: 'Sony A7IV transferred from Design to Marketing.', time: '1 hour ago', type: 'success', read: false },
  { id: 'n-3', title: 'New Audit Campaign', description: 'Annual IT Infrastructure Audit 2026 started.', time: '4 hours ago', type: 'info', read: true }
];

const SEED_LOGS: ActivityLog[] = [
  { id: 'log-1', action: 'Asset Registered', details: 'MacBook Pro 16" registered by Alex Sterling', user: 'Alex Sterling', time: '5 days ago', category: 'asset' },
  { id: 'log-2', action: 'Allocation Approved', details: 'Sarah Jenkins assigned to AST-2024-001', user: 'Procurement System', time: '4 days ago', category: 'asset' },
  { id: 'log-3', action: 'Maintenance Ticket Created', details: 'Ticket M-101 created for iPad Pro 12.9"', user: 'Mark Chen', time: '2 hours ago', category: 'maintenance' },
  { id: 'log-4', action: 'Room Reserved', details: 'Conference Room 1 booked for Team Sync', user: 'John Doe', time: '30 mins ago', category: 'booking' }
];

// ============================================================================
// 🎛️ REACTIVE LOCAL STORAGE REPLACEMENT
// ============================================================================

class LocalStorageCollection<T extends { id: string }> {
  private key: string;
  private listeners: Set<(data: T[]) => void> = new Set();

  constructor(key: string, initialData: T[]) {
    this.key = `assetflow_${key}`;
    if (!localStorage.getItem(this.key)) {
      localStorage.setItem(this.key, JSON.stringify(initialData));
    }
  }

  get(): T[] {
    try {
      return JSON.parse(localStorage.getItem(this.key) || '[]');
    } catch {
      return [];
    }
  }

  save(data: T[]) {
    localStorage.setItem(this.key, JSON.stringify(data));
    this.notify();
  }

  subscribe(listener: (data: T[]) => void) {
    this.listeners.add(listener);
    listener(this.get());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const data = this.get();
    this.listeners.forEach(cb => cb(data));
  }

  add(item: T) {
    const list = this.get();
    this.save([...list, item]);
  }

  update(id: string, updates: Partial<T>) {
    const list = this.get();
    const newList = list.map(item => item.id === id ? { ...item, ...updates } as T : item);
    this.save(newList);
  }

  delete(id: string) {
    const list = this.get();
    this.save(list.filter(item => item.id !== id));
  }
}

// Instantiate Local Databases
const localAssets = new LocalStorageCollection<Asset>('assets', SEED_ASSETS);
const localBookings = new LocalStorageCollection<Booking>('bookings', SEED_BOOKINGS);
const localMaintenance = new LocalStorageCollection<MaintenanceTicket>('maintenance', SEED_MAINTENANCE);
const localAudits = new LocalStorageCollection<AuditCampaign>('audits', SEED_AUDITS);
const localDiscrepancies = new LocalStorageCollection<Discrepancy>('discrepancies', SEED_DISCREPANCIES);
const localEmployees = new LocalStorageCollection<Employee>('employees', SEED_EMPLOYEES);
const localDepartments = new LocalStorageCollection<Department>('departments', SEED_DEPARTMENTS);
const localNotifications = new LocalStorageCollection<SystemNotification>('notifications', SEED_NOTIFICATIONS);
const localLogs = new LocalStorageCollection<ActivityLog>('logs', SEED_LOGS);
const localTransfers = new LocalStorageCollection<TransferRequest>('transfers', SEED_TRANSFERS);

// ============================================================================
// 🌱 FIRESTORE SEED UTILITY
// ============================================================================

export const seedFirestoreIfEmpty = async () => {
  if (!isFirebaseConfigured() || !db) return;

  try {
    const testSnap = await getDocs(query(collection(db, 'assets'), limit(1)));
    if (!testSnap.empty) {
      console.log("🔥 Firestore already has data. Skipping database seed.");
      return;
    }

    console.log("🌱 Firestore is empty. Seeding initial enterprise datasets...");
    const batch = writeBatch(db);

    // Seed Assets
    SEED_ASSETS.forEach(asset => {
      const ref = doc(db, 'assets', asset.id);
      batch.set(ref, asset);
    });

    // Seed Bookings
    SEED_BOOKINGS.forEach(b => {
      const ref = doc(db, 'bookings', b.id);
      batch.set(ref, b);
    });

    // Seed Maintenance Tickets
    SEED_MAINTENANCE.forEach(m => {
      const ref = doc(db, 'maintenance', m.id);
      batch.set(ref, m);
    });

    // Seed Audits
    SEED_AUDITS.forEach(a => {
      const ref = doc(db, 'audits', a.id);
      batch.set(ref, a);
    });

    // Seed Discrepancies
    SEED_DISCREPANCIES.forEach(d => {
      const ref = doc(db, 'discrepancies', d.id);
      batch.set(ref, d);
    });

    // Seed Employees
    SEED_EMPLOYEES.forEach(emp => {
      const ref = doc(db, 'employees', emp.id);
      batch.set(ref, emp);
    });

    // Seed Departments
    SEED_DEPARTMENTS.forEach(dept => {
      const ref = doc(db, 'departments', dept.id);
      batch.set(ref, dept);
    });

    // Seed Notifications
    SEED_NOTIFICATIONS.forEach(n => {
      const ref = doc(db, 'notifications', n.id);
      batch.set(ref, n);
    });

    // Seed Logs
    SEED_LOGS.forEach(l => {
      const ref = doc(db, 'logs', l.id);
      batch.set(ref, l);
    });

    await batch.commit();
    console.log("✨ Firestore seeded successfully!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
  }
};

// Auto seed triggers when configured
seedFirestoreIfEmpty();

// ============================================================================
// 📢 SUBSCRIPTION CHANNELS (REAL-TIME SNAPSHOTS)
// ============================================================================

export const subscribeCollection = <T extends { id: string }>(
  collectionName: string,
  localDb: LocalStorageCollection<T>,
  callback: (data: T[]) => void
) => {
  if (isFirebaseConfigured() && db) {
    return onSnapshot(collection(db, collectionName), (snap) => {
      const list: T[] = [];
      snap.forEach((docSnap) => {
        list.push({ ...docSnap.data(), id: docSnap.id } as T);
      });
      callback(list);
    }, (error) => {
      console.warn(`Firestore subscription failed for ${collectionName}, falling back to local:`, error);
      localDb.subscribe(callback);
    });
  } else {
    return localDb.subscribe(callback);
  }
};

export const subscribeAssets = (cb: (assets: Asset[]) => void) => subscribeCollection('assets', localAssets, cb);
export const subscribeBookings = (cb: (bookings: Booking[]) => void) => subscribeCollection('bookings', localBookings, cb);
export const subscribeMaintenance = (cb: (tickets: MaintenanceTicket[]) => void) => subscribeCollection('maintenance', localMaintenance, cb);
export const subscribeAudits = (cb: (audits: AuditCampaign[]) => void) => subscribeCollection('audits', localAudits, cb);
export const subscribeDiscrepancies = (cb: (disc: Discrepancy[]) => void) => subscribeCollection('discrepancies', localDiscrepancies, cb);
export const subscribeEmployees = (cb: (emp: Employee[]) => void) => subscribeCollection('employees', localEmployees, cb);
export const subscribeDepartments = (cb: (dept: Department[]) => void) => subscribeCollection('departments', localDepartments, cb);
export const subscribeNotifications = (cb: (noti: SystemNotification[]) => void) => subscribeCollection('notifications', localNotifications, cb);
export const subscribeLogs = (cb: (logs: ActivityLog[]) => void) => subscribeCollection('logs', localLogs, cb);
export const subscribeTransferRequests = (cb: (transfers: TransferRequest[]) => void) => subscribeCollection('transfers', localTransfers, cb);

// ============================================================================
// ✍️ WRITE MUTATIONS (TRANSACTIONS & WORKFLOW CHECKS)
// ============================================================================

// Helper to write to DB
const writeDocument = async (collectionName: string, docId: string, data: any, localDb: any) => {
  if (isFirebaseConfigured() && db) {
    await setDoc(doc(db, collectionName, docId), data, { merge: true });
  } else {
    localDb.update(docId, data);
  }
};

const addDocument = async (collectionName: string, data: any, localDb: any) => {
  const id = data.id || `doc-${Date.now()}`;
  const fullData = { ...data, id };
  if (isFirebaseConfigured() && db) {
    await setDoc(doc(db, collectionName, id), fullData);
  } else {
    localDb.add(fullData);
  }
  return id;
};

const deleteDocument = async (collectionName: string, docId: string, localDb: any) => {
  if (isFirebaseConfigured() && db) {
    await deleteDoc(doc(db, collectionName, docId));
  } else {
    localDb.delete(docId);
  }
};

// Global Activity logger helper
export const logActivity = async (action: string, details: string, user: string, category: ActivityLog['category']) => {
  const newLog: ActivityLog = {
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    action,
    details,
    user,
    time: 'Just now',
    category
  };
  await addDocument('logs', newLog, localLogs);

  // Send system notification
  const notiType = category === 'system' || category === 'maintenance' ? 'warning' : 'info';
  const newNotification: SystemNotification = {
    id: `n-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    title: action,
    description: details,
    time: 'Just now',
    type: notiType,
    read: false
  };
  await addDocument('notifications', newNotification, localNotifications);
};

// -- ASSET LIFECYCLE MANAGEMENT --

export const registerAsset = async (assetData: Omit<Asset, 'id' | 'status' | 'utilizationScore' | 'lifecycleTimeline'>) => {
  const id = `AST-${Date.now().toString().slice(-4)}`;
  const newAsset: Asset = {
    ...assetData,
    id,
    status: 'Available',
    utilizationScore: 0,
    lifecycleTimeline: [
      { state: 'Purchased', date: assetData.purchaseDate, user: 'System Register', details: 'Cost: $' + assetData.cost },
      { state: 'Available', date: new Date().toISOString().split('T')[0], user: 'System Register', details: 'Added to inventory' }
    ]
  };
  await addDocument('assets', newAsset, localAssets);
  await logActivity('Asset Registered', `New asset "${newAsset.name}" registered under tag ${newAsset.tag}`, 'IT Admin', 'asset');
  return id;
};

export const updateAsset = async (id: string, updates: Partial<Asset>) => {
  await writeDocument('assets', id, updates, localAssets);
  await logActivity('Asset Updated', `Asset details updated for ID ${id}`, 'System', 'asset');
};

// Allocating Asset
export const allocateAsset = async (assetId: string, employeeName: string, departmentName: string, user: string) => {
  // 1. Get current asset list
  let assetList: Asset[] = [];
  if (isFirebaseConfigured() && db) {
    const snap = await getDocs(collection(db, 'assets'));
    snap.forEach(d => assetList.push(d.data() as Asset));
  } else {
    assetList = localAssets.get();
  }

  const asset = assetList.find(a => a.id === assetId);
  if (!asset) throw new Error("Asset not found");
  if (asset.status === 'Maintenance') {
    throw new Error("Cannot allocate an asset that is currently under Maintenance.");
  }
  if (asset.status === 'Retired') {
    throw new Error("Cannot allocate a Retired asset.");
  }

  const dateStr = new Date().toISOString().split('T')[0];
  const newTimeline = [
    ...(asset.lifecycleTimeline || []),
    { state: 'Allocated', date: dateStr, user, details: `Assigned to ${employeeName} (${departmentName})` }
  ];

  const updates: Partial<Asset> = {
    status: 'Allocated',
    employee: employeeName,
    department: departmentName,
    lifecycleTimeline: newTimeline
  };

  await writeDocument('assets', assetId, updates, localAssets);
  await logActivity('Asset Allocated', `Assigned "${asset.name}" (${asset.tag}) to ${employeeName}`, user, 'asset');
};

// Releasing/Returning Asset
export const returnAsset = async (assetId: string, user: string) => {
  let assetList: Asset[] = [];
  if (isFirebaseConfigured() && db) {
    const snap = await getDocs(collection(db, 'assets'));
    snap.forEach(d => assetList.push(d.data() as Asset));
  } else {
    assetList = localAssets.get();
  }

  const asset = assetList.find(a => a.id === assetId);
  if (!asset) throw new Error("Asset not found");

  const dateStr = new Date().toISOString().split('T')[0];
  const newTimeline = [
    ...(asset.lifecycleTimeline || []),
    { state: 'Available', date: dateStr, user, details: `Returned to Inventory` }
  ];

  const updates: Partial<Asset> = {
    status: 'Available',
    employee: '-',
    department: 'Inventory',
    lifecycleTimeline: newTimeline
  };

  await writeDocument('assets', assetId, updates, localAssets);
  await logActivity('Asset Returned', `Asset "${asset.name}" (${asset.tag}) returned to Inventory`, user, 'asset');
};

// -- BOOKING MANAGER & OVERLAP VALIDATION --

export const checkBookingOverlap = async (resourceId: string, date: string, startTime: string, duration: number): Promise<boolean> => {
  let list: Booking[] = [];
  if (isFirebaseConfigured() && db) {
    const snap = await getDocs(collection(db, 'bookings'));
    snap.forEach(d => list.push(d.data() as Booking));
  } else {
    list = localBookings.get();
  }

  // Parse check start & end times
  const parseTimeToMins = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };

  const newStart = parseTimeToMins(startTime);
  const newEnd = newStart + duration * 60;

  // Filter list by resource and date
  const conflicts = list.filter(b => b.resourceId === resourceId && b.date === date);

  for (const b of conflicts) {
    const currentStart = parseTimeToMins(b.startTime);
    const currentEnd = currentStart + b.duration * 60;

    // Standard time overlap check: max(start1, start2) < min(end1, end2)
    if (Math.max(newStart, currentStart) < Math.min(newEnd, currentEnd)) {
      return true; // Overlap detected!
    }
  }

  return false;
};

export const createBooking = async (booking: Omit<Booking, 'id'>, user: string): Promise<string> => {
  // Check if resource is available (not under maintenance/retired)
  let assetList: Asset[] = [];
  if (isFirebaseConfigured() && db) {
    const snap = await getDocs(collection(db, 'assets'));
    snap.forEach(d => assetList.push(d.data() as Asset));
  } else {
    assetList = localAssets.get();
  }

  const matchingAsset = assetList.find(a => a.id === booking.resourceId);
  if (matchingAsset) {
    if (matchingAsset.status === 'Maintenance') {
      throw new Error(`The asset "${matchingAsset.name}" is in Maintenance and cannot be booked.`);
    }
    if (matchingAsset.status === 'Retired') {
      throw new Error(`The asset "${matchingAsset.name}" has been Retired.`);
    }
  }

  // 1. Verify overlap
  const isOverlapping = await checkBookingOverlap(booking.resourceId, booking.date, booking.startTime, booking.duration);
  if (isOverlapping) {
    throw new Error(`Conflict detected! The resource "${booking.resource}" is already reserved during this time slot.`);
  }

  const id = `b-${Date.now()}`;
  const completeBooking: Booking = { ...booking, id };

  await addDocument('bookings', completeBooking, localBookings);
  await logActivity('Resource Booked', `Reserved "${booking.resource}" for "${booking.title}"`, user, 'booking');
  return id;
};

export const cancelBooking = async (bookingId: string, title: string, user: string) => {
  await deleteDocument('bookings', bookingId, localBookings);
  await logActivity('Booking Cancelled', `Cancelled reservation for "${title}"`, user, 'booking');
};

export const updateBookingTime = async (bookingId: string, newStartTime: string, user: string) => {
  await writeDocument('bookings', bookingId, { startTime: newStartTime }, localBookings);
  await logActivity('Booking Rescheduled', `Moved booking reservation to start at ${newStartTime}`, user, 'booking');
};

// -- MAINTENANCE CANBAN LOGIC --

export const createMaintenanceTicket = async (ticketData: Omit<MaintenanceTicket, 'id' | 'status' | 'age' | 'createdAt'>, user: string) => {
  const ticketId = `M-${Date.now().toString().slice(-3)}`;
  const ticket: MaintenanceTicket = {
    ...ticketData,
    id: ticketId,
    status: 'pending',
    age: 'Just now',
    createdAt: new Date().toISOString()
  };

  // Create ticket in maintenance DB
  await addDocument('maintenance', ticket, localMaintenance);

  // Retrieve current asset lifecycle timeline
  let assetList: Asset[] = [];
  if (isFirebaseConfigured() && db) {
    const snap = await getDocs(collection(db, 'assets'));
    snap.forEach(d => assetList.push(d.data() as Asset));
  } else {
    assetList = localAssets.get();
  }

  const asset = assetList.find(a => a.id === ticketData.assetId);
  if (asset) {
    const dateStr = new Date().toISOString().split('T')[0];
    const newTimeline = [
      ...(asset.lifecycleTimeline || []),
      { state: 'Maintenance', date: dateStr, user, details: `Ticket ${ticketId} created: ${ticketData.description}` }
    ];

    // Lock asset status to Maintenance
    await writeDocument('assets', ticketData.assetId, { 
      status: 'Maintenance',
      lifecycleTimeline: newTimeline
    }, localAssets);
  }

  await logActivity('Maintenance Triggered', `Maintenance ticket ${ticketId} opened for ${ticketData.assetName}`, user, 'maintenance');
  return ticketId;
};

export const updateMaintenanceStatus = async (
  ticketId: string, 
  newStatus: MaintenanceTicket['status'], 
  technician: string,
  user: string
) => {
  let ticketList: MaintenanceTicket[] = [];
  if (isFirebaseConfigured() && db) {
    const snap = await getDocs(collection(db, 'maintenance'));
    snap.forEach(d => ticketList.push(d.data() as MaintenanceTicket));
  } else {
    ticketList = localMaintenance.get();
  }

  const ticket = ticketList.find(t => t.id === ticketId);
  if (!ticket) throw new Error("Ticket not found");

  const updates: Partial<MaintenanceTicket> = { status: newStatus, technician };
  await writeDocument('maintenance', ticketId, updates, localMaintenance);

  // If status is resolved or closed, we update the asset back to Available!
  if (newStatus === 'resolved' || newStatus === 'closed') {
    let assetList: Asset[] = [];
    if (isFirebaseConfigured() && db) {
      const snap = await getDocs(collection(db, 'assets'));
      snap.forEach(d => assetList.push(d.data() as Asset));
    } else {
      assetList = localAssets.get();
    }

    const asset = assetList.find(a => a.id === ticket.assetId);
    if (asset) {
      const dateStr = new Date().toISOString().split('T')[0];
      const newTimeline = [
        ...(asset.lifecycleTimeline || []),
        { state: 'Available', date: dateStr, user, details: `Maintenance ticket ${ticketId} resolved: ${ticket.description}` }
      ];

      // Update asset health slightly (simulate service resolution improvement!)
      const currentHealth = asset.health;
      const restoredHealth = Math.min(100, currentHealth + 30); // Repair boosts health by 30%

      await writeDocument('assets', ticket.assetId, {
        status: 'Available',
        health: restoredHealth,
        lifecycleTimeline: newTimeline
      }, localAssets);
    }
  }

  await logActivity('Maintenance Stage Changed', `Ticket ${ticketId} moved to ${newStatus}`, user, 'maintenance');
};

// -- COLLABORATIVE AUDIT CYCLES --

export const verifyAssetInAudit = async (campaignId: string, assetId: string, departmentMatches: boolean, signaturePresent: boolean, user: string) => {
  let auditList: AuditCampaign[] = [];
  if (isFirebaseConfigured() && db) {
    const snap = await getDocs(collection(db, 'audits'));
    snap.forEach(d => auditList.push(d.data() as AuditCampaign));
  } else {
    auditList = localAudits.get();
  }

  const campaign = auditList.find(c => c.id === campaignId);
  if (!campaign) throw new Error("Campaign not found");

  // Check if already verified
  if (campaign.verifiedAssetIds.includes(assetId)) {
    return; // Already verified
  }

  const updatedAssetIds = [...campaign.verifiedAssetIds, assetId];
  const verifiedCount = updatedAssetIds.length;
  const progressPercent = Math.round((verifiedCount / campaign.totalItems) * 100);

  const updates: Partial<AuditCampaign> = {
    verifiedAssetIds: updatedAssetIds,
    verifiedItems: verifiedCount,
    progress: progressPercent,
    status: progressPercent === 100 ? 'Completed' : campaign.status
  };

  await writeDocument('audits', campaignId, updates, localAudits);

  // If there are issues, create discrepancies!
  let assetList: Asset[] = [];
  if (isFirebaseConfigured() && db) {
    const snap = await getDocs(collection(db, 'assets'));
    snap.forEach(d => assetList.push(d.data() as Asset));
  } else {
    assetList = localAssets.get();
  }

  const asset = assetList.find(a => a.id === assetId);
  if (asset) {
    if (!departmentMatches) {
      const discId = `disc-${Date.now()}`;
      const locationDisc: Discrepancy = {
        id: discId,
        assetId,
        tag: asset.tag,
        assetName: asset.name,
        issueType: 'Location Mismatch',
        description: `Asset registered to ${asset.department} but found in different department under verification.`,
        status: 'Open',
        reportedAt: 'Just now',
        reportedBy: user
      };
      await addDocument('discrepancies', locationDisc, localDiscrepancies);
      await logActivity('Audit Discrepancy', `Location mismatch logged for asset ${asset.tag}`, user, 'audit');
    }

    if (!signaturePresent) {
      const discId = `disc-${Date.now()}-sig`;
      const signatureDisc: Discrepancy = {
        id: discId,
        assetId,
        tag: asset.tag,
        assetName: asset.name,
        issueType: 'Missing Signature',
        description: `Allocation document lacks employee signature verification.`,
        status: 'Open',
        reportedAt: 'Just now',
        reportedBy: user
      };
      await addDocument('discrepancies', signatureDisc, localDiscrepancies);
      await logActivity('Audit Discrepancy', `Missing signature logged for asset ${asset.tag}`, user, 'audit');
    }
  }

  await logActivity('Audit Asset Verified', `Asset verified under campaign "${campaign.title}"`, user, 'audit');
};

export const resolveDiscrepancy = async (discId: string, resolutionDetails: string, user: string) => {
  await writeDocument('discrepancies', discId, { status: 'Resolved' }, localDiscrepancies);
  await logActivity('Discrepancy Resolved', `Discrepancy ${discId} resolved: ${resolutionDetails}`, user, 'audit');
};

// -- NOTIFICATION HELPERS --

export const markNotificationRead = async (notiId: string) => {
  await writeDocument('notifications', notiId, { read: true }, localNotifications);
};

export const clearAllNotifications = async () => {
  let list: SystemNotification[] = [];
  if (isFirebaseConfigured() && db) {
    const snap = await getDocs(collection(db, 'notifications'));
    snap.forEach(d => list.push(d.data() as SystemNotification));
  } else {
    list = localNotifications.get();
  }

  for (const noti of list) {
    await deleteDocument('notifications', noti.id, localNotifications);
  }
};

// -- DIRECTORY DIRECT OPERATIONS --

export const addEmployee = async (emp: Omit<Employee, 'id'>) => {
  const id = `emp-${Date.now().toString().slice(-4)}`;
  const fullEmp = { ...emp, id };
  await addDocument('employees', fullEmp, localEmployees);
  await logActivity('Employee Joined', `Registered new employee "${emp.name}" to directory`, 'HR Admin', 'system');
};

export const addDepartment = async (dept: Omit<Department, 'id' | 'efficiencyScore' | 'assetCount'>) => {
  const id = `dept-${Date.now().toString().slice(-4)}`;
  const fullDept: Department = {
    ...dept,
    id,
    efficiencyScore: 100,
    assetCount: 0
  };
  await addDocument('departments', fullDept, localDepartments);
  await logActivity('Department Opened', `Registered new department organization "${dept.name}"`, 'HR Admin', 'system');
};

// -- TRANSFER WORKFLOWS --
export const requestTransfer = async (assetId: string, toEmployee: string, toDepartment: string, user: string) => {
  let assetList: Asset[] = [];
  if (isFirebaseConfigured() && db) {
    const snap = await getDocs(collection(db, 'assets'));
    snap.forEach(d => assetList.push(d.data() as Asset));
  } else {
    assetList = localAssets.get();
  }
  const asset = assetList.find(a => a.id === assetId);
  if (!asset) throw new Error("Asset not found");

  const id = `tr-${Date.now()}`;
  const newTransfer: TransferRequest = {
    id,
    assetId,
    assetName: asset.name,
    tag: asset.tag,
    fromDepartment: asset.department,
    toDepartment,
    fromEmployee: asset.employee,
    toEmployee,
    status: 'Pending Approval',
    requestedBy: user,
    requestedAt: new Date().toISOString().split('T')[0]
  };
  await addDocument('transfers', newTransfer, localTransfers);
  await logActivity('Transfer Requested', `Transfer requested for "${asset.name}" to ${toEmployee} (${toDepartment})`, user, 'asset');
  return id;
};

export const approveTransfer = async (transferId: string, user: string) => {
  let transferList: TransferRequest[] = [];
  if (isFirebaseConfigured() && db) {
    const snap = await getDocs(collection(db, 'transfers'));
    snap.forEach(d => transferList.push(d.data() as TransferRequest));
  } else {
    transferList = localTransfers.get();
  }
  const transfer = transferList.find(t => t.id === transferId);
  if (!transfer) throw new Error("Transfer request not found");

  await writeDocument('transfers', transferId, { status: 'Approved' }, localTransfers);

  let assetList: Asset[] = [];
  if (isFirebaseConfigured() && db) {
    const snap = await getDocs(collection(db, 'assets'));
    snap.forEach(d => assetList.push(d.data() as Asset));
  } else {
    assetList = localAssets.get();
  }
  const asset = assetList.find(a => a.id === transfer.assetId);
  if (asset) {
    const dateStr = new Date().toISOString().split('T')[0];
    const newTimeline = [
      ...(asset.lifecycleTimeline || []),
      { state: 'Transferred', date: dateStr, user, details: `Transferred from ${transfer.fromDepartment} to ${transfer.toDepartment}` }
    ];
    await writeDocument('assets', asset.id, {
      status: 'Allocated',
      employee: transfer.toEmployee,
      department: transfer.toDepartment,
      lifecycleTimeline: newTimeline
    }, localAssets);
  }

  await logActivity('Transfer Approved', `Transfer approved for "${transfer.assetName}" to ${transfer.toEmployee}`, user, 'asset');
};

export const rejectTransfer = async (transferId: string, user: string) => {
  let transferList: TransferRequest[] = [];
  if (isFirebaseConfigured() && db) {
    const snap = await getDocs(collection(db, 'transfers'));
    snap.forEach(d => transferList.push(d.data() as TransferRequest));
  } else {
    transferList = localTransfers.get();
  }
  const transfer = transferList.find(t => t.id === transferId);
  if (!transfer) throw new Error("Transfer request not found");

  await writeDocument('transfers', transferId, { status: 'Rejected' }, localTransfers);
  await logActivity('Transfer Rejected', `Transfer rejected for "${transfer.assetName}"`, user, 'asset');
};

// -- AUDIT LIFECYCLE --
export const createAuditCampaign = async (title: string, totalItems: number, auditor: string, deadline: string, user: string) => {
  const id = `audit-${Date.now()}`;
  const newAudit: AuditCampaign = {
    id,
    title,
    progress: 0,
    status: 'In Progress',
    totalItems,
    verifiedItems: 0,
    verifiedAssetIds: [],
    auditor,
    deadline,
    complianceScore: 100
  };
  await addDocument('audits', newAudit, localAudits);
  await logActivity('Audit Created', `New audit campaign "${title}" created. Target deadline: ${deadline}`, user, 'audit');
  return id;
};

// -- ASSET REMOVAL --
export const deleteAsset = async (assetId: string, user: string) => {
  await deleteDocument('assets', assetId, localAssets);
  await logActivity('Asset Deleted', `Asset ID ${assetId} deleted from database`, user, 'asset');
};
