import React, { useState, useEffect, useMemo } from 'react';
import { Place, Category, WeatherReport } from '../types';
import { api } from '../services/api';
import { storage } from '../services/storage';
import { LiveLocationState, calculateDistanceMeters } from '../hooks/useLiveLocation';
import { LiveLeafletMap } from '../components/LiveLeafletMap';
import { fxService } from '../services/fxService';
import { PlaceThumbnail } from '../components/PlaceThumbnail';
import { useDesktopMap } from '../hooks/useDesktopMap';

interface ExploreViewProps {
  location: LiveLocationState;
  activeCityId: string;
  onSelectPlace: (place: Place) => void;
  onStartRoute: (place: Place) => void;
  onOpenEmergency: () => void;
  onRequestGPS: () => void;
}

function getLocalTimeInfo(countryCode: string): { timeStr: string; tzCode: string } {
  const code = (countryCode || 'IN').toUpperCase();
  let timeZone = 'Asia/Kolkata';
  let tzCode = 'IST';

  if (code === 'JP') {
    timeZone = 'Asia/Tokyo';
    tzCode = 'JST';
  } else if (code === 'GB') {
    timeZone = 'Europe/London';
    tzCode = 'BST';
  } else if (code === 'US') {
    timeZone = 'America/New_York';
    tzCode = 'EDT';
  } else if (code === 'FR' || code === 'DE' || code === 'IT' || code === 'ES') {
    timeZone = 'Europe/Paris';
    tzCode = 'CEST';
  } else if (code === 'AU') {
    timeZone = 'Australia/Sydney';
    tzCode = 'AEST';
  } else if (code === 'AE') {
    timeZone = 'Asia/Dubai';
    tzCode = 'GST';
  }

  try {
    const formatted = new Intl.DateTimeFormat('en-GB', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(new Date());
    return { timeStr: formatted, tzCode };
  } catch {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    return { timeStr: `${hh}:${mm}`, tzCode };
  }
}

function getRibbonFXText(countryCode: string, rates: Record<string, number> | null): string {
  if (!rates) return 'Rates unavailable';
  const code = (countryCode || 'IN').toUpperCase();

  if (code === 'JP' && rates.JPY) {
    return `$1 = ${rates.JPY.toFixed(1)}¥`;
  }
  if (code === 'GB' && rates.GBP) {
    return `$1 = £${rates.GBP.toFixed(2)}`;
  }
  if (code === 'US' && rates.EUR) {
    return `€1 = $${(1 / rates.EUR).toFixed(2)}`;
  }
  if ((code === 'FR' || code === 'DE' || code === 'IT' || code === 'ES') && rates.EUR) {
    return `$1 = ${rates.EUR.toFixed(2)}€`;
  }
  if (code === 'AU' && rates.AUD) {
    return `$1 = A$${rates.AUD.toFixed(2)}`;
  }
  if (code === 'AE' && rates.AED) {
    return `$1 = ${rates.AED.toFixed(2)} AED`;
  }
  if (rates.INR) {
    return `$1 = ₹${rates.INR.toFixed(1)}`;
  }
  return 'Rates unavailable';
}

const CATEGORY_PILLS: { id: Category | 'all'; label: string; icon: string }[] = [
  { id: 'all', label: 'All Places', icon: 'explore' },
  { id: 'historic', label: 'Raj Mahal & Heritage', icon: 'castle' },
  { id: 'museum', label: 'Museums', icon: 'museum' },
  { id: 'beach', label: 'Beaches', icon: 'beach_access' },
  { id: 'attraction', label: 'Attractions', icon: 'attractions' },
  { id: 'hospital', label: 'Hospitals & ER', icon: 'local_hospital' },
  { id: 'pharmacy', label: 'Pharmacies', icon: 'medication' },
  { id: 'atm', label: 'ATMs & Cash', icon: 'atm' },
  { id: 'transit_stop', label: 'Transit', icon: 'train' },
  { id: 'cafe', label: 'Cafes & Dining', icon: 'restaurant' },
  { id: 'police', label: 'Police', icon: 'local_police' },
  { id: 'supermarket', label: 'Shops', icon: 'shopping_basket' }
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

  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const desktopMap = useDesktopMap();

  // Ribbon live telemetry: weather, currency, local clock
  const [ribbonWeather, setRibbonWeather] = useState<{
    tempC: number;
    condition: string;
    icon: string;
  } | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [ribbonRates, setRibbonRates] = useState<Record<string, number> | null>(null);
  const [localTimeInfo, setLocalTimeInfo] = useState<{ timeStr: string; tzCode: string }>(() =>
    getLocalTimeInfo(location.countryCode)
  );

  // Dynamic local clock
  useEffect(() => {
    const updateTime = () => setLocalTimeInfo(getLocalTimeInfo(location.countryCode));
    updateTime();
    const timer = setInterval(updateTime, 10000);
    return () => clearInterval(timer);
  }, [location.countryCode]);

  // Real-time live temperature and weather for current location
  useEffect(() => {
    let isCurrent = true;
    setRibbonWeather(null);
    setWeatherLoading(true);
    api.getWeather(activeCityId, location.coords, location.cityName)
      .then((w: WeatherReport) => {
        if (isCurrent && w && typeof w.tempC === 'number') {
          const icon = (w as any).conditionIcon || 'wb_sunny';
          setRibbonWeather({
            tempC: w.tempC,
            condition: w.condition,
            icon
          });
        }
      })
      .catch(() => {})
      .finally(() => { if (isCurrent) setWeatherLoading(false); });

    return () => { isCurrent = false; };
  }, [location.coords.latitude, location.coords.longitude, location.cityName, activeCityId]);

  // Real-time live currency exchange rate
  useEffect(() => {
    let isCurrent = true;
    fxService.getRates().then(r => {
      if (isCurrent && r?.rates) {
        setRibbonRates(r.rates);
      }
    }).catch(() => {});

    return () => { isCurrent = false; };
  }, []);

  // One request owns the visible pool. Rounded coordinates avoid a new search for every GPS tick.
  const requestLatitude = Number(location.coords.latitude.toFixed(3));
  const requestLongitude = Number(location.coords.longitude.toFixed(3));
  useEffect(() => {
    let current = true;
    setLoading(true);
    setLoadError(null);
    setPlaces([]);
    const timer = setTimeout(() => {
      const query = searchQuery.trim();
      api.getNearbyPlaces(activeCityId, selectedCategory, query.length >= 2 ? query : undefined, query.length >= 2 ? 25000 : 12000,
        { latitude: requestLatitude, longitude: requestLongitude })
        .then(result => { if (current) setPlaces(result.items); })
        .catch(() => { if (current) setLoadError('Places could not be loaded. Check your connection or try another search.'); })
        .finally(() => { if (current) setLoading(false); });
    }, 300);
    return () => { current = false; clearTimeout(timer); };
  }, [activeCityId, requestLatitude, requestLongitude, searchQuery, selectedCategory]);
  // Dynamically compute real-time distance and instant search filtering with semantic matching
  const dynamicPlaces = useMemo(() => {
    let filtered = places || [];
    const hasSearch = Boolean(searchQuery && searchQuery.trim().length >= 1);

    // If NO search query, filter strictly by selected category pill
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p && p.category === selectedCategory);
    }

    // Instant real-time search filtering across name, localized name, address, tags, and category keywords
    if (hasSearch) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(p => {
        if (!p) return false;
        // Direct text match
        if (p.name && p.name.toLowerCase().includes(q)) return true;
        if (p.localizedName && p.localizedName.toLowerCase().includes(q)) return true;
        if (p.address && p.address.toLowerCase().includes(q)) return true;
        if (p.city && p.city.toLowerCase().includes(q)) return true;
        if (p.tags && p.tags.some(t => t.toLowerCase().includes(q))) return true;

        // Category & semantic intent matching
        if (p.category && p.category.toLowerCase().includes(q)) return true;
        if ((q.includes('hosp') || q.includes('clinic') || q.includes('doctor') || q.includes('er') || q.includes('casualty') || q.includes('medical') || q.includes('health') || q.includes('trauma')) && p.category === 'hospital') {
          return true;
        }
        if ((q.includes('pharm') || q.includes('chem') || q.includes('med') || q.includes('drug') || q.includes('rx') || q.includes('dispens')) && p.category === 'pharmacy') {
          return true;
        }
        if ((q.includes('police') || q.includes('cop') || q.includes('station') || q.includes('patrol') || q.includes('security') || q.includes('thana')) && p.category === 'police') {
          return true;
        }
        if ((q.includes('atm') || q.includes('cash') || q.includes('bank') || q.includes('money')) && p.category === 'atm') {
          return true;
        }
        if ((q.includes('transit') || q.includes('bus') || q.includes('train') || q.includes('metro') || q.includes('subway') || q.includes('station') || q.includes('stop')) && p.category === 'transit_stop') {
          return true;
        }
        if ((q.includes('supermarket') || q.includes('grocer') || q.includes('market') || q.includes('shop') || q.includes('store') || q.includes('food') || q.includes('bazaar') || q.includes('provisions')) && p.category === 'supermarket') {
          return true;
        }
        if ((q.includes('cafe') || q.includes('coffee') || q.includes('tea') || q.includes('bakery') || q.includes('snack') || q.includes('drink') || q.includes('restaurant') || q.includes('dhaba')) && p.category === 'cafe') {
          return true;
        }
        if ((q.includes('historic') || q.includes('monument') || q.includes('fort') || q.includes('palace') || q.includes('heritage') || q.includes('ancient') || q.includes('tomb') || q.includes('qila')) && p.category === 'historic') {
          return true;
        }
        if ((q.includes('museum') || q.includes('gallery') || q.includes('art') || q.includes('exhibit')) && p.category === 'museum') {
          return true;
        }
        if ((q.includes('beach') || q.includes('sea') || q.includes('shore') || q.includes('coast')) && p.category === 'beach') {
          return true;
        }
        if ((q.includes('tourist') || q.includes('attraction') || q.includes('sight') || q.includes('viewpoint') || q.includes('park')) && p.category === 'attraction') {
          return true;
        }

        return false;
      });
    }

    const userLat = location?.coords?.latitude;
    const userLon = location?.coords?.longitude;

    return filtered.map(p => {
      const liveDist = (p && p.location && typeof p.location.latitude === 'number' && typeof p.location.longitude === 'number' && typeof userLat === 'number' && typeof userLon === 'number')
        ? calculateDistanceMeters(
            userLat,
            userLon,
            p.location.latitude,
            p.location.longitude
          )
        : 999999;
      return {
        ...p,
        distanceMeters: liveDist
      };
    }).sort((a, b) => {
      if (a.distanceMeters !== b.distanceMeters) {
        return a.distanceMeters - b.distanceMeters;
      }
      return (a.id || '').localeCompare(b.id || '');
    });
  }, [places, selectedCategory, searchQuery, location?.coords]);

  const displayCityName = (location?.cityName || 'Current Location').split(',')[0].trim() || 'Current Location';

  const refreshSavedState = () => {
    const saved = storage.getSavedPlaces();
    setSavedIds(new Set(saved.map(s => s.placeId)));
  };

  useEffect(() => {
    refreshSavedState();
    return storage.subscribeSavedPlaces(refreshSavedState);
  }, []);

  const handleToggleSave = async (e: React.MouseEvent, place: Place) => {
    e.stopPropagation();
    try {
      await storage.toggleSavePlace(place);
      setSaveError(null);
    } catch (error) { setSaveError(error instanceof Error ? error.message : 'Unable to save this place.'); }
  };

  return (
    <div className="flex-1 w-full px-4 sm:px-6 lg:px-8 xl:px-10 pb-28 pt-2">
      {saveError && <p role="alert" className="p-3 text-sm text-rose-700">{saveError}</p>}
      {loadError && <p role="alert" className="p-3 text-sm text-rose-700">{loadError}</p>}
      {/* Human Editorial Destination Hero */}
      <section className="pt-2 pb-3">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-sky-950 p-6 sm:p-7 text-white shadow-md">
          <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] font-semibold text-sky-200 mb-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{location.isCustom ? 'Custom Location' : location.status === 'fixed' ? 'Live GPS Active' : 'City Hub'}</span>
                <span>•</span>
                <span>{displayCityName}</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
                Explore {displayCityName}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 font-medium max-w-xl">
                Historic forts, palaces, museums, scenic beaches, local cafes and nearby services.
              </p>
            </div>

            {/* Travel Telemetry Strip */}
            <div className="flex flex-wrap items-center gap-2 pt-1 md:pt-0">
              {/* Weather Chip */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 text-xs font-semibold text-white">
                <span className="material-symbols-outlined text-[17px] text-amber-400">
                  {ribbonWeather?.icon || 'wb_sunny'}
                </span>
                <span>{ribbonWeather ? `${ribbonWeather.tempC}°C • ${ribbonWeather.condition}` : weatherLoading ? 'Loading weather...' : 'Weather unavailable'}</span>
              </div>

              {/* Currency Chip */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 text-xs font-semibold text-white">
                <span className="material-symbols-outlined text-[17px] text-emerald-400">currency_exchange</span>
                <span>{getRibbonFXText(location.countryCode, ribbonRates)}</span>
              </div>

              {/* Local Clock Chip */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 text-xs font-semibold text-white">
                <span className="material-symbols-outlined text-[17px] text-sky-300">schedule</span>
                <span>{localTimeInfo.timeStr} {localTimeInfo.tzCode}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Human Search Bar */}
      <section className="py-1">
        <div className="flex items-center gap-2.5">
          <div className="flex-1 relative flex items-center h-12 rounded-2xl bg-white border border-slate-200/90 shadow-sm px-4 focus-within:ring-2 focus-within:ring-sky-500/20 focus-within:border-sky-500 transition-all">
            <span className="material-symbols-outlined text-slate-400 text-[20px] mr-2.5 select-none">search</span>
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search places, forts, museums, beaches, cafes, ATMs, hospitals..."
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

      {/* Human Category Filter Chips */}
      <section className="pt-2 pb-1">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {CATEGORY_PILLS.map((pill) => {
            const isActive = selectedCategory === pill.id;
            return (
              <button
                key={pill.id}
                onClick={() => setSelectedCategory(pill.id)}
                className={`flex items-center gap-1.5 h-9 px-4 rounded-full text-xs font-bold flex-shrink-0 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-sm ring-2 ring-sky-600/20'
                    : 'bg-white text-slate-700 border border-slate-200/90 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">
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
        <div className={`flex flex-col gap-3.5 md:col-span-7 lg:col-span-7 xl:col-span-7 ${mobileViewMode === 'map' ? 'hidden md:flex' : 'flex'}`}>
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-slate-900">Nearby Places</span>
              <span className="text-xs font-medium text-slate-500">Sorted by distance</span>
            </div>
            <span className="text-xs font-semibold text-sky-600 flex items-center gap-1.5 bg-sky-50 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-600 animate-pulse"></span>
              <span>{dynamicPlaces.length} Places Found</span>
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-500 text-sm font-medium flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-[20px] animate-spin text-sky-600">progress_activity</span>
              <span>Discovering places near {displayCityName}...</span>
            </div>
          ) : dynamicPlaces.length === 0 ? (
            <div className="p-10 text-center rounded-2xl bg-white shadow-sm border border-slate-200/80 flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
                <span className="material-symbols-outlined text-[28px]">search_off</span>
              </div>
              <p className="text-sm font-bold text-slate-800 mt-1">No matching places found</p>
              <p className="text-xs text-slate-500 max-w-xs">Try clearing your search filters or searching for another place in {displayCityName}.</p>
            </div>
          ) : (
            dynamicPlaces.map((place) => {
              const isSaved = savedIds.has(place.id);
              const walkMins = Math.max(1, Math.round(place.distanceMeters / 75));
              const distDisplay = place.distanceMeters >= 1000 
                ? `${(place.distanceMeters / 1000).toFixed(1)} km` 
                : `${place.distanceMeters} m`;

              const catBadgeStyle = 
                place.category === 'historic' ? 'bg-amber-50 text-amber-800 border-amber-200/80' :
                place.category === 'museum' ? 'bg-purple-50 text-purple-800 border-purple-200/80' :
                place.category === 'beach' ? 'bg-cyan-50 text-cyan-800 border-cyan-200/80' :
                place.category === 'attraction' ? 'bg-rose-50 text-rose-800 border-rose-200/80' :
                place.category === 'hospital' ? 'bg-red-50 text-red-700 border-red-200/80' :
                place.category === 'pharmacy' ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80' :
                place.category === 'atm' ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80' :
                place.category === 'cafe' ? 'bg-orange-50 text-orange-800 border-orange-200/80' :
                'bg-slate-50 text-slate-700 border-slate-200';

              const catLabel = 
                place.category === 'historic' ? 'Heritage & Palace' :
                place.category === 'museum' ? 'Museum' :
                place.category === 'beach' ? 'Beach' :
                place.category === 'attraction' ? 'Attraction' :
                place.category === 'hospital' ? 'Hospital / ER' :
                place.category === 'pharmacy' ? 'Pharmacy' :
                place.category === 'atm' ? 'ATM & Cash' :
                place.category === 'cafe' ? 'Café & Dining' :
                place.category === 'transit_stop' ? 'Transit Station' :
                place.category;

              return (
                <article 
                  key={place.id}
                  onClick={() => onSelectPlace(place)}
                  className="group cursor-pointer rounded-2xl bg-white p-4 sm:p-5 border border-slate-200/80 hover:border-sky-300 shadow-sm hover:shadow-md transition-all active:scale-[0.99] flex flex-col gap-3.5"
                >
                  <div className="flex items-start gap-4">
                    {/* Dynamic Place Thumbnail with Category Fallback Icon */}
                    <PlaceThumbnail
                      place={place}
                      className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-slate-100 flex-shrink-0 relative shadow-inner"
                      iconSize={34}
                      showBadgeLabel={true}
                    />

                    {/* Details Column */}
                    <div className="flex-1 min-w-0 flex flex-col">
                      <div className="flex items-center justify-between gap-1.5 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold border ${catBadgeStyle}`}>
                            {catLabel}
                          </span>
                          <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                            place.hours.status === 'open' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {place.hours.status === 'open' ? 'Open now' : place.hours.status === 'closed' ? 'Closed' : 'Hours not confirmed'}
                          </span>
                        </div>

                        {/* Save Bookmark */}
                        <button 
                          onClick={(e) => handleToggleSave(e, place)}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-500 active:scale-90 transition-all hover:bg-rose-50 cursor-pointer"
                          title={isSaved ? 'Remove from Saved' : 'Save to Favorites'}
                        >
                          <span 
                            className={`material-symbols-outlined text-[20px] ${isSaved ? 'text-rose-500 fill' : ''}`}
                            style={isSaved ? { fontVariationSettings: "'FILL' 1" } : undefined}
                          >
                            {isSaved ? 'favorite' : 'favorite_border'}
                          </span>
                        </button>
                      </div>

                      <h2 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-sky-700 transition-colors truncate mt-1">
                        {place.name}
                      </h2>
                      
                      {place.localizedName && (
                        <p className="text-xs text-slate-500 truncate font-medium mt-0.5">
                          {place.localizedName}
                        </p>
                      )}

                      <div className="flex items-center gap-2 mt-2 text-xs font-semibold text-slate-600">
                        <span className="flex items-center gap-1 text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md">
                          <span className="material-symbols-outlined text-[14px]">directions_walk</span>
                          <span>{distDisplay} • {walkMins} min</span>
                        </span>
                        <span className="text-slate-400 truncate">•</span>
                        <span className="text-slate-500 truncate text-[11px]">
                          {place.address ? place.address.split(',')[0] : 'OpenStreetMap listing'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Highlights / Features Tip */}
                  {place.triageInfo && (
                    <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 border border-slate-100 flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 truncate">
                        <span className="material-symbols-outlined text-sky-600 text-[16px] flex-shrink-0">
                          {place.category === 'hospital' ? 'medical_services' : 'stars'}
                        </span>
                        <span className="truncate">{place.triageInfo}</span>
                      </span>
                      {place.emergencyCapable && (
                        <span className="text-[10px] text-red-600 font-bold px-1.5 py-0.5 rounded bg-red-50 flex-shrink-0">
                          Emergency listed
                        </span>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onStartRoute(place);
                      }}
                      className="flex-1 h-9 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">navigation</span>
                      <span>Directions</span>
                    </button>

                    {place.phone && (
                      <a
                        href={`tel:${place.phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="h-9 px-3 rounded-xl bg-slate-100 hover:bg-slate-200/70 text-slate-700 text-xs font-bold flex items-center justify-center gap-1 transition-all"
                        title="Call"
                      >
                        <span className="material-symbols-outlined text-[16px]">call</span>
                        <span className="hidden sm:inline">Call</span>
                      </a>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectPlace(place);
                      }}
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

          {/* Emergency SOS Quick Access Banner */}
          <section className="pt-2">
            <button 
              onClick={onOpenEmergency}
              className="w-full p-4 rounded-2xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white shadow-sm flex items-center justify-between active:scale-[0.99] transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-[22px] text-white" style={{ fontVariationSettings: "'FILL' 1" }}>
                    emergency
                  </span>
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-sm font-bold text-white tracking-tight">
                    Emergency Directory • {displayCityName}
                  </span>
                  <span className="text-xs text-rose-100 font-medium">
                    Emergency numbers and nearby hospital listings
                  </span>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0 group-hover:translate-x-0.5 transition-transform">
                <span className="material-symbols-outlined text-[18px] text-white">arrow_forward</span>
              </div>
            </button>
          </section>
        </div>

        {/* Right Column (Interactive Live Leaflet Map - Visible permanently on Tablet/Desktop, toggled on mobile) */}
        <div className={`md:col-span-5 lg:col-span-5 xl:col-span-5 md:sticky md:top-20 flex-col gap-3 ${mobileViewMode === 'map' ? 'flex' : 'hidden md:flex'}`}>
          <div className="rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm p-3 bg-white flex flex-col gap-2.5">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Live Interactive Map</span>
              </div>
              <button 
                onClick={onRequestGPS}
                className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-sky-700 flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer"
                title="Switch to live device GPS"
              >
                <span className="material-symbols-outlined text-[15px]">my_location</span>
                <span>{location.isCustom ? 'Use GPS' : 'Live GPS'}</span>
              </button>
            </div>

            <div className="relative w-full h-80 sm:h-96 md:h-[calc(100vh-140px)] md:min-h-[560px] rounded-xl overflow-hidden border border-slate-100">
              <LiveLeafletMap
                userLocation={location.coords}
                places={dynamicPlaces}
                onSelectPlace={onSelectPlace}
                isMapVisible={desktopMap || mobileViewMode === 'map'}
                className="w-full h-full"
              />
            </div>
            
            <div className="px-1 flex items-center justify-between text-[11px] text-slate-400 font-medium">
              <span>{location.coords.latitude.toFixed(4)}°, {location.coords.longitude.toFixed(4)}°</span>
              <span className="text-slate-600 font-semibold">{dynamicPlaces.length} places pinned</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Notice */}
      <footer className="pt-8 pb-4 text-center select-none">
        <p className="text-xs text-slate-400 font-medium flex items-center justify-center gap-1.5">
          <span className="material-symbols-outlined text-[15px]">public</span>
          <span>Map data from OpenStreetMap • Privacy-first, runs locally in your browser</span>
        </p>
      </footer>
    </div>
  );
};
