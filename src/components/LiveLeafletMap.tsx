import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Place, LocationCoordinates } from '../types';

interface LiveLeafletMapProps {
  userLocation: LocationCoordinates;
  places: Place[];
  selectedPlace?: Place | null;
  routeGeometry?: { coordinates: [number, number][] } | null;
  onSelectPlace: (place: Place) => void;
  className?: string;
}

export const LiveLeafletMap: React.FC<LiveLeafletMapProps> = ({
  userLocation,
  places,
  selectedPlace,
  routeGeometry,
  onSelectPlace,
  className = "w-full h-full"
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [userLocation.latitude, userLocation.longitude],
      zoom: 15,
      zoomControl: false,
      attributionControl: false
    });

    // Clean CartoDB Positron tiles for the Tactile Cerulean aesthetic
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update User Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

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
  }, [userLocation]);

  // Update POI Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    places.forEach((place) => {
      const isSelected = selectedPlace?.id === place.id;
      const bg = isSelected ? '#0369a1' : (place.emergencyCapable ? '#ba1a1a' : '#0284c7');
      const iconGlyph = place.category === 'hospital' ? '+' :
                        place.category === 'pharmacy' ? 'Rx' :
                        place.category === 'police' ? 'POL' :
                        place.category === 'atm' ? '$' :
                        place.category === 'transit_stop' ? 'TR' :
                        place.category === 'cafe' ? '☕' : '•';

      const customIcon = L.divIcon({
        className: 'custom-poi-marker',
        html: `
          <div style="
            background: ${bg};
            color: #ffffff;
            font-size: 11px;
            font-weight: 800;
            padding: 3px 8px;
            border-radius: 9999px;
            box-shadow: -2px -2px 6px rgba(255,255,255,0.9), 2px 4px 8px rgba(0,0,0,0.25);
            border: 2px solid #ffffff;
            display: flex;
            align-items: center;
            gap: 4px;
            white-space: nowrap;
            transform: translate(-50%, -50%);
            cursor: pointer;
          ">
            <span>${iconGlyph}</span>
            <span>${place.name.split(' ')[0]}</span>
            <span style="opacity: 0.85; font-size: 10px;">${place.distanceMeters}m</span>
          </div>
        `,
        iconSize: [80, 24],
        iconAnchor: [0, 0]
      });

      const marker = L.marker([place.location.latitude, place.location.longitude], {
        icon: customIcon
      });

      marker.on('click', () => {
        onSelectPlace(place);
      });

      markersGroup.addLayer(marker);
    });
  }, [places, selectedPlace, onSelectPlace]);

  // Update Route Polyline
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (routeLayerRef.current) {
      map.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }

    if (routeGeometry && routeGeometry.coordinates && routeGeometry.coordinates.length > 0) {
      // GeoJSON has [lon, lat], Leaflet needs [lat, lon]
      const latLngs = routeGeometry.coordinates.map(c => [c[1], c[0]] as [number, number]);
      const polyline = L.polyline(latLngs, {
        color: '#0284c7',
        weight: 6,
        opacity: 0.85,
        lineCap: 'round',
        lineJoin: 'round',
        dashArray: undefined
      }).addTo(map);

      routeLayerRef.current = polyline;
      map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
    }
  }, [routeGeometry]);

  return (
    <div className={`relative overflow-hidden rounded-xl bg-[#e4e9ec] ${className}`}>
      <div ref={mapContainerRef} className="w-full h-full min-h-[300px]" />
    </div>
  );
};
