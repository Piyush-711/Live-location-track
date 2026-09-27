import React, { useState, useEffect, useMemo } from 'react';
import { Place, Category } from '../types';
import { api } from '../services/api';
import { storage } from '../services/storage';
import { LiveLocationState, calculateDistanceMeters } from '../hooks/useLiveLocation';
import { LiveLeafletMap } from '../components/LiveLeafletMap';

interface ExploreViewProps {
  location: LiveLocationState;
  activeCityId: string;
  onSelectPlace: (place: Place) => void;
  onStartRoute: (place: Place) => void;
  onOpenEmergency: () => void;
  onRequestGPS: () => void;
}

const CATEGORY_PILLS: { id: Category | 'all'; label: string; icon: string }[] = [
  { id: 'all', label: 'All Essentials', icon: 'near_me' },
  { id: 'hospital', label: 'Hospitals', icon: 'local_hospital' },
  { id: 'pharmacy', label: 'Pharmacies', icon: 'medication' },
  { id: 'police', label: 'Police Box (Kōban)', icon: 'local_police' },
  { id: 'atm', label: 'ATMs', icon: 'atm' },
  { id: 'transit_stop', label: 'Transit', icon: 'train' },
  { id: 'supermarket', label: 'Supermarkets', icon: 'shopping_basket' },
  { id: 'cafe', label: 'Cafes', icon: 'coffee' }
];

export const ExploreView: React.FC<ExploreViewProps> = ({
  location,
  activeCityId,
  onSelectPlace,
  onStartRoute,
  onOpenEmergency,
  onRequestGPS
}) => {
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [mobileViewMode, setMobileViewMode] = useState<'list' | 'map'>('list');

  // Load places based on city or live GPS coordinates
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    api.getNearbyPlaces(activeCityId, selectedCategory, searchQuery, 3000, location.coords)
      .then(res => {
        if (isMounted) {
          setPlaces(res.items);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error('Failed to fetch places:', err);
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [activeCityId, selectedCategory, searchQuery, location.coords.latitude, location.coords.longitude]);

  // Dynamically compute real-time distance from user's live GPS to each place
  const dynamicPlaces = useMemo(() => {
    return places.map(p => {
      const liveDist = calculateDistanceMeters(
        location.coords.latitude,
        location.coords.longitude,
        p.location.latitude,
        p.location.longitude
      );
      return {
        ...p,
        distanceMeters: liveDist
      };
    }).sort((a, b) => {
      if (a.distanceMeters !== b.distanceMeters) {
        return a.distanceMeters - b.distanceMeters;
      }
      return a.id.localeCompare(b.id);
    });
  }, [places, location.coords]);

  const refreshSavedState = () => {
    const saved = storage.getSavedPlaces();
    setSavedIds(new Set(saved.map(s => s.placeId)));
  };

  useEffect(() => {
    refreshSavedState();
  }, []);

  const handleToggleSave = (e: React.MouseEvent, place: Place) => {
    e.stopPropagation();
    storage.toggleSavePlace(place);
    refreshSavedState();
  };

  return (
    <div className="flex-1 w-full max-w-6xl mx-auto px-4 md:px-8 pb-28 pt-2">
      {/* Live Context Hero (Tactile Card) */}
      <section className="pt-2 pb-3">
        <div className="relative overflow-hidden rounded-2xl bg-surface-container-low p-4 md:p-6 shadow-tactile border border-[#eae6df]/80">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#E0F2FE] text-primary shadow-[-2px_-2px_5px_rgba(255,255,255,0.9),2px_2px_4px_rgba(180,172,158,0.35)]">
                  <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    near_me
                  </span>
                </span>
                <span className="text-[10px] uppercase tracking-wider text-primary font-extrabold">
                  {location.status === 'fixed' ? 'Live GPS Positioning' : 'Simulated GPS Node'}
                </span>
              </div>
              <h1 className="text-[22px] sm:text-[28px] font-extrabold text-on-surface tracking-tight leading-tight">
                {location.cityName}
              </h1>
              <p className="text-[12px] sm:text-[13px] text-on-surface-variant mt-0.5 font-medium">
                {location.coords.latitude.toFixed(4)}° N, {location.coords.longitude.toFixed(4)}° E • High-Precision Triangulation
              </p>
            </div>
            
            <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2">
              <div className="px-3 py-1 rounded-full bg-surface-container shadow-tactile-inset-sm flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${location.status === 'fixed' ? 'bg-emerald-500 animate-ping' : 'bg-primary animate-pulse'}`}></span>
                <span className="text-[11px] text-primary font-extrabold">
                  {location.status === 'fixed' ? 'DEVICE GPS LOCKED' : 'L-BAND SIMULATED'}
                </span>
              </div>
              <span className="text-[11px] text-on-surface-variant font-semibold">
                Accuracy ±{location.accuracyMeters}m
              </span>
            </div>
          </div>

          {/* Quick Utility Ribbon */}
          <div className="mt-4 pt-1">
            <div className="rounded-xl bg-surface-variant/80 p-2.5 shadow-tactile-inset flex items-center justify-between gap-2 overflow-x-auto text-[11px] font-semibold text-on-surface">
              <div className="flex items-center gap-1.5 px-2 py-0.5 flex-shrink-0">
                <span className="material-symbols-outlined text-primary text-[16px]">wb_sunny</span>
                <span>21°C Clear</span>
              </div>
              <span className="w-[1px] h-3.5 bg-outline-variant/60 flex-shrink-0"></span>
              <div className="flex items-center gap-1.5 px-2 py-0.5 flex-shrink-0">
                <span className="material-symbols-outlined text-primary text-[16px]">currency_exchange</span>
                <span>$1 = 152.4¥</span>
              </div>
              <span className="w-[1px] h-3.5 bg-outline-variant/60 flex-shrink-0"></span>
              <div className="flex items-center gap-1.5 px-2 py-0.5 flex-shrink-0">
                <span className="material-symbols-outlined text-primary text-[16px]">schedule</span>
                <span>14:32 JST</span>
              </div>
              <span className="w-[1px] h-3.5 bg-outline-variant/60 flex-shrink-0"></span>
              <div className="flex items-center gap-1.5 px-2 py-0.5 flex-shrink-0">
                <span className="material-symbols-outlined text-primary text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  folder_zip
                </span>
                <span>SQLite Ready</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Inset Search Well */}
      <section className="py-1">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative flex items-center h-[52px] rounded-[18px] bg-surface-container-highest shadow-tactile-inset px-4 border border-[#eae6df]/40">
            <span className="material-symbols-outlined text-outline text-[20px] mr-2.5 select-none">search</span>
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search nearby essentials or places..."
              className="w-full bg-transparent border-none outline-none text-[13px] sm:text-[14px] text-on-surface placeholder:text-outline/80 font-medium"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="w-6 h-6 rounded-full flex items-center justify-center text-outline hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
          </div>

          {/* Toggle Map on Mobile (< md) */}
          <button 
            onClick={() => setMobileViewMode(mobileViewMode === 'list' ? 'map' : 'list')}
            aria-label="Toggle map view"
            className="md:hidden w-[52px] h-[52px] rounded-[18px] bg-surface flex items-center justify-center text-on-surface shadow-tactile active:shadow-tactile-inset transition-all"
            title={mobileViewMode === 'list' ? 'Switch to Map' : 'Switch to List'}
          >
            <span className="material-symbols-outlined text-[20px] text-primary">
              {mobileViewMode === 'list' ? 'map' : 'view_list'}
            </span>
          </button>
        </div>
      </section>

      {/* High-Value Category Filter Pills */}
      <section className="pt-3 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {CATEGORY_PILLS.map((pill) => {
            const isActive = selectedCategory === pill.id;
            return (
              <button
                key={pill.id}
                onClick={() => setSelectedCategory(pill.id)}
                className={`flex items-center gap-1.5 h-8 px-3.5 rounded-full text-[11px] sm:text-[12px] font-bold flex-shrink-0 transition-all ${
                  isActive
                    ? 'tactile-pill-active'
                    : 'tactile-pill-inactive active:scale-95'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">
                  {pill.icon}
                </span>
                <span>{pill.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Main Content Area: Responsive Split View on Tablet/Desktop (md+), Stacked on Mobile */}
      <div className="pt-3 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Column (Stream Cards) */}
        <div className={`flex flex-col gap-3.5 md:col-span-7 ${mobileViewMode === 'map' ? 'hidden md:flex' : 'flex'}`}>
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-baseline gap-2">
              <span className="text-[18px] font-extrabold text-on-surface">Surroundings Stream</span>
              <span className="text-[11px] font-semibold text-on-surface-variant">Live Proximity Ranked</span>
            </div>
            <span className="text-[11px] font-bold text-primary flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
              {dynamicPlaces.length} Verified
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-on-surface-variant text-[13px] font-medium">
              Loading proximity-indexed catalogue...
            </div>
          ) : dynamicPlaces.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-surface shadow-tactile border border-[#eae6df]">
              <span className="material-symbols-outlined text-[36px] text-outline">search_off</span>
              <p className="text-[13px] font-bold text-on-surface mt-2">No matching verified places nearby</p>
              <p className="text-[11px] text-on-surface-variant mt-1">Try clearing your search query or selecting "All Essentials"</p>
            </div>
          ) : (
            dynamicPlaces.map((place) => {
              const isSaved = savedIds.has(place.id);
              return (
                <article 
                  key={place.id}
                  onClick={() => onSelectPlace(place)}
                  className="cursor-pointer rounded-[22px] bg-surface p-4 shadow-tactile border border-[#eae6df]/80 flex flex-col gap-2.5 active:scale-[0.99] transition-all hover:border-primary/40"
                >
                  <div className="flex items-start gap-3.5">
                    {/* Photo or Category Glyph */}
                    <div className="w-20 h-20 rounded-xl p-1 bg-surface-container shadow-tactile-inset flex-shrink-0 overflow-hidden flex items-center justify-center">
                      {place.imageUrl ? (
                        <img 
                          alt={place.name} 
                          className="w-full h-full object-cover rounded-lg"
                          src={place.imageUrl}
                        />
                      ) : (
                        <div className="w-full h-full rounded-lg bg-surface flex items-center justify-center text-primary">
                          <span className="material-symbols-outlined text-[32px]">
                            {place.category === 'hospital' ? 'local_hospital' :
                             place.category === 'pharmacy' ? 'medication' :
                             place.category === 'police' ? 'local_police' :
                             place.category === 'atm' ? 'atm' :
                             place.category === 'transit_stop' ? 'train' : 'place'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Details Header */}
                    <div className="flex-1 min-w-0 flex flex-col">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-extrabold tracking-wide uppercase border ${
                          place.hours.status === 'open' 
                            ? 'bg-[#E0F2FE] text-primary border-[#BAE6FD]' 
                            : 'bg-surface-container-high text-on-surface-variant border-[#eae6df]'
                        }`}>
                          {place.hours.formatted || (place.hours.status === 'open' ? 'Open Now' : 'Hours Unknown')}
                        </span>
                        
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={(e) => handleToggleSave(e, place)}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:text-red-500 active:scale-90 transition-transform"
                            title={isSaved ? 'Saved to Offline List' : 'Save to Offline List'}
                          >
                            <span 
                              className={`material-symbols-outlined text-[19px] ${isSaved ? 'text-red-500 fill' : ''}`}
                              style={isSaved ? { fontVariationSettings: "'FILL' 1" } : undefined}
                            >
                              {isSaved ? 'favorite' : 'favorite_border'}
                            </span>
                          </button>
                          <div className="flex items-center gap-0.5 text-on-surface-variant text-[11px] font-semibold">
                            <span className="material-symbols-outlined text-[14px] text-primary">directions_walk</span>
                            <span>{Math.max(1, Math.round(place.distanceMeters / 75))} min</span>
                          </div>
                        </div>
                      </div>

                      <h2 className="text-[16px] font-extrabold text-on-surface truncate mt-1">
                        {place.name}
                      </h2>
                      
                      {place.localizedName && (
                        <p className="text-[12px] text-on-surface-variant truncate font-medium">
                          {place.localizedName}
                        </p>
                      )}

                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="text-[12px] text-primary font-bold">
                          {place.distanceMeters}m away
                        </span>
                        <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                        <span className="text-[11px] text-on-surface-variant flex items-center gap-1 font-semibold truncate">
                          {place.source === 'CURATED_REGISTRY' ? (
                            <>
                              <span className="material-symbols-outlined text-[13px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                                verified
                              </span>
                              <span>Verified Registry</span>
                            </>
                          ) : (
                            <span>OSM Validated</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Sub-Banner / Triage Note */}
                  {place.triageInfo && (
                    <div className="rounded-xl bg-[#F0F9FF] p-2.5 shadow-tactile-inset-sm flex items-center justify-between text-[11px] font-medium text-on-surface-variant border border-[#E0F2FE]">
                      <span className="flex items-center gap-1.5 truncate">
                        <span className="material-symbols-outlined text-primary text-[15px] flex-shrink-0">
                          {place.category === 'hospital' ? 'translate' : 'check_circle'}
                        </span>
                        <span className="truncate">{place.triageInfo}</span>
                      </span>
                      <span className="text-[10px] text-primary font-bold flex-shrink-0 ml-1">
                        {place.emergencyCapable ? 'Priority Tier 1' : 'Fast Access'}
                      </span>
                    </div>
                  )}

                  {/* Action Row */}
                  <div className="flex items-center gap-2 pt-1">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onStartRoute(place);
                      }}
                      className="flex-1 h-10 rounded-full bg-primary text-white text-[12px] font-bold flex items-center justify-center gap-1.5 shadow-tactile-primary active:scale-[0.98] transition-all hover:bg-secondary"
                    >
                      <span className="material-symbols-outlined text-[16px]">navigation</span>
                      <span>Start Walking</span>
                    </button>
                    
                    {place.phone ? (
                      <a
                        href={`tel:${place.phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary shadow-tactile active:scale-95 transition-transform"
                        title="Direct Phone Call"
                      >
                        <span className="material-symbols-outlined text-[18px]">call</span>
                      </a>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectPlace(place);
                        }}
                        className="h-10 px-3.5 rounded-full bg-surface-container text-primary text-[11px] font-bold shadow-tactile active:scale-95 transition-transform flex items-center gap-1"
                      >
                        <span>Details</span>
                        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                      </button>
                    )}
                  </div>
                </article>
              );
            })
          )}

          {/* Persistent Tactile Emergency SOS Trigger */}
          <section className="pt-2">
            <div className="rounded-2xl p-0.5 bg-gradient-to-br from-primary to-secondary shadow-tactile-primary">
              <button 
                onClick={onOpenEmergency}
                className="w-full py-3.5 px-4 rounded-[22px] bg-primary text-white flex items-center justify-between active:scale-[0.985] transition-transform select-none"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-[24px] text-white" style={{ fontVariationSettings: "'FILL' 1" }}>
                      health_and_safety
                    </span>
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-[15px] font-extrabold text-white leading-tight">
                      Emergency SOS {location.cityName.split(',')[0]}
                    </span>
                    <span className="text-[11px] text-white/90 font-medium">
                      Hotlines & Instant Location Beacon
                    </span>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-[18px] text-white">arrow_forward</span>
                </div>
              </button>
            </div>
          </section>
        </div>

        {/* Right Column (Interactive Live Leaflet Map - Visible permanently on Tablet/Desktop, toggled on mobile) */}
        <div className={`md:col-span-5 md:sticky md:top-20 flex-col gap-3 ${mobileViewMode === 'map' ? 'flex' : 'hidden md:flex'}`}>
          <div className="rounded-2xl overflow-hidden border border-[#eae6df] shadow-tactile p-2 bg-surface flex flex-col gap-2">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-primary">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>OpenStreetMap Live Layer</span>
              </div>
              <button 
                onClick={onRequestGPS}
                className="px-2.5 py-1 rounded-full bg-surface text-primary border border-primary/30 shadow-tactile-sm flex items-center gap-1 text-[11px] font-bold active:scale-95 transition-transform"
                title="Center on user GPS position"
              >
                <span className="material-symbols-outlined text-[14px]">my_location</span>
                <span>Center GPS</span>
              </button>
            </div>

            <div className="relative w-full h-80 sm:h-96 md:h-[540px] rounded-xl overflow-hidden shadow-inner">
              <LiveLeafletMap
                userLocation={location.coords}
                places={dynamicPlaces}
                onSelectPlace={onSelectPlace}
                className="w-full h-full"
              />
            </div>
            
            <div className="px-2 py-1 flex items-center justify-between text-[10px] text-on-surface-variant font-mono">
              <span>{location.coords.latitude.toFixed(5)}°, {location.coords.longitude.toFixed(5)}°</span>
              <span>{dynamicPlaces.length} OSM POIs Plotted</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Notice */}
      <footer className="pt-6 pb-6 text-center select-none">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container shadow-tactile-inset-sm">
          <span className="material-symbols-outlined text-[13px] text-outline">map</span>
          <span className="text-[10px] text-on-surface-variant font-medium">
            Map data © OpenStreetMap contributors (ODbL) • No Remote User Tracking
          </span>
        </div>
      </footer>
    </div>
  );
};
