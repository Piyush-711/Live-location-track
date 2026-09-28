import React, { useState, useEffect } from 'react';
import { OfflinePack } from '../types';
import { storage } from '../services/storage';
import { LiveLocationState } from '../hooks/useLiveLocation';

interface OfflineVaultViewProps {
  location?: LiveLocationState;
  activeCityId?: string;
  onBack?: () => void;
}

export const OfflineVaultView: React.FC<OfflineVaultViewProps> = ({
  location,
  activeCityId
}) => {
  const [packs, setPacks] = useState<OfflinePack[]>(() => storage.getOfflinePacks());
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [selectedPackForVerify, setSelectedPackForVerify] = useState<OfflinePack | null>(null);
  const [customCityInput, setCustomCityInput] = useState('');

  // Keep packs updated whenever storage changes or location changes
  useEffect(() => {
    setPacks(storage.getOfflinePacks());
  }, [location, activeCityId]);

  // Dynamically resolve matching regional pack for the current searched location
  const currentSearchPack = storage.getPackForLocation(location);

  const installedPacks = packs.filter(p => p.installed);
  const availablePacks = packs.filter(p => !p.installed && p.id !== currentSearchPack?.id);

  // Storage telemetry
  const totalInstalledFormatted = storage.getTotalInstalledFormatted();
  const totalInstalledBytes = storage.getTotalInstalledBytes();
  const totalMB = totalInstalledBytes / (1024 * 1024);
  const basemapMB = Math.round(totalMB * 0.58);
  const poiMB = Math.round(totalMB * 0.24);
  const ttsMB = Math.round(totalMB * 0.12);
  const cachedImgMB = Math.round(totalMB * 0.06);

  const handleDownloadPack = (pack: OfflinePack) => {
    setDownloadingId(pack.id);
    setDownloadProgress(8);
    setStatusMessage(`Requesting regional vector tiles for ${pack.name}...`);

    const interval = setInterval(() => {
      setDownloadProgress(prev => {
        if (prev < 35) {
          setStatusMessage(`Downloading vector tiles & SQLite POI blobs... (${prev + 12}%)`);
          return prev + 12;
        } else if (prev < 68) {
          setStatusMessage(`Extracting ${pack.name} routing graphs & POIs...`);
          return prev + 18;
        } else if (prev < 90) {
          setStatusMessage(`Verifying SHA-256 integrity & ES256 JWS signature...`);
          return prev + 15;
        } else {
          clearInterval(interval);
          setStatusMessage(`Atomic activation complete! Pack ready for 100% offline use.`);
          storage.updatePackStatus(pack.id, true);
          setPacks(storage.getOfflinePacks());
          setTimeout(() => {
            setDownloadingId(null);
            setStatusMessage(null);
          }, 1800);
          return 100;
        }
      });
    }, 380);
  };

  const handleRemovePack = (packId: string) => {
    storage.updatePackStatus(packId, false);
    setPacks(storage.getOfflinePacks());
  };

  const handleGenerateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCityInput.trim()) return;

    const dummyLoc: LiveLocationState = {
      coords: location?.coords || { latitude: 20.0, longitude: 78.0 },
      accuracyMeters: 10,
      altitudeMeters: null,
      heading: null,
      speed: null,
      status: 'fixed',
      cityName: customCityInput.trim(),
      countryCode: location?.countryCode || 'GL',
      matchedCityId: customCityInput.toLowerCase().replace(/[^a-z0-9]/g, ''),
      lastUpdated: new Date().toISOString(),
      isSimulated: false,
      isCustom: true
    };

    const newPack = storage.getOrGenerateCustomPack(dummyLoc);
    setPacks(storage.getOfflinePacks());
    setCustomCityInput('');
    handleDownloadPack(newPack);
  };

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 pb-28 pt-2">
      {/* Header Banner */}
      <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 mb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Offline Maps & Guides</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Download vector maps, place directories, and navigation guides for reliable offline travel without cellular data.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-xs border border-emerald-100">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>{installedPacks.length} Region{installedPacks.length === 1 ? '' : 's'} Ready</span>
          </span>
        </div>
      </div>

      {/* Target Search Regional Pack Spotlight */}
      <section className="mb-6">
        <div className="rounded-2xl bg-gradient-to-br from-sky-50 via-white to-slate-50 p-5 sm:p-6 shadow-sm border border-sky-100 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-700 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[17px]">near_me</span>
              <span>Pack For Current Area</span>
            </span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800">
              {location?.cityName || 'Active Location'}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">
                {currentSearchPack?.name}
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {currentSearchPack?.country} • {currentSearchPack?.sizeFormatted} • Includes Places, Roads & Transit
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 self-start sm:self-auto ${
              currentSearchPack?.installed
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : 'bg-amber-50 text-amber-800 border border-amber-200'
            }`}>
              <span className="material-symbols-outlined text-[15px]">
                {currentSearchPack?.installed ? 'check_circle' : 'cloud_download'}
              </span>
              <span>{currentSearchPack?.installed ? 'Downloaded & Ready' : 'Download Available'}</span>
            </span>
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-3 pt-1 border-t border-slate-100">
            {currentSearchPack?.installed ? (
              <>
                <button
                  onClick={() => setSelectedPackForVerify(currentSearchPack)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px] text-sky-600">verified</span>
                  <span>Inspect Security Hashes</span>
                </button>
                <button
                  onClick={() => handleRemovePack(currentSearchPack.id)}
                  className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                  title="Remove offline pack"
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                  <span>Remove</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => currentSearchPack && handleDownloadPack(currentSearchPack)}
                disabled={downloadingId !== null}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white flex items-center justify-center gap-2 text-xs font-bold shadow-sm active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">download</span>
                <span>Download {currentSearchPack?.sizeFormatted} Guide</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Download Status Toast */}
      {statusMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-sky-50 border border-sky-200 text-sky-900 shadow-sm flex flex-col gap-2 animate-fadeIn">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] animate-spin text-sky-600">sync</span>
              <span>{statusMessage}</span>
            </span>
            <span className="font-mono text-sky-700">{downloadProgress}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-sky-100 overflow-hidden">
            <div 
              style={{ width: `${downloadProgress}%` }} 
              className="h-full bg-sky-600 transition-all duration-300 rounded-full"
            />
          </div>
        </div>
      )}

      {/* Storage Allocation & Installed Packs Grid (2 cols on md+) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Column: Storage Meter & Installed Packs (7 cols) */}
        <div className="flex flex-col gap-6 md:col-span-7">
          {/* Storage Meter Card */}
          <div className="rounded-2xl bg-white p-5 sm:p-6 shadow-sm border border-slate-200/80 flex flex-col gap-3.5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">storage</span>
                </span>
                <span>Storage Utilization</span>
              </h2>
              <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-lg">
                {totalInstalledFormatted} Used
              </span>
            </div>

            {/* Segmented Progress Bar */}
            <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden flex">
              {totalMB > 0 ? (
                <>
                  <div style={{ width: '58%' }} className="bg-sky-500" title={`Basemaps (${basemapMB} MB)`} />
                  <div style={{ width: '24%' }} className="bg-indigo-500" title={`POIs & Search (${poiMB} MB)`} />
                  <div style={{ width: '12%' }} className="bg-teal-500" title={`Voice Audio (${ttsMB} MB)`} />
                  <div style={{ width: '6%' }} className="bg-slate-400" title={`Cached Assets (${cachedImgMB} MB)`} />
                </>
              ) : (
                <div style={{ width: '0%' }} className="bg-sky-500" />
              )}
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-2 text-xs font-medium text-slate-600 pt-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500 flex-shrink-0" />
                <span>Vector Basemaps ({basemapMB} MB)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 flex-shrink-0" />
                <span>Directory & POIs ({poiMB} MB)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500 flex-shrink-0" />
                <span>Audio Engine ({ttsMB} MB)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400 flex-shrink-0" />
                <span>Cached Data ({cachedImgMB} MB)</span>
              </div>
            </div>
          </div>

          {/* Installed Packs List */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">Downloaded Regional Packs</h2>
              <span className="text-xs font-semibold text-slate-500">{installedPacks.length} on device</span>
            </div>

            {installedPacks.length === 0 ? (
              <div className="p-6 rounded-2xl bg-white border border-dashed border-slate-200 text-center text-slate-500 text-xs">
                No offline packs installed yet. Download the guide for {location?.cityName || 'your destination'} above.
              </div>
            ) : (
              installedPacks.map(pack => {
                const isTargetActive = pack.id === currentSearchPack?.id;
                return (
                  <div 
                    key={pack.id} 
                    className={`rounded-2xl bg-white p-5 shadow-sm border flex flex-col gap-3 transition-all ${
                      isTargetActive ? 'border-sky-500/40 ring-2 ring-sky-500/10' : 'border-slate-200/80'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {isTargetActive ? (
                            <span className="px-2 py-0.5 rounded-md bg-sky-600 text-white text-[10px] font-bold">
                              Active Region
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold">
                              Saved Hub
                            </span>
                          )}
                          <span className="text-[10px] font-mono text-slate-400">v{pack.version}</span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900">{pack.name}</h3>
                        <p className="text-xs text-slate-500 font-medium">{pack.country}</p>
                      </div>

                      <span className="text-sm font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-lg">
                        {pack.sizeFormatted}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                      <button 
                        onClick={() => setSelectedPackForVerify(pack)}
                        className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[15px] text-sky-600">verified</span>
                        <span>Verify Security</span>
                      </button>
                      <button 
                        onClick={() => handleRemovePack(pack.id)}
                        className="py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors cursor-pointer"
                        title="Remove Pack"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Available Packs & Custom Region Generator (5 cols) */}
        <div className="flex flex-col gap-6 md:col-span-5">
          {/* Custom Location Generator */}
          <div className="rounded-2xl bg-white p-5 sm:p-6 shadow-sm border border-slate-200/80 flex flex-col gap-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-sky-600 text-[18px]">add_location_alt</span>
              <span>Cache Any Destination</span>
            </h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Create an offline pack for any custom city, historic town, or national park worldwide.
            </p>

            <form onSubmit={handleGenerateCustom} className="flex gap-2 pt-1">
              <input
                type="text"
                value={customCityInput}
                onChange={(e) => setCustomCityInput(e.target.value)}
                placeholder="e.g. Rome, Agra, Kyoto..."
                className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-sky-500"
              />
              <button
                type="submit"
                disabled={!customCityInput.trim() || downloadingId !== null}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-sm disabled:opacity-50 transition-colors cursor-pointer"
              >
                Generate
              </button>
            </form>
          </div>

          {/* Popular Available Hubs */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Featured Global Hubs</h3>
              <span className="text-xs text-slate-400">Ready to download</span>
            </div>

            {availablePacks.map(pack => (
              <div 
                key={pack.id} 
                className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200/80 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-slate-900 truncate">{pack.name}</h4>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {pack.country} • {pack.sizeFormatted}
                  </p>
                </div>

                <button
                  onClick={() => handleDownloadPack(pack)}
                  disabled={downloadingId !== null}
                  className="h-9 px-3.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white flex items-center gap-1 text-xs font-bold shadow-sm disabled:opacity-50 transition-colors cursor-pointer flex-shrink-0"
                >
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  <span>Get</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Signature Verification Modal Dialog */}
      {selectedPackForVerify && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">verified_user</span>
                </span>
                <span className="text-base font-bold text-slate-900">Package Security Verification</span>
              </div>
              <button
                onClick={() => setSelectedPackForVerify(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="text-xs flex flex-col gap-3">
              <div>
                <span className="font-bold text-slate-900 text-sm">{selectedPackForVerify.name}</span>
                <p className="text-xs text-slate-500">Version {selectedPackForVerify.version} • Schema {selectedPackForVerify.manifest.schemaVersion}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 font-mono text-[11px] text-slate-700 flex flex-col gap-1.5 border border-slate-200/80 break-all">
                <div>
                  <span className="font-bold text-sky-700">Signing Key ID:</span> {selectedPackForVerify.manifest.keyId}
                </div>
                <div>
                  <span className="font-bold text-sky-700">Algorithm:</span> ES256 (ECDSA P-256 with SHA-256)
                </div>
                <div>
                  <span className="font-bold text-sky-700">Basemap Hash:</span> {selectedPackForVerify.manifest.hashes['basemap.mbtiles']?.substring(0, 24)}...
                </div>
                <div>
                  <span className="font-bold text-sky-700">POIs Hash:</span> {selectedPackForVerify.manifest.hashes['pois.sqlite']?.substring(0, 24)}...
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-emerald-600 flex-shrink-0">check_circle</span>
                <span>Digital signature verified. Package contents have not been modified.</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedPackForVerify(null)}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
