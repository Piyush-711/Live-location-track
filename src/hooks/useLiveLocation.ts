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

export interface CustomLocationPayload {
  latitude: number;
  longitude: number;
  cityName: string;
  countryCode?: string;
}

// Calculate millimetric geodesic distance on WGS-84 ellipsoid using geolib
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  return getDistance(
    { latitude: lat1, longitude: lon1 },
    { latitude: lat2, longitude: lon2 }
  );
}

// Find closest supported pilot city node
export function findClosestCity(lat: number, lng: number, cityName?: string) {
  if (cityName) {
    const norm = cityName.toLowerCase();
    const nameMatch = CITIES.find(c => 
      norm.includes(c.id) || 
      norm.includes(c.name.toLowerCase().split(' ')[0]) ||
      c.name.toLowerCase().includes(norm)
    );
    if (nameMatch) {
      return { city: nameMatch, distance: 0 };
    }
  }

  let closest: typeof CITIES[0] | null = null;
  let minDistance = Infinity;

  for (const city of CITIES) {
    const dist = calculateDistanceMeters(lat, lng, city.lat, city.lng);
    if (dist < minDistance) {
      minDistance = dist;
      closest = city;
    }
  }

  // If user is more than 60km away from any pilot hub, return null (custom location)
  if (minDistance > 60000) {
    return { city: null, distance: minDistance };
  }

  return { city: closest, distance: minDistance };
}

export function useLiveLocation(selectedCityId: string) {
  const selectedCity = CITIES.find(c => c.id === selectedCityId) || CITIES[0];

  const [location, setLocation] = useState<LiveLocationState>(() => {
    try {
      const saved = localStorage.getItem('local_app_custom_location');
      if (saved) {
        const payload: CustomLocationPayload = JSON.parse(saved);
        const { city } = findClosestCity(payload.latitude, payload.longitude, payload.cityName);
        return {
          coords: { latitude: payload.latitude, longitude: payload.longitude },
          accuracyMeters: 5,
          altitudeMeters: null,
          heading: 350,
          speed: null,
          status: 'fixed',
          cityName: payload.cityName,
          countryCode: payload.countryCode || (city ? city.countryCode : 'IN'),
          matchedCityId: city ? city.id : 'custom',
          lastUpdated: new Date().toISOString(),
          isSimulated: false,
          isCustom: true
        };
      }
    } catch {}

    return {
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
      isSimulated: true,
      isCustom: false
    };
  });

  const lastGeocodedRef = useRef<{ lat: number; lon: number } | null>(null);
  const isCustomRef = useRef<boolean>(location.isCustom || false);

  const setCustomLocation = useCallback((custom: CustomLocationPayload) => {
    isCustomRef.current = true;
    try {
      localStorage.setItem('local_app_custom_location', JSON.stringify(custom));
    } catch {}

    const { city } = findClosestCity(custom.latitude, custom.longitude, custom.cityName);

    setLocation({
      coords: { latitude: custom.latitude, longitude: custom.longitude },
      accuracyMeters: 5,
      altitudeMeters: null,
      heading: 350,
      speed: null,
      status: 'fixed',
      cityName: custom.cityName,
      countryCode: custom.countryCode || (city ? city.countryCode : 'IN'),
      matchedCityId: city ? city.id : 'custom',
      lastUpdated: new Date().toISOString(),
      isSimulated: false,
      isCustom: true
    });
  }, []);

  const requestLiveGPS = useCallback(() => {
    isCustomRef.current = false;
    try {
      localStorage.removeItem('local_app_custom_location');
    } catch {}

    if (!('geolocation' in navigator)) {
      setLocation(prev => ({
        ...prev,
        status: 'unsupported',
        errorMessage: 'Geolocation is not supported by your browser.'
      }));
      return;
    }

    setLocation(prev => ({ ...prev, status: 'acquiring', isCustom: false }));

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        // If user manually chose a custom location in the meantime, ignore background GPS tick
        if (isCustomRef.current) return;

        const { latitude, longitude, accuracy, altitude, heading, speed } = pos.coords;
        const { city } = findClosestCity(latitude, longitude);

        setLocation(prev => ({
          ...prev,
          coords: { latitude, longitude },
          accuracyMeters: Math.round(accuracy || 5),
          altitudeMeters: altitude ? Math.round(altitude) : null,
          heading: heading ? Math.round(heading) : 350,
          speed: speed ? Math.round(speed * 3.6) : null,
          status: 'fixed',
          cityName: prev.cityName && prev.cityName !== selectedCity.name ? prev.cityName : (city ? city.name : `${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`),
          countryCode: prev.countryCode || (city ? city.countryCode : 'IN'),
          matchedCityId: city ? city.id : 'custom',
          lastUpdated: new Date(pos.timestamp).toISOString(),
          isSimulated: false,
          isCustom: false
        }));

        const shouldGeocode = !lastGeocodedRef.current || 
          calculateDistanceMeters(latitude, longitude, lastGeocodedRef.current.lat, lastGeocodedRef.current.lon) > 500;

        if (shouldGeocode) {
          lastGeocodedRef.current = { lat: latitude, lon: longitude };
          osmService.reverseGeocode(latitude, longitude).then(geo => {
            if (isCustomRef.current) return;
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
        if (isCustomRef.current) return;

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
          isCustom: false,
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
    // If no custom location saved, trigger live GPS on start
    try {
      const saved = localStorage.getItem('local_app_custom_location');
      if (!saved) {
        const cleanup = requestLiveGPS();
        return () => {
          if (cleanup) cleanup();
        };
      }
    } catch {
      const cleanup = requestLiveGPS();
      return () => {
        if (cleanup) cleanup();
      };
    }
  }, [requestLiveGPS]);

  // If user selects a predefined city from the list while not in custom mode
  useEffect(() => {
    if (location.isSimulated && !location.isCustom) {
      setLocation(prev => ({
        ...prev,
        coords: { latitude: selectedCity.lat, longitude: selectedCity.lng },
        cityName: selectedCity.name,
        countryCode: selectedCity.countryCode,
        matchedCityId: selectedCity.id,
        lastUpdated: new Date().toISOString()
      }));
    }
  }, [selectedCityId, selectedCity, location.isSimulated, location.isCustom]);

  return {
    location,
    requestLiveGPS,
    setCustomLocation
  };
}
