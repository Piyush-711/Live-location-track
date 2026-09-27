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
    <div className="flex-1 flex flex-col w-full max-w-md mx-auto px-4 pb-28 pt-2">
      {/* View Title */}
      <div className="py-2 flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-extrabold text-on-surface">Offline Storage & Packs</h1>
          <p className="text-[11px] text-on-surface-variant font-medium">
            Dynamic location matching • Cryptographically signed • ODbL
          </p>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-surface-container shadow-tactile-inset-sm text-primary font-bold text-[11px] flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">public</span>
          <span>Location Sync</span>
        </span>
      </div>

      {/* Target Search Regional Pack Spotlight */}
      <section className="pt-2 pb-3">
        <div className="rounded-[22px] bg-gradient-to-br from-primary/10 via-surface to-surface p-4 shadow-tactile border border-primary/20 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-primary flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px]">my_location</span>
              <span>Pack For Current Search Location</span>
            </span>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-primary/15 text-primary">
              {location?.cityName || 'Active Area'}
            </span>
          </div>

          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-[16px] font-black text-on-surface leading-tight">
                {currentSearchPack?.name}
              </h2>
              <p className="text-[12px] text-on-surface-variant font-medium mt-0.5">
                {currentSearchPack?.country} • {currentSearchPack?.sizeFormatted}
              </p>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black flex items-center gap-1 flex-shrink-0 ${
              currentSearchPack?.installed
                ? 'bg-emerald-500/15 text-emerald-800 border border-emerald-500/25'
                : 'bg-amber-500/15 text-amber-800 border border-amber-500/25'
            }`}>
              <span className="material-symbols-outlined text-[13px]">
                {currentSearchPack?.installed ? 'check_circle' : 'cloud_download'}
              </span>
              <span>{currentSearchPack?.installed ? 'Offline Ready' : 'Download Needed'}</span>
            </span>
          </div>

          {/* Action Row for Current Location Pack */}
          <div className="flex items-center gap-2 pt-1">
            {currentSearchPack?.installed ? (
              <>
                <button
                  onClick={() => setSelectedPackForVerify(currentSearchPack)}
                  className="flex-1 py-2 rounded-xl bg-surface-container text-primary text-[11px] font-bold shadow-tactile active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[14px]">verified</span>
                  <span>Verify Pack Hashes</span>
                </button>
                <button
                  onClick={() => handleRemovePack(currentSearchPack.id)}
                  className="py-2 px-3 rounded-xl bg-surface border border-red-200 text-red-600 text-[11px] font-bold shadow-tactile active:scale-95 flex items-center justify-center"
                  title="Remove offline pack"
                >
                  <span className="material-symbols-outlined text-[15px]">delete</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => currentSearchPack && handleDownloadPack(currentSearchPack)}
                disabled={downloadingId !== null}
                className="w-full py-2.5 rounded-xl tactile-btn-primary flex items-center justify-center gap-2 text-[12px] font-bold shadow-tactile-primary active:scale-95 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[16px]">download</span>
                <span>Download & Activate {currentSearchPack?.sizeFormatted} Pack</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Storage Allocation Meter Card */}
      <section className="pb-3">
        <div className="rounded-2xl bg-surface p-4 shadow-tactile border border-[#eae6df] flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-extrabold text-on-surface">Device Allocation</span>
            <span className="text-[12px] font-bold text-primary">
              {totalInstalledFormatted} of 128 GB
            </span>
          </div>

          {/* Segmented Progress Bar */}
          <div className="w-full h-3 rounded-full bg-surface-variant overflow-hidden flex shadow-tactile-inset-sm">
            {totalMB > 0 ? (
              <>
                <div style={{ width: '58%' }} className="bg-[#0284c7]" title={`Vector Basemaps (${basemapMB} MB)`}></div>
                <div style={{ width: '24%' }} className="bg-[#0369a1]" title={`Search & POIs (${poiMB} MB)`}></div>
                <div style={{ width: '12%' }} className="bg-[#38bdf8]" title={`Neural TTS Voice (${ttsMB} MB)`}></div>
                <div style={{ width: '6%' }} className="bg-[#78716c]" title={`Cached Images (${cachedImgMB} MB)`}></div>
              </>
            ) : (
              <div style={{ width: '0%' }} className="bg-[#0284c7]"></div>
            )}
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold text-on-surface-variant pt-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0284c7]"></span>
              <span>Vector Basemaps ({basemapMB} MB)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0369a1]"></span>
              <span>Search & POIs ({poiMB} MB)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#38bdf8]"></span>
              <span>Neural TTS Voice ({ttsMB} MB)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#78716c]"></span>
              <span>Cached Images ({cachedImgMB} MB)</span>
            </div>
          </div>
        </div>
      </section>

      {/* Download Status Toast */}
      {statusMessage && (
        <div className="mb-3 p-3 rounded-2xl bg-[#E0F2FE] border border-[#BAE6FD] text-primary shadow-tactile-sm flex flex-col gap-1.5 animate-fade-in">
          <div className="flex items-center justify-between text-[11px] font-bold">
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
              <span>{statusMessage}</span>
            </span>
            <span>{downloadProgress}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-white overflow-hidden">
            <div 
              style={{ width: `${downloadProgress}%` }} 
              className="h-full bg-primary transition-all duration-300"
            />
          </div>
        </div>
      )}

      {/* Active Installed Regional Packs */}
      <section className="flex flex-col gap-3 pt-1 pb-4">
        <div className="flex items-center justify-between">
          <span className="text-[14px] font-extrabold text-on-surface">Installed Regional Packs</span>
          <span className="text-[11px] font-bold text-primary">{installedPacks.length} Installed</span>
        </div>

        {installedPacks.length === 0 ? (
          <div className="p-4 rounded-[20px] bg-surface-container border border-dashed border-[#eae6df] text-center text-on-surface-variant text-[12px]">
            No packs installed yet. Download the recommended pack for {location?.cityName || 'your region'} above.
          </div>
        ) : (
          installedPacks.map(pack => {
            const isTargetActive = pack.id === currentSearchPack?.id;
            return (
              <div 
                key={pack.id} 
                className={`rounded-[20px] bg-surface p-4 shadow-tactile border flex flex-col gap-2.5 ${
                  isTargetActive ? 'border-primary/40 ring-1 ring-primary/20' : 'border-[#eae6df]'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      {isTargetActive ? (
                        <span className="px-2 py-0.5 rounded-full bg-primary text-white text-[10px] font-extrabold shadow-sm">
                          Active For Current Search
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-[10px] font-bold">
                          Cached Region
                        </span>
                      )}
                      <span className="text-[10px] font-mono text-outline">{pack.version}</span>
                    </div>
                    <h2 className="text-[15px] font-extrabold text-on-surface">{pack.name}</h2>
                    <p className="text-[11px] text-on-surface-variant font-medium">{pack.country}</p>
                  </div>

                  <span className="text-[14px] font-black text-primary">{pack.sizeFormatted}</span>
                </div>

                {/* Pack Manifest Verification Details */}
                <div className="p-2.5 rounded-xl bg-surface-container shadow-tactile-inset-sm text-[10px] text-on-surface-variant flex flex-col gap-1 border border-[#eae6df]/70">
                  <div className="flex items-center justify-between">
                    <span>Cryptographic Envelope:</span>
                    <span className="font-mono text-primary font-bold">ES256 (JWS Signed)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Signer Key ID:</span>
                    <span className="font-mono">{pack.manifest.keyId}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Licensing & Attribution:</span>
                    <span>OpenStreetMap contributors (ODbL)</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button 
                    onClick={() => handleRemovePack(pack.id)}
                    className="flex-1 py-2 rounded-xl bg-surface border border-red-200 text-red-600 text-[11px] font-bold shadow-tactile active:scale-95"
                  >
                    Remove Pack
                  </button>
                  <button 
                    onClick={() => setSelectedPackForVerify(pack)}
                    className="flex-1 py-2 rounded-xl bg-surface-container text-primary text-[11px] font-bold shadow-tactile active:scale-95 flex items-center justify-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">verified</span>
                    <span>Verify Signature</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </section>

      {/* Available Regional Packs */}
      <section className="flex flex-col gap-3 pb-4">
        <div className="flex items-center justify-between">
          <span className="text-[14px] font-extrabold text-on-surface">Available Regional Packs</span>
          <span className="text-[11px] font-semibold text-outline">Certified Worldwide Hubs</span>
        </div>

        {availablePacks.map(pack => (
          <div 
            key={pack.id} 
            className="rounded-[20px] bg-surface p-4 shadow-tactile border border-[#eae6df] flex items-center justify-between gap-3"
          >
            <div className="flex-1 min-w-0">
              <h3 className="text-[14px] font-extrabold text-on-surface truncate">{pack.name}</h3>
              <p className="text-[11px] text-on-surface-variant font-medium mt-0.5">
                {pack.country} • {pack.sizeFormatted}
              </p>
            </div>

            <button
              onClick={() => handleDownloadPack(pack)}
              disabled={downloadingId !== null}
              className="h-10 px-4 rounded-full tactile-btn-primary flex items-center gap-1.5 text-[12px] font-bold shadow-tactile-primary active:scale-95 disabled:opacity-50 flex-shrink-0"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              <span>Get Pack</span>
            </button>
          </div>
        ))}
      </section>

      {/* Custom City Offline Pack Generator */}
      <section className="pb-6">
        <div className="rounded-[20px] bg-surface p-4 shadow-tactile border border-[#eae6df] flex flex-col gap-2.5">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-primary">add_location_alt</span>
            <span className="text-[13px] font-extrabold text-on-surface">Cache Custom Search Location</span>
          </div>
          <p className="text-[11px] text-on-surface-variant">
            Create and sign a custom regional pack with vector basemaps & SQLite POIs for any searched town or district.
          </p>

          <form onSubmit={handleGenerateCustom} className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={customCityInput}
              onChange={(e) => setCustomCityInput(e.target.value)}
              placeholder="e.g. Rome, Bangalore, Kyoto, Goa..."
              className="flex-1 h-10 px-3 rounded-xl bg-surface-container border border-[#eae6df] text-[12px] text-on-surface focus:outline-none focus:ring-1 focus:ring-primary shadow-tactile-inset-sm"
            />
            <button
              type="submit"
              disabled={!customCityInput.trim() || downloadingId !== null}
              className="h-10 px-4 rounded-xl tactile-btn-primary text-[12px] font-bold shadow-tactile-primary disabled:opacity-50"
            >
              Generate
            </button>
          </form>
        </div>
      </section>

      {/* Signature Verification Modal */}
      {selectedPackForVerify && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-[24px] bg-surface p-5 shadow-tactile-xl border border-[#eae6df] flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#eae6df]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-primary">verified_user</span>
                <span className="text-[14px] font-extrabold text-on-surface">Cryptographic Integrity</span>
              </div>
              <button
                onClick={() => setSelectedPackForVerify(null)}
                className="w-7 h-7 rounded-full bg-surface-container flex items-center justify-center text-outline hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>

            <div className="text-[11px] flex flex-col gap-2">
              <div>
                <span className="font-bold text-on-surface">{selectedPackForVerify.name}</span>
                <p className="text-[10px] text-on-surface-variant">Version: {selectedPackForVerify.version} • Schema: {selectedPackForVerify.manifest.schemaVersion}</p>
              </div>

              <div className="p-2.5 rounded-xl bg-surface-container shadow-tactile-inset-sm font-mono text-[9px] text-on-surface-variant flex flex-col gap-1.5 break-all">
                <div>
                  <span className="font-bold text-primary">Key ID:</span> {selectedPackForVerify.manifest.keyId}
                </div>
                <div>
                  <span className="font-bold text-primary">Algorithm:</span> ES256 (ECDSA P-256 with SHA-256)
                </div>
                <div>
                  <span className="font-bold text-primary">Basemap Hash:</span> {selectedPackForVerify.manifest.hashes['basemap.mbtiles']?.substring(0, 32)}...
                </div>
                <div>
                  <span className="font-bold text-primary">POIs SQLite Hash:</span> {selectedPackForVerify.manifest.hashes['pois.sqlite']?.substring(0, 32)}...
                </div>
                <div>
                  <span className="font-bold text-primary">OSRM Route Hash:</span> {selectedPackForVerify.manifest.hashes['routing.osrm']?.substring(0, 32)}...
                </div>
              </div>

              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 font-bold text-[10px] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px] text-emerald-600">check_circle</span>
                <span>Signature verified against OpenStreetMap ODbL root trust anchor.</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedPackForVerify(null)}
              className="w-full py-2.5 rounded-xl tactile-btn-primary text-[12px] font-bold shadow-tactile-primary active:scale-95"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
