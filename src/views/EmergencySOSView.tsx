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
export const EmergencySOSView: React.FC<EmergencySOSViewProps> = ({ location, onStartRouteToER }) => {
  const [dossier, setDossier] = useState<EmergencyDossier | null>(null);
  const [hospital, setHospital] = useState<Place | null>(null);
  const [directoryError, setDirectoryError] = useState<string | null>(null);
  const [hospitalLoading, setHospitalLoading] = useState(true);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [speakingPhraseIndex, setSpeakingPhraseIndex] = useState<number | null>(null);
  const searchLat = Number(location.coords.latitude.toFixed(3));
  const searchLng = Number(location.coords.longitude.toFixed(3));
  const liveGPS = location.status === 'fixed' && !location.isCustom && !location.isSimulated;
  const coordinateText = Math.abs(location.coords.latitude).toFixed(5) + '° ' + (location.coords.latitude < 0 ? 'S' : 'N') + ', '
    + Math.abs(location.coords.longitude).toFixed(5) + '° ' + (location.coords.longitude < 0 ? 'W' : 'E');

  useEffect(() => {
    let current = true;
    setDossier(null);
    setDirectoryError(null);
    api.getEmergencyDossier(location.countryCode).then(result => {
      if (current) setDossier(result);
    }).catch(() => {
      if (current) setDirectoryError('Emergency numbers are not available for this selected country. Use your phone’s emergency call feature or confirm the local emergency number.');
    });
    return () => { current = false; };
  }, [location.countryCode]);

  useEffect(() => {
    let current = true;
    setHospital(null);
    setHospitalLoading(true);
    osmService.fetchNearestHospital(searchLat, searchLng).then(result => {
      if (current) setHospital(result);
    }).catch(() => {}).finally(() => { if (current) setHospitalLoading(false); });
    return () => { current = false; };
  }, [searchLat, searchLng]);

  useEffect(() => () => speechEngine.stop(), []);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(coordinateText + '. Region: ' + location.cityName + '. '
        + (liveGPS ? 'Device GPS accuracy ±' + location.accuracyMeters + 'm.' : 'Selected map location; not a verified device position.'));
      setCopyFeedback('Coordinates copied.');
    } catch { setCopyFeedback('Clipboard unavailable. Read or select the coordinates below.'); }
  };

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-28 pt-5">
      <h1 className="text-2xl font-black text-slate-900">Emergency Assistance</h1>
      <p className="text-sm text-slate-600 mt-2 mb-5">In an emergency, contact local emergency services. Directory listings do not confirm available treatment.</p>
      <section className="p-5 rounded-2xl bg-white border border-slate-200 mb-6 flex flex-col gap-2">
        <h2 className="font-bold">{liveGPS ? 'Device GPS location' : 'Selected map location'} • {location.cityName}</h2>
        <p className="text-lg font-mono text-sky-700 select-text">{coordinateText}</p>
        <p className="text-xs text-slate-600">{liveGPS ? 'Reported position accuracy: ±' + location.accuracyMeters + 'm' : 'This is a selected or fallback location. It may not be where you are.'}</p>
        <button onClick={handleCopy} className="self-start px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold">Copy Coordinates</button>
        {copyFeedback && <p role="status" className="text-sm text-slate-600">{copyFeedback}</p>}
      </section>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="flex flex-col gap-3">
          <h2 className="font-bold">Emergency numbers{dossier ? ' • ' + dossier.countryName : ''}</h2>
          {directoryError && <p role="alert" className="p-4 rounded-xl bg-amber-50 text-amber-900 text-sm">{directoryError}</p>}
          {!dossier && !directoryError && <p role="status" className="text-sm text-slate-600">Loading the country directory…</p>}
          <div className="grid grid-cols-2 gap-3">
            {dossier?.nationalHotlines.map(hotline => (
              <a key={hotline.number} href={'tel:' + hotline.number} className="p-4 rounded-2xl bg-white border border-slate-200">
                <span className="block text-xs text-slate-600">{hotline.service}</span>
                <strong className="block text-2xl text-rose-700 mt-2">{hotline.number}</strong>
                <span className="block text-xs text-slate-500 mt-2">Tap to call • {hotline.description}</span>
              </a>
            ))}
          </div>
        </section>
        <section className="flex flex-col gap-3">
          <h2 className="font-bold">Nearby hospital listing</h2>
          <div className="p-5 rounded-2xl bg-white border border-slate-200 flex flex-col gap-3">
            {hospital ? <>
              <h3 className="font-bold text-lg">{hospital.name}</h3>
              <p className="text-sm text-slate-600">{hospital.address}</p>
              <p className="text-xs text-slate-500">{(hospital.distanceMeters / 1000).toFixed(1)} km from the selected coordinates. Call to confirm emergency services and opening hours.</p>
              <div className="flex gap-3">
                <button onClick={() => onStartRouteToER(hospital)} className="px-4 py-2 rounded-xl bg-rose-600 text-white text-sm font-bold">Route options</button>
                {hospital.phone && <a href={'tel:' + hospital.phone} className="px-4 py-2 rounded-xl bg-slate-100 text-sm font-bold">Call hospital</a>}
              </div>
            </> : <p role="status" className="text-sm text-slate-600">{hospitalLoading ? 'Searching near the selected coordinates…' : 'No nearby hospital listing is available. Contact emergency services for assistance.'}</p>}
          </div>
        </section>
      </div>
      {!!dossier?.emergencyPhrases.length && <section className="mt-6">
        <h2 className="font-bold mb-3">Emergency phrases</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{dossier.emergencyPhrases.map((phrase, index) => (
          <div key={index} className="p-4 rounded-2xl bg-white border border-slate-200 flex items-center justify-between gap-3">
            <div><p className="font-bold">{phrase.localScript}</p><p className="text-sm text-slate-600">{phrase.english}</p><p className="text-xs text-slate-500">{phrase.pronunciation}</p></div>
            <button aria-label="Speak phrase" className="p-3 rounded-xl bg-slate-100" onClick={() => {
              setSpeakingPhraseIndex(index);
              speechEngine.speak(phrase.localScript, () => setSpeakingPhraseIndex(null));
            }}><span className="material-symbols-outlined">{speakingPhraseIndex === index ? 'graphic_eq' : 'volume_up'}</span></button>
          </div>
        ))}</div>
      </section>}
    </div>
  );
};
