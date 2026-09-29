import React from 'react';
import { LiveLocationState } from '../hooks/useLiveLocation';

interface OfflineVaultViewProps { location?: LiveLocationState; activeCityId?: string; onBack?: () => void; }
export const OfflineVaultView: React.FC<OfflineVaultViewProps> = ({ location }) => (
  <div className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 pb-28 pt-5">
    <h1 className="text-2xl font-black text-slate-900">Offline Maps & Guides</h1>
    <section className="mt-5 p-6 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col gap-3">
      <span className="material-symbols-outlined text-amber-700 text-3xl">cloud_off</span>
      <h2 className="font-bold text-lg text-amber-950">Offline map downloads are unavailable</h2>
      <p className="text-sm text-amber-900">Maps and new route calculations require an internet connection. No regional map pack has been downloaded or verified on this device.</p>
      <p className="text-sm text-amber-900">Before travelling around {location?.cityName || 'your destination'}, prepare an offline map in a service that supports downloads.</p>
    </section>
    <section className="mt-5 p-6 rounded-2xl bg-white border border-slate-200">
      <h2 className="font-bold text-slate-900">Saved places in this browser</h2>
      <p className="text-sm text-slate-600 mt-2">The bookmark button stores a place’s details in this browser. Saved details do not include offline maps, route calculations, or a guarantee that the app itself can open without a connection.</p>
    </section>
  </div>
);
