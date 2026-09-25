"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { MapPin, Navigation2, CheckCircle2, Search, Filter, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';

/** Shape returned by GET /facilities. */
interface ApiFacility {
  id: number | string;
  name?: string;
  address?: string;
}

/** Normalised shape the cards render, so the UI never has to guard for missing fields. */
interface FacilityCard {
  id: number | string;
  name: string;
  address: string;
  image: string;
  features: string[];
  distance: string;
  startingPrice: number;
}

// Fallback images since the backend doesn't provide them yet
const fallbackImages = [
  'https://images.unsplash.com/photo-1581404172551-789a74b2f2d9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1605814421448-6a3861fb13a6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1565118531796-763e5082d113?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
];

// Local images (already shipped in /public) so the samples below render with no network at all.
const localImages = ['/climate_control.jpg', '/smart_access.jpg', '/security_camera.jpg'];

// Fallback features
const fallbackFeatures = ['Climate Controlled', '24/7 Access', 'Security Cameras', 'Drive-up'];

/**
 * Shown when the API cannot be reached, so /locations stays useful instead of
 * rendering an empty grid. The UI flags these clearly as sample data.
 */
const SAMPLE_FACILITIES: FacilityCard[] = [
  {
    id: 'sample-landmark-81',
    name: 'SelfStorage Landmark 81',
    address: 'Khu B, Tòa nhà Landmark 81, P. 22, Q. Bình Thạnh, TP.HCM',
    image: localImages[0],
    features: fallbackFeatures.slice(0, 2),
    distance: '0.8 miles away',
    startingPrice: 35
  },
  {
    id: 'sample-cau-giay',
    name: 'SelfStorage Cầu Giấy',
    address: 'Số 8 Tôn Thất Thuyết, Q. Cầu Giấy, Hà Nội',
    image: localImages[1],
    features: fallbackFeatures.slice(2),
    distance: '2.0 miles away',
    startingPrice: 45
  },
  {
    id: 'sample-thu-duc',
    name: 'SelfStorage Thủ Đức',
    address: 'Võ Văn Ngân, P. Bình Thọ, TP. Thủ Đức, TP.HCM',
    image: localImages[2],
    features: ['Climate Controlled', 'Drive-up'],
    distance: '3.2 miles away',
    startingPrice: 55
  }
];

/**
 * Fetches and normalises the facility list.
 *
 * Deliberately pure (no setState) so it can be awaited from inside an effect
 * without triggering the react-hooks/set-state-in-effect rule.
 */
async function fetchFacilities(): Promise<FacilityCard[]> {
  const data = await api.get<ApiFacility[]>('/facilities');

  // A proxy/HTML error page or a mis-shaped payload must not crash the grid.
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('The facilities endpoint returned an empty or unexpected payload.');
  }

  // Map backend data to UI expected format (adding fallback images/features for now)
  return data.map((facility, index) => ({
    id: facility.id ?? `facility-${index}`,
    name: facility.name?.trim() || `Facility #${index + 1}`,
    address: facility.address?.trim() || 'Address not available',
    image: fallbackImages[index % fallbackImages.length],
    features: index % 2 === 0 ? fallbackFeatures.slice(0, 2) : fallbackFeatures.slice(2),
    distance: `${(index * 1.2 + 0.8).toFixed(1)} miles away`,
    startingPrice: 35 + index * 10
  }));
}

export default function FacilityList() {
  const [facilities, setFacilities] = useState<FacilityCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSampleData, setIsSampleData] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);

  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await fetchFacilities();
        if (cancelled) return;
        setFacilities(data);
        setIsSampleData(false);
        setErrorMessage('');
      } catch (error) {
        // Backend down, unreachable, CORS-blocked or blocked by a browser extension.
        // Keep the page useful by falling back to local sample facilities.
        console.error('Failed to load facilities:', error);
        if (cancelled) return;
        setFacilities(SAMPLE_FACILITIES);
        setIsSampleData(true);
        setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const handleRetry = () => {
    setLoading(true);
    setErrorMessage('');
    setReloadToken((token) => token + 1);
  };

  const allFeatures = Array.from(new Set(facilities.flatMap(f => f.features)));

  const filteredFacilities = useMemo(() => {
    return facilities.filter(f => {
      const matchesSearch = f.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            f.address.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFeature = selectedFeature ? f.features.includes(selectedFeature) : true;
      return matchesSearch && matchesFeature;
    });
  }, [facilities, searchTerm, selectedFeature]);

  return (
    <section id="facilities" className="py-24 bg-slate-50 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8">
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

        {/* Filters Section */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-12 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative w-full md:w-1/2">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by name or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 outline-none focus:border-[#7E22CE] focus:ring-2 focus:ring-[#7E22CE]/20 transition-all"
            />
          </div>
          
          <div className="w-full md:w-auto flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            <div className="flex items-center text-slate-500 font-bold text-sm mr-2 shrink-0">
              <Filter className="w-4 h-4 mr-1" /> Filters:
            </div>
            <button 
              onClick={() => setSelectedFeature(null)}
              className={`px-4 py-2 rounded-lg text-sm font-bold shrink-0 transition-colors ${!selectedFeature ? 'bg-[#1e1b4b] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              All
            </button>
            {allFeatures.map(feature => (
              <button 
                key={feature}
                onClick={() => setSelectedFeature(feature as string)}
                className={`px-4 py-2 rounded-lg text-sm font-bold shrink-0 transition-colors ${selectedFeature === feature ? 'bg-[#7E22CE] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {feature as string}
              </button>
            ))}
          </div>
        </div>

        {isSampleData && !loading && (
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-amber-900">
                Showing sample facilities — the live API could not be reached.
              </p>
              <p className="text-xs text-amber-700 mt-0.5 break-words">{errorMessage}</p>
            </div>
            <button
              onClick={handleRetry}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-amber-900 bg-white border border-amber-300 hover:bg-amber-100 rounded-xl transition-colors shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="py-24 flex justify-center items-center text-[#7E22CE]">
            <Loader2 className="w-12 h-12 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredFacilities.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-500 font-medium">
                No facilities found matching your criteria.
              </div>
            )}
            {filteredFacilities.map((facility) => (
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
                    {facility.features.map((feature: string, idx: number) => (
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
        )}

      </div>
    </section>
  );
}
