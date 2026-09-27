import React from 'react';

interface HeaderProps {
  cityName: string;
  gpsStatus: 'acquiring' | 'fixed' | 'denied' | 'unsupported' | 'fallback';
  isCustom?: boolean;
  tempC?: number | null;
  onOpenCityPicker: () => void;
  onOpenOfflineVault: () => void;
  onOpenProfile: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  cityName,
  gpsStatus,
  isCustom,
  tempC,
  onOpenCityPicker,
  onOpenOfflineVault,
  onOpenProfile
}) => {
  return (
    <header className="sticky top-0 w-full z-40 pt-safe bg-surface/90 backdrop-blur-xl border-b border-[#eae6df]/80 shadow-[0_4px_16px_rgba(180,172,158,0.20)]">
      <div className="h-16 px-4 md:px-8 max-w-5xl mx-auto flex items-center justify-between gap-2">
        {/* Brand & Dynamic Location Indicator */}
        <div 
          onClick={onOpenCityPicker}
          className="flex items-center gap-2.5 cursor-pointer select-none active:opacity-75 transition-opacity"
        >
          <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0 bg-primary/10 shadow-sm">
            <img 
              alt="Local Brand Mark" 
              className="w-full h-full object-contain" 
              src="https://lh3.googleusercontent.com/aida/AEtjO1VOefXQtWgZnEgEDxDkxHdXbqgIZlaF7_5pQCQN59AcPbzgker7g7RXETteLFWEJPBt7CgenCQepknpgaPgPjPNzt6W2WkHnNzseUjs891V0V6CWoTfmtzIlGaR3oNrL6tE1BvgRSUCujclpnEEV7T5De42pTeKWcd6EkwQE5FjfeNJ4GMeLTMyMKKHlMjTJguyElbMds-cL_g2YAiZbz22IsK_51Fg-Gq6dJoBKi401sPL2cxWEl3xaGU"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-[17px] tracking-tight text-on-surface leading-none">
              Local
            </span>
            <span className="text-[11px] font-semibold text-primary flex items-center gap-1 mt-0.5">
              <span className={`w-1.5 h-1.5 rounded-full ${isCustom ? 'bg-sky-500' : gpsStatus === 'fixed' ? 'bg-emerald-500 animate-pulse' : 'bg-primary'}`}></span>
              <span className="truncate max-w-[190px] md:max-w-none">
                {cityName} • {isCustom ? 'Custom Location' : gpsStatus === 'fixed' ? 'Live GPS' : 'Selected Hub'}
              </span>
              <span className="material-symbols-outlined text-[13px]">expand_more</span>
            </span>
          </div>
        </div>

        {/* Offline Vault & Profile Actions */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Real-time Temperature Pill */}
          {tempC !== null && tempC !== undefined && (
            <div 
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-800 shadow-tactile-inset-sm font-extrabold text-[11px]"
              title={`Live Temperature in ${cityName}: ${tempC}°C`}
            >
              <span className="material-symbols-outlined text-[14px] text-amber-600">
                device_thermostat
              </span>
              <span>{tempC}°C</span>
            </div>
          )}

          {/* Offline Pack Status Pill */}
          <button 
            onClick={onOpenOfflineVault}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container shadow-tactile-inset-sm active:scale-95 transition-all"
            title="View Offline Regional Packs & Storage"
          >
            <span className="material-symbols-outlined text-[15px] text-primary">offline_pin</span>
            <span className="text-[11px] text-on-surface-variant font-bold">1.42 GB</span>
          </button>

          {/* User Profile Avatar */}
          <button 
            onClick={onOpenProfile}
            className="w-9 h-9 rounded-full p-0.5 bg-surface shadow-[-2px_-2px_5px_rgba(255,255,255,0.95),2px_3px_6px_rgba(180,172,158,0.40)] flex items-center justify-center active:scale-95 transition-transform"
            title="Account & Saved Places"
          >
            <img 
              alt="Profile" 
              className="w-7 h-7 rounded-full object-cover" 
              src="https://lh3.googleusercontent.com/aida/AEtjO1UVIomhpKNmwnwjnuCOvaKapyvU48zCuUgh1jfNK6Ihi1X4_fCWCXjBTXKF92-dDHIoARwVFRIbxX1-Kj3lBjgA7Z59-VK95_g8ZzUSz7DrW0GBcfH4uXPC9ySvQ67xxtwZsOIlwMsp-ccJGItz7h3XO0DpYN5xsoM-GQ4XAffU_bc_7-mMhuOF0YIHxK96KgdXzGXQDLYWJrRoZcFi5dOJp6TuDvQ1dBvb1lkEFSRuZFruNgovt1YXBA0"
            />
          </button>
        </div>
      </div>
    </header>
  );
};
