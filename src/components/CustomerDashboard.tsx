"use client"
import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { 
  Box, 
  ShoppingCart, 
  HelpCircle, 
  Lock, 
  Copy, 
  Check, 
  CheckCircle2,
  DoorOpen, 
  CalendarDays, 
  Clock, 
  LogOut,
  ChevronRight,
  ChevronLeft,
  ShieldCheck
} from 'lucide-react';

const SIDEBAR_LINKS = [
  { id: 'storage', label: 'Storage Units', icon: Box },
  { id: 'checkout', label: 'Checkout & Booking', icon: ShoppingCart },
  { id: 'support', label: 'Support', icon: HelpCircle },
];

const LOGS = [
  { time: 'Today, 14:28:11', terminal: 'Perimeter Barrier Gantry 01', method: 'Optical QR Code', credential: 'Token #449-ALPHA', status: 'Authorized' },
  { time: 'Today, 14:31:05', terminal: 'Freight Elevator Core B', method: 'Keypad PIN', credential: 'PIN (••••01)', status: 'Authorized' },
  { time: 'Today, 14:34:49', terminal: 'Bay Door L2-412', method: 'Bluetooth BLE', credential: 'Device • iPhone 15 Pro', status: 'Authorized' },
  { time: 'Yesterday, 09:12:40', terminal: 'Pedestrian Turnstile A', method: 'Optical QR Code', credential: 'Token #418-KAPPA', status: 'Authorized' },
  { time: 'Oct 24, 2026 18:02', terminal: 'Bay Door L2-412', method: 'Bluetooth BLE', credential: 'Device • iPhone 15 Pro', status: 'Authorized' },
];

export default function CustomerDashboard() {
  const [activeTab, setActiveTab] = useState('storage');
  
  // Contracts and Unit Selection
  const [contracts, setContracts] = useState<any[]>([]);
  const [loadingContracts, setLoadingContracts] = useState(true);
  const [selectedUnit, setSelectedUnit] = useState<any | null>(null);
  
  // Smart Key States
  const [pin, setPin] = useState('Loading...');
  const [logs, setLogs] = useState<any[]>([]);
  const [isCopied, setIsCopied] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [unlockText, setUnlockText] = useState('Tap to Unlock Bay Door');
  const [unlockFeedback, setUnlockFeedback] = useState(false);
  
  // Self-Management States
  const [leaseDuration, setLeaseDuration] = useState('1 Mo');
  const [moveOutDate, setMoveOutDate] = useState('2026-11-30');

  // Load User's Contracts on mount
  useEffect(() => {
    async function loadContracts() {
      try {
        const data = await api.get('/contracts/my-contracts');
        // Filter only ACTIVE contracts or map over all
        setContracts(data);
      } catch (err) {
        console.error('Failed to load contracts:', err);
      } finally {
        setLoadingContracts(false);
      }
    }
    loadContracts();
  }, []);

  // When a unit is selected, fetch its PIN and Logs
  useEffect(() => {
    if (!selectedUnit) return;
    async function loadUnitDetails() {
      try {
        const { contractId, unitId } = selectedUnit;
        const codeData = await api.get(`/contracts/${contractId}/units/${unitId}/access-code`);
        setPin(codeData.accessCode || 'No PIN Issued');
        
        const logsData = await api.get(`/contracts/${contractId}/units/${unitId}/access-logs`);
        setLogs(logsData || []);
      } catch (err) {
        console.error('Failed to load unit details:', err);
        setPin('Error');
      }
    }
    loadUnitDetails();
  }, [selectedUnit]);

  const handleCopy = () => {
    navigator.clipboard.writeText(pin.replace(/\s/g, ''));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleUnlock = async () => {
    if (isUnlocking || !selectedUnit) return;
    setIsUnlocking(true);
    setUnlockText('Transmitting Token...');
    
    try {
      const { contractId, unitId } = selectedUnit;
      await api.post(`/contracts/${contractId}/units/${unitId}/access-logs`, {
        accessMethod: 'SMART_APP',
        status: 'SUCCESS',
        notes: 'Unlocked via Web Dashboard'
      });
      
      setUnlockText('Door Released (30s)');
      setUnlockFeedback(true);
      
      // Refresh logs
      const logsData = await api.get(`/contracts/${contractId}/units/${unitId}/access-logs`);
      setLogs(logsData || []);
      
    } catch (err) {
      console.error('Failed to unlock:', err);
      setUnlockText('Unlock Failed');
    }

    setTimeout(() => {
      setUnlockText('Tap to Unlock Bay Door');
      setUnlockFeedback(false);
      setIsUnlocking(false);
    }, 5000);
  };

  return (
    <section className="py-12 bg-slate-50 min-h-screen">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col lg:flex-row gap-10">
          
          {/* Sidebar Navigation */}
          <div className="w-full lg:w-1/4 xl:w-1/5 shrink-0">
            <div className="sticky top-24 bg-white rounded-[2rem] p-6 shadow-sm border border-slate-200">
              <div className="flex items-center space-x-3 mb-8 px-2">
                <div className="w-12 h-12 bg-[#1e1b4b] rounded-full flex items-center justify-center text-white font-bold text-lg">
                  JD
                </div>
                <div>
                  <p className="text-sm font-bold text-[#1e1b4b]">Customer Account</p>
                  <p className="text-xs text-slate-500 font-medium">Verified Tenant</p>
                </div>
              </div>

              <nav className="space-y-2">
                {SIDEBAR_LINKS.map(link => {
                  const Icon = link.icon;
                  const isActive = activeTab === link.id;
                  return (
                    <button
                      key={link.id}
                      onClick={() => { setActiveTab(link.id); if (link.id !== 'storage') setSelectedUnit(null); }}
                      className={`w-full flex items-center p-4 rounded-2xl transition-all duration-300 font-bold ${
                        isActive 
                          ? 'bg-[#1e1b4b] text-white shadow-md' 
                          : 'bg-transparent text-slate-500 hover:bg-slate-100 hover:text-[#1e1b4b]'
                      }`}
                    >
                      <Icon className={`w-5 h-5 mr-4 ${isActive ? 'text-[#7E22CE]' : 'text-slate-400'}`} />
                      {link.label}
                    </button>
                  )
                })}
              </nav>

              <div className="mt-12 pt-6 border-t border-slate-100 px-2">
                <button 
                  onClick={() => {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                  }}
                  className="flex items-center text-slate-400 font-bold hover:text-red-500 transition-colors"
                >
                  <LogOut className="w-5 h-5 mr-4" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="w-full lg:w-3/4 xl:w-4/5">
            
            {activeTab === 'storage' && (
              !selectedUnit ? (
                // --- LIST OF UNITS ---
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h1 className="text-4xl font-black text-[#1e1b4b] mb-2 tracking-tight">My Storage Units</h1>
                  <p className="text-slate-500 font-medium mb-10 text-lg">Select a unit to manage access, billing, and services.</p>
                  
                  {loadingContracts ? (
                    <div className="text-slate-500 font-medium">Loading your contracts...</div>
                  ) : contracts.length === 0 ? (
                    <div className="text-slate-500 font-medium">You have no active storage unit contracts. <a href="/locations" className="text-[#7E22CE] font-bold">Book one here.</a></div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {contracts.map(contract => (
                        contract.contractItems.map((item: any) => (
                          <button 
                            key={item.id}
                            onClick={() => setSelectedUnit({ contractId: contract.id, unitId: item.unit.id, ...item })} 
                            className="text-left bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 hover:border-[#1e1b4b] hover:shadow-lg transition-all duration-300 group relative overflow-hidden"
                          >
                            <div className="absolute -right-10 -top-10 w-40 h-40 bg-[#7E22CE]/5 rounded-full blur-3xl group-hover:bg-[#7E22CE]/10 transition-colors"></div>
                            <div className="flex justify-between items-start mb-8 relative z-10">
                              <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center group-hover:bg-[#1e1b4b] group-hover:text-white transition-colors duration-300">
                                <Box className="w-7 h-7" />
                              </div>
                              <span className={`px-3 py-1 text-xs font-bold rounded-full flex items-center ${item.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200'} border`}>
                                <CheckCircle2 className="w-3 h-3 mr-1" /> {item.status}
                              </span>
                            </div>
                            <h2 className="text-2xl font-black text-[#1e1b4b] mb-1 relative z-10">Unit #{item.unit.unitNumber}</h2>
                            <p className="text-slate-500 font-medium mb-8 relative z-10">Monthly Rate: ${item.rentalPrice}</p>
                            
                            <div className="flex items-center text-[#7E22CE] font-bold text-sm group-hover:text-[#1e1b4b] transition-colors relative z-10">
                              Manage Smart Key & Access <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                            </div>
                          </button>
                        ))
                      ))}
                      
                      {/* Placeholder for an upcoming reservation if any */}
                      <a href="/locations" className="text-left bg-slate-50/50 p-8 rounded-[2rem] border-2 border-dashed border-slate-200 hover:border-slate-300 transition-all duration-300 group flex flex-col items-center justify-center text-center">
                        <div className="w-14 h-14 bg-white text-slate-300 rounded-full flex items-center justify-center mb-4 shadow-sm group-hover:text-[#1e1b4b] transition-colors">
                          <ShoppingCart className="w-6 h-6" />
                        </div>
                        <h2 className="text-lg font-bold text-slate-600 mb-1 group-hover:text-[#1e1b4b]">Need more space?</h2>
                        <p className="text-slate-400 font-medium text-sm">Rent an additional unit today.</p>
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                // --- TENANT SMART KEY & ACCESS HUB ---
                <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  
                  {/* Header */}
                  <div>
                    <button onClick={() => setSelectedUnit(null)} className="inline-flex items-center text-slate-400 font-bold text-sm hover:text-[#1e1b4b] transition-colors mb-6 group">
                      <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" /> Back to My Units
                    </button>
                    <p className="text-sm font-bold text-[#7E22CE] uppercase tracking-widest mb-3">Unit {selectedUnit?.unit?.unitNumber} • {selectedUnit?.unit?.floor || 'Level 1'}</p>
                    <h1 className="text-4xl md:text-5xl font-black text-[#1e1b4b] tracking-tight mb-4">Tenant Smart Key & Access Hub</h1>
                    <p className="text-lg text-slate-500 font-medium max-w-3xl">Instant contactless gate opening, digital PIN management, and real-time unit telemetry.</p>
                  </div>

                  {/* Keycard & Self Management Row */}
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    
                    {/* Left: Active Digital Access Keycard */}
                    <div className="bg-white p-8 md:p-10 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center mb-6">
                          <div className="w-12 h-12 bg-[#7E22CE]/10 rounded-full flex items-center justify-center mr-4">
                            <Lock className="w-6 h-6 text-[#7E22CE]" />
                          </div>
                          <h2 className="text-2xl font-black text-[#1e1b4b]">Active Access Keycard</h2>
                        </div>
                        <p className="text-slate-500 font-medium leading-relaxed mb-10">
                          Present your verified PIN at keypad pedestals or initiate proximity door release directly over encrypted ultra-wideband Bluetooth.
                        </p>

                        {/* Master PIN Box */}
                        <div className="bg-slate-50 p-6 md:p-8 rounded-[1.5rem] border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                          <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Current 6-Digit Gate & Unit PIN</p>
                            <p className="text-4xl font-mono font-black text-[#1e1b4b] tracking-[0.2em]">{pin}</p>
                          </div>
                          <button 
                            onClick={handleCopy}
                            className="flex items-center justify-center px-6 py-3 bg-white border border-slate-200 hover:border-[#1e1b4b] text-[#1e1b4b] font-bold rounded-full transition-colors shadow-sm"
                          >
                            {isCopied ? <Check className="w-4 h-4 mr-2 text-green-500" /> : <Copy className="w-4 h-4 mr-2" />}
                            {isCopied ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                      </div>

                      {/* Proximity Unlock Action */}
                      <div className="mt-10">
                        <button 
                          onClick={handleUnlock}
                          disabled={isUnlocking}
                          className={`w-full py-5 rounded-full font-bold text-lg flex items-center justify-center transition-all shadow-md ${
                            isUnlocking 
                              ? 'bg-[#7E22CE] text-white scale-[0.98]' 
                              : 'bg-[#1e1b4b] hover:bg-[#7E22CE] text-white'
                          }`}
                        >
                          <DoorOpen className="w-6 h-6 mr-3" />
                          {unlockText}
                        </button>
                        
                        <div className={`text-center font-bold text-sm mt-4 transition-all duration-300 ${unlockFeedback ? 'text-green-600 opacity-100' : 'text-transparent opacity-0'}`}>
                          Encrypted signal acknowledged. Bay latch unlocked for 30s.
                        </div>
                      </div>
                    </div>

                    {/* Right: Tenant Self-Management */}
                    <div className="grid grid-rows-2 gap-8">
                      
                      {/* 1. Extend Lease Duration */}
                      <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center mb-4">
                            <Clock className="w-5 h-5 text-[#7E22CE] mr-3" />
                            <h3 className="text-xl font-black text-[#1e1b4b]">Extend Lease</h3>
                          </div>
                          <p className="text-slate-500 text-sm font-medium mb-6">Guaranteed rate lock with immediate digital signature confirmation.</p>
                          
                          <div className="grid grid-cols-3 gap-3 mb-6">
                            {['1 Mo', '3 Mos', '6 Mos'].map(dur => (
                              <button
                                key={dur}
                                onClick={() => setLeaseDuration(dur)}
                                className={`py-2 rounded-full text-sm font-bold transition-all border-2 ${
                                  leaseDuration === dur 
                                    ? 'bg-[#1e1b4b] border-[#1e1b4b] text-white' 
                                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-[#1e1b4b]'
                                }`}
                              >
                                {dur}
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                          <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Monthly Rate</p>
                            <p className="text-2xl font-black text-[#1e1b4b]">$89.00</p>
                          </div>
                          <button className="flex items-center px-6 py-3 bg-[#1e1b4b] text-white font-bold rounded-full hover:bg-[#7E22CE] transition-colors">
                            Renew <ChevronRight className="w-4 h-4 ml-2" />
                          </button>
                        </div>
                      </div>

                      {/* 2. Move-Out & Deposit */}
                      <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center mb-4">
                            <CalendarDays className="w-5 h-5 text-[#7E22CE] mr-3" />
                            <h3 className="text-xl font-black text-[#1e1b4b]">Move-Out & Deposit</h3>
                          </div>
                          
                          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-[1rem] border border-slate-200 mb-6">
                            <p className="text-sm font-bold text-slate-500">Escrowed Deposit</p>
                            <p className="text-lg font-black text-[#1e1b4b]">$110.00</p>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Intended Vacate Date</label>
                            <input 
                              type="date" 
                              value={moveOutDate}
                              onChange={(e) => setMoveOutDate(e.target.value)}
                              className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-[#1e1b4b] outline-none font-medium text-slate-900"
                            />
                          </div>
                        </div>
                        
                        <button className="w-full mt-6 py-3 bg-white border-2 border-slate-200 hover:border-[#1e1b4b] text-[#1e1b4b] font-bold rounded-full transition-colors flex items-center justify-center">
                          Schedule Move-Out
                        </button>
                      </div>

                    </div>
                  </div>

                  {/* Bottom Section: Access Logs */}
                  <div className="bg-white p-8 md:p-10 rounded-[2rem] shadow-sm border border-slate-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 pb-6 border-b border-slate-100">
                      <div>
                        <h3 className="text-2xl font-black text-[#1e1b4b] mb-2">Recent Access Logs</h3>
                        <p className="text-slate-500 font-medium">Complete telemetry audit for Unit {selectedUnit?.unit?.unitNumber} credentials.</p>
                      </div>
                      <div className="mt-4 sm:mt-0 px-4 py-2 bg-slate-50 rounded-full border border-slate-200 flex items-center">
                        <ShieldCheck className="w-4 h-4 text-green-500 mr-2" />
                        <span className="text-sm font-bold text-[#1e1b4b]">All Nodes Secure</span>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                          <tr>
                            <th className="py-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">Timestamp</th>
                            <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">Access Terminal / Node</th>
                            <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">Method</th>
                            <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">Credential Verified</th>
                            <th className="py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {logs.map((log: any, idx: number) => (
                            <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                              <td className="py-5 text-sm font-bold text-[#1e1b4b] whitespace-nowrap">{new Date(log.accessedAt).toLocaleString()}</td>
                              <td className="py-5 px-6 text-sm font-medium text-slate-500 whitespace-nowrap">Smart App Access</td>
                              <td className="py-5 px-6 whitespace-nowrap">
                                <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold">
                                  {log.accessMethod}
                                </span>
                              </td>
                              <td className="py-5 px-6 text-sm font-medium text-slate-500 whitespace-nowrap">{log.notes || 'Authenticated'}</td>
                              <td className="py-5 text-right whitespace-nowrap">
                                <span className={`text-sm font-bold flex items-center justify-end ${log.status === 'SUCCESS' ? 'text-green-600' : 'text-red-500'}`}>
                                  {log.status === 'SUCCESS' ? <Check className="w-3 h-3 mr-1" /> : null}
                                  {log.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              )
            )}

            {/* Other Sidebar Tabs placeholders */}
            {activeTab !== 'storage' && (
              <div className="bg-white rounded-[2rem] border border-slate-200 p-16 text-center flex flex-col items-center justify-center min-h-[600px] animate-in fade-in duration-500">
                 <div className="w-20 h-20 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mb-6">
                   <Box className="w-10 h-10" />
                 </div>
                 <h2 className="text-3xl font-black text-[#1e1b4b] mb-4">Under Construction</h2>
                 <p className="text-slate-500 font-medium max-w-md">The <b>{SIDEBAR_LINKS.find(l => l.id === activeTab)?.label}</b> section is currently being built. Please return to the Storage Units tab.</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </section>
  );
}
