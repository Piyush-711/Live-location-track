import React, { useState } from 'react';
import { LiveLocationState } from '../hooks/useLiveLocation';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  location: LiveLocationState;
  onRequestGPS: () => void;
}

export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  location,
  onRequestGPS
}) => {
  // Desktop view mode: 'responsive' (full wide dashboard) or 'phone-frame' (sleek mobile bezel)
  const [deviceView, setDeviceView] = useState<'responsive' | 'phone-frame'>('responsive');

  return (
    <div className="min-h-screen bg-[#f3efe6] flex flex-col items-center justify-start text-on-surface">
      {/* Top Universal Device & Location Status Bar (Visible on Tablet & Desktop >= 768px) */}
      <div className="hidden md:flex w-full bg-surface border-b border-[#eae6df] px-6 py-2 items-center justify-between shadow-tactile-sm z-50 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container shadow-tactile-inset-sm text-[12px] font-bold text-primary">
            <span className={`w-2 h-2 rounded-full ${location.status === 'fixed' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span>
              {location.status === 'fixed' 
                ? `Live GPS Active • ${location.coords.latitude.toFixed(4)}°, ${location.coords.longitude.toFixed(4)}° (±${location.accuracyMeters}m)`
                : `Simulated / City Mode (${location.cityName})`}
            </span>
          </div>

          {location.status !== 'fixed' && (
            <button
              onClick={onRequestGPS}
              className="px-2.5 py-1 rounded-full bg-primary text-white text-[11px] font-bold shadow-tactile-sm active:scale-95 flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">my_location</span>
              <span>Enable Browser Live GPS</span>
            </button>
          )}
        </div>

        {/* Viewport Form-Factor Mode Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-full bg-surface-container shadow-tactile-inset-sm">
          <button
            onClick={() => setDeviceView('responsive')}
            className={`px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 transition-all ${
              deviceView === 'responsive'
                ? 'bg-surface text-primary shadow-tactile-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">devices</span>
            <span>Fluid Responsive (Tablet & Desktop)</span>
          </button>

          <button
            onClick={() => setDeviceView('phone-frame')}
            className={`px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 transition-all ${
              deviceView === 'phone-frame'
                ? 'bg-surface text-primary shadow-tactile-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">smartphone</span>
            <span>Mobile Frame</span>
          </button>
        </div>
      </div>

      {/* Main Container Shell */}
      <div className={`w-full flex-1 flex flex-col justify-start transition-all duration-300 ${
        deviceView === 'phone-frame'
          ? 'my-6 max-w-[430px] rounded-[48px] border-[10px] border-[#383a37] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35),0_0_0_1px_rgba(255,255,255,0.4)] overflow-hidden bg-surface relative min-h-[880px]'
          : 'max-w-[76rem] w-full bg-surface shadow-tactile-lg min-h-screen'
      }`}>
        {/* Dynamic Island / Notch on Phone Frame */}
        {deviceView === 'phone-frame' && (
          <div className="hidden md:flex justify-center pt-2 pb-1 bg-surface z-50">
            <div className="w-24 h-4 bg-black rounded-full shadow-inner flex items-center justify-end px-2">
              <span className="w-2 h-2 rounded-full bg-[#1c2438]/80"></span>
            </div>
          </div>
        )}

        {children}
      </div>
    </div>
  );
};
