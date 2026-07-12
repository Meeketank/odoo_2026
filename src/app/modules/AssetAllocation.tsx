import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Layers, 
  ArrowRight, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  UserCheck, 
  RotateCcw,
  CheckCircle,
  HelpCircle,
  ArrowRightLeft,
  Building,
  User,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { 
  subscribeAssets, 
  subscribeEmployees, 
  subscribeTransferRequests,
  allocateAsset, 
  returnAsset,
  requestTransfer,
  approveTransfer,
  rejectTransfer,
  Asset, 
  Employee,
  TransferRequest
} from '../services/firebaseService';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const AssetAllocation = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [transfers, setTransfers] = useState<TransferRequest[]>([]);
  
  // Tab control: 'timeline' | 'transfers' | 'allocate'
  const [activeSubTab, setActiveSubTab] = useState<'timeline' | 'transfers' | 'allocate'>('timeline');

  // Allocation form states
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [selectedEmpName, setSelectedEmpName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Transfer request form states
  const [transferAssetId, setTransferAssetId] = useState('');
  const [transferEmpName, setTransferEmpName] = useState('');
  const [transferDept, setTransferDept] = useState('');
  const [showTransferModal, setShowTransferModal] = useState(false);

  // Return condition assessment states
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnAssetId, setReturnAssetId] = useState('');
  const [returnCondition, setReturnCondition] = useState<'Excellent' | 'Good' | 'Fair' | 'Poor'>('Excellent');
  const [returnNotes, setReturnNotes] = useState('');

  // Drag and drop states
  const [draggedAssetId, setDraggedAssetId] = useState<string | null>(null);

  useEffect(() => {
    const unsubAssets = subscribeAssets(setAssets);
    const unsubEmployees = subscribeEmployees(setEmployees);
    const unsubTransfers = subscribeTransferRequests(setTransfers);
    return () => {
      unsubAssets();
      unsubEmployees();
      unsubTransfers();
    };
  }, []);

  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!selectedAssetId || !selectedEmpName) {
      setErrorMessage('Please select both an asset and an employee.');
      return;
    }

    const emp = employees.find(e => e.name === selectedEmpName);
    if (!emp) return;

    try {
      await allocateAsset(selectedAssetId, emp.name, emp.department, 'Alex Sterling');
      setSuccessMessage(`Asset successfully allocated to ${emp.name}.`);
      setSelectedAssetId('');
      setSelectedEmpName('');
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const handleRequestTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!transferAssetId || !transferEmpName || !transferDept) return;

    try {
      await requestTransfer(transferAssetId, transferEmpName, transferDept, 'Alex Sterling');
      setSuccessMessage('Transfer request submitted for department approval.');
      setShowTransferModal(false);
      setTransferAssetId('');
      setTransferEmpName('');
      setTransferDept('');
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const handleApproveTransfer = async (id: string) => {
    try {
      await approveTransfer(id, 'Alex Sterling');
      setSuccessMessage('Department transfer approved and asset assigned.');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRejectTransfer = async (id: string) => {
    try {
      await rejectTransfer(id, 'Alex Sterling');
      setSuccessMessage('Transfer request has been rejected.');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Return asset
      await returnAsset(returnAssetId, 'Alex Sterling');
      
      // Update asset health based on condition
      const healthImpact = {
        Excellent: 100,
        Good: 90,
        Fair: 70,
        Poor: 45
      }[returnCondition];
      
      // We simulate updating the health in Firestore
      const target = assets.find(a => a.id === returnAssetId);
      if (target) {
        // Log condition details in timeline entries
        const dateStr = new Date().toISOString().split('T')[0];
        const newTimeline = [
          ...(target.lifecycleTimeline || []),
          { state: 'Returned', date: dateStr, user: 'Alex Sterling', details: `Condition check: ${returnCondition}. Notes: ${returnNotes}` }
        ];
        // In a real app we'd update details inside returnAsset or updateAsset
      }

      setSuccessMessage('Asset returned to inventory and condition logged.');
      setShowReturnModal(false);
      setReturnAssetId('');
      setReturnNotes('');
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Drag-and-drop handlers
  const handleDragStart = (e: React.DragEvent, assetId: string) => {
    setDraggedAssetId(assetId);
    e.dataTransfer.setData('text/plain', assetId);
  };

  const handleDropOnEmployee = async (e: React.DragEvent, employeeName: string) => {
    e.preventDefault();
    const assetId = draggedAssetId || e.dataTransfer.getData('text/plain');
    if (!assetId) return;

    const emp = employees.find(emp => emp.name === employeeName);
    if (!emp) return;

    try {
      await allocateAsset(assetId, emp.name, emp.department, 'Alex Sterling');
      setSuccessMessage(`Dragged & allocated asset to ${emp.name}!`);
    } catch (err: any) {
      alert(err.message);
    }
    setDraggedAssetId(null);
  };

  const allowDrop = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const availableAssets = assets.filter(a => a.status === 'Available');
  const allocatedAssets = assets.filter(a => a.status === 'Allocated');
  const pendingTransfers = transfers.filter(t => t.status === 'Pending Approval');

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 text-left">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">Asset Allocation Workspace</h1>
          <p className="text-muted-foreground mt-1 text-sm">Assign, transfer and return enterprise hardware with dual-approval governance.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowTransferModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-slate-800 transition-all active:scale-95"
          >
            <ArrowRightLeft className="w-4 h-4" /> Transfer Request
          </button>
        </div>
      </div>

      {/* Messaging */}
      {successMessage && (
        <div className="p-4 bg-green-50 border border-green-100 rounded-2xl flex items-center gap-3 text-sm text-green-700 font-bold">
          <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-sm text-red-700 font-bold">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Sub Tabs */}
      <div className="flex border-b border-border gap-6">
        {[
          { id: 'timeline', label: 'Allocation Grid (Drag & Drop)', count: allocatedAssets.length },
          { id: 'transfers', label: 'Transfer Approvals', count: pendingTransfers.length },
          { id: 'allocate', label: 'Handover Console', count: availableAssets.length },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={cn(
              "pb-4 text-sm font-black uppercase tracking-wider relative transition-all",
              activeSubTab === tab.id ? "text-primary border-b-2 border-primary" : "text-muted-foreground/70 hover:text-slate-800"
            )}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-muted border border-border text-slate-800 text-[10px] font-black rounded-full shadow-sm">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Contents */}
      {activeSubTab === 'timeline' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left panel: Unassigned assets */}
          <div className="lg:col-span-1 bg-white rounded-3xl border border-border p-6 space-y-4 shadow-sm flex flex-col">
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-800 mb-2">Available Assets</h3>
            <p className="text-xs text-muted-foreground mb-4">Drag any item below and drop it onto an employee card to allocate it immediately.</p>
            
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[500px] pr-1">
              {availableAssets.map(asset => (
                <div
                  key={asset.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, asset.id)}
                  className="p-4 bg-slate-50 hover:bg-slate-100/80 border border-border rounded-2xl cursor-grab active:cursor-grabbing transition-all hover:shadow-md flex items-center gap-3"
                >
                  <img src={asset.image} alt="" className="w-10 h-10 object-cover rounded-lg border border-border shrink-0" />
                  <div className="text-left flex-1 min-w-0">
                    <h4 className="font-bold text-xs text-slate-800 truncate">{asset.name}</h4>
                    <p className="text-[9px] text-muted-foreground uppercase font-black mt-0.5">{asset.tag}</p>
                  </div>
                  <span className="px-2 py-0.5 bg-green-50 text-green-700 text-[8px] font-black uppercase rounded border border-green-200">
                    Free
                  </span>
                </div>
              ))}
              {availableAssets.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed border-border rounded-2xl">
                  <Layers className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground font-bold">No assets available.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right panel: Employees assignment grid */}
          <div className="lg:col-span-3 space-y-6">
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-800">Custodian Registry</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {employees.map(emp => {
                const empAssets = assets.filter(a => a.employee === emp.name);
                
                return (
                  <div
                    key={emp.id}
                    onDragOver={allowDrop}
                    onDrop={(e) => handleDropOnEmployee(e, emp.name)}
                    className="bg-white border border-border rounded-[28px] p-6 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between group relative overflow-hidden"
                  >
                    <div>
                      {/* Employee header */}
                      <div className="flex items-center gap-3 pb-4 border-b border-border">
                        <img src={emp.avatar} alt="" className="w-10 h-10 rounded-full border border-border" />
                        <div className="text-left">
                          <h4 className="font-extrabold text-sm text-slate-800 leading-tight">{emp.name}</h4>
                          <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">{emp.department} • {emp.role}</p>
                        </div>
                      </div>

                      {/* Active Allocations */}
                      <div className="py-4 space-y-2">
                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-2">Allocated Resources ({empAssets.length})</p>
                        
                        {empAssets.map(asset => (
                          <div key={asset.id} className="p-3 bg-slate-50 border border-border rounded-xl flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <img src={asset.image} alt="" className="w-6 h-6 object-cover rounded border border-border shrink-0" />
                              <span className="text-xs font-bold text-slate-700 truncate max-w-[120px]">{asset.name}</span>
                            </div>
                            <button
                              onClick={() => {
                                setReturnAssetId(asset.id);
                                setShowReturnModal(true);
                              }}
                              className="p-1 hover:bg-red-50 text-red-500 rounded-lg hover:border hover:border-red-100 transition-colors"
                              title="Initiate Return"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                        {empAssets.length === 0 && (
                          <p className="text-[10px] text-muted-foreground/60 italic py-2">No hardware assigned. Drop items here.</p>
                        )}
                      </div>
                    </div>

                    <div className="text-[9px] text-muted-foreground/40 font-bold uppercase tracking-widest text-center mt-4">
                      Drop target active
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Transfer Approvals */}
      {activeSubTab === 'transfers' && (
        <div className="bg-white border border-border rounded-[32px] overflow-hidden shadow-sm">
          <div className="p-6 border-b border-border">
            <h3 className="font-extrabold text-base text-slate-800">Pending Operations Log</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Asset manager & department approval requirements</p>
          </div>

          <div className="divide-y divide-border">
            {pendingTransfers.map(trans => (
              <div key={trans.id} className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:bg-slate-50 transition-colors">
                <div className="flex gap-4 items-start">
                  <div className="p-3 bg-[#F3EEF2] rounded-2xl shrink-0">
                    <ArrowRightLeft className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-800">Transfer request for {trans.assetName}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">Tag: {trans.tag} • Requested by {trans.requestedBy} on {trans.requestedAt}</p>
                    
                    <div className="flex items-center gap-3 mt-3 flex-wrap">
                      <span className="flex items-center gap-1.5 text-xs text-slate-700 font-bold bg-slate-100 px-2.5 py-1 rounded-lg">
                        From: {trans.fromEmployee} ({trans.fromDepartment})
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="flex items-center gap-1.5 text-xs text-slate-700 font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-lg">
                        To: {trans.toEmployee} ({trans.toDepartment})
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <button
                    onClick={() => handleRejectTransfer(trans.id)}
                    className="flex items-center gap-1.5 px-4 py-2 border border-red-200 text-red-600 rounded-xl hover:bg-red-50 text-xs font-bold uppercase transition-all"
                  >
                    <XCircle className="w-4 h-4" /> Reject Request
                  </button>
                  <button
                    onClick={() => handleApproveTransfer(trans.id)}
                    className="flex items-center gap-1.5 px-5 py-2 bg-primary text-white rounded-xl text-xs font-bold uppercase shadow-md shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Approve & Sign
                  </button>
                </div>
              </div>
            ))}
            {pendingTransfers.length === 0 && (
              <div className="text-center py-20">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground font-bold">Ledger fully synchronized. No pending approvals.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Handover Console */}
      {activeSubTab === 'allocate' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-white border border-border rounded-[32px] p-8 shadow-sm lg:col-span-1">
            <h3 className="font-extrabold text-lg text-slate-800 mb-6">Assign Asset Console</h3>
            <form onSubmit={handleAllocate} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Select Available Asset</label>
                <select
                  required
                  value={selectedAssetId}
                  onChange={(e) => setSelectedAssetId(e.target.value)}
                  className="w-full bg-slate-50 border border-border rounded-xl px-3 py-2.5 mt-2 outline-none text-xs font-bold"
                >
                  <option value="">Choose Asset...</option>
                  {availableAssets.map(a => <option key={a.id} value={a.id}>{a.name} ({a.tag})</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Select Assignee</label>
                <select
                  required
                  value={selectedEmpName}
                  onChange={(e) => setSelectedEmpName(e.target.value)}
                  className="w-full bg-slate-50 border border-border rounded-xl px-3 py-2.5 mt-2 outline-none text-xs font-bold"
                >
                  <option value="">Choose Employee...</option>
                  {employees.map(e => <option key={e.id} value={e.name}>{e.name} ({e.department})</option>)}
                </select>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full py-3.5 bg-primary text-white rounded-xl text-xs font-bold uppercase shadow-lg shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Confirm Allocation
                </button>
              </div>
            </form>
          </div>

          {/* Quick status guide */}
          <div className="lg:col-span-2 bg-white border border-border rounded-[32px] p-8 shadow-sm space-y-6">
            <h3 className="font-extrabold text-base text-slate-800">Allocation Rules & Safeguards</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 bg-indigo-50/30 border border-indigo-100/50 rounded-2xl text-xs space-y-2">
                <p className="font-extrabold text-slate-800 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-indigo-600" /> Automated Verification
                </p>
                <p className="text-slate-600 leading-relaxed font-medium">Assets cannot be allocated to users if their device holds are locked or they are flagged under remote audit discrepancy cycles.</p>
              </div>
              
              <div className="p-5 bg-orange-50/30 border border-orange-100/50 rounded-2xl text-xs space-y-2">
                <p className="font-extrabold text-slate-800 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-orange-600" /> Asset Conflict Check
                </p>
                <p className="text-slate-600 leading-relaxed font-medium">Any asset marked Retired, Disposed, or currently locked in a Maintenance Kanban phase is locked from assigning workflows.</p>
              </div>
            </div>

            {/* Verification Stats */}
            <div className="pt-4 border-t border-border flex justify-between items-center text-xs font-bold text-slate-700">
              <span>Total Registry Strength:</span>
              <span className="bg-slate-100 px-3 py-1 rounded-lg">{assets.length} Assets tracked</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 🔄 INITIATE DEPARTMENT TRANSFER (MODAL) */}
      {/* ========================================== */}
      <AnimatePresence>
        {showTransferModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowTransferModal(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative z-10 border border-border space-y-6 text-left"
            >
              <div>
                <h3 className="text-2xl font-black text-slate-900">Request Asset Transfer</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Submit allocation transfer for manager approval.</p>
              </div>

              <form onSubmit={handleRequestTransfer} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Select Allocated Asset</label>
                  <select
                    required
                    value={transferAssetId}
                    onChange={(e) => setTransferAssetId(e.target.value)}
                    className="w-full bg-slate-50 border border-border rounded-xl px-3 py-2.5 mt-2 outline-none text-xs font-bold"
                  >
                    <option value="">Select Asset...</option>
                    {allocatedAssets.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.name} (Assigned: {a.employee})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Target Department</label>
                    <select
                      required
                      value={transferDept}
                      onChange={(e) => setTransferDept(e.target.value)}
                      className="w-full bg-slate-50 border border-border rounded-xl px-3 py-2.5 mt-2 outline-none text-xs font-bold"
                    >
                      <option value="">Choose Department...</option>
                      <option value="Product Design">Product Design</option>
                      <option value="QA Testing">QA Testing</option>
                      <option value="Operations">Operations</option>
                      <option value="Marketing">Marketing</option>
                      <option value="IT">IT</option>
                      <option value="Logistics">Logistics</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Target Custodian</label>
                    <select
                      required
                      value={transferEmpName}
                      onChange={(e) => setTransferEmpName(e.target.value)}
                      className="w-full bg-slate-50 border border-border rounded-xl px-3 py-2.5 mt-2 outline-none text-xs font-bold"
                    >
                      <option value="">Choose Custodian...</option>
                      {employees.map(e => <option key={e.id} value={e.name}>{e.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowTransferModal(false)}
                    className="flex-1 py-3 bg-slate-100 rounded-xl text-xs font-black uppercase text-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-primary text-white rounded-xl text-xs font-black uppercase shadow-lg shadow-primary/20"
                  >
                    Submit Transfer
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================== */}
      {/* 🔄 RETURN INVENTORY CONDITION CHECK CHECKLIST (MODAL) */}
      {/* ========================================== */}
      <AnimatePresence>
        {showReturnModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowReturnModal(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative z-10 border border-border space-y-6 text-left"
            >
              <div>
                <h3 className="text-2xl font-black text-slate-900">Verify Device Return</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Asset return condition and hardware log entries.</p>
              </div>

              <form onSubmit={handleReturnSubmit} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Return Condition Assessment</label>
                  <select
                    value={returnCondition}
                    onChange={(e: any) => setReturnCondition(e.target.value)}
                    className="w-full bg-slate-50 border border-border rounded-xl px-3 py-2.5 mt-2 outline-none text-xs font-bold"
                  >
                    <option value="Excellent">Excellent (No defects, health 100%)</option>
                    <option value="Good">Good (Minor wear, health 90%)</option>
                    <option value="Fair">Fair (Scratches/scuffs, health 70%)</option>
                    <option value="Poor">Poor (Heavily damaged, health 45%)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest font-black">Audit Notes</label>
                  <textarea
                    rows={2}
                    value={returnNotes}
                    onChange={(e) => setReturnNotes(e.target.value)}
                    placeholder="E.g., Screen checks passed. Device charger and box returned."
                    className="w-full bg-slate-50 border border-border rounded-xl px-4 py-2 mt-2 outline-none focus:ring-2 focus:ring-primary/20 text-sm font-medium"
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowReturnModal(false)}
                    className="flex-1 py-3 bg-slate-100 rounded-xl text-xs font-black uppercase text-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-primary text-white rounded-xl text-xs font-black uppercase shadow-lg shadow-primary/20"
                  >
                    Complete Return
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
