import React from 'react';
import { MapPin, Navigation2, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

const facilities = [
  {
    id: 1,
    name: 'Downtown Vault',
    address: '1200 Commerce St, Metro City, NY',
    distance: '0.8 miles away',
    image: 'https://images.unsplash.com/photo-1581404172551-789a74b2f2d9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    availableUnits: 12,
    startingPrice: 45,
    features: ['Climate Controlled', '24/7 Access', 'Drive-up'],
  },
  {
    id: 2,
    name: 'Westside Storage Hub',
    address: '8400 Industrial Blvd, Metro City, NY',
    distance: '3.2 miles away',
    image: 'https://images.unsplash.com/photo-1605814421448-6a3861fb13a6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    availableUnits: 5,
    startingPrice: 35,
    features: ['Security Cameras', 'Gate Access'],
  },
  {
    id: 3,
    name: 'East End Depot',
    address: '405 East Ave, Metro City, NY',
    distance: '5.1 miles away',
    image: 'https://images.unsplash.com/photo-1565118531796-763e5082d113?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    availableUnits: 24,
    startingPrice: 25,
    features: ['RV Parking', 'Climate Controlled'],
  }
];

export default function FacilityList() {
  return (
    <section id="facilities" className="py-24 bg-slate-50 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16">
          <div>
            <h2 className="text-4xl md:text-5xl font-black text-[#1e1b4b] tracking-tight">Available Facilities</h2>
            <p className="text-lg text-slate-600 mt-4 max-w-2xl font-medium">Select a location to view available units and book instantly.</p>
          </div>
          <div className="mt-6 md:mt-0">
            <button className="flex items-center text-sm font-bold text-[#7E22CE] hover:text-[#1e1b4b] transition-colors group">
              <Navigation2 className="w-4 h-4 mr-2 group-hover:-translate-y-1 transition-transform" />
              USE MY CURRENT LOCATION
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {facilities.map((facility) => (
            <div key={facility.id} className="group bg-white rounded-[2rem] border-2 border-slate-200 hover:border-[#1e1b4b] hover:shadow-2xl transition-all duration-300 flex flex-col h-full overflow-hidden">
              
              {/* Image Section */}
              <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                <img 
                  src={facility.image} 
                  alt={facility.name} 
                  className="w-full h-full object-cover grayscale transition-all duration-500 group-hover:grayscale-0 group-hover:scale-105" 
                />
                <div className="absolute top-4 left-4 bg-white px-3 py-1 text-xs font-bold text-slate-950 uppercase tracking-wider">
                  {facility.distance}
                </div>
              </div>

              {/* Content Section */}
              <div className="p-8 flex flex-col flex-grow">
                <h3 className="text-2xl font-black text-[#1e1b4b] mb-2">{facility.name}</h3>
                
                <div className="flex items-start text-slate-500 mb-6 text-sm">
                  <MapPin className="w-4 h-4 mr-2 mt-0.5 shrink-0 text-slate-400" />
                  <span>{facility.address}</span>
                </div>

                {/* Features List */}
                <ul className="space-y-2 mb-8 flex-grow">
                  {facility.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center text-sm font-medium text-slate-700">
                      <CheckCircle2 className="w-4 h-4 mr-3 text-[#7E22CE]" />
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* Footer Action */}
                <div className="pt-6 border-t border-slate-100 flex items-center justify-between mt-auto">
                  <div>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Starting at</p>
                    <p className="text-3xl font-black text-[#1e1b4b]">${facility.startingPrice}<span className="text-base font-medium text-slate-500">/mo</span></p>
                  </div>
                  
                  <Link 
                    href={`/book/${facility.id}`}
                    className="inline-flex items-center justify-center px-8 py-4 text-sm font-bold text-white bg-[#1e1b4b] hover:bg-[#7E22CE] rounded-full hover:scale-105 shadow-md transition-all"
                  >
                    Select Unit
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
