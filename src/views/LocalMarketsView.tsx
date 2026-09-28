import React, { useState, useEffect, useMemo } from 'react';
import { LocalMarket, LocalMarketSpecialty, Place, LocationCoordinates } from '../types';
import { marketService, MARKET_SPECIALTIES } from '../services/marketService';
import { LiveLocationState } from '../hooks/useLiveLocation';
import { LiveLeafletMap } from '../components/LiveLeafletMap';

interface LocalMarketsViewProps {
  location: LiveLocationState;
  activeCityId: string;
  onStartRoute: (place: Place) => void;
  onSelectPlace: (place: Place) => void;
}

export const LocalMarketsView: React.FC<LocalMarketsViewProps> = ({
  location,
  activeCityId,
  onStartRoute,
  onSelectPlace
}) => {
  const [markets, setMarkets] = useState<LocalMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSpecialty, setSelectedSpecialty] = useState<LocalMarketSpecialty | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileViewMode, setMobileViewMode] = useState<'list' | 'map'>('list');
  const [selectedMarketId, setSelectedMarketId] = useState<string | null>(null);

  // Focus map coordinates when user taps "View on Map"
  const [focusedLocation, setFocusedLocation] = useState<LocationCoordinates>(location.coords);

  // Synchronize map center when user changes location
  useEffect(() => {
    setFocusedLocation(location.coords);
    setSelectedMarketId(null);
  }, [location.coords.latitude, location.coords.longitude, location.cityName]);

  // Fetch local markets dynamically
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    marketService.getLocalMarkets(location, searchQuery, selectedSpecialty)
      .then(res => {
        if (isMounted) {
          setMarkets(res);
          setLoading(false);
        }
      })
      .catch(err => {
        console.warn('Failed to load local markets:', err);
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [location.coords.latitude, location.coords.longitude, location.cityName, location.matchedCityId, activeCityId, selectedSpecialty, searchQuery]);

  // Convert markets to places for Leaflet Map
  const mapPlaces: Place[] = useMemo(() => {
    return markets.map(m => marketService.marketToPlace(m));
  }, [markets]);

  // Handle "View on Map"
  const handleFocusMarketOnMap = (market: LocalMarket) => {
    setSelectedMarketId(market.id);
    setFocusedLocation(market.location);
    if (window.innerWidth < 768) {
      setMobileViewMode('map');
    }
  };

  const cityNameClean = location.cityName.split(',')[0].trim();

  return (
    <div className="flex-1 w-full px-4 sm:px-6 lg:px-8 xl:px-10 pb-28 pt-2">
      {/* Editorial Destination Header */}
      <section className="pt-2 pb-3">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-7 text-white shadow-md">
          <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] font-semibold text-sky-200 mb-2">
                <span className="material-symbols-outlined text-[14px] text-amber-400">storefront</span>
                <span>Specialty Market Hub</span>
                <span>•</span>
                <span>{cityNameClean}</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
                {cityNameClean} Local Bazaars & Markets
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 font-medium max-w-2xl">
                Explore famous wholesale hubs, electronics tech corridors, budget clothes lanes, automobile spare parts scrap yards, spice alleys & heritage jewelry markets.
              </p>
            </div>

            {/* Quick Stats Pill */}
            <div className="flex items-center gap-2">
              <div className="px-3.5 py-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center gap-2.5 text-xs font-semibold text-white">
                <span className="material-symbols-outlined text-[20px] text-emerald-400">shopping_bag</span>
                <div>
                  <span className="block font-black text-sm text-white">{markets.length} Markets</span>
                  <span className="text-[10px] text-slate-300 font-medium">Verified by locals</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search Input Bar */}
      <section className="py-1">
        <div className="flex items-center gap-2.5">
          <div className="flex-1 relative flex items-center h-12 rounded-2xl bg-white border border-slate-200/90 shadow-sm px-4 focus-within:ring-2 focus-within:ring-sky-500/20 focus-within:border-sky-500 transition-all">
            <span className="material-symbols-outlined text-slate-400 text-[20px] mr-2.5 select-none">search</span>
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by market name or goods (e.g. laptops, dresses, car parts, saffron, lehenga, silver)..."
              className="w-full bg-transparent border-none outline-none text-sm text-slate-900 placeholder:text-slate-400 font-medium"
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

          {/* Toggle Map on Mobile (< md) */}
          <button 
            onClick={() => setMobileViewMode(mobileViewMode === 'list' ? 'map' : 'list')}
            aria-label="Toggle map view"
            className="md:hidden h-12 px-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-1.5 text-xs font-bold text-slate-700 active:scale-95 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px] text-sky-600">
              {mobileViewMode === 'list' ? 'map' : 'view_list'}
            </span>
            <span>{mobileViewMode === 'list' ? 'Map' : 'List'}</span>
          </button>
        </div>
      </section>

      {/* Specialty Filter Pills */}
      <section className="pt-2 pb-1">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {MARKET_SPECIALTIES.map((spec) => {
            const isActive = selectedSpecialty === spec.id;
            return (
              <button
                key={spec.id}
                onClick={() => setSelectedSpecialty(spec.id)}
                className={`flex items-center gap-1.5 h-9 px-3.5 rounded-full text-xs font-bold flex-shrink-0 transition-all cursor-pointer select-none ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-sm ring-2 ring-sky-600/20'
                    : 'bg-white text-slate-700 border border-slate-200/90 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <span>{spec.emoji}</span>
                <span>{spec.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Main Content Area: Responsive Split Grid */}
      <div className="pt-3 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Column: Markets List */}
        <div className={`flex flex-col gap-4 md:col-span-7 lg:col-span-7 xl:col-span-7 ${mobileViewMode === 'map' ? 'hidden md:flex' : 'flex'}`}>
          <div className="flex items-center justify-between pb-1 px-0.5">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-slate-900">Featured Markets</span>
              <span className="text-xs font-medium text-slate-500">Sorted by distance from you</span>
            </div>
            <span className="text-xs font-semibold text-sky-600 flex items-center gap-1.5 bg-sky-50 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
              <span>{markets.length} Listed</span>
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-500 text-sm font-medium flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-[20px] animate-spin text-sky-600">progress_activity</span>
              <span>Discovering verified markets in {cityNameClean}...</span>
            </div>
          ) : markets.length === 0 ? (
            <div className="p-10 text-center rounded-2xl bg-white shadow-sm border border-slate-200/80 flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
                <span className="material-symbols-outlined text-[28px]">storefront</span>
              </div>
              <p className="text-sm font-bold text-slate-800 mt-1">No markets found for this filter</p>
              <p className="text-xs text-slate-500 max-w-xs">
                Try selecting "All Markets" or searching for a different item like "clothes", "electronics", or "spices".
              </p>
            </div>
          ) : (
            markets.map((market) => {
              const specMeta = MARKET_SPECIALTIES.find(s => s.id === market.specialty) || MARKET_SPECIALTIES[0];
              const distDisplay = market.distanceMeters !== undefined
                ? market.distanceMeters >= 1000
                  ? `${(market.distanceMeters / 1000).toFixed(1)} km`
                  : `${market.distanceMeters} m`
                : '';
              const driveMins = market.distanceMeters ? Math.max(1, Math.round(market.distanceMeters / 400)) : null;

              const isHighlighted = selectedMarketId === market.id;

              return (
                <article
                  key={market.id}
                  className={`rounded-2xl bg-white p-5 border shadow-sm hover:shadow-md transition-all flex flex-col gap-4 ${
                    isHighlighted ? 'border-sky-500 ring-2 ring-sky-500/20' : 'border-slate-200/80'
                  }`}
                >
                  {/* Market Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center text-2xl flex-shrink-0 shadow-inner">
                        {specMeta.emoji}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${specMeta.badgeClass}`}>
                            {market.specialtyLabel}
                          </span>
                          {market.closedOn && (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-100">
                              {market.closedOn}
                            </span>
                          )}
                        </div>
                        <h2 className="text-lg font-extrabold text-slate-900 leading-tight">
                          {market.name}
                        </h2>
                        <p className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px] text-slate-400">location_on</span>
                          <span>{market.address}</span>
                        </p>
                      </div>
                    </div>

                    {/* Distance & Travel Badge */}
                    {distDisplay && (
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-1 flex-shrink-0">
                        <span className="text-xs font-black text-slate-900 bg-slate-100 px-2.5 py-1 rounded-xl">
                          {distDisplay} away
                        </span>
                        {driveMins && (
                          <span className="text-[11px] text-slate-500 font-medium">
                            ~{driveMins} min drive
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Market Banner Photo (if available) */}
                  {market.imageUrl && (
                    <div className="relative w-full h-44 rounded-xl overflow-hidden bg-slate-100 shadow-inner">
                      <img 
                        src={market.imageUrl} 
                        alt={market.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white text-[11px] font-semibold flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[13px] text-amber-400">schedule</span>
                        <span>{market.timings}</span>
                      </div>
                    </div>
                  )}

                  {/* "Famous For" Highlight Callout */}
                  <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100 flex flex-col gap-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-amber-600">stars</span>
                      <span>Famous For</span>
                    </span>
                    <p className="text-xs font-medium text-slate-800 leading-relaxed">
                      {market.famousFor}
                    </p>
                  </div>

                  {/* "What To Buy" Tags */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Popular Items & Best Buys:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {market.whatToBuy.map((item, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200/60"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Transit & Insider Bargaining Advice Strip */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {market.metroStation && (
                      <div className="p-2.5 rounded-xl bg-sky-50/70 border border-sky-100 text-sky-900 flex items-start gap-2">
                        <span className="material-symbols-outlined text-[18px] text-sky-600 flex-shrink-0 mt-0.5">
                          subway
                        </span>
                        <div>
                          <span className="font-bold block text-[11px] text-sky-800">Nearest Metro / Transit</span>
                          <span className="font-medium text-[11px]">{market.metroStation}</span>
                        </div>
                      </div>
                    )}

                    {market.bargainingTip && (
                      <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-100 text-amber-900 flex items-start gap-2">
                        <span className="material-symbols-outlined text-[18px] text-amber-600 flex-shrink-0 mt-0.5">
                          tips_and_updates
                        </span>
                        <div>
                          <span className="font-bold block text-[11px] text-amber-800">Insider Bargaining Tip</span>
                          <span className="font-medium text-[11px] leading-tight">{market.bargainingTip}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => onStartRoute(marketService.marketToPlace(market))}
                      className="flex-1 h-9 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">navigation</span>
                      <span>Get Directions</span>
                    </button>

                    <button
                      onClick={() => handleFocusMarketOnMap(market)}
                      className="h-9 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200/70 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px] text-sky-600">map</span>
                      <span>View on Map</span>
                    </button>

                    <button
                      onClick={() => onSelectPlace(marketService.marketToPlace(market))}
                      className="h-9 px-3 rounded-xl bg-slate-100 hover:bg-slate-200/70 text-slate-700 text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                    >
                      <span>Details</span>
                      <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </div>

        {/* Right Column: Sticky Interactive Leaflet Map */}
        <div className={`md:col-span-5 lg:col-span-5 xl:col-span-5 md:sticky md:top-20 flex-col gap-3 ${mobileViewMode === 'map' ? 'flex' : 'hidden md:flex'}`}>
          <div className="rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm p-3 bg-white flex flex-col gap-2.5">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Markets Map Overview</span>
              </div>
              <span className="text-[11px] font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-lg">
                {markets.length} locations
              </span>
            </div>

            <div className="relative w-full h-80 sm:h-96 md:h-[calc(100vh-140px)] md:min-h-[560px] rounded-xl overflow-hidden border border-slate-100">
              <LiveLeafletMap
                userLocation={focusedLocation}
                places={mapPlaces}
                onSelectPlace={(p) => {
                  const m = markets.find(m => `market-${m.id}` === p.id);
                  if (m) {
                    setSelectedMarketId(m.id);
                  }
                  onSelectPlace(p);
                }}
                isMapVisible={mobileViewMode === 'map'}
                className="w-full h-full"
              />
            </div>

            <div className="px-1 flex items-center justify-between text-[11px] text-slate-400 font-medium">
              <span>Center: {focusedLocation.latitude.toFixed(4)}°, {focusedLocation.longitude.toFixed(4)}°</span>
              <span className="text-slate-600 font-semibold">{cityNameClean} Hub</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
