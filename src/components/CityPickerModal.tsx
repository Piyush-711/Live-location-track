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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md rounded-[28px] bg-surface p-5 shadow-tactile-xl border border-[#eae6df] flex flex-col gap-3.5 max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-1 border-b border-[#eae6df]/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[20px]">explore</span>
            </div>
            <div className="flex flex-col">
              <h2 className="text-[16px] font-black text-on-surface leading-tight">Choose Location</h2>
              <span className="text-[11px] text-on-surface-variant font-medium">
                Current: <strong className="text-primary">{currentLocationName}</strong>
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-outline hover:text-on-surface shadow-tactile-inset-sm active:scale-95 transition-all"
            title="Close"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Live Search Input (Google / Apple Maps style) */}
        <div className="relative flex items-center">
          <span className="material-symbols-outlined absolute left-3.5 text-[20px] text-primary select-none">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search any city, landmark, or address..."
            className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-surface-container border border-[#eae6df] text-[13px] text-on-surface placeholder:text-outline/70 focus:outline-none focus:border-primary shadow-tactile-inset font-medium transition-all"
            autoFocus
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 w-5 h-5 rounded-full bg-surface flex items-center justify-center text-outline hover:text-on-surface shadow-tactile-sm"
            >
              <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
          )}
        </div>

        {/* Quick Action Tiles: GPS Location & Coordinate Input */}
        <div className="grid grid-cols-2 gap-2">
          {/* GPS Current Location Button */}
          <button
            onClick={() => {
              onRequestLiveGPS();
              onClose();
            }}
            className="p-2.5 rounded-2xl bg-[#F0FDF4] border border-[#BBF7D0] shadow-tactile active:scale-95 transition-all flex items-center gap-2 text-left group"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 shadow-tactile-sm">
              <span className="material-symbols-outlined text-[18px] group-hover:animate-spin">
                my_location
              </span>
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-[12px] font-black text-emerald-900 leading-tight">Live GPS</span>
              <span className="text-[10px] text-emerald-700 font-semibold truncate">Use Device Sensor</span>
            </div>
          </button>

          {/* Coordinates Pinpoint Toggle */}
          <button
            onClick={() => setShowCoordinateInput(!showCoordinateInput)}
            className={`p-2.5 rounded-2xl border shadow-tactile active:scale-95 transition-all flex items-center gap-2 text-left ${
              showCoordinateInput 
                ? 'bg-[#E0F2FE] border-[#BAE6FD] text-primary shadow-tactile-inset-sm' 
                : 'bg-surface border-[#eae6df] text-on-surface'
            }`}
          >
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-[18px]">pin_drop</span>
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-[12px] font-black text-on-surface leading-tight">Coordinates</span>
              <span className="text-[10px] text-outline font-semibold truncate">Lat, Long Input</span>
            </div>
          </button>
        </div>

        {/* Collapsible Direct Coordinates Form */}
        {showCoordinateInput && (
          <form onSubmit={handleApplyCoordinates} className="p-3 rounded-2xl bg-surface-container border border-[#eae6df] flex flex-col gap-2 animate-fadeIn">
            <div className="flex items-center justify-between text-[11px] font-bold text-on-surface">
              <span>Direct GPS Coordinates</span>
              <span className="text-[10px] text-outline">e.g. 16.4422, 80.6253</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                step="any"
                placeholder="Latitude (e.g. 16.4422)"
                value={customLat}
                onChange={(e) => setCustomLat(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-surface border border-[#eae6df] text-[12px] font-mono focus:outline-none focus:border-primary"
              />
              <input
                type="number"
                step="any"
                placeholder="Longitude (e.g. 80.6253)"
                value={customLng}
                onChange={(e) => setCustomLng(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-surface border border-[#eae6df] text-[12px] font-mono focus:outline-none focus:border-primary"
              />
            </div>
            <button
              type="submit"
              className="py-1.5 rounded-xl bg-primary text-white font-extrabold text-[11px] shadow-tactile active:scale-95 transition-all flex items-center justify-center gap-1 mt-0.5"
            >
              <span className="material-symbols-outlined text-[15px]">done</span>
              <span>Set Custom Pinpoint</span>
            </button>
          </form>
        )}

        {/* Scrollable Results / Catalogs */}
        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3 min-h-[220px]">
          
          {/* 1. Live Search Results */}
          {isSearching && (
            <div className="flex items-center justify-center py-8 gap-2 text-primary font-bold text-[12px]">
              <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
              <span>Finding places matching "{searchQuery}"...</span>
            </div>
          )}

          {!isSearching && searchQuery.trim() && searchResults.length === 0 && (
            <div className="py-8 text-center flex flex-col items-center gap-1.5">
              <span className="material-symbols-outlined text-[32px] text-outline">travel_explore</span>
              <span className="text-[13px] font-bold text-on-surface">No exact match found</span>
              <p className="text-[11px] text-on-surface-variant max-w-xs">
                Try searching a larger city name or enter exact coordinates using the Coordinates button above.
              </p>
            </div>
          )}

          {!isSearching && searchResults.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary px-1">
                Matching Locations ({searchResults.length})
              </span>
              {searchResults.map((res) => (
                <button
                  key={res.id}
                  onClick={() => handlePickResult(res)}
                  className="p-3 rounded-2xl bg-surface border border-[#eae6df] shadow-tactile active:scale-98 flex items-start justify-between text-left hover:border-primary/40 transition-all group"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-primary group-hover:text-white transition-colors">
                      <span className="material-symbols-outlined text-[18px]">
                        {res.type === 'historic' ? 'castle' : res.type === 'coordinate' ? 'pin_drop' : 'location_on'}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[13px] font-black text-on-surface group-hover:text-primary transition-colors">
                        {res.name}
                      </span>
                      <span className="text-[11px] text-on-surface-variant font-medium line-clamp-1">
                        {res.address}
                      </span>
                      <span className="text-[9px] font-mono text-outline mt-0.5">
                        {res.latitude.toFixed(4)}°, {res.longitude.toFixed(4)}°
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant flex-shrink-0 ml-2">
                    {res.countryCode}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* 2. Recent Locations (when not searching) */}
          {!searchQuery.trim() && recentLocations.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-outline flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px]">history</span>
                  <span>Recent Places</span>
                </span>
                <button
                  onClick={handleClearRecents}
                  className="text-[10px] font-bold text-outline hover:text-red-600 transition-colors"
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
                  className="p-2.5 rounded-xl bg-surface border border-[#eae6df] shadow-tactile-sm active:scale-98 flex items-center justify-between text-left hover:border-primary/30 transition-all"
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-outline">history</span>
                    <div className="flex flex-col">
                      <span className="text-[12px] font-bold text-on-surface">{item.name}</span>
                      <span className="text-[10px] text-outline truncate max-w-[200px]">{item.address}</span>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-surface-container text-outline">
                    {item.countryCode}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* 3. Popular Travel & Tourism Hubs (when not searching) */}
          {!searchQuery.trim() && (
            <div className="flex flex-col gap-1.5 pt-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-outline px-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px]">stars</span>
                <span>Popular Destinations & Tourist Hubs</span>
              </span>
              <div className="grid grid-cols-1 gap-1.5">
                {POPULAR_HUBS.map((hub) => {
                  const isSelected = activeCityId === hub.id || hub.name.toLowerCase().includes(currentLocationName.toLowerCase());
                  return (
                    <button
                      key={hub.id}
                      onClick={() => handlePickPopular(hub)}
                      className={`p-2.5 rounded-2xl flex items-center justify-between border text-left transition-all ${
                        isSelected
                          ? 'bg-[#E0F2FE] border-[#BAE6FD] text-primary shadow-tactile-inset-sm font-extrabold'
                          : 'bg-surface border-[#eae6df] text-on-surface shadow-tactile active:scale-98 hover:border-primary/30'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          isSelected ? 'bg-primary text-white' : 'bg-surface-container text-primary'
                        }`}>
                          <span className="material-symbols-outlined text-[18px]">
                            {hub.icon}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[13px] font-black text-on-surface">{hub.name}</span>
                          <span className="text-[10px] text-on-surface-variant font-medium truncate max-w-[220px]">
                            {hub.desc}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {isSelected && (
                          <span className="material-symbols-outlined text-primary text-[18px]">
                            check_circle
                          </span>
                        )}
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant">
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
