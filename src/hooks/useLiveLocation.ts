import { useState, useEffect, useCallback, useRef } from 'react';
import { LocationCoordinates } from '../types';
import { CITIES } from '../data/mockData';
import { osmService } from '../services/osmService';
import { getDistance } from 'geolib';

export type GeolocationStatus = 'acquiring' | 'fixed' | 'denied' | 'unsupported' | 'fallback';
export interface LiveLocationState {
  coords: LocationCoordinates;
  accuracyMeters: number;
  altitudeMeters: number | null;
  heading: number | null;
  speed: number | null;
  status: GeolocationStatus;
  cityName: string;
  countryCode: string;
  matchedCityId: string;
  lastUpdated: string;
  errorMessage?: string;
  isSimulated: boolean;
  isCustom?: boolean;
}
export interface CustomLocationPayload extends LocationCoordinates { cityName: string; countryCode?: string; }

export function validCoordinates(latitude: unknown, longitude: unknown): boolean {
  return typeof latitude === 'number' && Number.isFinite(latitude) && Math.abs(latitude) <= 90
    && typeof longitude === 'number' && Number.isFinite(longitude) && Math.abs(longitude) <= 180;
}
export function calculateDistanceMeters(lat1?: number | null, lon1?: number | null, lat2?: number | null, lon2?: number | null): number {
  if (!validCoordinates(lat1, lon1) || !validCoordinates(lat2, lon2)) return 999999;
  return getDistance({ latitude: lat1!, longitude: lon1! }, { latitude: lat2!, longitude: lon2! });
}
export function findClosestCity(lat: number, lng: number, _cityName?: string) {
  let closest: typeof CITIES[number] | null = null;
  let minDistance = Infinity;
  for (const city of CITIES) {
    const distance = calculateDistanceMeters(lat, lng, city.lat, city.lng);
    if (distance < minDistance) { minDistance = distance; closest = city; }
  }
  return { city: minDistance <= 60000 ? closest : null, distance: minDistance };
}
function readCustomLocation(): CustomLocationPayload | null {
  try {
    const payload = JSON.parse(localStorage.getItem('local_app_custom_location') || 'null');
    return payload && validCoordinates(payload.latitude, payload.longitude)
      && typeof payload.cityName === 'string' && payload.cityName.trim() ? payload : null;
  } catch { return null; }
}
function customState(custom: CustomLocationPayload): LiveLocationState {
  const { city } = findClosestCity(custom.latitude, custom.longitude);
  return {
    coords: { latitude: custom.latitude, longitude: custom.longitude },
    accuracyMeters: 0, altitudeMeters: null, heading: null, speed: null,
    status: 'fixed', cityName: custom.cityName.trim().slice(0, 200),
    countryCode: /^[A-Z]{2}$/.test(custom.countryCode || '') ? custom.countryCode! : city?.countryCode || '',
    matchedCityId: city?.id || 'custom', lastUpdated: new Date().toISOString(),
    isSimulated: false, isCustom: true
  };
}
export function useLiveLocation(selectedCityId: string) {
  const selectedCity = CITIES.find(c => c.id === selectedCityId) || CITIES[0];
  const selectedCityRef = useRef(selectedCity);
  selectedCityRef.current = selectedCity;
  const [location, setLocation] = useState<LiveLocationState>(() => {
    const custom = readCustomLocation();
    return custom ? customState(custom) : {
      coords: { latitude: selectedCity.lat, longitude: selectedCity.lng },
      accuracyMeters: 0, altitudeMeters: null, heading: null, speed: null,
      status: 'acquiring', cityName: selectedCity.name, countryCode: selectedCity.countryCode,
      matchedCityId: selectedCity.id, lastUpdated: new Date().toISOString(),
      isSimulated: true, isCustom: false
    };
  });
  const watchRef = useRef<number | null>(null);
  const generationRef = useRef(0);
  const geocodeRef = useRef(0);
  const lastGeocodedRef = useRef<LocationCoordinates | null>(null);
  // All callers share one watcher; invalidated callbacks cannot overwrite a newer location.
  const stopWatch = useCallback(() => {
    generationRef.current += 1;
    geocodeRef.current += 1;
    if (watchRef.current !== null) navigator.geolocation?.clearWatch(watchRef.current);
    watchRef.current = null;
  }, []);
  const setCustomLocation = useCallback((custom: CustomLocationPayload) => {
    if (!validCoordinates(custom.latitude, custom.longitude) || !custom.cityName.trim()) return;
    stopWatch();
    try { localStorage.setItem('local_app_custom_location', JSON.stringify(custom)); } catch {}
    setLocation(customState(custom));
  }, [stopWatch]);
  const requestLiveGPS = useCallback(() => {
    stopWatch();
    const generation = generationRef.current;
    lastGeocodedRef.current = null;
    try { localStorage.removeItem('local_app_custom_location'); } catch {}
    if (!navigator.geolocation) {
      setLocation(prev => ({ ...prev, status: 'unsupported', isCustom: false, isSimulated: true, accuracyMeters: 0, errorMessage: 'Geolocation is not supported by your browser.' }));
      return;
    }
    setLocation(prev => ({ ...prev, status: 'acquiring', isCustom: false, isSimulated: true, accuracyMeters: 0, errorMessage: undefined }));
    watchRef.current = navigator.geolocation.watchPosition(pos => {
      if (generation !== generationRef.current) return;
      const { latitude, longitude, accuracy, altitude, heading, speed } = pos.coords;
      if (!validCoordinates(latitude, longitude)) return;
      const { city } = findClosestCity(latitude, longitude);
      const last = lastGeocodedRef.current;
      const shouldGeocode = !last || calculateDistanceMeters(latitude, longitude, last.latitude, last.longitude) > 500;
      setLocation(prev => ({
        ...prev, coords: { latitude, longitude }, accuracyMeters: Math.max(0, Math.round(accuracy || 0)),
        altitudeMeters: altitude === null ? null : Math.round(altitude),
        heading: heading === null ? null : Math.round(heading), speed: speed === null ? null : Math.round(speed * 3.6),
        status: 'fixed', cityName: shouldGeocode ? city?.name || latitude.toFixed(2) + '°, ' + longitude.toFixed(2) + '°' : prev.cityName,
        countryCode: shouldGeocode ? city?.countryCode || '' : prev.countryCode,
        matchedCityId: city?.id || 'custom', lastUpdated: new Date(pos.timestamp).toISOString(),
        isSimulated: false, isCustom: false, errorMessage: undefined
      }));
      if (shouldGeocode) {
        lastGeocodedRef.current = { latitude, longitude };
        const request = ++geocodeRef.current;
        osmService.reverseGeocode(latitude, longitude).then(geo => {
          if (generation !== generationRef.current || request !== geocodeRef.current) return;
          setLocation(prev => ({ ...prev, cityName: geo.cityName, countryCode: geo.countryCode }));
        }).catch(() => {
          if (generation === generationRef.current && request === geocodeRef.current) lastGeocodedRef.current = null;
        });
      }
    }, err => {
      if (generation !== generationRef.current) return;
      const city = selectedCityRef.current;
      geocodeRef.current += 1;
      lastGeocodedRef.current = null;
      setLocation(prev => ({ ...prev, coords: { latitude: city.lat, longitude: city.lng }, accuracyMeters: 0,
        status: err.code === 1 ? 'denied' : 'fallback', cityName: city.name, countryCode: city.countryCode,
        matchedCityId: city.id, isSimulated: true, isCustom: false, errorMessage: err.message }));
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 });
  }, [stopWatch]);
  useEffect(() => {
    if (!readCustomLocation()) requestLiveGPS();
    return stopWatch;
  }, [requestLiveGPS, stopWatch]);
  return { location, requestLiveGPS, setCustomLocation };
}
