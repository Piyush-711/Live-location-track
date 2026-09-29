import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Place, LocationCoordinates } from '../types';
import { createPlaceMarker } from './mapMarker';
import { validCoordinates } from '../hooks/useLiveLocation';

export type MapTileProvider = 'google_streets' | 'google_satellite' | 'google_terrain' | 'osm';

interface TileConfig {
  name: string;
  shortLabel: string;
  icon: string;
  url: string;
  subdomains?: string[];
  maxZoom: number;
  attribution: string;
}

const TILE_CONFIG: Record<MapTileProvider, TileConfig> = {
  google_streets: {
    name: 'Google Maps',
    shortLabel: 'Google',
    icon: '🗺️',
    url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    maxZoom: 20,
    attribution: '&copy; Google Maps'
  },
  google_satellite: {
    name: 'Google Satellite',
    shortLabel: 'Satellite',
    icon: '🛰️',
    url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    maxZoom: 20,
    attribution: '&copy; Google Satellite'
  },
  google_terrain: {
    name: 'Google Terrain',
    shortLabel: 'Terrain',
    icon: '⛰️',
    url: 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    maxZoom: 20,
    attribution: '&copy; Google Terrain'
  },
  osm: {
    name: 'OpenStreetMap',
    shortLabel: 'OSM',
    icon: '🌐',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    subdomains: ['a', 'b', 'c'],
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }
};

interface LiveLeafletMapProps {
  userLocation: LocationCoordinates;
  places: Place[];
  selectedPlace?: Place | null;
  routeGeometry?: { coordinates: [number, number][] } | null;
  onSelectPlace: (place: Place) => void;
  className?: string;
  defaultTileProvider?: MapTileProvider;
  isMapVisible?: boolean;
}

export const LiveLeafletMap: React.FC<LiveLeafletMapProps> = ({
  userLocation,
  places,
  selectedPlace,
  routeGeometry,
  onSelectPlace,
  className = "w-full h-full",
  defaultTileProvider,
  isMapVisible = true
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const currentTileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  const [currentProvider, setCurrentProvider] = useState<MapTileProvider>(() => {
    if (defaultTileProvider) return defaultTileProvider;
    try {
      const saved = localStorage.getItem('app_map_provider');
      return (saved === 'google_satellite' || saved === 'google_streets' || saved === 'google_terrain') ? saved : 'osm';
    } catch { return 'osm'; }
  });

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    try {
      const container = mapContainerRef.current as any;
      if (container && container._leaflet_id) {
        container._leaflet_id = null;
      }

      const initialLat = (userLocation && typeof userLocation.latitude === 'number' && !isNaN(userLocation.latitude)) ? userLocation.latitude : 17.3850;
      const initialLng = (userLocation && typeof userLocation.longitude === 'number' && !isNaN(userLocation.longitude)) ? userLocation.longitude : 78.4867;

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 15,
        zoomControl: false,
        attributionControl: true
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      markersLayerRef.current = markersGroup;
      mapInstanceRef.current = map;
    } catch (err) {
      console.warn('Leaflet map initialization warning:', err);
    }

    return () => {
      try {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
          userMarkerRef.current = null;
          routeLayerRef.current = null;
          currentTileLayerRef.current = null;
          markersLayerRef.current = null;
        }
      } catch (err) {
        console.warn('Leaflet map remove warning:', err);
      }
    };
  }, []);

  // Switch Tile Layer dynamically (Google Maps, Satellite, OSM)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    try {
      if (currentTileLayerRef.current) {
        map.removeLayer(currentTileLayerRef.current);
        currentTileLayerRef.current = null;
      }

      const conf = TILE_CONFIG[currentProvider];
      const layer = L.tileLayer(conf.url, {
        maxZoom: conf.maxZoom,
        subdomains: conf.subdomains || [],
        attribution: conf.attribution
      }).addTo(map);

      layer.bringToBack();
      currentTileLayerRef.current = layer;
      try {
        localStorage.setItem('app_map_provider', currentProvider);
      } catch {}
    } catch (err) {
      console.warn('Tile layer switch warning:', err);
    }
  }, [currentProvider]);

  // Update User Marker and Relocate Map Dynamically on Location Change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !userLocation || !validCoordinates(userLocation.latitude, userLocation.longitude)) return;

    try {
      const userIcon = L.divIcon({
        className: 'user-puck-icon',
        html: `
          <div style="
            width: 22px; 
            height: 22px; 
            background: #0284c7; 
            border: 3px solid #ffffff; 
            border-radius: 50%; 
            box-shadow: 0 0 10px rgba(2,132,199,0.7);
            position: relative;
          ">
            <div style="
              position: absolute; 
              inset: -6px; 
              border-radius: 50%; 
              background: rgba(2,132,199,0.25); 
              animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
            "></div>
          </div>
        `,
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      });

      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng([userLocation.latitude, userLocation.longitude]);
      } else {
        userMarkerRef.current = L.marker([userLocation.latitude, userLocation.longitude], {
          icon: userIcon,
          zIndexOffset: 1000
        }).addTo(map);
      }

      // DO NOT animate or pan if map container is hidden (e.g. mobile list mode display:none)
      if (!isMapVisible) return;

      map.invalidateSize();

      // If an active route geometry is plotted, respect route fitBounds
      if (routeGeometry && routeGeometry.coordinates && routeGeometry.coordinates.length > 0) {
        return;
      }

      // Relocate map viewport dynamically to user coordinates
      const center = map.getCenter();
      if (!center) return;
      const latDiff = Math.abs(center.lat - userLocation.latitude);
      const lngDiff = Math.abs(center.lng - userLocation.longitude);

      if (latDiff > 0.0001 || lngDiff > 0.0001) {
        const currentZoom = map.getZoom() || 15;
        const targetZoom = currentZoom < 13 ? 15 : currentZoom;
        map.flyTo([userLocation.latitude, userLocation.longitude], targetZoom, {
          animate: true,
          duration: (latDiff > 0.2 || lngDiff > 0.2) ? 1.0 : 0.6
        });
      }
    } catch (err) {
      console.warn('Leaflet user marker or flyTo warning:', err);
    }
  }, [userLocation.latitude, userLocation.longitude, routeGeometry, isMapVisible]);

  // Handle visibility changes (e.g. switching between list/map on mobile)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapContainerRef.current) return;

    if (isMapVisible) {
      try {
        map.invalidateSize();
        const timer = setTimeout(() => {
          try {
            map.invalidateSize();
            if (!routeGeometry && !selectedPlace && validCoordinates(userLocation.latitude, userLocation.longitude)) {
              map.panTo([userLocation.latitude, userLocation.longitude]);
            }
          } catch {}
        }, 150);

        return () => clearTimeout(timer);
      } catch (err) {
        console.warn('Map visibility toggle warning:', err);
      }
    }
  }, [isMapVisible, userLocation.latitude, userLocation.longitude]);

  // Container Resize Observer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapContainerRef.current) return;

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      try {
        observer = new ResizeObserver(() => {
          try {
            map.invalidateSize();
          } catch {}
        });
        observer.observe(mapContainerRef.current);
      } catch {}
    }

    return () => {
      if (observer) observer.disconnect();
    };
  }, []);

  // Fly to selected place when user taps a POI
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedPlace || !selectedPlace.location) return;
    if (!validCoordinates(selectedPlace.location.latitude, selectedPlace.location.longitude)) return;

    try {
      if (isMapVisible) {
        map.flyTo([selectedPlace.location.latitude, selectedPlace.location.longitude], 16, {
          animate: true,
          duration: 0.8
        });
      }
    } catch (err) {
      console.warn('Fly to selected place warning:', err);
    }
  }, [selectedPlace, isMapVisible]);

  // Update POI Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    if (!map || !markersGroup) return;

    try {
      markersGroup.clearLayers();

      const validPlaces = (places || []).filter(p =>
        p &&
        p.location &&
        validCoordinates(p.location.latitude, p.location.longitude)
      );

      validPlaces.forEach((place) => {
        try {
          const isSelected = selectedPlace?.id === place.id;
          const customIcon = L.divIcon({
            className: 'custom-poi-marker',
            html: createPlaceMarker(place, isSelected),
            iconSize: [95, 26],
            iconAnchor: [0, 0]
          });
          const marker = L.marker([place.location.latitude, place.location.longitude], {
            icon: customIcon
          });

          marker.on('click', () => {
            onSelectPlace(place);
          });

          markersGroup.addLayer(marker);
        } catch (mErr) {
          console.warn('Marker create warning:', mErr);
        }
      });
    } catch (err) {
      console.warn('Markers group update warning:', err);
    }
  }, [places, selectedPlace, onSelectPlace]);

  // Update Route Polyline
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    try {
      if (routeLayerRef.current) {
        map.removeLayer(routeLayerRef.current);
        routeLayerRef.current = null;
      }

      if (routeGeometry && routeGeometry.coordinates && routeGeometry.coordinates.length > 0) {
        const validCoords = routeGeometry.coordinates.filter(c =>
          Array.isArray(c) &&
          validCoordinates(c[1], c[0])
        );

        if (validCoords.length > 0) {
          // GeoJSON has [lon, lat], Leaflet needs [lat, lon]
          const latLngs = validCoords.map(c => [c[1], c[0]] as [number, number]);
          const polyline = L.polyline(latLngs, {
            color: '#0284c7',
            weight: 6,
            opacity: 0.85,
            lineCap: 'round',
            lineJoin: 'round',
            dashArray: undefined
          }).addTo(map);

          routeLayerRef.current = polyline;
          if (isMapVisible) {
            map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
          }
        }
      }
    } catch (err) {
      console.warn('Route polyline warning:', err);
    }
  }, [routeGeometry, isMapVisible]);

  return (
    <div className={`relative overflow-hidden rounded-xl bg-[#e4e9ec] ${className}`}>
      {/* Dynamic Map Controls (Layer Switcher + Recenter) */}
      <div className="absolute top-3 right-3 z-[1000] flex items-center gap-1.5 pointer-events-auto">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (mapInstanceRef.current && validCoordinates(userLocation.latitude, userLocation.longitude)) {
              mapInstanceRef.current.flyTo([userLocation.latitude, userLocation.longitude], 15, {
                animate: true,
                duration: 0.8
              });
            }
          }}
          className="h-8 px-2.5 rounded-xl bg-white/95 backdrop-blur-md shadow-md border border-slate-200/90 flex items-center gap-1 text-[11px] font-bold text-primary active:scale-95 transition-all hover:bg-slate-50 cursor-pointer"
          title="Recenter Map on Current Location"
        >
          <span className="material-symbols-outlined text-[16px]">my_location</span>
          <span className="hidden sm:inline">Recenter</span>
        </button>

        <div className="flex items-center bg-white/95 backdrop-blur-md p-1 rounded-xl shadow-md border border-slate-200/90 gap-1 text-[11px] font-bold">
          {(['google_streets', 'google_satellite', 'osm'] as MapTileProvider[]).map((prov) => {
            const cfg = TILE_CONFIG[prov];
            const isActive = currentProvider === prov;
            return (
              <button
                key={prov}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentProvider(prov);
                }}
                className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title={cfg.name}
              >
                <span>{cfg.icon}</span>
                <span className="hidden sm:inline">{cfg.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div ref={mapContainerRef} className="w-full h-full min-h-[300px]" />
    </div>
  );
};
