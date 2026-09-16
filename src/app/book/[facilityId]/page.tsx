"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, ChevronRight, Shield, CreditCard, CalendarDays, User, Clock, Check, ChevronLeft } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

const UNIT_TYPES = [
  { id: '2m3', name: '2m³ Locker', desc: 'Perfect for boxes, luggage, and seasonal items.', price: 45, image: '/storage-images/MS_Style20guide_2m3.webp' },
  { id: '5m3', name: '5m³ Closet', desc: 'Holds a mattress set, dresser, and several boxes.', price: 65, image: '/storage-images/MS_Style20guide_5m3.webp' },
  { id: '8m3', name: '8m³ Half Room', desc: 'Fits furnishings of a mid-sized bedroom.', price: 95, image: '/storage-images/MS_Style20guide_8m3.webp' },
  { id: '12m3', name: '12m³ Full Room', desc: 'Ideal for an entire family room or two full bedrooms.', price: 145, image: '/storage-images/MS_Style20guide_12m3.webp' },
  { id: '23m3', name: '23m³ Garage', desc: 'Holds contents of a multi-bedroom house or large vehicles.', price: 210, image: '/storage-images/MS_Style20guide_23m3.webp' },
];

const DURATIONS = [
  { id: 'under_1', label: 'Under 1 month' },
  { id: '1_month', label: '1 month' },
  { id: '2_months', label: '2 months' },
  { id: '3_months', label: '3 months', badge: 'Save 5%' },
  { id: '6_months', label: '6 months', badge: 'Save 10%' },
  { id: '1_year', label: '1+ year', badge: 'Save 15%' }
];

export default function BookingFlow() {
  const params = useParams();
  const router = useRouter();
  const facilityId = params.facilityId;
  
  const [step, setStep] = useState(1);
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
  
  // Step 2 State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  
  const [duration, setDuration] = useState<string>('');
  const [dontKnowDuration, setDontKnowDuration] = useState(false);
  
  const [moveInDate, setMoveInDate] = useState<string>('');
  const [timeSlot, setTimeSlot] = useState<string>('');

  const unitDetails = UNIT_TYPES.find(u => u.id === selectedUnit);

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleComplete = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate API call and completion
    alert('Reservation complete! Redirecting to dashboard...');
    router.push('/');
  };
  
  const isStep2Valid = (name && email && phone) && (duration || dontKnowDuration) && (moveInDate && timeSlot);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Impeccable Minimal Header */}
      <header className="bg-white border-b border-slate-200 py-6 px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center">
          <Link href="/locations" className="group flex items-center text-sm font-bold text-slate-500 hover:text-slate-950 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            BACK TO FACILITIES
          </Link>
        </div>
        <div className="text-xl font-black tracking-tight text-slate-950">Self<span className="text-[#7E22CE]">Storage</span></div>
        <div className="w-24"></div> {/* Spacer for centering */}
      </header>

      <main className="flex-grow flex flex-col lg:flex-row max-w-7xl w-full mx-auto">
        
        {/* Left Column: Form & Steps */}
        <div className="flex-grow p-6 lg:p-12">
          
          {/* Progress Indicators */}
          <div className="flex items-center space-x-2 mb-12">
            {[1, 2, 3].map((s) => (
              <React.Fragment key={s}>
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                  step === s ? 'bg-[#1e1b4b] text-white' : 
                  step > s ? 'bg-[#7E22CE] text-white' : 'bg-slate-200 text-slate-500'
                }`}>
                  {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
                </div>
                {s < 3 && <div className={`h-1 w-12 sm:w-24 ${step > s ? 'bg-[#7E22CE]' : 'bg-slate-200'}`}></div>}
              </React.Fragment>
            ))}
          </div>

          <div className="max-w-3xl">
            {step === 1 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h1 className="text-4xl font-black text-[#1e1b4b] mb-4 tracking-tight">Select a Unit Size</h1>
                <p className="text-slate-600 font-medium mb-10 text-lg">Choose the space that perfectly fits your needs. You can upgrade later.</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                  {UNIT_TYPES.map((unit) => (
                    <button
                      key={unit.id}
                      onClick={() => setSelectedUnit(unit.id)}
                      className={`text-left rounded-[2rem] border-2 overflow-hidden transition-all duration-300 flex flex-col group ${
                        selectedUnit === unit.id 
                          ? 'border-[#1e1b4b] shadow-2xl scale-[1.02]' 
                          : 'border-slate-200 hover:border-[#1e1b4b] hover:shadow-xl'
                      }`}
                    >
                      <div className="aspect-[4/3] bg-slate-100 overflow-hidden relative">
                         <img src={unit.image} alt={unit.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                         {selectedUnit === unit.id && (
                           <div className="absolute top-4 right-4 bg-[#1e1b4b] text-white p-1 rounded-full">
                             <CheckCircle2 className="w-5 h-5" />
                           </div>
                         )}
                      </div>
                      <div className="p-6">
                        <h3 className="text-2xl font-black text-[#1e1b4b] mb-1">{unit.name}</h3>
                        <p className="text-xl font-bold text-slate-500 mb-3">${unit.price}<span className="text-sm">/mo</span></p>
                        <p className="text-sm text-slate-600 font-medium leading-relaxed">{unit.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="mt-10">
                  <button 
                    onClick={handleNext}
                    disabled={!selectedUnit}
                    className="w-full sm:w-auto inline-flex justify-center items-center px-10 py-4 bg-[#1e1b4b] text-white font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#7E22CE] transition-colors rounded-full shadow-md"
                  >
                    Continue <ChevronRight className="w-5 h-5 ml-2" />
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h1 className="text-4xl font-black text-[#1e1b4b] mb-4 tracking-tight">When do you need it?</h1>
                <p className="text-slate-600 font-medium mb-12 text-lg">Reserve your move-in date and preferred rental duration.</p>
                
                <div className="space-y-16">
                  
                  {/* Personal Info */}
                  <div>
                    <h2 className="text-sm font-bold text-[#7E22CE] uppercase tracking-wider mb-4 flex items-center">
                      <User className="w-4 h-4 mr-2" /> Personal Information
                    </h2>
                    <div className="space-y-4">
                      <input type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-[#1e1b4b] focus:bg-white outline-none font-medium transition-all" />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-[#1e1b4b] focus:bg-white outline-none font-medium transition-all" />
                        <input type="tel" placeholder="Phone Number" value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-[#1e1b4b] focus:bg-white outline-none font-medium transition-all" />
                      </div>
                    </div>
                  </div>

                  {/* Duration */}
                  <div>
                    <h2 className="text-2xl font-black text-[#1e1b4b] mb-6 flex items-center">
                      <Clock className="w-6 h-6 mr-3 text-[#1e1b4b]" /> How long will you stay?
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                      {DURATIONS.map(d => (
                        <button 
                          key={d.id} 
                          onClick={() => { setDuration(d.id); setDontKnowDuration(false); }}
                          className={`p-4 border-2 rounded-[1.5rem] font-bold flex flex-col items-center justify-center text-center transition-all ${
                            duration === d.id ? 'border-[#1e1b4b] bg-slate-50 text-[#1e1b4b] shadow-md scale-[1.02]' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <span>{d.label}</span>
                          {d.badge && <span className="mt-2 px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-black rounded-full">{d.badge}</span>}
                        </button>
                      ))}
                    </div>
                    <label className="flex items-center space-x-3 text-[#1e1b4b] font-bold cursor-pointer w-max mt-6">
                      <div className={`w-6 h-6 rounded flex items-center justify-center border-2 transition-colors ${dontKnowDuration ? 'bg-[#7E22CE] border-[#7E22CE]' : 'border-slate-300 bg-white'}`}>
                        {dontKnowDuration && <Check className="w-4 h-4 text-white" />}
                      </div>
                      <span>I don't know yet</span>
                      <input type="checkbox" className="hidden" checked={dontKnowDuration} onChange={(e) => {
                          setDontKnowDuration(e.target.checked);
                          if(e.target.checked) setDuration('');
                      }} />
                    </label>
                  </div>

                  {/* Date & Time */}
                  <div>
                    <h2 className="text-2xl font-black text-[#1e1b4b] mb-8 flex items-center">
                      <CalendarDays className="w-6 h-6 mr-3 text-[#1e1b4b]" /> When should we expect you?
                    </h2>
                    
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Pick Your Move-in Date</p>
                    <div className="bg-white border-2 border-slate-200 rounded-[2rem] p-6 mb-10 max-w-sm shadow-sm">
                      <div className="flex justify-between items-center mb-6">
                        <ChevronLeft className="w-5 h-5 text-slate-400 cursor-pointer hover:text-slate-900" />
                        <span className="font-bold text-[#1e1b4b] text-lg">September 2026</span>
                        <ChevronRight className="w-5 h-5 text-slate-400 cursor-pointer hover:text-slate-900" />
                      </div>
                      <div className="grid grid-cols-7 gap-y-4 gap-x-1 text-center">
                        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                          <div key={d} className="text-xs font-bold text-slate-400">{d}</div>
                        ))}
                        {/* Empty days */}
                        <div/><div/>
                        {/* Days 1-30 */}
                        {Array.from({length: 30}).map((_, i) => {
                          const day = i + 1;
                          const dateStr = `2026-09-${day.toString().padStart(2, '0')}`;
                          const isSelected = moveInDate === dateStr;
                          return (
                            <button 
                              key={day}
                              onClick={() => setMoveInDate(dateStr)}
                              className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                                isSelected ? 'bg-[#7E22CE] text-white shadow-md scale-110' : 'text-[#1e1b4b] hover:bg-slate-100'
                              }`}
                            >
                              {day}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">What time works best?</p>
                    <div className="space-y-4 max-w-sm">
                      {['Slot 1: 09:00 - 10:30', 'Slot 2: 10:30 - 12:00', 'Slot 3: 14:00 - 15:30'].map((slot, i) => (
                        <label key={i} className={`flex items-center p-5 border-2 rounded-[1.5rem] cursor-pointer transition-all ${
                          timeSlot === slot ? 'border-[#7E22CE] bg-white shadow-md' : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}>
                          <div className={`w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center ${
                            timeSlot === slot ? 'border-[#7E22CE]' : 'border-slate-300'
                          }`}>
                            {timeSlot === slot && <div className="w-3 h-3 rounded-full bg-[#7E22CE]" />}
                          </div>
                          <span className={`font-bold ${timeSlot === slot ? 'text-[#7E22CE]' : 'text-slate-600'}`}>{slot}</span>
                          <input type="radio" className="hidden" checked={timeSlot === slot} onChange={() => setTimeSlot(slot)} />
                        </label>
                      ))}
                    </div>
                  </div>

                </div>

                <div className="mt-16 flex items-center space-x-4 border-t border-slate-200 pt-10">
                  <button 
                    onClick={() => setStep(1)}
                    className="px-6 py-4 font-bold text-slate-600 hover:text-slate-950 transition-colors"
                  >
                    Back
                  </button>
                  <button 
                    onClick={handleNext}
                    disabled={!isStep2Valid}
                    className="flex-grow sm:flex-grow-0 inline-flex justify-center items-center px-10 py-4 bg-[#1e1b4b] text-white font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#7E22CE] transition-colors rounded-full shadow-md"
                  >
                    Continue <ChevronRight className="w-5 h-5 ml-2" />
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h1 className="text-4xl font-black text-[#1e1b4b] mb-4 tracking-tight">Finalize Reservation</h1>
                <p className="text-slate-600 font-medium mb-10 text-lg">Enter your payment details to secure your unit immediately.</p>
                
                <form onSubmit={handleComplete} className="space-y-6 max-w-xl">
                  <div>
                    <label className="block text-sm font-bold text-slate-950 uppercase tracking-wider mb-3">Cardholder Name</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Jane Doe"
                      className="w-full px-6 py-4 bg-white border-2 border-slate-200 rounded-[1.5rem] focus:border-[#1e1b4b] focus:ring-0 text-slate-950 font-medium outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-950 uppercase tracking-wider mb-3">Card Details</label>
                    <div className="relative">
                      <CreditCard className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                      <input 
                        type="text" 
                        required
                        placeholder="0000 0000 0000 0000"
                        className="w-full pl-14 pr-6 py-4 bg-white border-2 border-slate-200 rounded-[1.5rem] focus:border-[#1e1b4b] focus:ring-0 text-slate-950 font-medium outline-none transition-colors"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <input 
                        type="text" 
                        required
                        placeholder="MM/YY"
                        className="w-full px-6 py-4 bg-white border-2 border-slate-200 rounded-[1.5rem] focus:border-[#1e1b4b] focus:ring-0 text-slate-950 font-medium outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <input 
                        type="text" 
                        required
                        placeholder="CVC"
                        className="w-full px-6 py-4 bg-white border-2 border-slate-200 rounded-[1.5rem] focus:border-[#1e1b4b] focus:ring-0 text-slate-950 font-medium outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div className="mt-10 flex items-center space-x-4 pt-6">
                    <button 
                      type="button"
                      onClick={() => setStep(2)}
                      className="px-6 py-4 font-bold text-slate-600 hover:text-slate-950 transition-colors"
                    >
                      Back
                    </button>
                    <button 
                      type="submit"
                      className="flex-grow inline-flex justify-center items-center px-10 py-4 bg-[#1e1b4b] text-white font-bold text-lg hover:bg-[#7E22CE] transition-colors rounded-full shadow-md"
                    >
                      Pay & Reserve
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Order Summary */}
        <div className="w-full lg:w-[400px] bg-slate-100 p-6 lg:p-10 border-t lg:border-t-0 lg:border-l border-slate-200 flex flex-col">
          <h2 className="text-sm font-bold text-slate-950 uppercase tracking-widest mb-8">Reservation Summary</h2>
          
          <div className="flex-grow space-y-6">
            <div className="flex items-start justify-between pb-6 border-b border-slate-200">
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Facility</p>
                <p className="text-[#1e1b4b] font-bold">Facility {facilityId}</p>
              </div>
            </div>

            <div className="flex items-start justify-between pb-6 border-b border-slate-200">
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Unit Selected</p>
                <p className="text-[#1e1b4b] font-bold">{unitDetails ? unitDetails.name : 'Not selected'}</p>
              </div>
              <p className="text-[#1e1b4b] font-black">{unitDetails ? `$${unitDetails.price}` : '-'}</p>
            </div>

            <div className="flex items-start justify-between pb-6 border-b border-slate-200">
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Move-In Date</p>
                <p className="text-[#1e1b4b] font-bold">{moveInDate ? `${moveInDate} (${timeSlot})` : 'Not selected'}</p>
              </div>
            </div>

            <div className="flex items-start justify-between pb-6 border-b border-slate-200">
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Duration</p>
                <p className="text-[#1e1b4b] font-bold">
                  {dontKnowDuration ? 'I don\'t know yet' : (DURATIONS.find(d => d.id === duration)?.label || 'Not selected')}
                </p>
              </div>
            </div>

            <div className="pt-4">
              <div className="flex justify-between items-center mb-4 text-slate-600 font-medium">
                <span>Monthly Rent</span>
                <span>{unitDetails ? `$${unitDetails.price}` : '-'}</span>
              </div>
              <div className="flex justify-between items-center mb-4 text-slate-600 font-medium">
                <span>One-time Setup Fee</span>
                <span>$25.00</span>
              </div>
              <div className="flex justify-between items-center mt-6 pt-6 border-t border-slate-300">
                <span className="text-lg font-bold text-[#1e1b4b]">Due Today</span>
                <span className="text-3xl font-black text-[#1e1b4b]">
                  ${unitDetails ? (unitDetails.price + 25).toFixed(2) : '0.00'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8 bg-[#7E22CE]/10 p-6 rounded-[2rem] flex items-start">
            <Shield className="w-5 h-5 text-[#7E22CE] mr-3 shrink-0 mt-0.5" />
            <p className="text-xs text-[#1e1b4b] font-bold leading-relaxed">
              Your payment is secure. We use bank-level encryption to protect your data. Free cancellation up to 48 hours before move-in.
            </p>
          </div>

        </div>

      </main>
    </div>
  );
}
