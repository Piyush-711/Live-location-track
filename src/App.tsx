import React, { useState, lazy, Suspense } from 'react';
import { TabType, BottomNav } from './components/BottomNav';
import { Header } from './components/Header';
import { ResponsiveLayout } from './components/ResponsiveLayout';
const ExploreView = lazy(() => import('./views/ExploreView').then(module => ({ default: module.ExploreView })));
const PlaceDetailsModal = lazy(() => import('./views/PlaceDetailsModal').then(module => ({ default: module.PlaceDetailsModal })));
const RoutePreviewModal = lazy(() => import('./views/RoutePreviewModal').then(module => ({ default: module.RoutePreviewModal })));
const LiveNavigationHUD = lazy(() => import('./views/LiveNavigationHUD').then(module => ({ default: module.LiveNavigationHUD })));
const VoiceSettingsModal = lazy(() => import('./views/VoiceSettingsModal').then(module => ({ default: module.VoiceSettingsModal })));
const OfflineVaultView = lazy(() => import('./views/OfflineVaultView').then(module => ({ default: module.OfflineVaultView })));
const EmergencySOSView = lazy(() => import('./views/EmergencySOSView').then(module => ({ default: module.EmergencySOSView })));
const TravelToolkitView = lazy(() => import('./views/TravelToolkitView').then(module => ({ default: module.TravelToolkitView })));
const LocalMarketsView = lazy(() => import('./views/LocalMarketsView').then(module => ({ default: module.LocalMarketsView })));
const ReportCorrectionModal = lazy(() => import('./components/ReportCorrectionModal').then(module => ({ default: module.ReportCorrectionModal })));
const CityPickerModal = lazy(() => import('./components/CityPickerModal').then(module => ({ default: module.CityPickerModal })));
const SavedPlacesDrawer = lazy(() => import('./components/SavedPlacesDrawer').then(module => ({ default: module.SavedPlacesDrawer })));
import { Place, RouteResponse, WeatherReport } from './types';
import { storage } from './services/storage';
import { api } from './services/api';
import { useLiveLocation, findClosestCity } from './hooks/useLiveLocation';
import { CITIES } from './data/mockData';

export const App: React.FC = () => {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<TabType>('explore');
  const [activeCityId, setActiveCityId] = useState<string>(storage.getActiveCityId());

  // Dynamic live location
  const { location, requestLiveGPS, setCustomLocation } = useLiveLocation(activeCityId);

  // Modals & HUD state
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [previewRoutePlace, setPreviewRoutePlace] = useState<{ place: Place; mode: 'walking' | 'driving' } | null>(null);
  const [activeLiveRoute, setActiveLiveRoute] = useState<RouteResponse | null>(null);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [showSavedDrawer, setShowSavedDrawer] = useState(false);
  const [reportingPlace, setReportingPlace] = useState<Place | null>(null);
  const [currentTemp, setCurrentTemp] = useState<number | null>(null);

  // Live atmospheric temperature fetch for current location
  React.useEffect(() => {
    let isCurrent = true;
    setCurrentTemp(null);
    api.getWeather(activeCityId, location.coords, location.cityName)
      .then((w: WeatherReport) => {
        if (isCurrent && w && typeof w.tempC === 'number') {
          setCurrentTemp(w.tempC);
        }
      })
      .catch(() => {});

    return () => { isCurrent = false; };
  }, [location.coords.latitude, location.coords.longitude, location.cityName, activeCityId]);

  // Switch City
  const handleSelectCity = (cityId: string) => {
    setActiveCityId(cityId);
    storage.setActiveCityId(cityId);
    const targetCity = CITIES.find(c => c.id === cityId);
    if (targetCity) {
      setCustomLocation({
        latitude: targetCity.lat,
        longitude: targetCity.lng,
        cityName: targetCity.name,
        countryCode: targetCity.countryCode
      });
    }
  };

  // Switch Custom Location (e.g. searched "Hyderabad" or custom address)
  const handleSelectCustomLocation = (custom: {
    latitude: number;
    longitude: number;
    cityName: string;
    countryCode?: string;
  }) => {
    const rawName = (custom && custom.cityName) || 'Custom Location';
    const { city: matched } = findClosestCity(custom.latitude, custom.longitude);
    const resolvedCityId = matched ? matched.id : (rawName.split(',')[0].trim().toLowerCase().replace(/[^a-z0-9]/g, '') || 'custom');
    setActiveCityId(resolvedCityId);
    storage.setActiveCityId(resolvedCityId);
    setCustomLocation({
      ...custom,
      cityName: rawName
    });
  };

  // Start route preview flow
  const handleStartRoute = (place: Place, mode: 'walking' | 'driving' = 'walking') => {
    setSelectedPlace(null);
    setPreviewRoutePlace({ place, mode });
  };

  // Launch live navigation HUD
  const handleStartLiveNavigation = (route: RouteResponse) => {
    setPreviewRoutePlace(null);
    setActiveLiveRoute(route);
  };

  // Determine active regional pack for current location
  const offlinePackLabel = 'Offline info';

  return (
    <ResponsiveLayout location={location} onRequestGPS={requestLiveGPS}>
      <div className="w-full flex-1 flex flex-col relative select-none">
        {/* Top Header with live location and temperature badge */}
        <Header
          cityName={location.cityName}
          gpsStatus={location.status}
          isCustom={location.isCustom}
          tempC={currentTemp}
          offlinePackLabel={offlinePackLabel}
          onOpenCityPicker={() => setShowCityPicker(true)}
          onOpenOfflineVault={() => setActiveTab('offline')}
          onOpenProfile={() => setShowSavedDrawer(true)}
        />

        {/* Main Tab Screen Area */}
        <main className="flex-1 flex flex-col pt-3">
          <Suspense fallback={<p role="status" className="p-6 text-slate-600">Loading view…</p>}>
          {activeTab === 'explore' && (
            <ExploreView
              location={location}
              activeCityId={activeCityId}
              onSelectPlace={(p) => setSelectedPlace(p)}
              onStartRoute={(p) => handleStartRoute(p, 'walking')}
              onOpenEmergency={() => setActiveTab('emergency')}
              onRequestGPS={requestLiveGPS}
            />
          )}

          {activeTab === 'markets' && (
            <LocalMarketsView
              location={location}
              activeCityId={activeCityId}
              onStartRoute={(p) => handleStartRoute(p, 'driving')}
              onSelectPlace={(p) => setSelectedPlace(p)}
            />
          )}

          {activeTab === 'emergency' && (
            <EmergencySOSView
              location={location}
              onStartRouteToER={(p) => handleStartRoute(p, 'walking')}
            />
          )}

          {activeTab === 'offline' && (
            <OfflineVaultView 
              location={location}
              activeCityId={activeCityId}
            />
          )}

          {activeTab === 'toolkit' && (
            <TravelToolkitView 
              activeCityId={activeCityId} 
              liveCountryCode={location.countryCode} 
              location={location}
            />
          )}
          </Suspense>
        </main>

        {/* Bottom Floating Navigation Dock */}
        {!activeLiveRoute && (
          <BottomNav
            activeTab={activeTab}
            onChangeTab={(tab) => {
              setActiveTab(tab);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {/* Place Details Modal (Screen 1) */}
        <Suspense fallback={<p role="status" className="fixed bottom-24 left-4 z-50 rounded-xl bg-white p-4 shadow-lg">Loading details…</p>}>
        {selectedPlace && (
          <PlaceDetailsModal
            place={selectedPlace}
            onClose={() => setSelectedPlace(null)}
            onStartRoute={(p, mode) => handleStartRoute(p, mode)}
            onOpenReportModal={(p) => setReportingPlace(p)}
          />
        )}

        {/* Turn-by-Turn Route Preview Modal (Screen 4) */}
        {previewRoutePlace && (
          <RoutePreviewModal
            key={previewRoutePlace.place.id + previewRoutePlace.mode}
            place={previewRoutePlace.place}
            mode={previewRoutePlace.mode}
            userLocation={location.coords}
            onClose={() => setPreviewRoutePlace(null)}
            onStartLiveNavigation={handleStartLiveNavigation}
          />
        )}

        {/* Live Voice Navigation HUD (Screen 2) */}
        {activeLiveRoute && (
          <LiveNavigationHUD
            route={activeLiveRoute}
            location={location}
            onEndNavigation={() => setActiveLiveRoute(null)}
            onOpenVoiceSettings={() => setShowVoiceSettings(true)}
            onOpenEmergency={() => {
              setActiveLiveRoute(null);
              setActiveTab('emergency');
            }}
          />
        )}

        {/* Audio & Voice Engine Settings Modal (Screen 3) */}
        {showVoiceSettings && (
          <VoiceSettingsModal
            onClose={() => setShowVoiceSettings(false)}
            onOpenOfflineVault={() => {
              setShowVoiceSettings(false);
              setActiveTab('offline');
            }}
          />
        )}

        {/* Location Picker Modal (Google / Apple Maps style) */}
        {showCityPicker && (
          <CityPickerModal
            activeCityId={activeCityId}
            currentLocationName={location.cityName}
            onSelectCity={handleSelectCity}
            onSelectCustomLocation={handleSelectCustomLocation}
            onRequestLiveGPS={requestLiveGPS}
            onClose={() => setShowCityPicker(false)}
          />
        )}

        {/* Saved Places Drawer */}
        {showSavedDrawer && (
          <SavedPlacesDrawer
            onClose={() => setShowSavedDrawer(false)}
            onSelectPlace={(p) => setSelectedPlace(p)}
            onStartRoute={(p) => handleStartRoute(p, 'walking')}
          />
        )}

        {/* Correction Report Modal */}
        {reportingPlace && (
          <ReportCorrectionModal
            place={reportingPlace}
            onClose={() => setReportingPlace(null)}
          />
        )}
        </Suspense>
      </div>
    </ResponsiveLayout>
  );
};

export default App;
