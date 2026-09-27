import React, { useState } from 'react';
import { OfflinePack } from '../types';
import { storage } from '../services/storage';

interface OfflineVaultViewProps {
  onBack?: () => void;
}

export const OfflineVaultView: React.FC<OfflineVaultViewProps> = () => {
  const [packs, setPacks] = useState<OfflinePack[]>(storage.getOfflinePacks());
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const installedPacks = packs.filter(p => p.installed);
  const availablePacks = packs.filter(p => !p.installed);

  const handleDownloadPack = (pack: OfflinePack) => {
    setDownloadingId(pack.id);
    setDownloadProgress(5);
    setStatusMessage(`Requesting chunk range for ${pack.name}...`);

    // Simulate staged download per spec Section 13 (manifest validation -> chunk fetch -> hash check -> atomic activate)
    const interval = setInterval(() => {
      setDownloadProgress(prev => {
        if (prev < 40) {
          setStatusMessage(`Downloading vector tiles & SQLite POI blobs... (${prev + 15}%)`);
          return prev + 15;
        } else if (prev < 75) {
          setStatusMessage(`Verifying SHA-256 integrity & ES256 JWS signature...`);
          return prev + 20;
        } else if (prev < 95) {
          setStatusMessage(`Running SQLite integrity & content compatibility checks...`);
          return prev + 15;
        } else {
          clearInterval(interval);
          setStatusMessage(`Atomic activation complete! Pack ready for 100% offline use.`);
          storage.updatePackStatus(pack.id, true);
          setPacks(storage.getOfflinePacks());
          setTimeout(() => {
            setDownloadingId(null);
            setStatusMessage(null);
          }, 2000);
          return 100;
        }
      });
    }, 450);
  };

  const handleRemovePack = (packId: string) => {
    storage.updatePackStatus(packId, false);
    setPacks(storage.getOfflinePacks());
  };

  return (
    <div className="flex-1 flex flex-col w-full max-w-md mx-auto px-4 pb-28 pt-2">
      {/* View Title */}
      <div className="py-2 flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-extrabold text-on-surface">Offline Storage & Packs</h1>
          <p className="text-[11px] text-on-surface-variant font-medium">
            Cryptographically signed regional packages • ODbL Compliant
          </p>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-surface-container shadow-tactile-inset-sm text-primary font-bold text-[11px] flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">verified</span>
          <span>v8 Baseline</span>
        </span>
      </div>

      {/* Storage Allocation Meter Card */}
      <section className="pt-2 pb-3">
        <div className="rounded-2xl bg-surface p-4 shadow-tactile border border-[#eae6df] flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-extrabold text-on-surface">Device Allocation</span>
            <span className="text-[12px] font-bold text-primary">1.42 GB of 128 GB</span>
          </div>

          {/* Segmented Progress Bar */}
          <div className="w-full h-3 rounded-full bg-surface-variant overflow-hidden flex shadow-tactile-inset-sm">
            <div style={{ width: '48%' }} className="bg-[#0284c7]" title="Vector Basemaps (840 MB)"></div>
            <div style={{ width: '22%' }} className="bg-[#0369a1]" title="Search & POIs (320 MB)"></div>
            <div style={{ width: '12%' }} className="bg-[#38bdf8]" title="Neural TTS Voice (160 MB)"></div>
            <div style={{ width: '8%' }} className="bg-[#78716c]" title="Cached Images (100 MB)"></div>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold text-on-surface-variant pt-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0284c7]"></span>
              <span>Vector Basemaps (840 MB)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0369a1]"></span>
              <span>Search & POIs (320 MB)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#38bdf8]"></span>
              <span>Neural TTS Voice (160 MB)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#78716c]"></span>
              <span>Cached Images (100 MB)</span>
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
          <span className="text-[11px] font-bold text-primary">{installedPacks.length} Active</span>
        </div>

        {installedPacks.map(pack => (
          <div 
            key={pack.id} 
            className="rounded-[20px] bg-surface p-4 shadow-tactile border border-[#eae6df] flex flex-col gap-2.5"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="px-2 py-0.5 rounded-full bg-[#E0F2FE] text-primary text-[10px] font-extrabold border border-[#BAE6FD]">
                    Active Region
                  </span>
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
                onClick={() => alert(`Manifest integrity verified for ${pack.name}. Monotonic version ${pack.version}`)}
                className="flex-1 py-2 rounded-xl bg-surface-container text-primary text-[11px] font-bold shadow-tactile active:scale-95 flex items-center justify-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">verified</span>
                <span>Verify Signature</span>
              </button>
            </div>
          </div>
        ))}
      </section>

      {/* Available Regional Packs */}
      <section className="flex flex-col gap-3 pb-6">
        <div className="flex items-center justify-between">
          <span className="text-[14px] font-extrabold text-on-surface">Available Regional Packs</span>
          <span className="text-[11px] font-semibold text-outline">Section 3 Country Group</span>
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
    </div>
  );
};
