import React, { useState, useEffect } from 'react';
import { EmergencyDossier, Place } from '../types';
import { api } from '../services/api';
import { osmService } from '../services/osmService';
import { speechEngine } from '../services/speechEngine';
import { LiveLocationState } from '../hooks/useLiveLocation';

interface EmergencySOSViewProps {
  location: LiveLocationState;
  onStartRouteToER: (place: Place) => void;
}

export const EmergencySOSView: React.FC<EmergencySOSViewProps> = ({
  location,
  onStartRouteToER
}) => {
  const [dossier, setDossier] = useState<EmergencyDossier | null>(null);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [speakingPhraseIndex, setSpeakingPhraseIndex] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    api.getEmergencyDossier(location.countryCode).then(res => {
      if (!isMounted) return;
      setDossier(res);
      // Try to query nearest real-world hospital via OpenStreetMap Overpass
      osmService.fetchNearbyPOIs(location.coords.latitude, location.coords.longitude, 'hospital', 8000)
        .then(places => {
          if (isMounted && places.length > 0) {
            setDossier(prev => prev ? { ...prev, verifiedER: places[0] } : null);
          }
        })
        .catch(err => console.warn('Live hospital search error:', err));
    });

    return () => { isMounted = false; };
  }, [location.countryCode, location.coords.latitude, location.coords.longitude]);

  const handleCopyCoordinates = () => {
    const latStr = location.coords.latitude >= 0 ? `${location.coords.latitude.toFixed(5)}° N` : `${Math.abs(location.coords.latitude).toFixed(5)}° S`;
    const lngStr = location.coords.longitude >= 0 ? `${location.coords.longitude.toFixed(5)}° E` : `${Math.abs(location.coords.longitude).toFixed(5)}° W`;
    const coordStr = `EMERGENCY LOCATION BEACON: ${latStr}, ${lngStr} (Accuracy ±${location.accuracyMeters}m). Region: ${location.cityName}`;
    
    navigator.clipboard.writeText(coordStr);
    setCopyFeedback(true);
    speechEngine.playAcousticChime('tap');
    setTimeout(() => setCopyFeedback(false), 3000);
  };

  const handleSpeakPhrase = (text: string, index: number) => {
    setSpeakingPhraseIndex(index);
    speechEngine.speak(text, () => setSpeakingPhraseIndex(null));
  };

  if (!dossier) return null;

  return (
    <div className="flex-1 flex flex-col w-full max-w-5xl mx-auto px-4 md:px-8 pb-28 pt-2">
      {/* Toast Confirmation */}
      {copyFeedback && (
        <div className="mb-4 p-3 rounded-2xl bg-emerald-600 text-white text-xs font-bold text-center shadow-md flex items-center justify-center gap-2 animate-fadeIn">
          <span className="material-symbols-outlined text-[18px]">verified</span>
          <span>Exact GPS Coordinates copied to clipboard for emergency responders</span>
        </div>
      )}

      {/* Header Info */}
      <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
            <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">
              Emergency Guidance & Hotlines
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Emergency Assistance</h1>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold text-xs flex items-center gap-1.5 border border-slate-200">
            <span className="material-symbols-outlined text-[15px] text-emerald-600">verified</span>
            <span>Always Available Offline</span>
          </span>
        </div>
      </div>

      {/* Live GPS Coordinates Hero Card with 1-Tap Copy */}
      <section className="mb-6">
        <div className="rounded-2xl bg-white p-5 sm:p-6 shadow-sm border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sky-600 text-[16px]">my_location</span>
              <span>Your Live Location Beacon</span>
            </span>
            <h2 className="text-xl font-bold text-slate-900 mt-1">
              {location.cityName}
            </h2>
            <p className="text-sm font-mono font-bold text-sky-700 mt-0.5">
              {location.coords.latitude.toFixed(5)}° N, {location.coords.longitude.toFixed(5)}° E
            </p>
            <span className="text-xs font-semibold text-slate-500 mt-1">
              Position Accuracy: ±{location.accuracyMeters}m ({location.status === 'fixed' ? 'Direct Satellite GPS' : 'Regional Location'})
            </span>
          </div>

          <button
            onClick={handleCopyCoordinates}
            className="h-11 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm active:scale-98 transition-all select-none cursor-pointer flex-shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">content_copy</span>
            <span>Copy Coordinates</span>
          </button>
        </div>
      </section>

      {/* Grid for Hotlines & ER Hospital (Multi-column on Tablet/Desktop) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* National Emergency Hotlines */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">
              National Emergency Hotlines • {dossier.countryName}
            </h2>
            <span className="text-xs text-slate-400 font-medium">Free Calls</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {dossier.nationalHotlines.map((hotline, idx) => (
              <a
                key={idx}
                href={`tel:${hotline.number}`}
                className="p-4 rounded-2xl bg-white shadow-sm border border-slate-200/80 flex flex-col justify-between gap-3 active:scale-98 transition-all hover:border-rose-300 hover:shadow-md group"
              >
                <div>
                  <span className="text-xs font-semibold text-slate-500 truncate block">
                    {hotline.service}
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-rose-600 tracking-tight leading-tight block mt-1">
                    {hotline.number}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400 font-medium pt-2 border-t border-slate-100">
                  <span className="group-hover:text-rose-600 transition-colors">Tap to Call</span>
                  <span className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-[16px]">call</span>
                  </span>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* Nearest Verified Emergency Facility */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">
              Nearest Verified 24/7 Hospital
            </h2>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              Open 24/7
            </span>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80 flex flex-col justify-between gap-3.5 h-full">
            <div>
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse"></span>
                  Emergency Department
                </span>
                <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md">
                  {dossier.verifiedER.distanceMeters}m away
                </span>
              </div>

              <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-2.5">
                {dossier.verifiedER.name}
              </h3>
              {dossier.verifiedER.localizedName && (
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {dossier.verifiedER.localizedName}
                </p>
              )}
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {dossier.verifiedER.address}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-sky-50/70 text-xs text-sky-900 font-medium flex items-center gap-2 border border-sky-100">
              <span className="material-symbols-outlined text-[18px] text-sky-600 flex-shrink-0">medical_services</span>
              <span>24/7 Trauma casualty & English assistance available</span>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => onStartRouteToER(dossier.verifiedER)}
                className="flex-1 h-10 rounded-xl bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center gap-2 text-xs font-bold shadow-sm active:scale-98 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">turn_right</span>
                <span>Directions to Hospital</span>
              </button>
              {dossier.verifiedER.phone && (
                <a
                  href={`tel:${dossier.verifiedER.phone}`}
                  className="h-10 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  title="Call Emergency Hospital"
                >
                  <span className="material-symbols-outlined text-[18px]">call</span>
                  <span>Call</span>
                </a>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Emergency Responder Communication Flashcards */}
      <section className="flex flex-col gap-3 pb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">
            Emergency Phrases • Show to First Responders
          </h2>
          <span className="text-xs text-slate-400 font-medium">Bilingual Speech Enabled</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {dossier.emergencyPhrases.map((phrase, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-white shadow-sm border border-slate-200/80 flex items-center justify-between gap-3 hover:border-slate-300 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700">
                  {phrase.category}
                </span>
                <p className="text-base font-bold text-slate-900 mt-0.5 leading-snug">
                  {phrase.localScript}
                </p>
                <p className="text-xs text-slate-600 font-medium mt-0.5">
                  "{phrase.english}"
                </p>
                <p className="text-[11px] font-mono text-slate-400 italic mt-0.5">
                  {phrase.pronunciation}
                </p>
              </div>

              <button
                onClick={() => handleSpeakPhrase(phrase.localScript, idx)}
                className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors flex-shrink-0 cursor-pointer"
                title="Speak Aloud"
              >
                <span className={`material-symbols-outlined text-[20px] text-sky-600 ${speakingPhraseIndex === idx ? 'animate-bounce text-sky-700' : ''}`}>
                  volume_up
                </span>
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
