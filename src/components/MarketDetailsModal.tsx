import React, { useState } from 'react';
import { LocalMarket, Place } from '../types';
import { marketService, MARKET_SPECIALTIES } from '../services/marketService';
import { storage } from '../services/storage';

interface MarketDetailsModalProps {
  market: LocalMarket;
  onClose: () => void;
  onStartRoute: (place: Place) => void;
  onFocusOnMap: (market: LocalMarket) => void;
}

export const MarketDetailsModal: React.FC<MarketDetailsModalProps> = ({
  market,
  onClose,
  onStartRoute,
  onFocusOnMap,
}) => {
  const [copiedCoord, setCopiedCoord] = useState(false);
  const [isSaved, setIsSaved] = useState(() => storage.isPlaceSaved(`market-${market.id}`));

  const specMeta = MARKET_SPECIALTIES.find(s => s.id === market.specialty) || MARKET_SPECIALTIES[0];
  const place = marketService.marketToPlace(market);

  const distDisplay = market.distanceMeters !== undefined
    ? market.distanceMeters >= 1000
      ? `${(market.distanceMeters / 1000).toFixed(1)} km away`
      : `${market.distanceMeters} m away`
    : '';
  const driveMins = market.distanceMeters ? Math.max(1, Math.round(market.distanceMeters / 400)) : null;

  const handleCopyCoordinates = () => {
    navigator.clipboard.writeText(`${market.location.latitude.toFixed(6)}, ${market.location.longitude.toFixed(6)}`);
    setCopiedCoord(true);
    setTimeout(() => setCopiedCoord(false), 2000);
  };

  const handleToggleSave = () => {
    const res = storage.toggleSavePlace(place);
    setIsSaved(res.saved);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-xl max-h-[92vh] rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        
        {/* Hero Header with Market Image */}
        <div className="relative w-full h-52 sm:h-60 bg-slate-900 flex-shrink-0">
          {market.imageUrl ? (
            <img
              src={market.imageUrl}
              alt={market.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center text-5xl">
              {specMeta.emoji}
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

          {/* Top Floating Buttons */}
          <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between">
            <span className={`text-xs font-bold px-3 py-1 rounded-full border shadow-sm backdrop-blur-md bg-white/90 text-slate-800 ${specMeta.badgeClass}`}>
              <span className="mr-1.5">{specMeta.emoji}</span>
              <span>{market.specialtyLabel}</span>
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleSave}
                aria-label="Save market"
                className={`w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md transition-all cursor-pointer shadow-sm ${
                  isSaved ? 'bg-rose-500 text-white' : 'bg-black/50 text-white hover:bg-black/70'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {isSaved ? 'bookmark_added' : 'bookmark_border'}
                </span>
              </button>

              <button
                onClick={onClose}
                aria-label="Close details"
                className="w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-md transition-all cursor-pointer shadow-sm"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
          </div>

          {/* Bottom Title & Distance on Hero */}
          <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-3 text-white">
            <div>
              <span className="text-[11px] font-semibold tracking-wider uppercase text-amber-300 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">verified</span>
                <span>Verified Local Hub • {market.city}</span>
              </span>
              <h2 className="text-xl sm:text-2xl font-black leading-tight drop-shadow-md">
                {market.name}
              </h2>
            </div>

            {distDisplay && (
              <div className="flex flex-col items-end flex-shrink-0">
                <span className="text-xs font-extrabold px-2.5 py-1 rounded-xl bg-sky-600/90 backdrop-blur-md text-white shadow-sm">
                  {distDisplay}
                </span>
                {driveMins && (
                  <span className="text-[10px] text-slate-300 font-medium mt-0.5">
                    ~{driveMins} min drive
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 flex flex-col gap-5">
          
          {/* Address & Quick Coordinates */}
          <div className="flex items-start justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-start gap-2.5">
              <span className="material-symbols-outlined text-slate-500 text-[20px] mt-0.5">
                location_on
              </span>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-900 leading-snug">
                  {market.address}
                </span>
                <span className="text-[11px] font-mono text-slate-500 mt-0.5">
                  {market.location.latitude.toFixed(4)}°, {market.location.longitude.toFixed(4)}°
                </span>
              </div>
            </div>

            <button
              onClick={handleCopyCoordinates}
              className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 flex items-center gap-1 transition-all flex-shrink-0 cursor-pointer shadow-xs"
            >
              <span className="material-symbols-outlined text-[15px] text-sky-600">
                {copiedCoord ? 'check' : 'content_copy'}
              </span>
              <span>{copiedCoord ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          {/* Key Telemetry Tiles: Price, Timings, Bargaining Level, Best Time */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* Price Level */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Price Range</span>
              <span className="text-xs font-extrabold text-slate-800 mt-1 truncate">
                {market.priceRange || '₹ Budget / Wholesale'}
              </span>
            </div>

            {/* Operating Hours */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Timings</span>
              <span className="text-xs font-extrabold text-emerald-700 mt-1 truncate">
                {market.timings}
              </span>
              <span className="text-[10px] font-semibold text-rose-600 mt-0.5">
                {market.closedOn || 'Open Daily'}
              </span>
            </div>

            {/* Bargaining Level */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Bargaining</span>
              <span className="text-xs font-extrabold text-amber-700 mt-1 truncate">
                {market.bargainingLevel || 'Medium (15-25%)'}
              </span>
            </div>

            {/* Best Time to Visit */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Best Hours</span>
              <span className="text-xs font-extrabold text-sky-800 mt-1 truncate">
                {market.bestTimeToVisit ? market.bestTimeToVisit.split(' ')[0] + ' ' + (market.bestTimeToVisit.split(' ')[1] || '') : 'Late Afternoon'}
              </span>
            </div>
          </div>

          {/* Section: Famous For */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-amber-500">stars</span>
              <span>Why It's World Famous</span>
            </span>
            <p className="text-sm font-medium text-slate-800 leading-relaxed bg-amber-50/50 p-4 rounded-2xl border border-amber-100/80">
              {market.famousFor}
            </p>
          </div>

          {/* Section: What To Buy */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-sky-600">shopping_bag</span>
              <span>Popular Items & Best Buys</span>
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {market.whatToBuy.map((item, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center gap-2 text-xs font-semibold text-slate-800"
                >
                  <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-[12px] flex-shrink-0">
                    ✓
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Insider Bargaining Tip */}
          {market.bargainingTip && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/70 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                <span className="material-symbols-outlined text-[18px]">lightbulb</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-amber-900 leading-tight">
                  Local Insider Bargaining Advice
                </span>
                <p className="text-xs font-medium text-amber-800 mt-1 leading-relaxed">
                  {market.bargainingTip}
                </p>
              </div>
            </div>
          )}

          {/* Section: Connectivity, Parking & Payments Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Metro & Transit */}
            {market.metroStation && (
              <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-100 flex items-start gap-2.5">
                <span className="material-symbols-outlined text-sky-600 text-[20px] flex-shrink-0 mt-0.5">
                  subway
                </span>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-sky-950">Nearest Metro & Transit</span>
                  <span className="text-xs font-medium text-sky-900 mt-0.5">{market.metroStation}</span>
                </div>
              </div>
            )}

            {/* Parking Tips */}
            {market.parkingTip && (
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5">
                <span className="material-symbols-outlined text-slate-600 text-[20px] flex-shrink-0 mt-0.5">
                  local_parking
                </span>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-900">Parking & Vehicle Access</span>
                  <span className="text-xs font-medium text-slate-700 mt-0.5">{market.parkingTip}</span>
                </div>
              </div>
            )}
          </div>

          {/* Section: Nearby Landmark / Famous Food Stalls */}
          {market.famousLandmarkOrFood && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                <span className="material-symbols-outlined text-[18px]">restaurant</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-emerald-950">
                  Must-Try Food & Landmarks Nearby
                </span>
                <p className="text-xs font-medium text-emerald-800 mt-1 leading-relaxed">
                  {market.famousLandmarkOrFood}
                </p>
              </div>
            </div>
          )}

          {/* Payment Methods */}
          {market.paymentMethods && market.paymentMethods.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Payment Options Accepted
              </span>
              <div className="flex flex-wrap gap-2">
                {market.paymentMethods.map((pm, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200"
                  >
                    💳 {pm}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sticky Action Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center gap-3 flex-shrink-0">
          <button
            onClick={() => {
              onClose();
              onFocusOnMap(market);
            }}
            className="h-12 px-5 rounded-2xl bg-slate-100 hover:bg-slate-200/70 text-slate-800 text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px] text-sky-600">map</span>
            <span>View on Map</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onStartRoute(place);
            }}
            className="flex-1 h-12 rounded-2xl bg-sky-600 hover:bg-sky-700 active:scale-98 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">navigation</span>
            <span>Get Directions</span>
          </button>
        </div>

      </div>
    </div>
  );
};
