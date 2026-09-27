import React from 'react';
import { CITIES } from '../data/mockData';

interface CityPickerModalProps {
  activeCityId: string;
  onSelectCity: (cityId: string) => void;
  onClose: () => void;
}

export const CityPickerModal: React.FC<CityPickerModalProps> = ({
  activeCityId,
  onSelectCity,
  onClose
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm rounded-[24px] bg-surface p-5 shadow-tactile-xl border border-[#eae6df] flex flex-col gap-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#eae6df]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-primary">location_city</span>
            <span className="text-[15px] font-extrabold text-on-surface">Supported Launch Nodes</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-outline hover:text-on-surface shadow-tactile-inset-sm"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <p className="text-[11px] text-on-surface-variant font-medium">
          Section 3 Specification: Explicit supported-city catalogue. Verified data, emergency routing and offline vector extracts.
        </p>

        <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
          {CITIES.map(city => {
            const isSelected = city.id === activeCityId;
            return (
              <button
                key={city.id}
                onClick={() => {
                  onSelectCity(city.id);
                  onClose();
                }}
                className={`p-3 rounded-2xl flex items-center justify-between border text-left transition-all ${
                  isSelected
                    ? 'bg-[#E0F2FE] border-[#BAE6FD] text-primary shadow-tactile-inset-sm font-extrabold'
                    : 'bg-surface border-[#eae6df] text-on-surface shadow-tactile active:scale-98'
                }`}
              >
                <div className="flex flex-col">
                  <span className="text-[14px] font-extrabold">{city.name}</span>
                  <span className="text-[11px] text-on-surface-variant font-medium">{city.country}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {isSelected && (
                    <span className="material-symbols-outlined text-primary text-[20px]">
                      check_circle
                    </span>
                  )}
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant">
                    {city.countryCode}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
