import React, { useState, useEffect } from 'react';
import { EmergencyDossier, Place } from '../types';
import { api } from '../services/api';
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
    api.getEmergencyDossier(location.countryCode).then(res => setDossier(res));
  }, [location.countryCode]);

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
        <div className="mb-2 p-3 rounded-xl bg-emerald-700 text-white text-[12px] font-bold text-center shadow-tactile-sm flex items-center justify-center gap-1.5 animate-fade-in">
          <span className="material-symbols-outlined text-[18px]">verified</span>
          <span>Exact Live GPS Coordinates copied to clipboard for Emergency Responders</span>
        </div>
      )}

      {/* Header Info */}
      <div className="py-2 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
            <span className="text-[11px] font-extrabold text-red-600 uppercase tracking-wider">
              Emergency Guidance & Hotlines
            </span>
          </div>
          <h1 className="text-[22px] md:text-[26px] font-extrabold text-on-surface">Emergency SOS Hub</h1>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-surface-container shadow-tactile-inset-sm text-primary font-bold text-[11px] flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">offline_pin</span>
            <span>100% OFFLINE</span>
          </span>
        </div>
      </div>

      {/* Live GPS Coordinates Hero Card with 1-Tap Copy */}
      <section className="pt-1 pb-3">
        <div className="rounded-2xl bg-surface p-5 shadow-tactile border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-[11px] font-extrabold uppercase text-on-surface-variant flex items-center gap-1">
              <span className="material-symbols-outlined text-primary text-[15px]">near_me</span>
              <span>Live Triangulated Coordinates</span>
            </span>
            <h2 className="text-[20px] font-extrabold text-on-surface mt-0.5">
              {location.cityName}
            </h2>
            <p className="text-[14px] font-mono font-bold text-primary mt-0.5">
              {location.coords.latitude.toFixed(5)}° N • {location.coords.longitude.toFixed(5)}° E
            </p>
            <span className="text-[11px] font-semibold text-emerald-700 mt-1">
              Fix: {location.status === 'fixed' ? 'High-Accuracy Satellite Lock' : 'Simulated Regional Node'} (±{location.accuracyMeters}m)
            </span>
          </div>

          <button
            onClick={handleCopyCoordinates}
            className="h-12 px-6 rounded-xl bg-surface-container-low text-primary text-[13px] font-extrabold flex items-center justify-center gap-2 border border-[#eae6df] shadow-tactile active:scale-98 select-none flex-shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">content_copy</span>
            <span>Copy Live Coordinates</span>
          </button>
        </div>
      </section>

      {/* Grid for Hotlines & ER Hospital (Multi-column on Tablet/Desktop) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
        {/* National Emergency Hotlines */}
        <section className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-extrabold text-on-surface">
              National Hotlines ({dossier.countryName})
            </span>
            <span className="text-[10px] font-bold text-outline">No Mobile Data Required</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {dossier.nationalHotlines.map((hotline, idx) => (
              <a
                key={idx}
                href={`tel:${hotline.number}`}
                className="p-3.5 rounded-2xl bg-surface shadow-tactile border border-[#eae6df] flex flex-col justify-between gap-2 active:scale-98 transition-all hover:border-red-300"
              >
                <div>
                  <span className="text-[11px] font-bold text-on-surface-variant truncate block">
                    {hotline.service}
                  </span>
                  <span className="text-[26px] font-black text-red-600 tracking-tight leading-tight block mt-0.5">
                    {hotline.number}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-outline font-semibold">
                  <span>Free Call</span>
                  <span className="material-symbols-outlined text-[16px] text-primary">call</span>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* Nearest Verified Emergency Facility */}
        <section className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-extrabold text-on-surface">
              Nearest Verified 24/7 ER
            </span>
            <span className="text-[11px] font-bold text-primary">
              Priority Tier 1
            </span>
          </div>

          <div className="rounded-[22px] bg-surface p-4 shadow-tactile border border-red-200/80 flex flex-col justify-between gap-3 h-full">
            <div>
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-extrabold uppercase border border-red-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>
                  Trauma Casualty
                </span>
                <span className="text-[12px] font-bold text-primary">
                  {dossier.verifiedER.distanceMeters}m away
                </span>
              </div>

              <h3 className="text-[17px] font-extrabold text-on-surface mt-2">
                {dossier.verifiedER.name}
              </h3>
              {dossier.verifiedER.localizedName && (
                <p className="text-[12px] text-on-surface-variant font-medium">
                  {dossier.verifiedER.localizedName}
                </p>
              )}
              <p className="text-[11px] text-on-surface-variant mt-1">
                {dossier.verifiedER.address}
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-[#F0F9FF] text-[11px] text-primary font-semibold flex items-center gap-1.5 border border-[#E0F2FE]">
              <span className="material-symbols-outlined text-[16px] flex-shrink-0">translate</span>
              <span>English & Multilingual triage staff on duty</span>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => onStartRouteToER(dossier.verifiedER)}
                className="flex-1 h-11 rounded-full tactile-btn-primary flex items-center justify-center gap-1.5 text-[12px] font-bold shadow-tactile-primary active:scale-98"
              >
                <span className="material-symbols-outlined text-[18px]">turn_right</span>
                <span>Direct Route (4 min)</span>
              </button>
              {dossier.verifiedER.phone && (
                <a
                  href={`tel:${dossier.verifiedER.phone}`}
                  className="w-11 h-11 rounded-full bg-surface-container flex items-center justify-center text-primary shadow-tactile active:scale-95"
                  title="Call Emergency Hospital"
                >
                  <span className="material-symbols-outlined text-[20px]">call</span>
                </a>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Emergency Responder Communication Flashcards */}
      <section className="flex flex-col gap-2.5 pb-6">
        <div className="flex items-center justify-between">
          <span className="text-[14px] font-extrabold text-on-surface">
            Bilingual First Responder Cards
          </span>
          <span className="text-[11px] font-semibold text-outline">Show to Paramedics / Police</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {dossier.emergencyPhrases.map((phrase, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-2xl bg-surface shadow-tactile border border-[#eae6df] flex items-center justify-between gap-3"
            >
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                  {phrase.category}
                </span>
                <p className="text-[15px] font-extrabold text-on-surface mt-0.5 leading-snug">
                  {phrase.localScript}
                </p>
                <p className="text-[12px] text-on-surface-variant font-medium">
                  "{phrase.english}"
                </p>
                <p className="text-[10px] font-mono text-outline italic">
                  {phrase.pronunciation}
                </p>
              </div>

              <button
                onClick={() => handleSpeakPhrase(phrase.localScript, idx)}
                className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary shadow-tactile active:scale-95 flex-shrink-0"
                title="Speak Aloud"
              >
                <span className={`material-symbols-outlined text-[20px] ${speakingPhraseIndex === idx ? 'animate-bounce text-secondary' : ''}`}>
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
