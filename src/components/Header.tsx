import React from 'react';

interface HeaderProps {
  cityName: string;
  gpsStatus: 'acquiring' | 'fixed' | 'denied' | 'unsupported' | 'fallback';
  isCustom?: boolean;
  tempC?: number | null;
  offlinePackLabel?: string;
  onOpenCityPicker: () => void;
  onOpenOfflineVault: () => void;
  onOpenProfile: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  cityName,
  gpsStatus,
  isCustom,
  tempC,
  offlinePackLabel,
  onOpenCityPicker,
  onOpenOfflineVault,
  onOpenProfile
}) => {
  return (
    <header className="sticky top-0 w-full z-40 pt-safe bg-white/85 backdrop-blur-xl border-b border-slate-200/80 shadow-sm">
      <div className="h-16 px-4 md:px-8 max-w-6xl mx-auto flex items-center justify-between gap-3">
        {/* Brand & Dynamic Location Indicator */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-blue-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
            <span className="material-symbols-outlined text-[20px]">explore</span>
          </div>

          <div 
            onClick={onOpenCityPicker}
            className="group flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100/90 hover:bg-slate-200/80 border border-slate-200/60 cursor-pointer select-none transition-all active:scale-95"
            title="Click to search or change location"
          >
            <span className={`w-2 h-2 rounded-full ${isCustom ? 'bg-sky-500' : gpsStatus === 'fixed' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
            <span className="text-[13px] font-bold text-slate-800 truncate max-w-[170px] sm:max-w-xs">
              {cityName}
            </span>
            <span className="material-symbols-outlined text-[16px] text-slate-400 group-hover:text-slate-700 transition-colors">
              unfold_more
            </span>
          </div>
        </div>

        {/* Actions: Weather, Offline & Profile */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Live Temperature */}
          {tempC !== null && tempC !== undefined && (
            <div 
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-amber-800 text-[12px] font-bold shadow-sm"
              title={`Live Temperature in ${cityName}: ${tempC}°C`}
            >
              <span className="material-symbols-outlined text-[15px] text-amber-600">
                wb_sunny
              </span>
              <span>{tempC}°C</span>
            </div>
          )}

          {/* Offline Maps Button */}
          <button 
            onClick={onOpenOfflineVault}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200/70 border border-slate-200/70 text-slate-700 text-[12px] font-bold transition-all active:scale-95"
            title="Offline Maps & Downloads"
          >
            <span className="material-symbols-outlined text-[16px] text-sky-600">cloud_download</span>
            <span className="hidden sm:inline">{offlinePackLabel || 'Offline'}</span>
          </button>

          {/* User Profile Avatar */}
          <button 
            onClick={onOpenProfile}
            className="w-9 h-9 rounded-full ring-2 ring-slate-200 hover:ring-sky-500 overflow-hidden flex items-center justify-center transition-all active:scale-95 shadow-sm"
            title="Saved Places & Favorites"
          >
            <img 
              alt="Profile" 
              className="w-full h-full object-cover" 
              src="https://lh3.googleusercontent.com/aida/AEtjO1UVIomhpKNmwnwjnuCOvaKapyvU48zCuUgh1jfNK6Ihi1X4_fCWCXjBTXKF92-dDHIoARwVFRIbxX1-Kj3lBjgA7Z59-VK95_g8ZzUSz7DrW0GBcfH4uXPC9ySvQ67xxtwZsOIlwMsp-ccJGItz7h3XO0DpYN5xsoM-GQ4XAffU_bc_7-mMhuOF0YIHxK96KgdXzGXQDLYWJrRoZcFi5dOJp6TuDvQ1dBvb1lkEFSRuZFruNgovt1YXBA0"
            />
          </button>
        </div>
      </div>
    </header>
  );
};
