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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md rounded-3xl bg-white p-5 sm:p-6 shadow-2xl border border-slate-200 flex flex-col gap-4 max-h-[85vh]">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px] fill" style={{ fontVariationSettings: "'FILL' 1" }}>
                favorite
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-900">Saved Places</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
          <span>{savedPlaces.length} Saved {savedPlaces.length === 1 ? 'Place' : 'Places'}</span>
          <span>Saved to local browser storage</span>
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col gap-2.5 pr-1">
          {savedPlaces.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
                <span className="material-symbols-outlined text-[26px]">favorite_border</span>
              </div>
              <p className="text-sm font-bold text-slate-800">No saved places yet</p>
              <p className="text-xs text-slate-500 max-w-[220px]">
                Tap the heart icon on any tourist place, cafe, ATM, or hospital to save it for quick offline access.
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
                className="cursor-pointer p-3.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200/90 shadow-sm flex items-center justify-between gap-3 active:scale-98 transition-all group"
              >
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700">
                    {item.place.category}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-sky-700 transition-colors truncate">
                    {item.place.name}
                  </h4>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
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
                    className="w-8 h-8 rounded-xl bg-sky-600 hover:bg-sky-700 text-white flex items-center justify-center shadow-sm transition-colors cursor-pointer"
                    title="Directions"
                  >
                    <span className="material-symbols-outlined text-[16px]">navigation</span>
                  </button>
                  <button
                    onClick={(e) => handleRemove(e, item.place)}
                    className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
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
