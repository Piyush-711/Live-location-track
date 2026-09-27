import React, { useState, useEffect } from 'react';
import { Place, SavedPlace } from '../types';
import { storage } from '../services/storage';

interface SavedPlacesDrawerProps {
  onClose: () => void;
  onSelectPlace: (place: Place) => void;
  onStartRoute: (place: Place) => void;
}

export const SavedPlacesDrawer: React.FC<SavedPlacesDrawerProps> = ({
  onClose,
  onSelectPlace,
  onStartRoute
}) => {
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);

  const reload = () => {
    setSavedPlaces(storage.getSavedPlaces());
  };

  useEffect(() => {
    reload();
  }, []);

  const handleRemove = (e: React.MouseEvent, place: Place) => {
    e.stopPropagation();
    storage.toggleSavePlace(place);
    reload();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm rounded-[24px] bg-surface p-5 shadow-tactile-xl border border-[#eae6df] flex flex-col gap-3.5 max-h-[85vh]">
        <div className="flex items-center justify-between pb-2 border-b border-[#eae6df]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-red-500 fill" style={{ fontVariationSettings: "'FILL' 1" }}>
              favorite
            </span>
            <span className="text-[15px] font-extrabold text-on-surface">Saved Places</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-outline hover:text-on-surface shadow-tactile-inset-sm"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div className="flex items-center justify-between text-[11px] font-semibold text-on-surface-variant px-1">
          <span>{savedPlaces.length} Saved Essentials</span>
          <span>Encrypted SQLite Store</span>
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col gap-2.5 pr-1">
          {savedPlaces.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center gap-2">
              <span className="material-symbols-outlined text-[40px] text-outline">favorite_border</span>
              <p className="text-[13px] font-bold text-on-surface">No saved places yet</p>
              <p className="text-[11px] text-on-surface-variant max-w-[200px]">
                Tap the heart icon on any hospital, pharmacy, or transit stop to access it offline.
              </p>
            </div>
          ) : (
            savedPlaces.map(item => (
              <div
                key={item.placeId}
                onClick={() => {
                  onSelectPlace(item.place);
                  onClose();
                }}
                className="cursor-pointer p-3 rounded-2xl bg-surface shadow-tactile border border-[#eae6df] flex items-center justify-between gap-2.5 active:scale-98 transition-all"
              >
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                    {item.place.category}
                  </span>
                  <h4 className="text-[14px] font-extrabold text-on-surface truncate">
                    {item.place.name}
                  </h4>
                  <p className="text-[11px] text-on-surface-variant font-medium">
                    {item.place.distanceMeters}m away • {item.place.city}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onStartRoute(item.place);
                      onClose();
                    }}
                    className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shadow-tactile-primary active:scale-90"
                    title="Start Route"
                  >
                    <span className="material-symbols-outlined text-[16px]">navigation</span>
                  </button>
                  <button
                    onClick={(e) => handleRemove(e, item.place)}
                    className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-outline hover:text-red-500 shadow-tactile-inset-sm active:scale-90"
                    title="Remove from saved"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
