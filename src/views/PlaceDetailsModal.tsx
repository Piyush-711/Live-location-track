import React, { useState, useEffect } from 'react';
import { Place } from '../types';
import { storage } from '../services/storage';
import { getCategoryVisualMeta, getDynamicPlaceImage } from '../utils/placeVisuals';

interface PlaceDetailsModalProps {
  place: Place;
  onClose: () => void;
  onStartRoute: (place: Place, mode: 'walking' | 'driving') => void;
  onOpenReportModal: (place: Place) => void;
}

export const PlaceDetailsModal: React.FC<PlaceDetailsModalProps> = ({
  place,
  onClose,
  onStartRoute,
  onOpenReportModal
}) => {
  const [isSaved, setIsSaved] = useState(false);
  const [selectedMode, setSelectedMode] = useState<'walking' | 'driving'>('walking');
  const [notification, setNotification] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);

  const visualMeta = getCategoryVisualMeta(place.category, place.name);
  const dynamicImg = getDynamicPlaceImage(place);

  useEffect(() => {
    const refresh = () => setIsSaved(storage.isPlaceSaved(place.id));
    refresh();
    setImgError(false);
    return storage.subscribeSavedPlaces(refresh);
  }, [place.id]);

  const handleToggleSave = async () => {
    try {
      const res = await storage.toggleSavePlace(place);
      setNotification(res.saved ? 'Saved in this browser' : 'Removed from saved places');
    } catch (err) { setNotification(err instanceof Error ? err.message : 'Unable to save this place.'); }
  };

  const handleShare = async () => {
    if (navigator.share) {
      navigator.share({
        title: place.name,
        text: `${place.name} - ${place.address} (${place.distanceMeters}m away)`,
        url: window.location.href
      }).catch(() => {});
    } else {
      try {
        await navigator.clipboard.writeText(`${place.name} - ${place.address} (${place.location.latitude}, ${place.location.longitude})`);
        setNotification('Place coordinates & address copied to clipboard');
      } catch { setNotification('Clipboard access is unavailable.'); }
    }
  };

  const walkMinutes = Math.max(1, Math.round(place.distanceMeters / 70));
  const driveMinutes = Math.max(1, Math.round(place.distanceMeters / 300));
  const driveDistance = Math.round(place.distanceMeters * 1.4);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-y-auto">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-slate-100 px-5 py-3.5 flex items-center justify-between">
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
            aria-label="Back"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          
          <span className="text-sm font-bold text-slate-900">
            Place Details
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleSave}
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 hover:text-rose-600 transition-colors cursor-pointer"
              title={isSaved ? 'Saved to Offline List' : 'Save'}
            >
              <span 
                className={`material-symbols-outlined text-[20px] ${isSaved ? 'text-rose-500 fill' : ''}`}
                style={isSaved ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {isSaved ? 'favorite' : 'favorite_border'}
              </span>
            </button>
            
            <button
              onClick={handleShare}
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
              title="Share"
            >
              <span className="material-symbols-outlined text-[20px]">share</span>
            </button>
          </div>
        </header>

        {/* Notification Toast */}
        {notification && (
          <div className="mx-5 mt-3 p-3 rounded-xl bg-sky-600 text-white text-xs font-semibold text-center shadow-sm animate-fadeIn">
            {notification}
          </div>
        )}

        {/* Body Content */}
        <div className="p-5 flex flex-col gap-4">
          {/* Photo Card */}
          <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
            {!imgError && dynamicImg ? (
              <img 
                src={dynamicImg} 
                alt={place.name}
                onError={() => setImgError(true)}
                className="w-full h-56 object-cover"
              />
            ) : (
              <div className={`w-full h-44 ${visualMeta.bgClass} flex flex-col items-center justify-center ${visualMeta.textClass} border ${visualMeta.borderClass} gap-1.5`}>
                <span className="material-symbols-outlined text-[54px]">
                  {visualMeta.icon}
                </span>
                <span className="text-xs font-bold uppercase tracking-wider opacity-90">
                  {visualMeta.label}
                </span>
              </div>
            )}

            {/* Floating Badges */}
            <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-white/95 backdrop-blur-md text-sky-700 text-xs font-bold border border-sky-100 shadow-sm">
                {place.hours.formatted || (place.hours.status === 'open' ? 'Open now' : place.hours.status === 'closed' ? 'Closed' : 'Hours not confirmed')}
              </span>
              {place.emergencyCapable && (
                <span className="px-3 py-1 rounded-full bg-rose-500/95 backdrop-blur-md text-white text-xs font-bold shadow-sm flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                  Emergency Triage
                </span>
              )}
            </div>
          </div>

          {/* Place Title & Address */}
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-tight">
              {place.name}
            </h1>
            {place.localizedName && (
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {place.localizedName}
              </p>
            )}

            <div className="mt-3 flex flex-col gap-2 text-xs text-slate-600 font-medium">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-sky-600">location_on</span>
                <span>{place.address}</span>
              </div>
              {place.phone && (
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-sky-600">call</span>
                  <a href={`tel:${place.phone}`} className="font-bold text-sky-700 hover:underline">
                    {place.phone}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Mode Selector Cards: Walk vs Drive */}
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => setSelectedMode('walking')}
              className={`p-3.5 rounded-2xl flex flex-col gap-1 border text-left transition-all cursor-pointer ${
                selectedMode === 'walking'
                  ? 'bg-sky-50 border-sky-200 text-sky-900 ring-1 ring-sky-500/20'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-bold">
                <span className="material-symbols-outlined text-[18px]">directions_walk</span>
                <span>Walking</span>
              </div>
              <div className="text-base font-bold mt-0.5">
                {walkMinutes} min
              </div>
              <div className="text-xs text-slate-500 font-medium">
                {place.distanceMeters} meters
              </div>
            </button>

            <button 
              onClick={() => setSelectedMode('driving')}
              className={`p-3.5 rounded-2xl flex flex-col gap-1 border text-left transition-all cursor-pointer ${
                selectedMode === 'driving'
                  ? 'bg-sky-50 border-sky-200 text-sky-900 ring-1 ring-sky-500/20'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-bold">
                <span className="material-symbols-outlined text-[18px]">directions_car</span>
                <span>Driving</span>
              </div>
              <div className="text-base font-bold mt-0.5">
                {driveMinutes} min
              </div>
              <div className="text-xs text-slate-500 font-medium">
                {driveDistance} meters
              </div>
            </button>
          </div>

          {/* Primary Route Trigger */}
          <button
            onClick={() => onStartRoute(place, selectedMode)}
            className="w-full h-11 rounded-xl bg-sky-600 hover:bg-sky-700 text-white flex items-center justify-center gap-2 text-xs font-bold shadow-sm active:scale-98 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">navigation</span>
            <span>Start {selectedMode === 'walking' ? 'Walking Directions' : 'Driving Route'}</span>
          </button>

          {/* Operating Schedule Card */}
          <section className="rounded-2xl bg-white p-4 border border-slate-200 shadow-sm flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">Operating Schedule</span>
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold">
                Listed hours
              </span>
            </div>

            <div className="flex flex-col gap-2 pt-1 divide-y divide-slate-100">
              {!place.operatingSchedule?.length && <p className="text-xs text-slate-500">{place.hours.raw || 'Opening hours are unavailable. Confirm with the place before travelling.'}</p>}
              {(place.operatingSchedule || []).map((sched, idx) => (
                <div key={idx} className="flex items-center justify-between pt-2 text-xs">
                  <span className="font-semibold text-slate-700">{sched.day}</span>
                  <span className="font-mono font-medium text-slate-500 flex items-center gap-1.5">
                    {sched.isOpenNow && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    )}
                    {sched.hours}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Save to Offline List Button */}
          <button
            onClick={handleToggleSave}
            className={`w-full h-10 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              isSaved 
                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {isSaved ? 'bookmark_remove' : 'bookmark_add'}
            </span>
            <span>{isSaved ? 'Remove from Saved Places' : 'Save to Favorites & Offline List'}</span>
          </button>

          {/* Provenance Box */}
          <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500 flex flex-col gap-1 border border-slate-200/80">
            <div className="flex items-center justify-between">
              <span className="font-semibold">Source:</span>
              <span className="text-slate-700">{place.source === 'CURATED_REGISTRY' ? 'Local directory' : 'OpenStreetMap'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold">Coordinates:</span>
              <span className="font-mono text-slate-700">{place.location.latitude.toFixed(5)}, {place.location.longitude.toFixed(5)}</span>
            </div>
          </div>

          {/* Report Incorrect Info Link */}
          <button
            onClick={() => onOpenReportModal(place)}
            className="w-full py-2 flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">flag</span>
            <span>Report incorrect details</span>
          </button>
        </div>
      </div>
    </div>
  );
};
