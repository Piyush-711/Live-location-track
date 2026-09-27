import React, { useState, useEffect } from 'react';
import { Place, Category } from '../types';
import { api } from '../services/api';
import { storage } from '../services/storage';
import { CITIES } from '../data/mockData';

interface ExploreViewProps {
  activeCityId: string;
  onSelectPlace: (place: Place) => void;
  onStartRoute: (place: Place) => void;
  onOpenEmergency: () => void;
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
  activeCityId,
  onSelectPlace,
  onStartRoute,
  onOpenEmergency
}) => {
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  const activeCity = CITIES.find(c => c.id === activeCityId) || CITIES[0];

  // Refresh places when city, category or search query changes
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    api.getNearbyPlaces(activeCityId, selectedCategory, searchQuery)
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
  }, [activeCityId, selectedCategory, searchQuery]);

  // Sync saved places IDs
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
    <div className="flex-1 flex flex-col w-full max-w-md mx-auto px-4 pb-28 pt-2">
      {/* Live Context Hero (Tactile Card) */}
      <section className="pt-2 pb-3">
        <div className="relative overflow-hidden rounded-2xl bg-surface-container-low p-4 shadow-tactile border border-[#eae6df]/80">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#E0F2FE] text-primary shadow-[-2px_-2px_5px_rgba(255,255,255,0.9),2px_2px_4px_rgba(180,172,158,0.35)]">
                  <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    near_me
                  </span>
                </span>
                <span className="text-[10px] uppercase tracking-wider text-primary font-extrabold">
                  Live Positioning
                </span>
              </div>
              <h1 className="text-[22px] font-extrabold text-on-surface tracking-tight leading-tight">
                {activeCity.name}
              </h1>
              <p className="text-[12px] text-on-surface-variant mt-0.5 font-medium">
                {activeCity.countryCode === 'JP' ? 'Higashiyama Ward • Historic District Sub-mesh' : `${activeCity.country} • Verified Pilot Node`}
              </p>
            </div>
            
            <div className="flex flex-col items-end">
              <div className="px-2.5 py-1 rounded-full bg-surface-container shadow-tactile-inset-sm flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
                <span className="text-[10px] text-primary font-extrabold">L-BAND FIXED</span>
              </div>
              <span className="text-[11px] text-on-surface-variant mt-1 font-semibold">
                Accuracy ±3m
              </span>
            </div>
          </div>

          {/* Quick Utility Ribbon (Debossed Tactile Strip) */}
          <div className="mt-3.5 pt-1">
            <div className="rounded-xl bg-surface-variant/80 p-2 shadow-tactile-inset flex items-center justify-between gap-1 overflow-x-auto text-[11px] font-semibold text-on-surface">
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
          <div className="flex-1 relative flex items-center h-[50px] rounded-[18px] bg-surface-container-highest shadow-tactile-inset px-3.5 border border-[#eae6df]/40">
            <span className="material-symbols-outlined text-outline text-[20px] mr-2 select-none">search</span>
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search nearby essentials or places..."
              className="w-full bg-transparent border-none outline-none text-[13px] text-on-surface placeholder:text-outline/80 font-medium"
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
          <button 
            onClick={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
            aria-label="Toggle map view"
            className="w-[50px] h-[50px] rounded-[18px] bg-surface flex items-center justify-center text-on-surface shadow-tactile active:shadow-tactile-inset transition-all"
            title={viewMode === 'list' ? 'Switch to Map' : 'Switch to List'}
          >
            <span className="material-symbols-outlined text-[20px] text-primary">
              {viewMode === 'list' ? 'map' : 'view_list'}
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
                className={`flex items-center gap-1.5 h-8 px-3 rounded-full text-[11px] font-bold flex-shrink-0 transition-all ${
                  isActive
                    ? 'tactile-pill-active'
                    : 'tactile-pill-inactive active:scale-95'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">
                  {pill.icon}
                </span>
                <span>{pill.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Surroundings Stream Header */}
      <div className="pt-3 pb-2 flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <span className="text-[17px] font-extrabold text-on-surface">Surroundings Stream</span>
          <span className="text-[11px] font-semibold text-on-surface-variant">Proximity Indexed</span>
        </div>
        <span className="text-[11px] font-bold text-primary flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
          {places.length} Verified
        </span>
      </div>

      {/* Map View Toggle Mode */}
      {viewMode === 'map' && (
        <div className="mb-4 rounded-2xl overflow-hidden border border-[#eae6df] shadow-tactile p-1 bg-surface">
          <div className="relative w-full h-64 rounded-xl overflow-hidden bg-[#e4e9ec] flex items-center justify-center">
            {/* Simulated Vector Map with Pins */}
            <div className="absolute inset-0 bg-[#e5ece9] opacity-90" style={{
              backgroundImage: 'radial-gradient(#c7d4cc 1.5px, transparent 1.5px), radial-gradient(#c7d4cc 1.5px, #e5ece9 1.5px)',
              backgroundSize: '30px 30px',
              backgroundPosition: '0 0, 15px 15px'
            }}></div>
            
            {/* Map Roads / River Graphic */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
              <path d="M 0 120 Q 150 140 250 80 T 430 110" stroke="#bae6fd" strokeWidth="18" fill="none" opacity="0.8" />
              <path d="M 60 0 L 140 260" stroke="#ffffff" strokeWidth="8" fill="none" />
              <path d="M 0 160 L 430 160" stroke="#ffffff" strokeWidth="10" fill="none" />
              <path d="M 280 0 L 320 260" stroke="#ffffff" strokeWidth="6" fill="none" />
              <circle cx="140" cy="160" r="14" fill="#0284c7" fillOpacity="0.2" />
              <circle cx="140" cy="160" r="6" fill="#0284c7" />
            </svg>

            {/* Floating POI pins on map */}
            {places.map((place, idx) => {
              const offsets = [
                { top: '35%', left: '60%' },
                { top: '55%', left: '40%' },
                { top: '25%', left: '30%' },
                { top: '65%', left: '75%' }
              ];
              const pos = offsets[idx % offsets.length];
              return (
                <div 
                  key={place.id}
                  onClick={() => onSelectPlace(place)}
                  style={{ top: pos.top, left: pos.left }}
                  className="absolute cursor-pointer -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group"
                >
                  <div className="px-2 py-1 rounded-full bg-surface shadow-tactile border border-primary/30 flex items-center gap-1 text-[10px] font-bold text-on-surface whitespace-nowrap active:scale-95 transition-transform">
                    <span className="w-2 h-2 rounded-full bg-primary"></span>
                    <span>{place.name.split(' ')[0]}</span>
                    <span className="text-primary font-bold">{place.distanceMeters}m</span>
                  </div>
                  <div className="w-2 h-2 bg-primary rotate-45 -mt-1 shadow-sm"></div>
                </div>
              );
            })}

            <div className="absolute bottom-2 left-2 px-2 py-1 rounded-lg bg-surface/90 backdrop-blur-sm text-[10px] font-bold text-on-surface-variant border border-[#eae6df]">
              GPS Centered: {activeCity.name}
            </div>
            <div className="absolute bottom-2 right-2 px-2 py-1 rounded-lg bg-surface/90 backdrop-blur-sm text-[10px] font-bold text-primary border border-primary/20">
              Offline Vector Tiles
            </div>
          </div>
        </div>
      )}

      {/* Surroundings Stream (Cards Ranked by Proximity) */}
      <section className="flex flex-col gap-3.5 pb-4">
        {loading ? (
          <div className="p-8 text-center text-on-surface-variant text-[13px] font-medium">
            Loading proximity-indexed catalogue...
          </div>
        ) : places.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-surface shadow-tactile border border-[#eae6df]">
            <span className="material-symbols-outlined text-[36px] text-outline">search_off</span>
            <p className="text-[13px] font-bold text-on-surface mt-2">No matching verified places nearby</p>
            <p className="text-[11px] text-on-surface-variant mt-1">Try clearing your search query or selecting "All Essentials"</p>
          </div>
        ) : (
          places.map((place) => {
            const isSaved = savedIds.has(place.id);
            return (
              <article 
                key={place.id}
                onClick={() => onSelectPlace(place)}
                className="cursor-pointer rounded-[20px] bg-surface p-3.5 shadow-tactile border border-[#eae6df]/80 flex flex-col gap-2.5 active:scale-[0.99] transition-all hover:border-primary/40"
              >
                <div className="flex items-start gap-3">
                  {/* Photo or Category Glyph */}
                  <div className="w-18 h-18 rounded-xl p-1 bg-surface-container shadow-tactile-inset flex-shrink-0 overflow-hidden flex items-center justify-center">
                    {place.imageUrl ? (
                      <img 
                        alt={place.name} 
                        className="w-16 h-16 object-cover rounded-lg"
                        src={place.imageUrl}
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-surface flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-[28px]">
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
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold tracking-wide uppercase border ${
                        place.hours.status === 'open' 
                          ? 'bg-[#E0F2FE] text-primary border-[#BAE6FD]' 
                          : 'bg-surface-container-high text-on-surface-variant border-[#eae6df]'
                      }`}>
                        {place.hours.formatted || (place.hours.status === 'open' ? 'Open Now' : 'Hours Unknown')}
                      </span>
                      
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={(e) => handleToggleSave(e, place)}
                          className="w-7 h-7 rounded-full flex items-center justify-center text-outline hover:text-red-500 active:scale-90 transition-transform"
                          title={isSaved ? 'Saved to Offline List' : 'Save to Offline List'}
                        >
                          <span 
                            className={`material-symbols-outlined text-[18px] ${isSaved ? 'text-red-500 fill' : ''}`}
                            style={isSaved ? { fontVariationSettings: "'FILL' 1" } : undefined}
                          >
                            {isSaved ? 'favorite' : 'favorite_border'}
                          </span>
                        </button>
                        <div className="flex items-center gap-0.5 text-on-surface-variant text-[11px] font-semibold">
                          <span className="material-symbols-outlined text-[13px] text-primary">directions_walk</span>
                          <span>{Math.max(1, Math.round(place.distanceMeters / 75))} min</span>
                        </div>
                      </div>
                    </div>

                    <h2 className="text-[15px] font-extrabold text-on-surface truncate mt-1">
                      {place.name}
                    </h2>
                    
                    {place.localizedName && (
                      <p className="text-[11px] text-on-surface-variant truncate font-medium">
                        {place.localizedName}
                      </p>
                    )}

                    <div className="flex items-center gap-2 mt-1 flex-wrap">
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
                          <span>OSM Direct Validated</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sub-Banner / Triage Note if present */}
                {place.triageInfo && (
                  <div className="rounded-xl bg-[#F0F9FF] p-2 shadow-tactile-inset-sm flex items-center justify-between text-[11px] font-medium text-on-surface-variant border border-[#E0F2FE]">
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
                <div className="flex items-center gap-2 pt-0.5">
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
      </section>

      {/* Persistent Tactile Emergency SOS Action Trigger */}
      <section className="pt-1 pb-4">
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
                  Emergency SOS {activeCity.name.split(',')[0]}
                </span>
                <span className="text-[11px] text-white/90 font-medium">
                  {activeCity.countryCode === 'JP' ? 'Hotlines (119/110) & Instant Mesh Help' : 'Direct Emergency Hotlines & Location Beacon'}
                </span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-[18px] text-white">arrow_forward</span>
            </div>
          </button>
        </div>
      </section>

      {/* Footer Notice: OSM & Spec Licensing */}
      <footer className="pt-2 pb-6 text-center select-none">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container shadow-tactile-inset-sm">
          <span className="material-symbols-outlined text-[13px] text-outline">map</span>
          <span className="text-[10px] text-on-surface-variant font-medium">
            Map data © OpenStreetMap contributors (ODbL) • No User Tracking
          </span>
        </div>
      </footer>
    </div>
  );
};
