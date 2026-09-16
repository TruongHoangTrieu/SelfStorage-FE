"use client"
import React, { useState } from 'react';
import { 
  Users, BarChart3, Settings, Shield, 
  Map, Calendar, ClipboardCheck, AlertTriangle, 
  Wallet, Key, Database, ChevronDown, Check,
  Search, ArrowUpRight, ArrowDownRight, Clock,
  FileText, Activity, Lock
} from 'lucide-react';

type Role = 'STAFF' | 'MANAGER' | 'OPS' | 'ADMIN';

export default function AdminPortal() {
  const [role, setRole] = useState<Role>('MANAGER');
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  const getSidebarLinks = () => {
    switch(role) {
      case 'STAFF':
        return [
          { label: 'Daily Operations', icon: Calendar },
          { label: 'Unit Handovers', icon: Key },
          { label: 'Support Tickets', icon: AlertTriangle },
        ];
      case 'MANAGER':
        return [
          { label: 'Facility Overview', icon: BarChart3 },
          { label: 'Unit Allocation', icon: Map },
          { label: 'Customers', icon: Users },
          { label: 'Overdue Accounts', icon: Wallet },
        ];
      case 'OPS':
        return [
          { label: 'System Analytics', icon: Activity },
          { label: 'Facilities', icon: Database },
          { label: 'Policy & Pricing', icon: Settings },
          { label: 'Financial Reports', icon: FileText },
        ];
      case 'ADMIN':
        return [
          { label: 'Access Control', icon: Shield },
          { label: 'Audit Logs', icon: ClipboardCheck },
          { label: 'System Health', icon: Database },
        ];
    }
  };

  const getRoleName = (r: Role) => {
    return {
      'STAFF': 'Facility Staff',
      'MANAGER': 'Facility Manager',
      'OPS': 'Business Operations',
      'ADMIN': 'System Administrator'
    }[r];
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Top Navbar */}
      <header className="h-16 bg-slate-950 flex items-center justify-between px-6 z-20">
        <div className="flex items-center text-white">
          <div className="w-8 h-8 bg-[#7E22CE] rounded flex items-center justify-center mr-3">
            <Lock className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">SelfStorage <span className="font-normal text-slate-400">Internal</span></span>
        </div>

        {/* Role Switcher */}
        <div className="relative">
          <button 
            onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
            className="flex items-center px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors border border-slate-700 text-sm font-bold"
          >
            <Shield className="w-4 h-4 mr-2 text-[#7E22CE]" />
            Viewing as: {getRoleName(role)}
            <ChevronDown className="w-4 h-4 ml-3 text-slate-400" />
          </button>
          
          {isRoleDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Switch Role</p>
              </div>
              {(['STAFF', 'MANAGER', 'OPS', 'ADMIN'] as Role[]).map(r => (
                <button 
                  key={r}
                  onClick={() => { setRole(r); setIsRoleDropdownOpen(false); }}
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center justify-between transition-colors border-b border-slate-50 last:border-0"
                >
                  <span className={`text-sm font-bold ${role === r ? 'text-[#1e1b4b]' : 'text-slate-600'}`}>{getRoleName(r)}</span>
                  {role === r && <Check className="w-4 h-4 text-[#7E22CE]" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      <div className="flex flex-grow overflow-hidden">
        
        {/* Sidebar */}
        <aside className="w-64 bg-slate-900 flex flex-col">
          <div className="flex-grow py-6">
            <div className="px-6 mb-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Navigation</p>
            </div>
            <nav className="space-y-1 px-3">
              {getSidebarLinks().map((link, idx) => {
                const Icon = link.icon;
                const isActive = idx === 0; // Just mocking the first item as active for now
                return (
                  <button 
                    key={link.label}
                    className={`w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-bold transition-all ${
                      isActive 
                        ? 'bg-[#7E22CE]/20 text-white' 
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Icon className={`w-4 h-4 mr-3 ${isActive ? 'text-[#7E22CE]' : 'text-slate-500'}`} />
                    {link.label}
                  </button>
                )
              })}
            </nav>
          </div>
          
          {/* User Profile Footer */}
          <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center">
            <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-slate-300 font-bold mr-3 border border-slate-700">
              {role.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-tight">Admin User</p>
              <p className="text-xs text-slate-500">{getRoleName(role)}</p>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-grow overflow-y-auto p-8 relative">
          {role === 'STAFF' && <FacilityStaffView />}
          {role === 'MANAGER' && <FacilityManagerView />}
          {role === 'OPS' && <BusinessOpsView />}
          {role === 'ADMIN' && <SystemAdminView />}
        </main>

      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// ROLE 1: FACILITY STAFF
// ----------------------------------------------------------------------
function FacilityStaffView() {
  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-[#1e1b4b] tracking-tight">Daily Operations</h1>
        <p className="text-slate-500 font-medium mt-1">Facility 3 • Oct 15, 2026</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Check-ins Column */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[600px]">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
            <h3 className="font-bold text-[#1e1b4b] flex items-center"><Key className="w-4 h-4 mr-2 text-amber-500" /> Check-ins Today</h3>
            <span className="bg-amber-100 text-amber-700 px-2.5 py-0.5 rounded-full text-xs font-bold">3 Pending</span>
          </div>
          <div className="p-4 flex-grow overflow-y-auto space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="p-4 border border-slate-200 rounded-xl hover:border-amber-300 transition-colors cursor-pointer bg-white">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-[#1e1b4b]">Unit #A{100+i}</span>
                  <span className="text-xs font-bold text-slate-400">10:00 AM</span>
                </div>
                <p className="text-sm text-slate-500 font-medium mb-4">Customer: John Doe</p>
                <button className="w-full py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold rounded-lg transition-colors border border-amber-200">
                  Begin Handover
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Move-outs Column */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[600px]">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
            <h3 className="font-bold text-[#1e1b4b] flex items-center"><Calendar className="w-4 h-4 mr-2 text-indigo-500" /> Move-outs Today</h3>
            <span className="bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full text-xs font-bold">1 Pending</span>
          </div>
          <div className="p-4 flex-grow overflow-y-auto space-y-3">
            <div className="p-4 border border-slate-200 rounded-xl hover:border-indigo-300 transition-colors cursor-pointer bg-white">
              <div className="flex justify-between items-start mb-2">
                <span className="font-bold text-[#1e1b4b]">Unit #C42</span>
                <span className="text-xs font-bold text-slate-400">02:00 PM</span>
              </div>
              <p className="text-sm text-slate-500 font-medium mb-4">Customer: Alice Smith</p>
              <button className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg transition-colors border border-indigo-200">
                Inspect Unit
              </button>
            </div>
          </div>
        </div>

        {/* Support Tickets Column */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[600px]">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
            <h3 className="font-bold text-[#1e1b4b] flex items-center"><AlertTriangle className="w-4 h-4 mr-2 text-red-500" /> Active Tickets</h3>
            <span className="bg-red-100 text-red-700 px-2.5 py-0.5 rounded-full text-xs font-bold">2 Open</span>
          </div>
          <div className="p-4 flex-grow overflow-y-auto space-y-3">
            <div className="p-4 border border-red-200 rounded-xl bg-red-50">
              <div className="flex justify-between items-start mb-2">
                <span className="font-bold text-red-900 text-sm">Lock jammed</span>
                <span className="text-xs font-bold text-red-500">High</span>
              </div>
              <p className="text-xs text-red-700 font-medium mb-3">Unit #B22 • Code not working</p>
              <button className="w-full py-2 bg-white text-red-700 hover:bg-red-100 text-xs font-bold rounded-lg transition-colors border border-red-200">
                Resolve Issue
              </button>
            </div>
            
            <div className="p-4 border border-slate-200 rounded-xl bg-white hover:border-slate-300 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <span className="font-bold text-[#1e1b4b] text-sm">Lost Access Card</span>
                <span className="text-xs font-bold text-slate-400">Low</span>
              </div>
              <p className="text-xs text-slate-500 font-medium mb-3">Unit #A11 • Needs replacement</p>
              <button className="w-full py-2 bg-slate-50 text-slate-600 hover:bg-slate-100 text-xs font-bold rounded-lg transition-colors border border-slate-200">
                Issue New Card
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// ROLE 2: FACILITY MANAGER
// ----------------------------------------------------------------------
const MOCK_UNITS = [
  { id: 'A-101', status: 'Occupied', tenant: 'Nguyễn Văn An', size: '5.0 m²', type: 'Medium Locker', battery: 94, lock: 'LOCK-CG-101', phone: '0987 654 321', contract: '15/06 - 15/12' },
  { id: 'A-102', status: 'Reserved', tenant: 'T. T. Hương', size: '3.0 m²', type: 'Small Locker', battery: 88, lock: 'LOCK-CG-102', phone: '0912 345 678', contract: 'Move-in Today' },
  { id: 'A-103', status: 'Occupied', tenant: 'Đỗ H. Nam', size: '4.0 m²', type: 'Standard Locker', battery: 99, lock: 'LOCK-CG-103', phone: '0903 888 999', contract: '01/01 - 31/12' },
  { id: 'A-104', status: 'Occupied', tenant: 'Lê M. Tú', size: '2.0 m²', type: 'Micro Locker', battery: 91, lock: 'LOCK-CG-104', phone: '0977 111 222', contract: '10/03 - 10/09' },
  { id: 'A-105', status: 'Available', tenant: 'None', size: '2.5 m²', type: 'Micro Locker', battery: 100, lock: 'LOCK-CG-105', phone: '--', contract: 'None' },
  { id: 'A-106', status: 'Occupied', tenant: 'Hoàng G. Bách', size: '4.5 m²', type: 'Standard Locker', battery: 76, lock: 'LOCK-CG-106', phone: '0944 555 666', contract: '01/05 - 01/11' },
  { id: 'A-107', status: 'Overlocked', tenant: 'P. Q. Bảo', size: '5.0 m²', type: 'Medium Locker', battery: 62, lock: 'LOCK-CG-107', phone: '0932 444 888', contract: 'Overdue 14 Days' },
  { id: 'A-108', status: 'Available', tenant: 'None', size: '1.8 m²', type: 'Micro Locker', battery: 98, lock: 'LOCK-CG-108', phone: '--', contract: 'None' },
  { id: 'A-109', status: 'Occupied', tenant: 'Vũ Đức Tài', size: '3.5 m²', type: 'Small Locker', battery: 88, lock: 'LOCK-CG-109', phone: '0911 222 333', contract: 'Active' },
  { id: 'A-110', status: 'Occupied', tenant: 'Lý Kim Yến', size: '3.5 m²', type: 'Small Locker', battery: 92, lock: 'LOCK-CG-110', phone: '0988 777 666', contract: 'Active' },
  { id: 'A-111', status: 'Reserved', tenant: 'App Holder', size: '4.0 m²', type: 'Standard Locker', battery: 100, lock: 'LOCK-CG-111', phone: '--', contract: 'Reserved' },
  { id: 'A-112', status: 'Occupied', tenant: 'Ngô Chí Kiên', size: '4.0 m²', type: 'Standard Locker', battery: 95, lock: 'LOCK-CG-112', phone: '0933 444 555', contract: 'Active' },
  { id: 'A-113', status: 'Occupied', tenant: 'Bùi Nhật Hào', size: '5.0 m²', type: 'Medium Locker', battery: 84, lock: 'LOCK-CG-113', phone: '0944 333 222', contract: 'Active' },
  { id: 'A-114', status: 'Occupied', tenant: 'Trịnh Mỹ Duyên', size: '5.0 m²', type: 'Medium Locker', battery: 97, lock: 'LOCK-CG-114', phone: '0955 666 777', contract: 'Active' },
  { id: 'A-115', status: 'Occupied', tenant: 'Phan Tùng', size: '2.0 m²', type: 'Micro Locker', battery: 72, lock: 'LOCK-CG-115', phone: '0966 888 999', contract: 'Active' },
  { id: 'A-116', status: 'Occupied', tenant: 'Mai Phương', size: '2.0 m²', type: 'Micro Locker', battery: 93, lock: 'LOCK-CG-116', phone: '0912 345 987', contract: 'Active' },
];

function FacilityManagerView() {
  const [selectedUnit, setSelectedUnit] = useState(MOCK_UNITS[0]);

  return (
    <div className="animate-in fade-in duration-300 max-w-[1400px] mx-auto">
      
      {/* Header & Ribbon */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black text-[#1e1b4b] tracking-tight">Facility Unit Grid</h1>
          <p className="text-slate-500 font-medium mt-1">Real-Time Telemetry • Cầu Giấy Branch, Hà Nội</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Jump to Unit, PIN..." className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-[#7E22CE]" />
          </div>
          <button className="px-4 py-2 bg-[#1e1b4b] text-white text-sm font-bold rounded-lg shadow-md hover:bg-[#7E22CE] transition-colors flex items-center">
            <Lock className="w-4 h-4 mr-2" /> Bulk Overlock
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Units</p>
          <p className="text-2xl font-black text-[#1e1b4b]">120</p>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3"><div className="bg-[#1e1b4b] h-full rounded-full w-full"></div></div>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Occupied</p>
            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">85%</span>
          </div>
          <p className="text-2xl font-black text-[#1e1b4b]">102</p>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3"><div className="bg-slate-400 h-full rounded-full w-[85%]"></div></div>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Reserved</p>
            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold">10%</span>
          </div>
          <p className="text-2xl font-black text-blue-600">12</p>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3"><div className="bg-blue-500 h-full rounded-full w-[10%]"></div></div>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Available</p>
            <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold">5%</span>
          </div>
          <p className="text-2xl font-black text-emerald-600">6</p>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3"><div className="bg-emerald-500 h-full rounded-full w-[5%]"></div></div>
        </div>
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <p className="text-xs font-bold text-red-600 uppercase tracking-wider">Overdue</p>
            <span className="bg-red-600 text-white px-2 py-0.5 rounded text-[10px] font-bold animate-pulse">ACTION</span>
          </div>
          <p className="text-2xl font-black text-red-700">2</p>
          <div className="w-full bg-red-200 h-1.5 rounded-full mt-3"><div className="bg-red-600 h-full rounded-full w-full"></div></div>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Maintenance</p>
          <p className="text-2xl font-black text-slate-400">0</p>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3"></div>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* FLOOR CANVAS (Left 8 Cols) */}
        <div className="xl:col-span-8 bg-white p-6 rounded-[1.5rem] shadow-sm border border-slate-200">
          
          <div className="flex flex-wrap items-center justify-between mb-4 gap-4">
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button className="px-4 py-1.5 rounded-md bg-white text-[#1e1b4b] font-bold text-sm shadow-sm">Zone A (1-5m²)</button>
              <button className="px-4 py-1.5 rounded-md text-slate-500 font-bold text-sm hover:text-[#1e1b4b]">Zone B (5-10m²)</button>
              <button className="px-4 py-1.5 rounded-md text-slate-500 font-bold text-sm hover:text-[#1e1b4b]">Zone C (&gt;10m²)</button>
            </div>
            
            <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
              <span className="flex items-center"><div className="w-3 h-3 bg-slate-100 border border-slate-300 rounded mr-1"></div> Occupied</span>
              <span className="flex items-center"><div className="w-3 h-3 bg-emerald-100 border border-emerald-300 rounded mr-1"></div> Available</span>
              <span className="flex items-center"><div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded mr-1"></div> Reserved</span>
              <span className="flex items-center"><div className="w-3 h-3 bg-red-100 border border-red-300 rounded mr-1"></div> Overdue</span>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 overflow-x-auto border border-slate-100">
             <div className="grid grid-cols-8 gap-2 min-w-[700px]">
                {MOCK_UNITS.map(unit => {
                  let bgColor = "bg-white border-slate-200";
                  let textColor = "text-[#1e1b4b]";
                  let subTextColor = "text-slate-500";
                  let dotColor = "bg-slate-300";

                  if (unit.status === 'Available') {
                    bgColor = "bg-emerald-50 border-emerald-200";
                    textColor = "text-emerald-700";
                    subTextColor = "text-emerald-600";
                    dotColor = "bg-emerald-500 animate-pulse";
                  } else if (unit.status === 'Reserved') {
                    bgColor = "bg-blue-50 border-blue-200";
                    textColor = "text-blue-700";
                    subTextColor = "text-blue-600";
                    dotColor = "bg-blue-500";
                  } else if (unit.status === 'Overlocked') {
                    bgColor = "bg-red-50 border-red-300";
                    textColor = "text-red-700";
                    subTextColor = "text-red-600 font-bold";
                    dotColor = "bg-red-500 animate-ping";
                  }

                  const isSelected = selectedUnit.id === unit.id;

                  return (
                    <button 
                      key={unit.id}
                      onClick={() => setSelectedUnit(unit)}
                      className={`flex flex-col justify-between p-3 rounded-lg border text-left h-24 transition-all hover:shadow-md ${bgColor} ${isSelected ? 'ring-2 ring-[#7E22CE] shadow-md' : ''}`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className={`text-xs font-black ${textColor}`}>{unit.id}</span>
                        <span className={`w-2 h-2 rounded-full ${dotColor}`}></span>
                      </div>
                      <div className="flex flex-col">
                        <span className={`text-[10px] font-bold ${subTextColor}`}>{unit.size}</span>
                        <span className={`text-xs font-bold truncate ${textColor}`}>{unit.tenant}</span>
                      </div>
                      <div className={`flex items-center justify-between text-[10px] font-bold w-full ${subTextColor}`}>
                        <span>{unit.status === 'Available' ? 'VACANT' : `${unit.battery}%`}</span>
                        <Lock className="w-3 h-3" />
                      </div>
                    </button>
                  )
                })}
             </div>
          </div>
          
          <div className="flex justify-between items-center mt-4 text-xs font-bold text-slate-400">
            <span>Zigbee Mesh Hub: <strong className="text-green-500">99.8% Signal</strong></span>
            <span>Autorefreshes every 15s</span>
          </div>

        </div>

        {/* QUICK ACTION FLYOUT (Right 4 Cols) */}
        <div className="xl:col-span-4 bg-white p-6 rounded-[1.5rem] shadow-md border border-slate-200 sticky top-24">
          
          <div className="flex items-start justify-between pb-4 border-b border-slate-100 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded bg-slate-100 text-[#1e1b4b] text-xs font-black uppercase tracking-wider">Unit {selectedUnit.id}</span>
                <span className={`text-xs font-bold uppercase ${
                  selectedUnit.status === 'Available' ? 'text-emerald-500' :
                  selectedUnit.status === 'Overlocked' ? 'text-red-500' :
                  selectedUnit.status === 'Reserved' ? 'text-blue-500' : 'text-slate-500'
                }`}>{selectedUnit.status}</span>
              </div>
              <h2 className="text-xl font-black text-[#1e1b4b]">{selectedUnit.type} ({selectedUnit.size})</h2>
              <p className="text-xs font-medium text-slate-500">Climate Controlled • Ground Level Aisle 2</p>
            </div>
            <Lock className="w-8 h-8 text-[#1e1b4b]" />
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Current Tenant Profile</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-[#1e1b4b] text-white flex items-center justify-center font-bold mr-3">
                  {selectedUnit.tenant === 'None' ? 'NA' : selectedUnit.tenant.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-[#1e1b4b] text-sm">{selectedUnit.tenant}</p>
                  <p className="text-xs font-medium text-slate-500">{selectedUnit.phone}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lease Duration</p>
              <p className="text-xs font-bold text-[#1e1b4b] mt-1">{selectedUnit.contract}</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hardware Status</p>
              <div className="flex justify-between items-center mt-1">
                <p className="text-xs font-bold text-[#1e1b4b]">{selectedUnit.lock}</p>
                <span className="text-xs font-bold text-green-500">{selectedUnit.battery}%</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 mt-6">
            <button className="w-full py-3 bg-[#1e1b4b] hover:bg-[#7E22CE] text-white text-sm font-bold rounded-xl transition-colors shadow-sm">
              {selectedUnit.status === 'Available' ? 'Assign to Reservation' : 'View Contract & Invoices'}
            </button>
            <button className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-colors">
              Mark for Inspection
            </button>
            <button className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-700 text-sm font-bold rounded-xl transition-colors border border-red-200">
              Manual Overlock
            </button>
          </div>

        </div>

      </div>

      {/* Overdue Alert Table (If applicable) */}
      <div className="mt-8 bg-white p-6 rounded-[1.5rem] shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center mr-3">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-[#1e1b4b] text-lg">Delinquent Units & Overdue Lockout</h3>
              <p className="text-xs font-bold text-slate-500">Automated lock enforcement triggered for past-due leases.</p>
            </div>
          </div>
          <span className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">2 Requiring Action</span>
        </div>
        
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Unit ID</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Primary Tenant</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Delinquency</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="hover:bg-slate-50">
                <td className="px-4 py-3 font-black text-[#1e1b4b]">A-107 <span className="text-xs text-slate-400 ml-1 font-medium">5.0 m²</span></td>
                <td className="px-4 py-3 font-bold text-[#1e1b4b]">P. Q. Bảo</td>
                <td className="px-4 py-3"><span className="bg-red-100 text-red-700 px-2 py-1 rounded-md text-xs font-bold">14 Days Late</span></td>
                <td className="px-4 py-3 text-right">
                  <button className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors mr-2">Send SMS</button>
                  <button className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm">Clearance Workflow</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
}

// ----------------------------------------------------------------------
// ROLE 3: BUSINESS OPERATIONS
// ----------------------------------------------------------------------
function BusinessOpsView() {
  return (
    <div className="animate-in fade-in duration-300 max-w-[1400px] mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-xs uppercase tracking-wider text-white bg-[#7E22CE] px-2 py-0.5 rounded">HQ Operations Control</span>
            <span className="text-xs text-slate-500 font-bold flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 inline-block"></span>
              Sync Active • Realtime Vault Policy Engine
            </span>
          </div>
          <h1 className="text-3xl font-black text-[#1e1b4b] tracking-tight">Pricing & Business Rules</h1>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-lg transition-colors shadow-sm">
            Bulk Dynamic Surge
          </button>
          <button className="px-4 py-2 bg-[#1e1b4b] hover:bg-[#7E22CE] text-white font-bold text-sm rounded-lg transition-colors shadow-md">
            + Add New Unit Type
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Monthly Recurring Revenue</span>
              <div className="text-2xl font-black text-[#1e1b4b] mt-1">384.5M <span className="text-sm font-normal text-slate-400">VND</span></div>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg text-[#7E22CE]"><Wallet className="w-5 h-5" /></div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold flex items-center"><ArrowUpRight className="w-3 h-3 mr-1" /> 12.4%</span>
            <span className="text-slate-400 font-medium">vs last month</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#7E22CE]"></div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Average Rate / m²</span>
              <div className="text-2xl font-black text-[#1e1b4b] mt-1">457k <span className="text-sm font-normal text-slate-400">VND</span></div>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><Map className="w-5 h-5" /></div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium">Normalized floor yield</span>
            <span className="text-blue-600 font-bold ml-auto">98.2% target</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500"></div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Outstanding Unpaid</span>
              <div className="text-2xl font-black text-red-600 mt-1">9.0M <span className="text-sm font-normal text-red-400">VND</span></div>
            </div>
            <div className="p-2 bg-red-100 rounded-lg text-red-600"><AlertTriangle className="w-5 h-5" /></div>
          </div>
          <div className="flex items-center justify-between text-xs mt-2">
            <div className="flex items-center gap-1 font-bold text-red-600">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping"></span>
              2 Overdue
            </div>
            <span className="text-slate-400 font-medium">Action required</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-500"></div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Paying Leases</span>
              <div className="text-2xl font-black text-[#1e1b4b] mt-1">102 <span className="text-sm font-normal text-slate-400">/ 120</span></div>
            </div>
            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600"><Key className="w-5 h-5" /></div>
          </div>
          <div className="flex flex-col gap-1 text-xs mt-1">
            <div className="flex justify-between font-bold">
              <span className="text-emerald-600">85% Occupancy</span>
              <span className="text-slate-400">18 Avail</span>
            </div>
            <div className="w-full h-1 bg-slate-100 rounded-full"><div className="h-full bg-emerald-500 rounded-full w-[85%]"></div></div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500"></div>
        </div>
      </div>

      {/* Main Workspace Split */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Left Column */}
        <div className="xl:col-span-8 flex flex-col gap-6">
          
          {/* Unit Tier & Rate Matrix */}
          <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <Database className="w-6 h-6 text-[#7E22CE]" />
                <div>
                  <h2 className="text-lg font-black text-[#1e1b4b]">Unit Tier & Rate Matrix</h2>
                  <p className="text-xs font-bold text-slate-500">Base lease figures, security thresholds & capacity</p>
                </div>
              </div>
              <div className="flex bg-slate-100 p-1 rounded-lg">
                <button className="px-3 py-1 bg-white text-[#1e1b4b] text-xs font-bold rounded-md shadow-sm">All Facilities</button>
                <button className="px-3 py-1 text-slate-500 hover:text-[#1e1b4b] text-xs font-bold rounded-md">Cầu Giấy</button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Type / Branch</th>
                    <th className="py-3 px-4">Dimension</th>
                    <th className="py-3 px-4 text-right">Base Rent / Mo</th>
                    <th className="py-3 px-4 text-center">Occupancy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  <tr className="hover:bg-slate-50">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center font-bold text-[#7E22CE] text-xs">LK-S</div>
                        <div>
                          <p className="font-bold text-[#1e1b4b]">Small Locker</p>
                          <p className="text-[10px] font-bold text-slate-400">Cầu Giấy Branch</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-bold text-[#1e1b4b]">1.50 m²</p>
                      <p className="text-[10px] font-medium text-slate-400">1.0 x 1.5 x 2.4m</p>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <p className="font-black text-[#1e1b4b]">750,000 ₫</p>
                      <p className="text-[10px] font-bold text-[#7E22CE]">500k ₫/m²</p>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-col items-center gap-1 w-24 mx-auto">
                        <div className="flex justify-between w-full text-[10px] font-bold text-slate-500">
                          <span className="text-[#1e1b4b]">36/40</span>
                          <span className="text-emerald-600">90%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full"><div className="h-full bg-emerald-500 rounded-full w-[90%]"></div></div>
                      </div>
                    </td>
                  </tr>
                  
                  <tr className="hover:bg-slate-50">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center font-bold text-[#7E22CE] text-xs">LK-M</div>
                        <div>
                          <p className="font-bold text-[#1e1b4b]">Medium Locker</p>
                          <p className="text-[10px] font-bold text-slate-400">All Facilities</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-bold text-[#1e1b4b]">5.00 m²</p>
                      <p className="text-[10px] font-medium text-slate-400">2.0 x 2.5 x 2.6m</p>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <p className="font-black text-[#1e1b4b]">2,150,000 ₫</p>
                      <p className="text-[10px] font-bold text-[#7E22CE]">430k ₫/m²</p>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-col items-center gap-1 w-24 mx-auto">
                        <div className="flex justify-between w-full text-[10px] font-bold text-slate-500">
                          <span className="text-[#1e1b4b]">42/50</span>
                          <span className="text-emerald-600">84%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full"><div className="h-full bg-emerald-500 rounded-full w-[84%]"></div></div>
                      </div>
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center font-bold text-[#7E22CE] text-xs">VT-L</div>
                        <div>
                          <p className="font-bold text-[#1e1b4b]">Climate Vault</p>
                          <p className="text-[10px] font-bold text-slate-400">Cầu Giấy Branch</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-bold text-[#1e1b4b]">12.00 m²</p>
                      <p className="text-[10px] font-medium text-slate-400">3.0 x 4.0 x 2.8m</p>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <p className="font-black text-[#1e1b4b]">4,800,000 ₫</p>
                      <p className="text-[10px] font-bold text-[#7E22CE]">400k ₫/m²</p>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-col items-center gap-1 w-24 mx-auto">
                        <div className="flex justify-between w-full text-[10px] font-bold text-slate-500">
                          <span className="text-[#1e1b4b]">18/20</span>
                          <span className="text-emerald-600">90%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full"><div className="h-full bg-emerald-500 rounded-full w-[90%]"></div></div>
                      </div>
                    </td>
                  </tr>
                  
                  <tr className="hover:bg-slate-50">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center font-bold text-[#7E22CE] text-xs">CM-X</div>
                        <div>
                          <p className="font-bold text-[#1e1b4b]">Warehouse Flex</p>
                          <p className="text-[10px] font-bold text-slate-400">Quận 7 Mega</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-bold text-[#1e1b4b]">25.00 m²</p>
                      <p className="text-[10px] font-medium text-slate-400">5.0 x 5.0 x 3.5m</p>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <p className="font-black text-[#1e1b4b]">9,500,000 ₫</p>
                      <p className="text-[10px] font-bold text-[#7E22CE]">380k ₫/m²</p>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-col items-center gap-1 w-24 mx-auto">
                        <div className="flex justify-between w-full text-[10px] font-bold text-slate-500">
                          <span className="text-[#1e1b4b]">6/10</span>
                          <span className="text-blue-600">60%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full"><div className="h-full bg-blue-500 rounded-full w-[60%]"></div></div>
                      </div>
                    </td>
                  </tr>

                </tbody>
              </table>
            </div>
          </div>

          {/* Revenue Analytics Chart */}
          <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-slate-200">
             <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-lg font-black text-[#1e1b4b]">Revenue Breakdown</h2>
                  <p className="text-xs font-bold text-slate-500">Last 6 months across all facilities</p>
                </div>
                <div className="flex gap-4 text-[10px] font-bold">
                  <span className="flex items-center"><div className="w-2 h-2 bg-[#1e1b4b] rounded-sm mr-1"></div> Base Lease</span>
                  <span className="flex items-center"><div className="w-2 h-2 bg-blue-400 rounded-sm mr-1"></div> Deposits</span>
                  <span className="flex items-center"><div className="w-2 h-2 bg-amber-400 rounded-sm mr-1"></div> Fines</span>
                </div>
             </div>

             <div className="h-48 flex items-end justify-between gap-2 border-b border-slate-100 pb-2">
               {/* Just mocking the stacked bars */}
               {[
                 { base: '40%', dep: '15%', fine: '5%', m: 'May' },
                 { base: '45%', dep: '15%', fine: '6%', m: 'Jun' },
                 { base: '50%', dep: '18%', fine: '4%', m: 'Jul' },
                 { base: '55%', dep: '18%', fine: '5%', m: 'Aug' },
                 { base: '60%', dep: '20%', fine: '4%', m: 'Sep' },
                 { base: '70%', dep: '22%', fine: '3%', m: 'Oct' },
               ].map((col, idx) => (
                 <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                   <div className="w-full max-w-[40px] flex flex-col rounded-t-md overflow-hidden hover:brightness-110 transition-all cursor-pointer">
                     <div className="bg-amber-400 w-full" style={{ height: col.fine }}></div>
                     <div className="bg-blue-400 w-full" style={{ height: col.dep }}></div>
                     <div className="bg-[#1e1b4b] w-full" style={{ height: col.base }}></div>
                   </div>
                   <span className="text-xs font-bold text-slate-400 mt-2">{col.m}</span>
                 </div>
               ))}
             </div>
          </div>

        </div>

        {/* Right Column: Enforcement Rules */}
        <div className="xl:col-span-4 flex flex-col gap-6">
          <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-[#7E22CE] flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-[#1e1b4b]">Enforcement Rules</h2>
                <p className="text-xs font-bold text-slate-500">Automated lockouts & deposits</p>
              </div>
            </div>

            <div className="space-y-5">
              
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-sm font-bold text-[#1e1b4b]">Grace Period Days</label>
                  <span className="text-[10px] font-bold text-slate-400">Before auto-overlock</span>
                </div>
                <div className="relative">
                  <input type="number" defaultValue={7} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm font-bold outline-none focus:border-[#7E22CE]" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">Days</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-sm font-bold text-[#1e1b4b]">Overdue Daily Fine</label>
                  <span className="text-[10px] font-bold text-blue-600">Compounding daily</span>
                </div>
                <div className="relative">
                  <input type="number" step="0.1" defaultValue={1.5} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm font-bold outline-none focus:border-[#7E22CE]" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">% per day</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-sm font-bold text-[#1e1b4b]">Reservation Deposit</label>
                  <span className="text-[10px] font-bold text-slate-400">Holds unit 72h</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <select className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm font-bold outline-none">
                    <option>Percentage</option>
                    <option>Flat Fee</option>
                  </select>
                  <div className="relative">
                    <input type="number" defaultValue={25} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm font-bold outline-none focus:border-[#7E22CE]" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">%</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-[#1e1b4b] block mb-1">Security Deposit Multiplier</label>
                <select className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm font-bold outline-none">
                  <option>1.0x Monthly Rent (Standard)</option>
                  <option>1.5x Monthly Rent (High-Value)</option>
                  <option>2.0x Monthly Rent (Commercial)</option>
                </select>
                <p className="text-[10px] font-medium text-slate-400 mt-1">Refunded 48h after physical checkout.</p>
              </div>

            </div>

            <button className="w-full py-3 mt-6 bg-[#1e1b4b] hover:bg-[#7E22CE] text-white text-sm font-bold rounded-xl transition-colors shadow-md">
              Save Policy Changes
            </button>
            
          </div>
        </div>

      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// ROLE 4: SYSTEM ADMIN
// ----------------------------------------------------------------------
function SystemAdminView() {
  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-[#1e1b4b] tracking-tight">Access Control</h1>
        <p className="text-slate-500 font-medium mt-1">Manage users, roles, and facility assignments.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex space-x-2">
            <button className="px-4 py-2 bg-white border border-slate-200 text-sm font-bold text-[#1e1b4b] rounded-lg shadow-sm">Internal Staff</button>
            <button className="px-4 py-2 bg-transparent text-sm font-bold text-slate-500 hover:text-[#1e1b4b] rounded-lg">Customers</button>
          </div>
          <button className="px-4 py-2 bg-[#7E22CE] text-white text-sm font-bold rounded-lg hover:bg-purple-600 transition-colors">
            + Add User
          </button>
        </div>
        
        <table className="w-full text-left">
          <thead className="bg-white border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">User</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">System Role</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Facility Access</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Last Login</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {[
              { name: 'John Smith', email: 'john@selfstorage.com', role: 'Facility Manager', access: 'Facility 3', login: '10 mins ago' },
              { name: 'Emily Davis', email: 'emily@selfstorage.com', role: 'Facility Staff', access: 'Facility 3', login: '2 hours ago' },
              { name: 'Marcus Johnson', email: 'marcus@selfstorage.com', role: 'Business Ops', access: 'Global', login: '1 day ago' },
              { name: 'System Admin', email: 'admin@selfstorage.com', role: 'System Admin', access: 'Global', login: 'Just now' },
            ].map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-50 group">
                <td className="px-6 py-4">
                  <p className="font-bold text-[#1e1b4b]">{row.name}</p>
                  <p className="text-xs text-slate-500">{row.email}</p>
                </td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold">
                    {row.role}
                  </span>
                </td>
                <td className="px-6 py-4 font-medium text-slate-500">{row.access}</td>
                <td className="px-6 py-4 text-xs font-medium text-slate-400">{row.login}</td>
                <td className="px-6 py-4 text-right">
                  <button className="text-xs font-bold text-[#7E22CE] hover:text-[#1e1b4b] transition-colors">Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Audit Log Stream */}
      <div>
        <h3 className="font-bold text-[#1e1b4b] mb-4">Live Audit Stream</h3>
        <div className="bg-slate-900 rounded-2xl p-4 font-mono text-xs text-slate-400 space-y-2 h-48 overflow-y-auto">
          <p><span className="text-green-400">[2026-09-16 19:28:11]</span> [AUTH] User admin@selfstorage.com authenticated successfully.</p>
          <p><span className="text-blue-400">[2026-09-16 19:28:15]</span> [POLICY] User marcus@selfstorage.com updated GLOBAL_LATE_FEE to 5%.</p>
          <p><span className="text-green-400">[2026-09-16 19:29:01]</span> [AUTH] User john@selfstorage.com authenticated successfully.</p>
          <p><span className="text-amber-400">[2026-09-16 19:29:45]</span> [ACCESS] User emily@selfstorage.com performed manual override on Unit A105.</p>
        </div>
      </div>
    </div>
  );
}
