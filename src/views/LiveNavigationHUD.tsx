import React, { useState, useEffect } from 'react';
import { RouteResponse } from '../types';
import { speechEngine } from '../services/speechEngine';
import { LiveLocationState } from '../hooks/useLiveLocation';

interface LiveNavigationHUDProps {
  route: RouteResponse;
  location: LiveLocationState;
  onEndNavigation: () => void;
  onOpenVoiceSettings: () => void;
  onOpenEmergency: () => void;
}

export const LiveNavigationHUD: React.FC<LiveNavigationHUDProps> = ({
  route,
  location,
  onEndNavigation,
  onOpenVoiceSettings,
  onOpenEmergency
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [distanceRemaining, setDistanceRemaining] = useState(route.steps[0]?.distanceMeters || 45);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showStepsDrawer, setShowStepsDrawer] = useState(false);

  const currentStep = route.steps[currentStepIndex] || route.steps[0];
  const nextStep = route.steps[currentStepIndex + 1];

  // Announce the step when step changes
  useEffect(() => {
    if (currentStep) {
      setIsSpeaking(true);
      const instructionText = `In ${distanceRemaining} meters, ${currentStep.instruction}. ${currentStep.landmark ? currentStep.landmark : ''}`;
      speechEngine.speak(instructionText, () => setIsSpeaking(false));
    }
    return () => {
      speechEngine.stop();
    };
  }, [currentStepIndex]);

  // Simulate walking step advancement
  const handleAdvanceStep = () => {
    if (currentStepIndex < route.steps.length - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      setDistanceRemaining(route.steps[nextIndex].distanceMeters);
    } else {
      // Arrived!
      speechEngine.playAcousticChime('arrive');
      speechEngine.speak("You have arrived at your destination.");
    }
  };

  const handleReplayVoice = () => {
    if (currentStep) {
      setIsSpeaking(true);
      const instructionText = `In ${distanceRemaining} meters, ${currentStep.instruction}.`;
      speechEngine.speak(instructionText, () => setIsSpeaking(false));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-0 md:p-6 overflow-hidden">
      <div className="w-full h-full md:max-w-md md:h-[92vh] md:max-h-[880px] rounded-none md:rounded-3xl bg-white flex flex-col overflow-hidden shadow-2xl border-0 md:border md:border-slate-200">
        {/* Top Status & Metrics Bar */}
        <div className="pt-safe px-4 py-3 bg-white border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="px-2.5 py-1 rounded-full bg-slate-100 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <span className={`w-1.5 h-1.5 rounded-full ${location.status === 'fixed' ? 'bg-emerald-500 animate-ping' : 'bg-sky-500'}`}></span>
              <span>GPS ±{location.accuracyMeters}m</span>
            </div>
            <div className="px-2.5 py-1 rounded-full bg-slate-100 flex items-center gap-1 text-xs font-semibold text-slate-600">
              <span className="material-symbols-outlined text-[14px] text-sky-600">cloud_off</span>
              <span>Offline Guide</span>
            </div>
          </div>

          <button
            onClick={onEndNavigation}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
            aria-label="Exit navigation"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Acoustic Guidance Banner */}
        <div className="px-4 py-2 bg-sky-50 border-b border-sky-100 flex items-center justify-between text-xs font-semibold text-sky-800">
          <span className="flex items-center gap-1.5">
            <span className={`material-symbols-outlined text-[16px] text-sky-600 ${isSpeaking ? 'animate-bounce' : ''}`}>
              volume_up
            </span>
            <span>Spoken Instructions Active</span>
          </span>
          <button
            onClick={handleReplayVoice}
            className="px-2.5 py-0.5 rounded-lg bg-white text-sky-700 border border-sky-200 text-xs font-bold hover:bg-sky-50 transition-colors cursor-pointer"
          >
            Replay
          </button>
        </div>

        {/* Main Maneuver Area */}
        <div className="flex-1 p-5 flex flex-col justify-between overflow-y-auto">
          {/* Giant Active Turn Card */}
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200/90 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-sky-600 text-white flex items-center justify-center shadow-sm">
                  <span className="material-symbols-outlined text-[34px]">
                    {currentStep.maneuver === 'turn_right' ? 'turn_right' :
                     currentStep.maneuver === 'turn_left' ? 'turn_left' :
                     currentStep.maneuver === 'arrive' ? 'pin_drop' : 'straight'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold uppercase tracking-wider text-sky-700 block">
                    Next Turn In
                  </span>
                  <span className="text-3xl font-black text-slate-900 leading-none">
                    {distanceRemaining}m
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <h2 className="text-lg font-bold text-slate-900 leading-snug">
                  {currentStep.instruction}
                </h2>
                {currentStep.instructionLocal && (
                  <p className="text-xs font-medium text-slate-500 mt-0.5">
                    {currentStep.instructionLocal}
                  </p>
                )}
              </div>

              {currentStep.landmark && (
                <div className="rounded-xl bg-slate-50 p-2.5 flex items-center gap-2 text-xs font-medium text-slate-600 border border-slate-100">
                  <span className="material-symbols-outlined text-sky-600 text-[16px] flex-shrink-0">
                    storefront
                  </span>
                  <span>{currentStep.landmark}</span>
                </div>
              )}
            </div>

            {/* Next Turn Preview */}
            {nextStep ? (
              <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-200/80 flex items-center gap-3 text-slate-700">
                <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-sky-600 flex-shrink-0">
                  <span className="material-symbols-outlined text-[20px]">
                    {nextStep.maneuver === 'turn_right' ? 'turn_right' :
                     nextStep.maneuver === 'turn_left' ? 'turn_left' :
                     nextStep.maneuver === 'arrive' ? 'pin_drop' : 'straight'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Then in {nextStep.distanceMeters}m
                  </span>
                  <span className="text-xs font-bold text-slate-900 truncate block">
                    {nextStep.instruction}
                  </span>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-emerald-50 p-3 border border-emerald-200 text-emerald-800 text-xs font-bold text-center">
                Destination Approaching
              </div>
            )}

            {/* Simulation Helper */}
            <button
              onClick={handleAdvanceStep}
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px] text-sky-600">fast_forward</span>
              <span>Next Step ({currentStepIndex + 1} of {route.steps.length})</span>
            </button>
          </div>

          {/* Bottom Navigation Control Bar */}
          <div className="pt-4 flex flex-col gap-2.5">
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={onOpenVoiceSettings}
                className="h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center gap-1.5 text-xs font-bold transition-colors cursor-pointer"
                title="Voice Settings"
              >
                <span className="material-symbols-outlined text-[16px] text-sky-600">volume_up</span>
                <span>Audio</span>
              </button>

              <button
                onClick={() => setShowStepsDrawer(!showStepsDrawer)}
                className="h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center gap-1.5 text-xs font-bold transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px] text-sky-600">format_list_bulleted</span>
                <span>Steps</span>
              </button>

              <button
                onClick={onOpenEmergency}
                className="h-10 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 flex items-center justify-center gap-1 text-xs font-bold transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">emergency</span>
                <span>SOS</span>
              </button>
            </div>

            <button
              onClick={onEndNavigation}
              className="w-full h-11 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 select-none transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">stop_circle</span>
              <span>End Navigation</span>
            </button>
          </div>
        </div>

        {/* Steps Drawer Sheet */}
        {showStepsDrawer && (
          <div className="absolute inset-x-0 bottom-0 top-16 bg-white/98 backdrop-blur-xl z-30 p-5 border-t border-slate-200 flex flex-col gap-3 overflow-y-auto shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-sm font-bold text-slate-900">All Route Steps</span>
              <button 
                onClick={() => setShowStepsDrawer(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {route.steps.map((st, idx) => (
                <div 
                  key={st.id} 
                  onClick={() => { setCurrentStepIndex(idx); setShowStepsDrawer(false); }}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                    idx === currentStepIndex 
                      ? 'bg-sky-50 border-sky-200 text-sky-900 font-bold' 
                      : 'bg-white hover:bg-slate-50 border-slate-200/80 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-mono font-bold text-slate-400">{idx + 1}.</span>
                    <span className="text-xs font-medium">{st.instruction}</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-400">{st.distanceMeters}m</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
