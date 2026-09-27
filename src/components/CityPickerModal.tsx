import React, { useState, useEffect, useRef } from 'react';
import { CITIES } from '../data/mockData';
import { osmService, GeocodingResult } from '../services/osmService';

interface CityPickerModalProps {
  activeCityId: string;
  currentLocationName: string;
  onSelectCity: (cityId: string) => void;
  onSelectCustomLocation: (custom: {
    latitude: number;
    longitude: number;
    cityName: string;
    countryCode?: string;
  }) => void;
  onRequestLiveGPS: () => void;
  onClose: () => void;
}

interface RecentLocationItem {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  countryCode: string;
  timestamp: number;
}

const POPULAR_HUBS = [
  {
    id: 'vijayawada',
    name: 'Vijayawada / Amaravati (KLEF)',
    desc: 'Undavalli Caves, Kondapalli Fort, Bhavani Island',
    country: 'India',
    countryCode: 'IN',
    lat: 16.4422,
    lng: 80.6253,
    icon: 'castle'
  },
  {
    id: 'mumbai',
    name: 'South Mumbai',
    desc: 'Gateway of India, Marine Drive, Colaba',
    country: 'India',
    countryCode: 'IN',
    lat: 18.9220,
    lng: 72.8347,
    icon: 'location_city'
  },
  {
    id: 'kyoto',
    name: 'Gion, Kyoto',
    desc: 'Kiyomizu-dera, Yasaka Shrine, Historic Alleyways',
    country: 'Japan',
    countryCode: 'JP',
    lat: 35.0037,
    lng: 135.7772,
    icon: 'temple_buddhist'
  },
  {
    id: 'london',
    name: 'Central London',
    desc: 'Westminster, Soho, British Museum, Thames',
    country: 'United Kingdom',
    countryCode: 'GB',
    lat: 51.5074,
    lng: -0.1278,
    icon: 'apartment'
  },
  {
    id: 'newyork',
    name: 'Manhattan, New York',
    desc: 'Times Square, Central Park, Broadway',
    country: 'United States',
    countryCode: 'US',
    lat: 40.7580,
    lng: -73.9855,
    icon: 'domain'
  },
  {
    id: 'paris',
    name: 'Paris',
    desc: 'Eiffel Tower, Louvre Museum, Seine Riverfront',
    country: 'France',
    countryCode: 'FR',
    lat: 48.8566,
    lng: 2.3522,
    icon: 'tour'
  },
  {
    id: 'goa',
    name: 'Goa Coast',
    desc: 'Baga & Calangute Beaches, Aguada Fort',
    country: 'India',
    countryCode: 'IN',
    lat: 15.4909,
    lng: 73.8278,
    icon: 'beach_access'
  },
  {
    id: 'delhi',
    name: 'New Delhi & NCR',
    desc: 'Red Fort, Qutub Minar, India Gate',
    country: 'India',
    countryCode: 'IN',
    lat: 28.6139,
    lng: 77.2090,
    icon: 'account_balance'
  }
];

export const CityPickerModal: React.FC<CityPickerModalProps> = ({
  activeCityId,
  currentLocationName,
  onSelectCity,
  onSelectCustomLocation,
  onRequestLiveGPS,
  onClose
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
  const [showCoordinateInput, setShowCoordinateInput] = useState(false);
  const [customLat, setCustomLat] = useState('');
  const [customLng, setCustomLng] = useState('');

  // Recent locations history
  const [recentLocations, setRecentLocations] = useState<RecentLocationItem[]>(() => {
    try {
      const saved = localStorage.getItem('local_app_recent_locations');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced forward geocoding search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await osmService.searchLocations(trimmed);
        setSearchResults(results);
      } catch (e) {
        console.warn('Geocoding search failed:', e);
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const saveRecent = (item: RecentLocationItem) => {
    setRecentLocations(prev => {
      const filtered = prev.filter(r => r.id !== item.id);
      const updated = [item, ...filtered].slice(0, 5);
      try {
        localStorage.setItem('local_app_recent_locations', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleClearRecents = () => {
    setRecentLocations([]);
    try {
      localStorage.removeItem('local_app_recent_locations');
    } catch {}
  };

  const handlePickResult = (result: GeocodingResult) => {
    saveRecent({
      id: result.id,
      name: result.name,
      address: result.address,
      latitude: result.latitude,
      longitude: result.longitude,
      countryCode: result.countryCode,
      timestamp: Date.now()
    });

    onSelectCustomLocation({
      latitude: result.latitude,
      longitude: result.longitude,
      cityName: result.name,
      countryCode: result.countryCode
    });
    onClose();
  };

  const handlePickPopular = (hub: typeof POPULAR_HUBS[0]) => {
    saveRecent({
      id: `hub-${hub.id}`,
      name: hub.name,
      address: `${hub.desc}, ${hub.country}`,
      latitude: hub.lat,
      longitude: hub.lng,
      countryCode: hub.countryCode,
      timestamp: Date.now()
    });

    if (CITIES.some(c => c.id === hub.id)) {
      onSelectCity(hub.id);
    }

    onSelectCustomLocation({
      latitude: hub.lat,
      longitude: hub.lng,
      cityName: hub.name,
      countryCode: hub.countryCode
    });
    onClose();
  };

  const handleApplyCoordinates = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(customLat);
    const lng = parseFloat(customLng);

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      alert('Please enter valid coordinates (-90 to 90 lat, -180 to 180 lng).');
      return;
    }

    const name = `Custom (${lat.toFixed(3)}°, ${lng.toFixed(3)}°)`;
    saveRecent({
      id: `coord-${lat.toFixed(3)}-${lng.toFixed(3)}`,
      name,
      address: `Latitude: ${lat.toFixed(5)}, Longitude: ${lng.toFixed(5)}`,
      latitude: lat,
      longitude: lng,
      countryCode: 'IN',
      timestamp: Date.now()
    });

    onSelectCustomLocation({
      latitude: lat,
      longitude: lng,
      cityName: name,
      countryCode: 'IN'
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg rounded-3xl bg-white p-5 sm:p-6 shadow-2xl border border-slate-200 flex flex-col gap-4 max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">explore</span>
            </div>
            <div className="flex flex-col">
              <h2 className="text-base font-bold text-slate-900 leading-tight">Change Location</h2>
              <span className="text-xs text-slate-500 font-medium">
                Current: <strong className="text-sky-700 font-semibold">{currentLocationName}</strong>
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
            title="Close"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Live Search Input (Google / Apple Maps style) */}
        <div className="relative flex items-center h-12 rounded-2xl bg-slate-50 border border-slate-200/90 px-3.5 focus-within:ring-2 focus-within:ring-sky-500/20 focus-within:border-sky-500 focus-within:bg-white transition-all">
          <span className="material-symbols-outlined text-[20px] text-slate-400 select-none mr-2.5">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search any city, landmark, or address..."
            className="w-full bg-transparent border-none outline-none text-sm text-slate-900 placeholder:text-slate-400 font-medium"
            autoFocus
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>

        {/* Quick Action Tiles: GPS Location & Coordinate Input */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* GPS Current Location Button */}
          <button
            onClick={() => {
              onRequestLiveGPS();
              onClose();
            }}
            className="p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-200 transition-all flex items-center gap-2.5 text-left group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-[18px] group-hover:rotate-45 transition-transform">
                my_location
              </span>
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-xs font-bold text-emerald-900 leading-tight">Device GPS</span>
              <span className="text-[11px] text-emerald-700 font-medium truncate">Use Current Sensor</span>
            </div>
          </button>

          {/* Coordinates Pinpoint Toggle */}
          <button
            onClick={() => setShowCoordinateInput(!showCoordinateInput)}
            className={`p-3 rounded-2xl border transition-all flex items-center gap-2.5 text-left cursor-pointer ${
              showCoordinateInput 
                ? 'bg-sky-50 border-sky-200 text-sky-800' 
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
            }`}
          >
            <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-[18px]">pin_drop</span>
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-xs font-bold text-slate-900 leading-tight">Coordinates</span>
              <span className="text-[11px] text-slate-500 font-medium truncate">Lat, Long Pin</span>
            </div>
          </button>
        </div>

        {/* Collapsible Direct Coordinates Form */}
        {showCoordinateInput && (
          <form onSubmit={handleApplyCoordinates} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col gap-2.5 animate-fadeIn">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
              <span>Direct GPS Coordinates</span>
              <span className="text-slate-400 font-normal">e.g. 16.4422, 80.6253</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                step="any"
                placeholder="Latitude (e.g. 16.4422)"
                value={customLat}
                onChange={(e) => setCustomLat(e.target.value)}
                className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-mono text-slate-800 focus:outline-none focus:border-sky-500"
              />
              <input
                type="number"
                step="any"
                placeholder="Longitude (e.g. 80.6253)"
                value={customLng}
                onChange={(e) => setCustomLng(e.target.value)}
                className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-mono text-slate-800 focus:outline-none focus:border-sky-500"
              />
            </div>
            <button
              type="submit"
              className="py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-sm active:scale-98 transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">done</span>
              <span>Set Custom Pinpoint</span>
            </button>
          </form>
        )}

        {/* Scrollable Results / Catalogs */}
        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3 min-h-[220px]">
          
          {/* 1. Live Search Results */}
          {isSearching && (
            <div className="flex items-center justify-center py-8 gap-2 text-sky-700 font-semibold text-xs">
              <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
              <span>Searching OpenStreetMap for "{searchQuery}"...</span>
            </div>
          )}

          {!isSearching && searchQuery.trim() && searchResults.length === 0 && (
            <div className="py-8 text-center flex flex-col items-center gap-2">
              <span className="material-symbols-outlined text-[36px] text-slate-300">travel_explore</span>
              <span className="text-sm font-bold text-slate-800">No matching locations found</span>
              <p className="text-xs text-slate-500 max-w-xs">
                Try searching a city name or use custom coordinates above.
              </p>
            </div>
          )}

          {!isSearching && searchResults.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
                Matching Places ({searchResults.length})
              </span>
              {searchResults.map((res) => (
                <button
                  key={res.id}
                  onClick={() => handlePickResult(res)}
                  className="p-3 rounded-2xl bg-white border border-slate-200/90 shadow-sm active:scale-98 flex items-start justify-between text-left hover:border-sky-300 hover:shadow transition-all group cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                      <span className="material-symbols-outlined text-[18px]">
                        {res.type === 'historic' ? 'castle' : res.type === 'coordinate' ? 'pin_drop' : 'location_on'}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-900 group-hover:text-sky-700 transition-colors">
                        {res.name}
                      </span>
                      <span className="text-xs text-slate-500 font-medium line-clamp-1">
                        {res.address}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 mt-0.5">
                        {res.latitude.toFixed(4)}°, {res.longitude.toFixed(4)}°
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 flex-shrink-0 ml-2">
                    {res.countryCode}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* 2. Recent Locations (when not searching) */}
          {!searchQuery.trim() && recentLocations.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">history</span>
                  <span>Recent Places</span>
                </span>
                <button
                  onClick={handleClearRecents}
                  className="text-xs font-semibold text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                >
                  Clear History
                </button>
              </div>
              {recentLocations.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectCustomLocation({
                      latitude: item.latitude,
                      longitude: item.longitude,
                      cityName: item.name,
                      countryCode: item.countryCode
                    });
                    onClose();
                  }}
                  className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 active:scale-98 flex items-center justify-between text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[18px] text-slate-400">history</span>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-800">{item.name}</span>
                      <span className="text-[11px] text-slate-500 truncate max-w-[240px]">{item.address}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-white text-slate-500 border border-slate-200">
                    {item.countryCode}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* 3. Popular Travel & Tourism Hubs (when not searching) */}
          {!searchQuery.trim() && (
            <div className="flex flex-col gap-2 pt-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-amber-500">stars</span>
                <span>Popular Destinations & Tourist Hubs</span>
              </span>
              <div className="grid grid-cols-1 gap-2">
                {POPULAR_HUBS.map((hub) => {
                  const isSelected = activeCityId === hub.id || hub.name.toLowerCase().includes(currentLocationName.toLowerCase());
                  return (
                    <button
                      key={hub.id}
                      onClick={() => handlePickPopular(hub)}
                      className={`p-3 rounded-2xl flex items-center justify-between border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-sky-50 border-sky-200 text-sky-900 ring-1 ring-sky-500/20'
                          : 'bg-white hover:bg-slate-50 border-slate-200/90 text-slate-800 shadow-sm active:scale-98'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          isSelected ? 'bg-sky-600 text-white' : 'bg-slate-100 text-sky-700'
                        }`}>
                          <span className="material-symbols-outlined text-[20px]">
                            {hub.icon}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-900">{hub.name}</span>
                          <span className="text-xs text-slate-500 font-medium truncate max-w-[240px]">
                            {hub.desc}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {isSelected && (
                          <span className="material-symbols-outlined text-sky-600 text-[18px]">
                            check_circle
                          </span>
                        )}
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                          {hub.countryCode}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
