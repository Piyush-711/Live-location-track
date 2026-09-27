import { useState, useEffect, useCallback, useRef } from 'react';
import { LocationCoordinates } from '../types';
import { CITIES } from '../data/mockData';
import { osmService } from '../services/osmService';

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
}

// Calculate great-circle distance between two points in meters using Haversine formula
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in metres
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

// Find closest supported pilot city node
function findClosestCity(lat: number, lng: number) {
  let closest = CITIES[0];
  let minDistance = Infinity;

  for (const city of CITIES) {
    const dist = calculateDistanceMeters(lat, lng, city.lat, city.lng);
    if (dist < minDistance) {
      minDistance = dist;
      closest = city;
    }
  }
  return { city: closest, distance: minDistance };
}

export function useLiveLocation(selectedCityId: string) {
  const selectedCity = CITIES.find(c => c.id === selectedCityId) || CITIES[0];

  const [location, setLocation] = useState<LiveLocationState>({
    coords: { latitude: selectedCity.lat, longitude: selectedCity.lng },
    accuracyMeters: 3,
    altitudeMeters: null,
    heading: 350,
    speed: null,
    status: 'acquiring',
    cityName: selectedCity.name,
    countryCode: selectedCity.countryCode,
    matchedCityId: selectedCity.id,
    lastUpdated: new Date().toISOString(),
    isSimulated: true
  });

  const lastGeocodedRef = useRef<{ lat: number; lon: number } | null>(null);

  const requestLiveGPS = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setLocation(prev => ({
        ...prev,
        status: 'unsupported',
        errorMessage: 'Geolocation is not supported by your browser.'
      }));
      return;
    }

    setLocation(prev => ({ ...prev, status: 'acquiring' }));

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy, altitude, heading, speed } = pos.coords;
        const { city } = findClosestCity(latitude, longitude);

        setLocation(prev => ({
          ...prev,
          coords: { latitude, longitude },
          accuracyMeters: Math.round(accuracy || 5),
          altitudeMeters: altitude ? Math.round(altitude) : null,
          heading: heading ? Math.round(heading) : 350,
          speed: speed ? Math.round(speed * 3.6) : null, // km/h
          status: 'fixed',
          cityName: prev.cityName && prev.cityName !== selectedCity.name ? prev.cityName : (city ? city.name : `${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`),
          countryCode: prev.countryCode || (city ? city.countryCode : 'JP'),
          matchedCityId: city ? city.id : selectedCityId,
          lastUpdated: new Date(pos.timestamp).toISOString(),
          isSimulated: false
        }));

        // Only reverse geocode if first time or moved > 500m
        const shouldGeocode = !lastGeocodedRef.current || 
          calculateDistanceMeters(latitude, longitude, lastGeocodedRef.current.lat, lastGeocodedRef.current.lon) > 500;

        if (shouldGeocode) {
          lastGeocodedRef.current = { lat: latitude, lon: longitude };
          osmService.reverseGeocode(latitude, longitude).then(geo => {
            setLocation(prev => ({
              ...prev,
              cityName: geo.cityName,
              countryCode: geo.countryCode,
              lastUpdated: new Date().toISOString()
            }));
          }).catch(e => console.warn('Live geocode background warn:', e));
        }
      },
      (err) => {
        console.warn('Geolocation error or permission denied:', err.message);
        // Fallback to selected city coordinates gracefully (Gate G4)
        setLocation(prev => ({
          ...prev,
          coords: { latitude: selectedCity.lat, longitude: selectedCity.lng },
          accuracyMeters: 3,
          status: err.code === 1 ? 'denied' : 'fallback',
          cityName: selectedCity.name,
          countryCode: selectedCity.countryCode,
          matchedCityId: selectedCity.id,
          lastUpdated: new Date().toISOString(),
          isSimulated: true,
          errorMessage: err.message
        }));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [selectedCityId, selectedCity]);

  useEffect(() => {
    const cleanup = requestLiveGPS();
    return () => {
      if (cleanup) cleanup();
    };
  }, [requestLiveGPS]);

  // If user changes city manually while simulated, update coords
  useEffect(() => {
    if (location.isSimulated) {
      setLocation(prev => ({
        ...prev,
        coords: { latitude: selectedCity.lat, longitude: selectedCity.lng },
        cityName: selectedCity.name,
        countryCode: selectedCity.countryCode,
        matchedCityId: selectedCity.id,
        lastUpdated: new Date().toISOString()
      }));
    }
  }, [selectedCityId, selectedCity, location.isSimulated]);

  return {
    location,
    requestLiveGPS
  };
}
