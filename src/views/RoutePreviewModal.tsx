import React, { useState, useEffect } from 'react';
import { Place, RouteResponse, LocationCoordinates } from '../types';
import { api } from '../services/api';
import { LiveLeafletMap } from '../components/LiveLeafletMap';

interface RoutePreviewModalProps {
  place: Place;
  mode: 'walking' | 'driving';
  userLocation: LocationCoordinates;
  onClose: () => void;
  onStartLiveNavigation: (route: RouteResponse) => void;
}

export const RoutePreviewModal: React.FC<RoutePreviewModalProps> = ({
  place,
  mode,
  userLocation,
  onClose,
  onStartLiveNavigation
}) => {
  const [route, setRoute] = useState<RouteResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    api.getRoute('live', mode, userLocation, place.location)
      .then(res => {
        if (isMounted) {
          setRoute(res);
          setLoading(false);
        }
      })
      .catch(err => {
        console.warn('Failed to fetch route, using fallback:', err);
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [place, mode, userLocation]);

  const durationSeconds = route?.durationSeconds || (mode === 'walking' ? Math.round(place.distanceMeters / 1.2) : Math.round(place.distanceMeters / 6));
  const distanceMeters = route?.distanceMeters || place.distanceMeters;
  const minutes = Math.max(1, Math.round(durationSeconds / 60));
  const steps = route?.steps || [
    {
      id: 'step-1',
      instruction: `Head directly toward ${place.name}`,
      distanceMeters,
      durationSeconds,
      maneuver: 'depart' as const,
      landmark: place.address
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md px-5 py-3.5 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">
                {mode === 'walking' ? 'directions_walk' : 'directions_car'}
              </span>
            </div>
            <div>
              <h1 className="font-bold text-sm text-slate-900 leading-tight">Route Preview</h1>
              <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                <span className="truncate max-w-[210px]">{place.name}</span>
              </div>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
            aria-label="Close route preview"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Route Summary Strip */}
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-slate-900 text-lg">
                  {loading ? 'Calculating...' : `${minutes} min`}
                </span>
                <span className="text-xs text-slate-500 font-semibold">
                  • {distanceMeters}m
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {mode === 'walking' ? 'Pedestrian Route' : 'Driving Route'} via OpenStreetMap
              </p>
            </div>
          </div>
          
          <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 capitalize border border-sky-100">
            {mode}
          </span>
        </div>

        {/* Mini Leaflet Route Map */}
        <div className="p-5 pb-0">
          <div className="w-full h-44 rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
            <LiveLeafletMap
              userLocation={userLocation}
              places={[place]}
              selectedPlace={place}
              routeGeometry={route?.geometry}
              onSelectPlace={() => {}}
              className="w-full h-full"
            />
          </div>
        </div>

        {/* Route Steps Header */}
        <div className="p-5 flex-1 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900">
              Turn-by-Turn Guidance ({steps.length} Steps)
            </span>
            <span className="text-xs font-medium text-sky-700 flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px]">volume_up</span>
              Voice Enabled
            </span>
          </div>

          {/* Steps Timeline */}
          <div className="relative pl-6 flex flex-col gap-3.5 py-1">
            <div className="absolute left-[11px] top-3 bottom-3 w-[2px] bg-slate-200"></div>

            {steps.map((step, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === steps.length - 1;
              return (
                <div key={step.id || idx} className="relative flex items-start gap-3">
                  <div className={`absolute -left-[19px] top-1.5 w-4 h-4 rounded-full flex items-center justify-center z-10 ${
                    isFirst || isLast 
                      ? 'bg-sky-600 ring-4 ring-sky-100' 
                      : 'bg-white border-2 border-sky-600'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isFirst || isLast ? 'bg-white' : 'bg-sky-600'}`}></span>
                  </div>

                  <div className="flex-1 rounded-2xl bg-slate-50 p-3.5 border border-slate-200/80 flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-sky-700 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">
                          {step.maneuver === 'turn_right' ? 'turn_right' :
                           step.maneuver === 'turn_left' ? 'turn_left' :
                           step.maneuver === 'arrive' ? 'pin_drop' : 'straight'}
                        </span>
                        <span>In {step.distanceMeters}m</span>
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        Step {idx + 1}
                      </span>
                    </div>

                    <p className="text-xs font-bold text-slate-900 leading-snug">
                      {step.instruction}
                    </p>

                    {step.instructionLocal && (
                      <p className="text-xs font-medium text-slate-500">
                        {step.instructionLocal}
                      </p>
                    )}

                    {step.landmark && (
                      <div className="mt-1 pt-1 border-t border-slate-200/60 flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                        <span className="material-symbols-outlined text-[14px] text-sky-600">visibility</span>
                        <span>{step.landmark}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sticky Bottom Actions */}
        <div className="sticky bottom-0 z-20 bg-white/95 backdrop-blur-md p-5 border-t border-slate-100 flex flex-col gap-2">
          <button
            onClick={() => {
              if (route) {
                onStartLiveNavigation(route);
              } else {
                onStartLiveNavigation({
                  graphVersion: 'osrm-fallback',
                  profileVersion: 'walking-1.0',
                  mode,
                  distanceMeters,
                  durationSeconds,
                  geometry: {
                    type: 'LineString',
                    coordinates: [
                      [userLocation.longitude, userLocation.latitude],
                      [place.location.longitude, place.location.latitude]
                    ]
                  },
                  steps,
                  sourceUpdatedAt: new Date().toISOString(),
                  coverageAreaId: 'live'
                });
              }
            }}
            className="w-full h-11 rounded-xl bg-sky-600 hover:bg-sky-700 text-white flex items-center justify-center gap-2 text-xs font-bold shadow-sm active:scale-98 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">play_arrow</span>
            <span>Start Live Navigation</span>
          </button>

          <button
            onClick={onClose}
            className="w-full py-1 text-center text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            Back to Place Details
          </button>
        </div>
      </div>
    </div>
  );
};
