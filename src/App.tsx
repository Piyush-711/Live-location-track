import React, { useState } from 'react';
import { TabType, BottomNav } from './components/BottomNav';
import { Header } from './components/Header';
import { ResponsiveLayout } from './components/ResponsiveLayout';
import { ExploreView } from './views/ExploreView';
import { PlaceDetailsModal } from './views/PlaceDetailsModal';
import { RoutePreviewModal } from './views/RoutePreviewModal';
import { LiveNavigationHUD } from './views/LiveNavigationHUD';
import { VoiceSettingsModal } from './views/VoiceSettingsModal';
import { OfflineVaultView } from './views/OfflineVaultView';
import { EmergencySOSView } from './views/EmergencySOSView';
import { TravelToolkitView } from './views/TravelToolkitView';
import { ReportCorrectionModal } from './components/ReportCorrectionModal';
import { CityPickerModal } from './components/CityPickerModal';
import { SavedPlacesDrawer } from './components/SavedPlacesDrawer';
import { Place, RouteResponse, WeatherReport } from './types';
import { storage } from './services/storage';
import { api } from './services/api';
import { useLiveLocation } from './hooks/useLiveLocation';

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
  const currentRegionalPack = storage.getPackForLocation(location);
  const offlinePackLabel = currentRegionalPack.installed ? currentRegionalPack.sizeFormatted : 'Get Pack';

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
            onSelectCustomLocation={(custom) => setCustomLocation(custom)}
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
      </div>
    </ResponsiveLayout>
  );
};

export default App;
