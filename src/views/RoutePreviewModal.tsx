import React from 'react';
import { Place, RouteResponse } from '../types';
import { MOCK_KYOTO_ROUTE } from '../data/mockData';

interface RoutePreviewModalProps {
  place: Place;
  mode: 'walking' | 'driving';
  onClose: () => void;
  onStartLiveNavigation: (route: RouteResponse) => void;
}

export const RoutePreviewModal: React.FC<RoutePreviewModalProps> = ({
  place,
  mode,
  onClose,
  onStartLiveNavigation
}) => {
  const route: RouteResponse = {
    ...MOCK_KYOTO_ROUTE,
    mode,
    distanceMeters: mode === 'walking' ? 280 : 650,
    durationSeconds: mode === 'walking' ? 240 : 120
  };

  const minutes = Math.round(route.durationSeconds / 60);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-surface overflow-y-auto max-w-md mx-auto">
      {/* Modal Header */}
      <div className="sticky top-0 z-10 pt-safe bg-surface/95 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-[#EFECE5]">
        <div className="flex items-center gap-2.5">
          <img 
            src="https://lh3.googleusercontent.com/aida/AEtjO1VOefXQtWgZnEgEDxDkxHdXbqgIZlaF7_5pQCQN59AcPbzgker7g7RXETteLFWEJPBt7CgenCQepknpgaPgPjPNzt6W2WkHnNzseUjs891V0V6CWoTfmtzIlGaR3oNrL6tE1BvgRSUCujclpnEEV7T5De42pTeKWcd6EkwQE5FjfeNJ4GMeLTMyMKKHlMjTJguyElbMds-cL_g2YAiZbz22IsK_51Fg-Gq6dJoBKi401sPL2cxWEl3xaGU" 
            alt="Local Logo" 
            className="w-8 h-8 rounded-xl object-contain shadow-sm"
          />
          <div>
            <h1 className="font-extrabold text-[14px] text-on-surface leading-tight">Local Companion</h1>
            <div className="flex items-center gap-1.5 text-[11px] text-on-surface-variant font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
              <span className="truncate max-w-[210px]">Route to {place.name}</span>
            </div>
          </div>
        </div>
        
        <button 
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-outline hover:text-on-surface active:scale-95 transition-all shadow-tactile-inset-sm"
          aria-label="Close route preview"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>

      {/* Route Summary Strip */}
      <div className="px-4 py-3 bg-[#F5F2EA] border-b border-[#E8E3D8] flex items-center justify-between shadow-tactile-inset-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#E0F2FE] border border-[#BAE6FD] flex items-center justify-center text-primary shadow-sm flex-shrink-0">
            <span className="material-symbols-outlined text-[20px]">
              {mode === 'walking' ? 'directions_walk' : 'directions_car'}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-on-surface text-[16px]">{minutes} min</span>
              <span className="text-[12px] text-on-surface-variant font-semibold">• {route.distanceMeters} meters</span>
              <span className="px-2 py-0.5 rounded-full bg-[#E0F2FE] text-primary text-[10px] font-extrabold">
                OSRM Validated
              </span>
            </div>
            <p className="text-[11px] text-on-surface-variant flex items-center gap-1 mt-0.5 font-medium">
              <span className="material-symbols-outlined text-primary text-[13px]">check_circle</span>
              {mode === 'walking' ? 'Paved pedestrian path • No steep incline' : 'Direct driving route • Tested urban graph'}
            </p>
          </div>
        </div>
        
        <div className="text-right flex-shrink-0">
          <span className="text-[10px] font-bold tracking-wider uppercase text-outline block">Arrival</span>
          <span className="text-[14px] font-extrabold text-on-surface">14:36 JST</span>
        </div>
      </div>

      {/* Route Steps Header */}
      <div className="p-4 flex-1 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-[14px] font-extrabold text-on-surface">
            Turn-by-Turn Instructions ({route.steps.length} Steps)
          </span>
          <span className="text-[11px] font-semibold text-primary flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">volume_up</span>
            Voice Ready
          </span>
        </div>

        {/* Steps Timeline */}
        <div className="relative pl-6 flex flex-col gap-4 py-2">
          {/* Continuous vertical timeline track */}
          <div className="absolute left-[11px] top-4 bottom-4 w-[2px] bg-[#E2E8F0]"></div>

          {route.steps.map((step, idx) => {
            const isFirst = idx === 0;
            const isLast = idx === route.steps.length - 1;
            return (
              <div key={step.id} className="relative flex items-start gap-3">
                {/* Node marker on the line */}
                <div className={`absolute -left-[19px] top-1 w-4 h-4 rounded-full flex items-center justify-center z-10 ${
                  isFirst || isLast 
                    ? 'bg-primary ring-4 ring-[#E0F2FE]' 
                    : 'bg-surface border-2 border-primary'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isFirst || isLast ? 'bg-white' : 'bg-primary'}`}></span>
                </div>

                {/* Step Content Card */}
                <div className="flex-1 rounded-2xl bg-surface p-3.5 shadow-tactile border border-[#eae6df] flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-primary flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">
                        {step.maneuver === 'turn_right' ? 'turn_right' :
                         step.maneuver === 'turn_left' ? 'turn_left' :
                         step.maneuver === 'arrive' ? 'pin_drop' : 'straight'}
                      </span>
                      <span>In {step.distanceMeters} meters</span>
                    </span>
                    <span className="text-[10px] font-mono text-outline">
                      Step {idx + 1}
                    </span>
                  </div>

                  <p className="text-[13px] font-extrabold text-on-surface leading-snug">
                    {step.instruction}
                  </p>

                  {step.instructionLocal && (
                    <p className="text-[11px] font-medium text-on-surface-variant">
                      {step.instructionLocal}
                    </p>
                  )}

                  {step.landmark && (
                    <div className="mt-1 pt-1 border-t border-[#eae6df]/70 flex items-center gap-1.5 text-[11px] text-outline font-medium">
                      <span className="material-symbols-outlined text-[14px] text-primary">visibility</span>
                      <span>{step.landmark}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sticky Bottom Actions */}
      <div className="sticky bottom-0 z-20 pb-safe bg-surface/95 backdrop-blur-md p-4 border-t border-[#eae6df] flex flex-col gap-2">
        <button
          onClick={() => onStartLiveNavigation(route)}
          className="w-full h-12 rounded-full tactile-btn-primary flex items-center justify-center gap-2 text-[14px] font-bold shadow-tactile-primary select-none"
        >
          <span className="material-symbols-outlined text-[20px]">play_arrow</span>
          <span>Start Live Turn Guidance</span>
        </button>

        <button
          onClick={onClose}
          className="w-full py-2 text-center text-[12px] font-bold text-outline hover:text-on-surface transition-colors"
        >
          Back to Place Details
        </button>
      </div>
    </div>
  );
};
