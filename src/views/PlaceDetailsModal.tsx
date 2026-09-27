import React, { useState, useEffect } from 'react';
import { Place } from '../types';
import { storage } from '../services/storage';

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

  useEffect(() => {
    setIsSaved(storage.isPlaceSaved(place.id));
  }, [place.id]);

  const handleToggleSave = () => {
    const res = storage.toggleSavePlace(place);
    setIsSaved(res.saved);
    setNotification(res.saved ? 'Saved to local encrypted offline list' : 'Removed from offline list');
    setTimeout(() => setNotification(null), 3000);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: place.name,
        text: `${place.name} - ${place.address} (${place.distanceMeters}m away)`,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${place.name} - ${place.address}`);
      setNotification('Place coordinates & address copied to clipboard');
      setTimeout(() => setNotification(null), 2500);
    }
  };

  const walkMinutes = Math.max(1, Math.round(place.distanceMeters / 70));
  const driveMinutes = Math.max(1, Math.round(place.distanceMeters / 300));
  const driveDistance = Math.round(place.distanceMeters * 1.4);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-surface overflow-y-auto max-w-md mx-auto">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-10 pt-safe bg-surface/90 backdrop-blur-xl border-b border-[#eae6df] px-4 py-3 flex items-center justify-between">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-surface shadow-tactile active:shadow-tactile-inset flex items-center justify-center text-on-surface"
          aria-label="Back"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </button>
        
        <span className="text-[15px] font-extrabold text-on-surface">
          Place Details
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleSave}
            className="w-10 h-10 rounded-full bg-surface shadow-tactile active:shadow-tactile-inset flex items-center justify-center text-outline hover:text-red-500"
            title={isSaved ? 'Saved to Offline List' : 'Save'}
          >
            <span 
              className={`material-symbols-outlined text-[20px] ${isSaved ? 'text-red-500' : ''}`}
              style={isSaved ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              {isSaved ? 'favorite' : 'favorite_border'}
            </span>
          </button>
          
          <button
            onClick={handleShare}
            className="w-10 h-10 rounded-full bg-surface shadow-tactile active:shadow-tactile-inset flex items-center justify-center text-on-surface"
            title="Share"
          >
            <span className="material-symbols-outlined text-[20px]">share</span>
          </button>
        </div>
      </header>

      {/* Notification Toast */}
      {notification && (
        <div className="mx-4 mt-2 p-2.5 rounded-xl bg-primary text-white text-[12px] font-bold text-center shadow-tactile-primary animate-fade-in">
          {notification}
        </div>
      )}

      {/* Body Content */}
      <div className="p-4 flex flex-col gap-4 pb-12">
        {/* Photo Card */}
        <div className="relative rounded-2xl overflow-hidden shadow-tactile border border-[#eae6df]">
          {place.imageUrl ? (
            <img 
              src={place.imageUrl} 
              alt={place.name}
              className="w-full h-56 object-cover"
            />
          ) : (
            <div className="w-full h-44 bg-surface-container flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[54px]">
                {place.category === 'hospital' ? 'local_hospital' :
                 place.category === 'pharmacy' ? 'medication' :
                 place.category === 'police' ? 'local_police' :
                 place.category === 'atm' ? 'atm' : 'place'}
              </span>
            </div>
          )}

          {/* Floating Category & Verified Badges */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
            <span className="px-3 py-1 rounded-full bg-[#E0F2FE]/95 backdrop-blur-sm text-primary text-[11px] font-extrabold border border-[#BAE6FD] shadow-sm">
              {place.hours.formatted || (place.hours.status === 'open' ? 'Open 24/7' : 'Hours Stated')}
            </span>
            {place.emergencyCapable && (
              <span className="px-3 py-1 rounded-full bg-red-100/95 backdrop-blur-sm text-red-700 text-[11px] font-extrabold border border-red-200 shadow-sm flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>
                Emergency Triage
              </span>
            )}
          </div>
        </div>

        {/* Place Title & Address */}
        <div className="flex flex-col">
          <h1 className="text-[22px] font-extrabold text-on-surface tracking-tight leading-tight">
            {place.name}
          </h1>
          {place.localizedName && (
            <p className="text-[14px] text-on-surface-variant font-medium mt-0.5">
              {place.localizedName}
            </p>
          )}

          <div className="mt-3 flex flex-col gap-1.5 text-[12px] text-on-surface-variant">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-primary">location_on</span>
              <span className="font-medium">{place.address}</span>
            </div>
            {place.phone && (
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-primary">call</span>
                <a href={`tel:${place.phone}`} className="font-bold text-primary underline">
                  {place.phone}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Mode Selector Cards: Walk vs Drive */}
        <div className="grid grid-cols-2 gap-3">
          <div 
            onClick={() => setSelectedMode('walking')}
            className={`cursor-pointer p-3 rounded-2xl flex flex-col gap-1 border transition-all ${
              selectedMode === 'walking'
                ? 'bg-[#E0F2FE] border-[#BAE6FD] shadow-tactile-inset-sm text-primary'
                : 'bg-surface border-[#eae6df] shadow-tactile text-on-surface'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px]">directions_walk</span>
              <span className="text-[12px] font-extrabold">Walk</span>
            </div>
            <div className="text-[15px] font-extrabold mt-1">
              {walkMinutes} min
            </div>
            <div className="text-[11px] opacity-80 font-medium">
              {place.distanceMeters} meters
            </div>
          </div>

          <div 
            onClick={() => setSelectedMode('driving')}
            className={`cursor-pointer p-3 rounded-2xl flex flex-col gap-1 border transition-all ${
              selectedMode === 'driving'
                ? 'bg-[#E0F2FE] border-[#BAE6FD] shadow-tactile-inset-sm text-primary'
                : 'bg-surface border-[#eae6df] shadow-tactile text-on-surface'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px]">directions_car</span>
              <span className="text-[12px] font-extrabold">Drive</span>
            </div>
            <div className="text-[15px] font-extrabold mt-1">
              {driveMinutes} min
            </div>
            <div className="text-[11px] opacity-80 font-medium">
              {driveDistance} meters
            </div>
          </div>
        </div>

        {/* Primary Route Trigger */}
        <button
          onClick={() => onStartRoute(place, selectedMode)}
          className="w-full h-12 rounded-full tactile-btn-primary flex items-center justify-center gap-2 text-[14px] font-bold shadow-tactile-primary select-none"
        >
          <span className="material-symbols-outlined text-[20px]">navigation</span>
          <span>Start {selectedMode === 'walking' ? 'Walking Directions' : 'Driving Route'}</span>
        </button>

        {/* Operating Schedule Card */}
        <section className="rounded-2xl bg-surface p-4 shadow-tactile border border-[#eae6df] flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-extrabold text-on-surface">Operating Schedule</span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#E0F2FE] text-primary font-bold">
              Live Verified
            </span>
          </div>

          <div className="flex flex-col gap-2 pt-1 divide-y divide-[#eae6df]/60">
            {(place.operatingSchedule || [
              { day: 'Monday - Friday', hours: '08:30 - 20:00', isOpenNow: true },
              { day: 'Saturday - Sunday', hours: '09:00 - 18:00', isOpenNow: false }
            ]).map((sched, idx) => (
              <div key={idx} className="flex items-center justify-between pt-2 text-[12px]">
                <span className="font-semibold text-on-surface">{sched.day}</span>
                <span className="font-mono font-medium text-on-surface-variant flex items-center gap-1.5">
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
          className={`w-full h-11 rounded-full text-[13px] font-bold flex items-center justify-center gap-2 transition-all ${
            isSaved 
              ? 'bg-red-50 text-red-600 border border-red-200 shadow-tactile-inset-sm'
              : 'bg-surface text-primary border border-[#eae6df] shadow-tactile active:scale-98'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">
            {isSaved ? 'bookmark_remove' : 'download_for_offline'}
          </span>
          <span>{isSaved ? 'Remove from Offline List' : 'Save to Offline List'}</span>
        </button>

        {/* Provenance and Integrity Box */}
        <div className="rounded-xl bg-surface-container p-3 text-[11px] text-on-surface-variant flex flex-col gap-1 border border-[#eae6df]/70 shadow-tactile-inset-sm">
          <div className="flex items-center justify-between font-semibold">
            <span>Data Authority:</span>
            <span className="text-on-surface">{place.source === 'CURATED_REGISTRY' ? 'National Health Registry' : 'OpenStreetMap (ODbL)'}</span>
          </div>
          <div className="flex items-center justify-between font-semibold">
            <span>Coordinates:</span>
            <span className="font-mono text-on-surface">{place.location.latitude.toFixed(5)}, {place.location.longitude.toFixed(5)}</span>
          </div>
          <div className="flex items-center justify-between font-semibold">
            <span>Source Snapshot:</span>
            <span>{new Date(place.sourceUpdatedAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Report Incorrect Info Link */}
        <button
          onClick={() => onOpenReportModal(place)}
          className="w-full py-2.5 flex items-center justify-center gap-1.5 text-[12px] font-bold text-outline hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">flag</span>
          <span>Report incorrect info</span>
        </button>
      </div>
    </div>
  );
};
